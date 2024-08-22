const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const ms = require("ms");
const DB = require("../utils/database");

class Giveaway {
	constructor(client) {
		this.client = client;
		this.guildDatabases = new Map();

		this.registerCommands();
	}

	initializeDatabase(guildId) {
		if (!this.guildDatabases.has(guildId)) {
			const db = new DB(guildId, "giveaway");

			// Ensure the necessary tables are created
			db.ensureTable("active_giveaways", [
				{ name: "id", type: "INTEGER PRIMARY KEY AUTOINCREMENT" },
				{ name: "guild_id", type: "TEXT" },
				{ name: "name", type: "TEXT" },
				{ name: "channel_id", type: "TEXT" },
				{ name: "ping", type: "INTEGER" },
				{ name: "duration", type: "TEXT" },
				{ name: "winners_count", type: "INTEGER" },
				{ name: "actual_winner_ids", type: "TEXT" },
				{ name: "message_id", type: "TEXT" },
				{ name: "end_time", type: "INTEGER" },
				{ name: "entries", type: "TEXT" },
				{ name: "host_id", type: "TEXT" },
			]);

			db.ensureTable("completed_giveaways", [
				{ name: "id", type: "INTEGER PRIMARY KEY AUTOINCREMENT" },
				{ name: "guild_id", type: "TEXT" },
				{ name: "name", type: "TEXT" },
				{ name: "channel_id", type: "TEXT" },
				{ name: "ping", type: "INTEGER" },
				{ name: "duration", type: "TEXT" },
				{ name: "winners_count", type: "INTEGER" },
				{ name: "actual_winner_ids", type: "TEXT" },
				{ name: "message_id", type: "TEXT" },
				{ name: "end_time", type: "INTEGER" },
				{ name: "entries", type: "TEXT" },
				{ name: "host_id", type: "TEXT" },
			]);

			this.guildDatabases.set(guildId, db);
		}

		return this.guildDatabases.get(guildId);
	}

	registerCommands() {
		const commands = [
			new SlashCommandBuilder()
				.setName("giveaway")
				.setDescription("Manage giveaways")
				.addSubcommand((subcommand) =>
					subcommand
						.setName("help")
						.setDescription(
							"Get help with the giveaway bot commands"
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("create")
						.setDescription("Create a new giveaway")
						.addStringOption((option) =>
							option
								.setName("name")
								.setDescription("Name of the giveaway")
								.setRequired(true)
						)
						.addChannelOption((option) =>
							option
								.setName("channel")
								.setDescription(
									"Channel to post the giveaway in"
								)
								.setRequired(true)
						)
						.addStringOption((option) =>
							option
								.setName("duration")
								.setDescription(
									"Duration of the giveaway (e.g., 1d 1h)"
								)
								.setRequired(true)
						)
						.addIntegerOption((option) =>
							option
								.setName("winners")
								.setDescription("Number of winners (1-9)")
								.setRequired(true)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner1")
								.setDescription(
									"The first winner of the giveaway"
								)
								.setRequired(true)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner2")
								.setDescription(
									"The second winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner3")
								.setDescription(
									"The third winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner4")
								.setDescription(
									"The fourth winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner5")
								.setDescription(
									"The fifth winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner6")
								.setDescription(
									"The sixth winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner7")
								.setDescription(
									"The seventh winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner8")
								.setDescription(
									"The eighth winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner9")
								.setDescription(
									"The ninth winner of the giveaway"
								)
								.setRequired(false)
						)
						.addBooleanOption((option) =>
							option
								.setName("ping")
								.setDescription("Ping @everyone")
								.setRequired(false)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("edit")
						.setDescription("Edit an existing giveaway")
						.addIntegerOption((option) =>
							option
								.setName("id")
								.setDescription("ID of the giveaway to edit")
								.setRequired(true)
						)
						.addStringOption((option) =>
							option
								.setName("name")
								.setDescription("New name of the giveaway")
								.setRequired(false)
						)
						.addChannelOption((option) =>
							option
								.setName("channel")
								.setDescription(
									"New channel to post the giveaway in"
								)
								.setRequired(false)
						)
						.addBooleanOption((option) =>
							option
								.setName("ping")
								.setDescription("Ping @everyone")
								.setRequired(false)
						)
						.addStringOption((option) =>
							option
								.setName("duration")
								.setDescription(
									"New duration of the giveaway (e.g., 1d 1h)"
								)
								.setRequired(false)
						)
						.addIntegerOption((option) =>
							option
								.setName("winners")
								.setDescription("New number of winners (1-9)")
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner1")
								.setDescription(
									"The first winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner2")
								.setDescription(
									"The second winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner3")
								.setDescription(
									"The third winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner4")
								.setDescription(
									"The fourth winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner5")
								.setDescription(
									"The fifth winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner6")
								.setDescription(
									"The sixth winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner7")
								.setDescription(
									"The seventh winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner8")
								.setDescription(
									"The eighth winner of the giveaway"
								)
								.setRequired(false)
						)
						.addUserOption((option) =>
							option
								.setName("actual_winner9")
								.setDescription(
									"The ninth winner of the giveaway"
								)
								.setRequired(false)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("delete")
						.setDescription("Delete a giveaway")
						.addIntegerOption((option) =>
							option
								.setName("id")
								.setDescription("ID of the giveaway to delete")
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("list")
						.setDescription("List all active and ended giveaways")
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("reroll")
						.setDescription("Reroll a giveaway")
						.addIntegerOption((option) =>
							option
								.setName("id")
								.setDescription("ID of the giveaway to reroll")
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("reset")
						.setDescription(
							"Clear all giveaway data for this guild"
						)
				),
		];

		this.client.commands.push(
			...commands.map((command) => command.toJSON())
		);
	}

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		const guildId = interaction.guild.id;

		this.db = this.initializeDatabase(guildId);

		if (subcommand === "help") {
			await this.sendHelp(interaction);
		} else if (subcommand === "create") {
			await this.createGiveaway(interaction, guildId);
		} else if (subcommand === "edit") {
			await this.editGiveaway(interaction, guildId);
		} else if (subcommand === "delete") {
			await this.deleteGiveaway(interaction, guildId);
		} else if (subcommand === "list") {
			await this.listGiveaways(interaction, guildId);
		} else if (subcommand === "reroll") {
			await this.rerollGiveaway(interaction, guildId);
		} else if (subcommand === "reset") {
			await this.resetGiveaways(interaction, guildId);
		}
	}

	async sendHelp(interaction) {
		const embed = new EmbedBuilder()
			.setTitle("Giveaway Bot Commands")
			.setDescription(
				"Here are the commands you can use with the giveaway bot:"
			)
			.setColor("#5865F2")
			.addFields(
				{
					name: "/giveaway create",
					value: "Create a new giveaway. Usage: `/giveaway create [name] [channel] [duration] [winners] [actual_winner] [ping]`",
					inline: false,
				},
				{
					name: "/giveaway edit",
					value: "Edit an existing giveaway. Usage: `/giveaway edit [id] [name] [channel] [duration] [winners] [actual_winner] [ping]`",
					inline: false,
				},
				{
					name: "/giveaway delete",
					value: "Delete a giveaway. Usage: `/giveaway delete [id]`",
					inline: false,
				},
				{
					name: "/giveaway list",
					value: "List all active and ended giveaways. Usage: `/giveaway list`",
					inline: false,
				},
				{
					name: "/giveaway reroll",
					value: "Reroll a giveaway. Usage: `/giveaway reroll [id]`",
					inline: false,
				},
				{
					name: "/giveaway reset",
					value: "Clear all giveaway data for this guild. Usage: `/giveaway reset`",
					inline: false,
				},
				{
					name: "/help",
					value: "Display this help message. Usage: `/giveaway help`",
					inline: false,
				}
			)
			.setFooter({
				text: "Use the commands wisely to manage your giveaways!",
			});

		await interaction.reply({ embeds: [embed], ephemeral: true });
	}

	parseDuration(durationStr) {
		const durationParts = durationStr.split(/\s+/);
		let totalDurationMs = 0;

		for (const part of durationParts) {
			const partMs = ms(part.trim());
			if (partMs) totalDurationMs += partMs;
		}

		return totalDurationMs;
	}

	async createGiveaway(interaction, guildId) {
		const name = interaction.options.getString("name");
		const channel = interaction.options.getChannel("channel");
		const ping = interaction.options.getBoolean("ping") ? 1 : 0;
		const durationStr = interaction.options.getString("duration");
		const durationMs = this.parseDuration(durationStr);
		const winnersCount = interaction.options.getInteger("winners");
		const hostId = interaction.user.id;

		let actualWinners = [];
		for (let i = 1; i <= winnersCount; i++) {
			const winner = interaction.options.getUser(`actual_winner${i}`);
			if (winner) actualWinners.push(winner.id);
		}

		if (actualWinners.length !== winnersCount) {
			return interaction.reply({
				content: `Please specify exactly ${winnersCount} winners.`,
				ephemeral: true,
			});
		}

		const endTime = Date.now() + durationMs;
		const endTimeRelative = `<t:${Math.floor(endTime / 1000)}:R>`;
		const endTimeFormatted = `<t:${Math.floor(endTime / 1000)}:f>`;

		const embed = new EmbedBuilder()
			.setTitle(name)
			.setDescription(
				`Ends: ${endTimeRelative} (${endTimeFormatted})\nHosted by: <@${hostId}>\nEntries: **0**\nWinners: **${winnersCount}**`
			)
			.setColor("#5865f2")
			.setTimestamp(new Date(endTime));

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`giveaway_${endTime}`)
				.setEmoji("🎉")
				.setStyle(ButtonStyle.Primary)
		);

		const giveawayMessage = await channel.send({
			content: ping ? "@everyone" : "",
			embeds: [embed],
			components: [row],
		});

		this.db.insert("active_giveaways", {
			guild_id: guildId,
			name,
			channel_id: channel.id,
			ping,
			duration: durationStr,
			winners_count: winnersCount,
			actual_winner_ids: actualWinners.join(","), // Store as comma-separated IDs
			message_id: giveawayMessage.id,
			end_time: endTime,
			entries: "",
			host_id: hostId,
		});

		await interaction.reply({
			content: `Giveaway **${name}** created successfully!`,
			ephemeral: true,
		});

		setTimeout(async () => {
			await this.endGiveaway(giveawayMessage, actualWinners);
		}, durationMs);
	}

	async editGiveaway(interaction, guildId) {
		const id = interaction.options.getInteger("id");
		const giveaway = this.db.get("active_giveaways", {
			id,
			guild_id: guildId,
		});

		if (!giveaway) {
			return interaction.reply({
				content: "Giveaway not found.",
				ephemeral: true,
			});
		}

		const name = interaction.options.getString("name") || giveaway.name;
		const channel =
			interaction.options.getChannel("channel") ||
			this.client.channels.cache.get(giveaway.channel_id);
		const ping =
			interaction.options.getBoolean("ping") !== null
				? interaction.options.getBoolean("ping")
					? 1
					: 0
				: giveaway.ping;
		const durationStr =
			interaction.options.getString("duration") || giveaway.duration;
		const durationMs = this.parseDuration(durationStr);
		const winnersCount =
			interaction.options.getInteger("winners") || giveaway.winners_count;

		let actualWinners = [];
		for (let i = 1; i <= winnersCount; i++) {
			const winner = interaction.options.getUser(`actual_winner${i}`);
			if (winner) actualWinners.push(winner.id);
		}

		if (actualWinners.length !== winnersCount) {
			return interaction.reply({
				content: `Please specify exactly ${winnersCount} winners.`,
				ephemeral: true,
			});
		}

		const endTime = Date.now() + durationMs;

		const endTimeRelative = `<t:${Math.floor(endTime / 1000)}:R>`;
		const endTimeFormatted = `<t:${Math.floor(endTime / 1000)}:f>`;

		const embed = new EmbedBuilder()
			.setTitle(name)
			.setDescription(
				`Ends: ${endTimeRelative} (${endTimeFormatted})\nHosted by: <@${
					giveaway.host_id
				}>\nEntries: **${
					giveaway.entries.split(",").length
				}**\nWinners: **${winnersCount}**`
			)
			.setColor("#5865f2")
			.setTimestamp(new Date(endTime));

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`giveaway_${endTime}`)
				.setEmoji("🎉")
				.setStyle(ButtonStyle.Primary)
		);

		const oldMessage = await channel.messages.fetch(giveaway.message_id);
		if (oldMessage) await oldMessage.delete();

		const giveawayMessage = await channel.send({
			content: ping ? "@everyone" : "",
			embeds: [embed],
			components: [row],
		});

		this.db.update(
			"active_giveaways",
			{
				name,
				channel_id: channel.id,
				ping,
				duration: durationStr,
				winners_count: winnersCount,
				actual_winner_ids: actualWinners.join(","),
				message_id: giveawayMessage.id,
				end_time: endTime,
				entries: giveaway.entries,
				host_id: giveaway.host_id,
			},
			{ id, guild_id: guildId }
		);

		await interaction.reply({
			content: `Giveaway **${name}** edited successfully!`,
			ephemeral: true,
		});
	}

	async deleteGiveaway(interaction, guildId) {
		const id = interaction.options.getInteger("id");
		const giveaway = this.db.get("active_giveaways", {
			id,
			guild_id: guildId,
		});

		if (!giveaway) {
			return interaction.reply({
				content: "Giveaway not found.",
				ephemeral: true,
			});
		}

		const channel = this.client.channels.cache.get(giveaway.channel_id);
		const message = await channel.messages.fetch(giveaway.message_id);
		if (message) await message.delete();

		this.db.delete("active_giveaways", { id, guild_id: guildId });

		await interaction.reply({
			content: `Giveaway **${giveaway.name}** deleted successfully!`,
			ephemeral: true,
		});
	}

	async listGiveaways(interaction, guildId) {
		let activeGiveaways = [];
		let completedGiveaways = [];

		try {
			activeGiveaways = this.db
				.getAll("active_giveaways")
				.filter((g) => g.guild_id === guildId);
			completedGiveaways = this.db
				.getAll("completed_giveaways")
				.filter((g) => g.guild_id === guildId);

			const embed = new EmbedBuilder()
				.setTitle("Giveaway List")
				.setColor("#5865f2");

			if (activeGiveaways.length > 0) {
				embed.addFields({
					name: "**Active Giveaways**",
					value: "\u200B",
					inline: false,
				});
				activeGiveaways.forEach((g) => {
					const endTimeRelative = `<t:${Math.floor(
						g.end_time / 1000
					)}:R>`;
					const endTimeFormatted = `<t:${Math.floor(
						g.end_time / 1000
					)}:f>`;
					const messageLink = `https://discord.com/channels/${guildId}/${g.channel_id}/${g.message_id}`;
					embed.addFields(
						{ name: "ID", value: `${g.id}`, inline: true },
						{
							name: "Name",
							value: `[${g.name}](${messageLink})`,
							inline: true,
						},
						{
							name: "Ends",
							value: `${endTimeRelative} (${endTimeFormatted})`,
							inline: true,
						},
						{ name: "\u200B", value: "\u200B", inline: false }
					);
				});
			} else {
				embed.addFields({
					name: "Active Giveaways",
					value: "No active giveaways.",
					inline: false,
				});
			}

			if (completedGiveaways.length > 0) {
				embed.addFields({
					name: "**Ended Giveaways**",
					value: "\u200B",
					inline: false,
				});
				completedGiveaways.forEach((g) => {
					const endTimeRelative = `<t:${Math.floor(
						g.end_time / 1000
					)}:R>`;
					const endTimeFormatted = `<t:${Math.floor(
						g.end_time / 1000
					)}:f>`;
					const messageLink = `https://discord.com/channels/${guildId}/${g.channel_id}/${g.message_id}`;
					embed.addFields(
						{ name: "ID", value: `${g.id}`, inline: true },
						{
							name: "Name",
							value: `[${g.name}](${messageLink})`,
							inline: true,
						},
						{
							name: "Ended",
							value: `${endTimeRelative} (${endTimeFormatted})`,
							inline: true,
						},
						{ name: "\u200B", value: "\u200B", inline: false }
					);
				});
			} else {
				embed.addFields({
					name: "Ended Giveaways",
					value: "No ended giveaways.",
					inline: false,
				});
			}

			await interaction.reply({ embeds: [embed], ephemeral: true });
		} catch (error) {
			console.error(`Error fetching giveaways: ${error.message}`);
			await interaction.reply({
				content: "An error occurred while listing the giveaways.",
				ephemeral: true,
			});
		}
	}

	async rerollGiveaway(interaction, guildId) {
		const id = interaction.options.getInteger("id");

		let giveaway =
			this.db.get("active_giveaways", { id, guild_id: guildId }) ||
			this.db.get("completed_giveaways", { id, guild_id: guildId });

		if (!giveaway) {
			return interaction.reply({
				content: "Giveaway not found.",
				ephemeral: true,
			});
		}

		const channel = this.client.channels.cache.get(giveaway.channel_id);
		const giveawayMessage = await channel.messages.fetch(
			giveaway.message_id
		);

		const winners = giveaway.actual_winner_ids
			.split(",")
			.map((id) => this.client.users.cache.get(id));
		await this.endGiveaway(giveawayMessage, winners, true);

		await interaction.reply({
			content: `Giveaway **${giveaway.name}** has been rerolled successfully!`,
			ephemeral: true,
		});
	}

	async resetGiveaways(interaction, guildId) {
		this.db.deleteWhere("active_giveaways", { guild_id: guildId });
		this.db.deleteWhere("completed_giveaways", { guild_id: guildId });

		await interaction.reply({
			content: "All giveaway data for this guild has been cleared.",
			ephemeral: true,
		});
	}

	async handleInteraction(interaction) {
		const guildId = interaction.guild.id;

		this.db = this.initializeDatabase(guildId);

		if (interaction.isCommand() && interaction.commandName === "giveaway") {
			await this.execute(interaction);
		} else if (interaction.isButton()) {
			const [action, endTime] = interaction.customId.split("_");

			if (action === "giveaway") {
				const giveaway = this.db.get("active_giveaways", {
					end_time: parseInt(endTime),
					guild_id: guildId,
				});

				if (!giveaway) {
					return interaction.reply({
						content: "Giveaway not found.",
						ephemeral: true,
					});
				}

				let entries = giveaway.entries
					? giveaway.entries.split(",")
					: [];
				if (entries.includes(interaction.user.id)) {
					const row = new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId(`leave_${endTime}`)
							.setLabel("Leave Giveaway")
							.setStyle(ButtonStyle.Danger)
					);

					return interaction.reply({
						content: "You have already entered this giveaway!",
						components: [row],
						ephemeral: true,
					});
				}

				entries.push(interaction.user.id);
				this.db.update(
					"active_giveaways",
					{ entries: entries.join(",") },
					{ end_time: parseInt(endTime), guild_id: guildId }
				);

				const channel = this.client.channels.cache.get(
					giveaway.channel_id
				);
				const message = await channel.messages.fetch(
					giveaway.message_id
				);
				const embed = message.embeds[0];
				const updatedEmbed = EmbedBuilder.from(embed).setDescription(
					embed.description.replace(
						/Entries: \*\*\d+\*\*/,
						`Entries: **${entries.length}**`
					)
				);
				await message.edit({ embeds: [updatedEmbed] });

				await interaction.deferUpdate();
			} else if (action === "leave") {
				const giveaway = this.db.get("active_giveaways", {
					end_time: parseInt(endTime),
					guild_id: guildId,
				});

				if (!giveaway) {
					return interaction.reply({
						content: "Giveaway not found.",
						ephemeral: true,
					});
				}

				let entries = giveaway.entries
					? giveaway.entries.split(",")
					: [];
				if (!entries.includes(interaction.user.id)) {
					return interaction.reply({
						content: "You are not in this giveaway!",
						ephemeral: true,
					});
				}

				entries = entries.filter((id) => id !== interaction.user.id);
				this.db.update(
					"active_giveaways",
					{ entries: entries.join(",") },
					{ end_time: parseInt(endTime), guild_id: guildId }
				);

				const channel = this.client.channels.cache.get(
					giveaway.channel_id
				);
				const message = await channel.messages.fetch(
					giveaway.message_id
				);
				const embed = message.embeds[0];
				const updatedEmbed = EmbedBuilder.from(embed).setDescription(
					embed.description.replace(
						/Entries: \*\*\d+\*\*/,
						`Entries: **${entries.length}**`
					)
				);
				await message.edit({ embeds: [updatedEmbed] });

				await interaction.update({
					content: "You have left the giveaway.",
					components: [],
					ephemeral: true,
				});
			}
		}
	}

	async endGiveaway(giveawayMessage, winners, isReroll = false) {
		const giveaway = this.db.get("active_giveaways", {
			message_id: giveawayMessage.id,
		});

		const endTimeRelative = `<t:${Math.floor(giveaway.end_time / 1000)}:R>`;
		const endTimeFormatted = `<t:${Math.floor(
			giveaway.end_time / 1000
		)}:f>`;

		const embed = giveawayMessage.embeds[0];
		const endedEmbed = EmbedBuilder.from(embed)
			.setDescription(
				embed.description
					.replace(
						/Ends: <t:\d+:R>/,
						`Ended: ${endTimeRelative}`
					)
					.replace(
						/Winners: \*\*\d+\*\*/,
						`Winners: ${winners.map((id) => `<@${id}>`).join(", ")}`
					)
			)
			.setColor("#2f3136");

		const summaryUrl = `https://giveawaybot.party/summary#giveaway=${giveaway.guild_id}/${giveaway.message_id}`;
		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setLabel("Giveaway Summary")
				.setURL(summaryUrl)
				.setStyle(ButtonStyle.Link)
				.setDisabled(false)
		);

		await giveawayMessage.edit({
			embeds: [endedEmbed],
			components: [row],
		});

		const channel = this.client.channels.cache.get(giveaway.channel_id);
		await channel.send({
			content: `Congratulations ${winners
				.map((id) => `<@${id}>`)
				.join(", ")}! You won the **${giveaway.name}**!`,
			reply: { messageReference: giveawayMessage.id },
		});

		if (!isReroll) {
			this.db.insert("completed_giveaways", { ...giveaway });
			this.db.delete("active_giveaways", { id: giveaway.id });
		}

		await this.purgeOldGiveaways();
	}

	async purgeOldGiveaways() {
		const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

		this.db.deleteWhere("completed_giveaways", {
			end_time: { $lte: sevenDaysAgo },
		});

		console.log("Purged completed giveaways older than 7 days.");
	}

	checkForEndedGiveaways() {
		const now = Date.now();
		const activeGiveaways = this.db.getAll("active_giveaways");

		for (const giveaway of activeGiveaways) {
			const channel = this.client.channels.cache.get(giveaway.channel_id);

			if (!channel) {
				console.error(
					`Channel with ID ${giveaway.channel_id} not found.`
				);
				continue;
			}

			if (giveaway.end_time <= now) {
				channel.messages
					.fetch(giveaway.message_id)
					.then((giveawayMessage) => {
						const winnerIds = giveaway.actual_winner_ids.split(",");
						const winners = winnerIds.map((id) =>
							this.client.users.cache.get(id)
						);
						this.endGiveaway(giveawayMessage, winners);
					})
					.catch(console.error);
			} else {
				setTimeout(async () => {
					const giveawayMessage = await channel.messages.fetch(
						giveaway.message_id
					);
					const winnerIds = giveaway.actual_winner_ids.split(",");
					const winners = winnerIds.map((id) =>
						this.client.users.cache.get(id)
					);
					await this.endGiveaway(giveawayMessage, winners);
				}, giveaway.end_time - now);
			}
		}
	}
}

module.exports = Giveaway;
