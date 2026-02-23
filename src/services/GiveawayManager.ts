import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  type TextChannel
} from 'discord.js';
import { container } from '@sapphire/framework';
import { COLORS, CUSTOM_IDS, EMOJIS, LIMITS } from '../lib/constants.js';
import type { Giveaway } from '../generated/prisma/client.js';

export class GiveawayManager {
  private timers = new Map<number, NodeJS.Timeout>();

  // ─── Guild Settings ──────────────────────────────────────────

  public async getGuildSettings(guildId: string): Promise<{ color: number; emoji: string }> {
    const settings = await container.prisma.guildSettings.findUnique({
      where: { guildId }
    });

    return {
      color: settings ? parseInt(settings.color.replace('#', ''), 16) : COLORS.PRIMARY,
      emoji: settings?.emoji ?? EMOJIS.GIVEAWAY
    };
  }

  public async setColor(guildId: string, color: string): Promise<void> {
    await container.prisma.guildSettings.upsert({
      where: { guildId },
      update: { color },
      create: { guildId, color }
    });
  }

  public async setEmoji(guildId: string, emoji: string): Promise<void> {
    await container.prisma.guildSettings.upsert({
      where: { guildId },
      update: { emoji },
      create: { guildId, emoji }
    });
  }

  public async getRawSettings(guildId: string) {
    return container.prisma.guildSettings.findUnique({ where: { guildId } });
  }

  // ─── Timer Restoration ───────────────────────────────────────

  public async restoreTimers(client: Client<true>): Promise<void> {
    const guildIds = client.guilds.cache.map((g) => g.id);

    const activeGiveaways = await container.prisma.giveaway.findMany({
      where: {
        ended: false,
        guildId: { in: guildIds }
      }
    });

    const now = Date.now();

    for (const giveaway of activeGiveaways) {
      const remaining = giveaway.endsAt.getTime() - now;

      if (remaining <= 0) {
        await this.endGiveaway(giveaway.id);
      } else {
        this.scheduleEnd(giveaway.id, remaining);
      }
    }

    container.logger.info(
      `Restored timers for ${activeGiveaways.length} active giveaways across ${guildIds.length} guilds.`
    );
  }

  // ─── Core Operations ─────────────────────────────────────────

  public async create(options: {
    guildId: string;
    channelId: string;
    name: string;
    description?: string;
    hostId: string;
    winnersCount: number;
    actualWinnerIds: string[];
    duration: string;
    durationMs: number;
    ping: boolean;
  }): Promise<Giveaway> {
    const channel = await container.client.channels.fetch(options.channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error('Invalid text channel.');
    }

    const settings = await this.getGuildSettings(options.guildId);
    const endsAt = new Date(Date.now() + options.durationMs);

    const embed = this.buildActiveEmbed({
      name: options.name,
      description: options.description,
      hostId: options.hostId,
      winnersCount: options.winnersCount,
      entriesCount: 0,
      endsAt,
      color: settings.color
    });

    const row = this.buildEnterRow('pending', settings.emoji);

    const message = await (channel as TextChannel).send({
      content: options.ping ? '@everyone' : undefined,
      embeds: [embed],
      components: [row]
    });

    const giveaway = await container.prisma.giveaway.create({
      data: {
        guildId: options.guildId,
        channelId: options.channelId,
        messageId: message.id,
        name: options.name,
        description: options.description ?? null,
        hostId: options.hostId,
        winnersCount: options.winnersCount,
        actualWinnerIds: options.actualWinnerIds,
        entries: [],
        duration: options.duration,
        endsAt,
        ping: options.ping
      }
    });

    const updatedRow = this.buildEnterRow(giveaway.id.toString(), settings.emoji);
    await message.edit({ components: [updatedRow] });

    this.scheduleEnd(giveaway.id, options.durationMs);

    return giveaway;
  }

  public async edit(
    id: number,
    guildId: string,
    updates: {
      name?: string;
      channelId?: string;
      ping?: boolean;
      duration?: string;
      durationMs?: number;
      winnersCount?: number;
      actualWinnerIds?: string[];
    }
  ): Promise<Giveaway> {
    const giveaway = await container.prisma.giveaway.findFirst({
      where: { id, guildId, ended: false }
    });

    if (!giveaway) throw new Error('Active giveaway not found.');

    const settings = await this.getGuildSettings(guildId);
    const newEndsAt = updates.durationMs
      ? new Date(Date.now() + updates.durationMs)
      : giveaway.endsAt;

    const updated = await container.prisma.giveaway.update({
      where: { id },
      data: {
        name: updates.name ?? giveaway.name,
        channelId: updates.channelId ?? giveaway.channelId,
        ping: updates.ping ?? giveaway.ping,
        duration: updates.duration ?? giveaway.duration,
        winnersCount: updates.winnersCount ?? giveaway.winnersCount,
        actualWinnerIds: updates.actualWinnerIds ?? giveaway.actualWinnerIds,
        endsAt: newEndsAt
      }
    });

    try {
      const oldChannel = await container.client.channels.fetch(giveaway.channelId);
      if (oldChannel?.isTextBased()) {
        const oldMessage = await (oldChannel as TextChannel).messages.fetch(giveaway.messageId);
        await oldMessage.delete();
      }
    } catch {
      // Old message may already be deleted
    }

    const newChannel = await container.client.channels.fetch(updated.channelId);
    if (!newChannel || newChannel.type !== ChannelType.GuildText) {
      throw new Error('Invalid text channel.');
    }

    const embed = this.buildActiveEmbed({
      name: updated.name,
      description: updated.description ?? undefined,
      hostId: updated.hostId,
      winnersCount: updated.winnersCount,
      entriesCount: updated.entries.length,
      endsAt: newEndsAt,
      color: settings.color
    });

    const row = this.buildEnterRow(updated.id.toString(), settings.emoji);

    const newMessage = await (newChannel as TextChannel).send({
      content: updated.ping ? '@everyone' : undefined,
      embeds: [embed],
      components: [row]
    });

    await container.prisma.giveaway.update({
      where: { id },
      data: { messageId: newMessage.id }
    });

    this.cancelTimer(id);
    const remaining = newEndsAt.getTime() - Date.now();
    if (remaining > 0) {
      this.scheduleEnd(id, remaining);
    }

    return updated;
  }

  public async end(id: number, guildId: string): Promise<Giveaway> {
    const giveaway = await container.prisma.giveaway.findFirst({
      where: { id, guildId, ended: false }
    });

    if (!giveaway) throw new Error('Active giveaway not found.');

    await this.endGiveaway(id);
    return giveaway;
  }

  public async delete(id: number, guildId: string): Promise<Giveaway> {
    const giveaway = await container.prisma.giveaway.findFirst({
      where: { id, guildId, ended: false }
    });

    if (!giveaway) throw new Error('Active giveaway not found.');

    try {
      const channel = await container.client.channels.fetch(giveaway.channelId);
      if (channel?.isTextBased()) {
        const message = await (channel as TextChannel).messages.fetch(giveaway.messageId);
        await message.delete();
      }
    } catch {
      // Message may already be deleted
    }

    this.cancelTimer(id);

    return container.prisma.giveaway.delete({ where: { id } });
  }

  public async list(guildId: string): Promise<{ active: Giveaway[]; ended: Giveaway[] }> {
    const [active, ended] = await Promise.all([
      container.prisma.giveaway.findMany({
        where: { guildId, ended: false },
        orderBy: { endsAt: 'asc' }
      }),
      container.prisma.giveaway.findMany({
        where: { guildId, ended: true },
        orderBy: { endsAt: 'desc' },
        take: 10
      })
    ]);

    return { active, ended };
  }

  // ─── Entry Management ────────────────────────────────────────

  public async addEntry(giveawayId: number, userId: string): Promise<{ alreadyEntered: boolean; entriesCount: number }> {
    const giveaway = await container.prisma.giveaway.findUnique({
      where: { id: giveawayId }
    });

    if (!giveaway || giveaway.ended) throw new Error('Giveaway not found or already ended.');

    if (giveaway.entries.includes(userId)) {
      return { alreadyEntered: true, entriesCount: giveaway.entries.length };
    }

    const updated = await container.prisma.giveaway.update({
      where: { id: giveawayId },
      data: { entries: { push: userId } }
    });

    await this.updateEntryCount(updated);

    return { alreadyEntered: false, entriesCount: updated.entries.length };
  }

  public async removeEntry(giveawayId: number, userId: string): Promise<{ wasEntered: boolean; entriesCount: number }> {
    const giveaway = await container.prisma.giveaway.findUnique({
      where: { id: giveawayId }
    });

    if (!giveaway || giveaway.ended) throw new Error('Giveaway not found or already ended.');

    if (!giveaway.entries.includes(userId)) {
      return { wasEntered: false, entriesCount: giveaway.entries.length };
    }

    const newEntries = giveaway.entries.filter((e) => e !== userId);

    const updated = await container.prisma.giveaway.update({
      where: { id: giveawayId },
      data: { entries: newEntries }
    });

    await this.updateEntryCount(updated);

    return { wasEntered: true, entriesCount: updated.entries.length };
  }

  // ─── Giveaway Completion ─────────────────────────────────────

  public async endGiveaway(giveawayId: number): Promise<void> {
    const giveaway = await container.prisma.giveaway.findUnique({
      where: { id: giveawayId }
    });

    if (!giveaway || giveaway.ended) return;

    this.cancelTimer(giveawayId);

    await container.prisma.giveaway.update({
      where: { id: giveawayId },
      data: { ended: true }
    });

    try {
      const channel = await container.client.channels.fetch(giveaway.channelId);
      if (!channel?.isTextBased()) return;

      const textChannel = channel as TextChannel;
      const message = await textChannel.messages.fetch(giveaway.messageId);

      const endedEmbed = this.buildEndedEmbed(giveaway);
      const summaryRow = this.buildSummaryRow(giveaway.guildId, giveaway.endsAt);

      await message.edit({
        embeds: [endedEmbed],
        components: [summaryRow]
      });

      const winnerMentions = giveaway.actualWinnerIds.map((id) => `<@${id}>`).join(', ');
      await textChannel.send({
        content: `Congratulations ${winnerMentions}! You won the **${giveaway.name}**!`,
        reply: { messageReference: message.id }
      });
    } catch (error) {
      container.logger.error(`Failed to end giveaway ${giveawayId}: ${error}`);
    }
  }

  public async reroll(id: number, guildId: string): Promise<void> {
    const giveaway = await container.prisma.giveaway.findFirst({
      where: { id, guildId }
    });

    if (!giveaway) throw new Error('Giveaway not found.');

    try {
      const channel = await container.client.channels.fetch(giveaway.channelId);
      if (!channel?.isTextBased()) throw new Error('Channel not found.');

      const textChannel = channel as TextChannel;
      const winnerMentions = giveaway.actualWinnerIds.map((id) => `<@${id}>`).join(', ');

      await textChannel.send({
        content: `\uD83C\uDF89 The giveaway for **${giveaway.name}** has been rerolled! New winners: ${winnerMentions}`
      });
    } catch (error) {
      throw new Error(`Failed to reroll giveaway: ${error}`);
    }
  }

  public async rerollByMessageId(messageId: string): Promise<void> {
    const giveaway = await container.prisma.giveaway.findUnique({
      where: { messageId }
    });

    if (!giveaway) throw new Error('Giveaway not found for this message.');

    try {
      const channel = await container.client.channels.fetch(giveaway.channelId);
      if (!channel?.isTextBased()) throw new Error('Channel not found.');

      const textChannel = channel as TextChannel;
      const winnerMentions = giveaway.actualWinnerIds.map((id) => `<@${id}>`).join(', ');

      await textChannel.send({
        content: `\uD83C\uDF89 The giveaway for **${giveaway.name}** has been rerolled! New winners: ${winnerMentions}`
      });
    } catch (error) {
      throw new Error(`Failed to reroll giveaway: ${error}`);
    }
  }

  // ─── Maintenance ─────────────────────────────────────────────

  public async reset(guildId: string): Promise<number> {
    const activeGiveaways = await container.prisma.giveaway.findMany({
      where: { guildId, ended: false }
    });

    for (const g of activeGiveaways) {
      this.cancelTimer(g.id);
    }

    const result = await container.prisma.giveaway.deleteMany({
      where: { guildId }
    });

    return result.count;
  }

  public async purgeOld(): Promise<number> {
    const cutoff = new Date(Date.now() - LIMITS.PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000);

    const result = await container.prisma.giveaway.deleteMany({
      where: {
        ended: true,
        endsAt: { lte: cutoff }
      }
    });

    if (result.count > 0) {
      container.logger.info(`Purged ${result.count} completed giveaways older than ${LIMITS.PURGE_AFTER_DAYS} days.`);
    }

    return result.count;
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private scheduleEnd(giveawayId: number, delayMs: number): void {
    const MAX_TIMEOUT = 2_147_483_647;
    const capped = Math.min(delayMs, MAX_TIMEOUT);

    const timeout = setTimeout(async () => {
      await this.endGiveaway(giveawayId);
    }, capped);

    this.timers.set(giveawayId, timeout);
  }

  private cancelTimer(giveawayId: number): void {
    const timeout = this.timers.get(giveawayId);
    if (timeout) {
      clearTimeout(timeout);
      this.timers.delete(giveawayId);
    }
  }

  private async updateEntryCount(giveaway: Giveaway): Promise<void> {
    try {
      const channel = await container.client.channels.fetch(giveaway.channelId);
      if (!channel?.isTextBased()) return;

      const message = await (channel as TextChannel).messages.fetch(giveaway.messageId);
      const embed = message.embeds[0];
      if (!embed) return;

      const updatedEmbed = EmbedBuilder.from(embed).setDescription(
        embed.description?.replace(
          /Entries: \*\*\d+\*\*/,
          `Entries: **${giveaway.entries.length}**`
        ) ?? ''
      );

      await message.edit({ embeds: [updatedEmbed] });
    } catch {
      // Message may be deleted
    }
  }

  private buildActiveEmbed(options: {
    name: string;
    description?: string;
    hostId: string;
    winnersCount: number;
    entriesCount: number;
    endsAt: Date;
    color?: number;
  }): EmbedBuilder {
    const timestamp = Math.floor(options.endsAt.getTime() / 1000);

    const lines: string[] = [];
    if (options.description) {
      lines.push(options.description, '');
    }
    lines.push(
      `Ends: <t:${timestamp}:R> (<t:${timestamp}:f>)`,
      `Hosted by: <@${options.hostId}>`,
      `Entries: **${options.entriesCount}**`,
      `Winners: **${options.winnersCount}**`
    );

    return new EmbedBuilder()
      .setTitle(options.name)
      .setDescription(lines.join('\n'))
      .setColor(options.color ?? COLORS.PRIMARY)
      .setTimestamp(options.endsAt);
  }

  private buildEndedEmbed(giveaway: Giveaway): EmbedBuilder {
    const timestamp = Math.floor(giveaway.endsAt.getTime() / 1000);
    const winnerMentions = giveaway.actualWinnerIds.map((id) => `<@${id}>`).join(', ');

    const lines: string[] = [];
    if (giveaway.description) {
      lines.push(giveaway.description, '');
    }
    lines.push(
      `Ended: <t:${timestamp}:R> (<t:${timestamp}:f>)`,
      `Hosted by: <@${giveaway.hostId}>`,
      `Entries: **${giveaway.entries.length}**`,
      `Winners: ${winnerMentions}`
    );

    return new EmbedBuilder()
      .setTitle(giveaway.name)
      .setDescription(lines.join('\n'))
      .setColor(COLORS.ENDED)
      .setTimestamp(giveaway.endsAt);
  }

  private buildEnterRow(giveawayId: string, emoji?: string): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${CUSTOM_IDS.GIVEAWAY_ENTER}:${giveawayId}`)
        .setEmoji(emoji ?? EMOJIS.GIVEAWAY)
        .setStyle(ButtonStyle.Primary)
    );
  }

  private buildSummaryRow(guildId: string, endsAt: Date): ActionRowBuilder<ButtonBuilder> {
    const id1 = this.deterministicSnowflake(guildId);
    const id2 = this.deterministicSnowflake(`${guildId}:${endsAt.getTime()}`);
    const url = `https://giveawaybot.party/summary#giveaway=${id1}/${id2}`;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Giveaway Summary')
        .setStyle(ButtonStyle.Link)
        .setURL(url)
    );
  }

  private deterministicSnowflake(seed: string): string {
    // djb2 hash into a BigInt
    let hash = 5381n;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5n) + hash) + BigInt(seed.charCodeAt(i));
      hash = hash & ((1n << 64n) - 1n);
    }
    // Clamp to 18-digit snowflake-like range
    const min = 100000000000000000n;
    const range = 900000000000000000n;
    return (min + (hash % range)).toString();
  }
}
