import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
  ActionRowBuilder,
  MessageFlags,
  type ModalSubmitInteraction,
  UserSelectMenuBuilder
} from 'discord.js';
import ms, { type StringValue } from 'ms';
import { CUSTOM_IDS } from '../lib/constants.js';
import { storePending } from '../lib/pending-giveaways.js';

export class GCreateModalHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.ModalSubmit
    });
  }

  public override parse(interaction: ModalSubmitInteraction) {
    if (!interaction.customId.startsWith(`${CUSTOM_IDS.GCREATE_MODAL}:`)) {
      return this.none();
    }

    const channelId = interaction.customId.split(':')[1];
    return this.some({ channelId });
  }

  public async run(interaction: ModalSubmitInteraction, data: { channelId: string }) {
    const prize = interaction.fields.getTextInputValue('prize');
    const description = interaction.fields.getTextInputValue('description') || undefined;
    const durationStr = interaction.fields.getTextInputValue('duration');
    const winnersStr = interaction.fields.getTextInputValue('winners');
    const pingStr = interaction.fields.getTextInputValue('ping');

    // Validate duration
    const durationMs = ms(durationStr.trim() as StringValue);
    if (!durationMs || durationMs <= 0) {
      return interaction.reply({
        content: 'Invalid duration. Use formats like `30s`, `5m`, `1h`, `2d`.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Validate winners count
    const winnersCount = parseInt(winnersStr.trim(), 10);
    if (isNaN(winnersCount) || winnersCount < 1 || winnersCount > 9) {
      return interaction.reply({
        content: 'Winners must be a number between 1 and 9.',
        flags: MessageFlags.Ephemeral
      });
    }

    const ping = pingStr?.toLowerCase().trim() === 'yes';

    const pendingId = `${interaction.id}`;

    storePending(pendingId, {
      guildId: interaction.guildId!,
      channelId: data.channelId,
      name: prize,
      description,
      hostId: interaction.user.id,
      winnersCount,
      duration: durationStr.trim(),
      durationMs,
      ping
    });

    const selectMenu = new UserSelectMenuBuilder()
      .setCustomId(`${CUSTOM_IDS.GIVEAWAY_WINNER_SELECT}:${pendingId}`)
      .setPlaceholder(`Select ${winnersCount} winner(s)`)
      .setMinValues(winnersCount)
      .setMaxValues(winnersCount);

    const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: `Select the **${winnersCount}** winner(s) for the **${prize}** giveaway:`,
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }
}
