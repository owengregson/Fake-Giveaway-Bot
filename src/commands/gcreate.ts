import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { CUSTOM_IDS } from '../lib/constants.js';

export class GCreateCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'gcreate',
      description: 'Creates a giveaway (interactive setup)',
      preconditions: ['AdminOnly']
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('gcreate')
        .setDescription('Creates a giveaway (interactive setup)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const modal = new ModalBuilder()
      .setCustomId(`${CUSTOM_IDS.GCREATE_MODAL}:${interaction.channelId}`)
      .setTitle('Create a Giveaway')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('prize')
            .setLabel('Prize')
            .setPlaceholder('e.g. Steam Code, Nitro, etc.')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Description (optional)')
            .setPlaceholder('e.g. React to enter! Must be level 5+')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('Duration')
            .setPlaceholder('e.g. 30s, 5m, 1h, 2d')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('winners')
            .setLabel('Number of Winners (1-9)')
            .setPlaceholder('e.g. 1')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(1)
            .setRequired(true)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('ping')
            .setLabel('Ping @everyone? (yes/no)')
            .setPlaceholder('no')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(3)
            .setRequired(false)
        )
      );

    await interaction.showModal(modal);
  }
}
