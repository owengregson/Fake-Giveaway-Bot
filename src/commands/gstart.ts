import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  MessageFlags,
  PermissionFlagsBits,
  UserSelectMenuBuilder
} from 'discord.js';
import ms, { type StringValue } from 'ms';
import { CUSTOM_IDS } from '../lib/constants.js';
import { storePending } from '../lib/pending-giveaways.js';

export class GStartCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'gstart',
      description: 'Starts a giveaway (quick start)',
      preconditions: ['AdminOnly']
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('gstart')
        .setDescription('Starts a giveaway (quick start)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption((o) =>
          o
            .setName('time')
            .setDescription('Duration (e.g. 30s, 5m, 1h, 2d)')
            .setRequired(true)
        )
        .addIntegerOption((o) =>
          o
            .setName('winners')
            .setDescription('Number of winners')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(9)
        )
        .addStringOption((o) =>
          o.setName('prize').setDescription('What is being given away').setRequired(true)
        )
        .addStringOption((o) =>
          o.setName('description').setDescription('Optional description for the giveaway').setRequired(false)
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const timeStr = interaction.options.getString('time', true);
    const winnersCount = interaction.options.getInteger('winners', true);
    const prize = interaction.options.getString('prize', true);
    const description = interaction.options.getString('description') ?? undefined;

    const durationMs = ms(timeStr as StringValue);
    if (!durationMs || durationMs <= 0) {
      return interaction.reply({
        content: 'Invalid time format. Use formats like `30s`, `5m`, `1h`, `2d`.',
        flags: MessageFlags.Ephemeral
      });
    }

    const pendingId = `${interaction.id}`;

    storePending(pendingId, {
      guildId: interaction.guildId!,
      channelId: interaction.channelId!,
      name: prize,
      description,
      hostId: interaction.user.id,
      winnersCount,
      duration: timeStr,
      durationMs,
      ping: false
    });

    const selectMenu = new UserSelectMenuBuilder()
      .setCustomId(`${CUSTOM_IDS.GIVEAWAY_WINNER_SELECT}:${pendingId}`)
      .setPlaceholder(`Select ${winnersCount} winner(s)`)
      .setMinValues(winnersCount)
      .setMaxValues(winnersCount);

    const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: `Select the **${winnersCount}** winner(s) for this giveaway:`,
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }
}
