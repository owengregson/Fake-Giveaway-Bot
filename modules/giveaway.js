const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const ms = require("ms");
const DB = require("../utils/database"); // Import the generic Database class

class Giveaway {
	constructor(client) {
		this.client = client;
		this.db = new DB("giveaways");

		// Define the table schema for active giveaways
		this.db.createTable("active_giveaways", [
			{ name: "id", type: "INTEGER PRIMARY KEY AUTOINCREMENT" },
			{ name: "guild_id", type: "TEXT" }, // Store the guild ID
			{ name: "name", type: "TEXT" },
			{ name: "channel_id", type: "TEXT" },
			{ name: "ping", type: "INTEGER" },
			{ name: "duration", type: "TEXT" },
			{ name: "winners_count", type: "INTEGER" },
			{ name: "actual_winner_ids", type: "TEXT" }, // Store actual winners as a comma-separated string
			{ name: "message_id", type: "TEXT" },
			{ name: "end_time", type: "INTEGER" },
			{ name: "entries", type: "TEXT" }, // Store entries as a comma-separated string
			{ name: "host_id", type: "TEXT" }, // Store the host ID
		]);

		// Define the table schema for completed giveaways
		this.db.createTable("completed_giveaways", [
			{ name: "id", type: "INTEGER PRIMARY KEY AUTOINCREMENT" },
			{ name: "guild_id", type: "TEXT" }, // Store the guild ID
			{ name: "name", type: "TEXT" },
			{ name: "channel_id", type: "TEXT" },
			{ name: "ping", type: "INTEGER" },
			{ name: "duration", type: "TEXT" },
			{ name: "winners_count", type: "INTEGER" },
			{ name: "actual_winner_ids", type: "TEXT" }, // Store actual winners as a comma-separated string
			{ name: "message_id", type: "TEXT" },
			{ name: "end_time", type: "INTEGER" },
			{ name: "entries", type: "TEXT" }, // Store entries as a comma-separated string
			{ name: "host_id", type: "TEXT" }, // Store the host ID
		]);

		this.registerCommands();
		this.checkForEndedGiveaways(); // Check for giveaways that ended while the bot was offline
	}

	registerCommands() {
		const commands = [
			new SlashCommandBuilder()
				.setName("giveaway")
				.setDescription("Manage giveaways")
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
									"Duration of the giveaway (e.g., 1d, 1h)"
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
									"New duration of the giveaway (e.g., 1d, 1h)"
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

		this.client.commands.push(...commands);
	}

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === "create") {
			const name = interaction.options.getString("name");
			const channel = interaction.options.getChannel("channel");
			const ping = interaction.options.getBoolean("ping") ? 1 : 0;
			const duration = interaction.options.getString("duration");
			const winnersCount = interaction.options.getInteger("winners");
			const hostId = interaction.user.id;
			const guildId = interaction.guild.id;

			// Collect actual winners
			let actualWinners = [];
			for (let i = 1; i <= winnersCount; i++) {
				const winner = interaction.options.getUser(`actual_winner${i}`);
				if (winner) actualWinners.push(winner.id);
			}

			// Validate that the number of winners matches the number specified
			if (actualWinners.length !== winnersCount) {
				return interaction.reply({
					content: `Please specify exactly ${winnersCount} winners.`,
					ephemeral: true,
				});
			}

			const endTime = Date.now() + ms(duration);

			const embed = new EmbedBuilder()
				.setTitle(name)
				.setDescription(
					`Ends in: <t:${Math.floor(
						endTime / 1000
					)}:R>\nHosted by: <@${hostId}>\nEntries: **0**\nWinners: **${winnersCount}**`
				)
				.setColor("#5865f2")
				.setTimestamp(new Date(endTime));

			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`giveaway_${endTime}`)
					.setLabel("🎉 Enter Giveaway")
					.setStyle(ButtonStyle.Primary)
			);

			const giveawayMessage = await channel.send({
				content: ping ? "@everyone" : "",
				embeds: [embed],
				components: [row],
			});

			const giveawayId = this.db.insert("active_giveaways", {
				guild_id: guildId,
				name,
				channel_id: channel.id,
				ping,
				duration,
				winners_count: winnersCount,
				actual_winner_ids: actualWinners.join(","), // Store as comma-separated IDs
				message_id: giveawayMessage.id,
				end_time: endTime,
				entries: "",
				host_id: hostId,
			}).lastInsertRowid;

			await interaction.reply({
				content: `Giveaway **${name}** created successfully!`,
				ephemeral: true,
			});

			// Schedule the end of the giveaway
			setTimeout(async () => {
				await this.endGiveaway(giveawayMessage, actualWinners);
			}, ms(duration));
		} else if (subcommand === "edit") {
			const id = interaction.options.getInteger("id");
			const guildId = interaction.guild.id;
			const giveaway = this.db.get("active_giveaways", {
				id,
				guild_id: guildId,
			});

			if (!giveaway)
				return interaction.reply({
					content: "Giveaway not found.",
					ephemeral: true,
				});

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
			const duration =
				interaction.options.getString("duration") || giveaway.duration;
			const winnersCount =
				interaction.options.getInteger("winners") ||
				giveaway.winners_count;

			// Collect actual winners
			let actualWinners = [];
			for (let i = 1; i <= winnersCount; i++) {
				const winner = interaction.options.getUser(`actual_winner${i}`);
				if (winner) actualWinners.push(winner.id);
			}

			// Validate that the number of winners matches the number specified
			if (actualWinners.length !== winnersCount) {
				return interaction.reply({
					content: `Please specify exactly ${winnersCount} winners.`,
					ephemeral: true,
				});
			}

			const endTime = Date.now() + ms(duration);

			const embed = new EmbedBuilder()
				.setTitle(name)
				.setDescription(
					`Ends in: <t:${Math.floor(
						endTime / 1000
					)}:R>\nHosted by: <@${giveaway.host_id}>\nEntries: **${
						giveaway.entries.split(",").length
					}**\nWinners: **${winnersCount}**`
				)
				.setColor("#5865f2")
				.setTimestamp(new Date(endTime));

			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`giveaway_${endTime}`)
					.setLabel("🎉 Enter Giveaway")
					.setStyle(ButtonStyle.Primary)
			);

			const oldMessage = await channel.messages.fetch(
				giveaway.message_id
			);
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
					duration,
					winners_count: winnersCount,
					actual_winner_ids: actualWinners.join(","), // Store as comma-separated IDs
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
		} else if (subcommand === "delete") {
			const id = interaction.options.getInteger("id");
			const guildId = interaction.guild.id;
			const giveaway = this.db.get("active_giveaways", {
				id,
				guild_id: guildId,
			});

			if (!giveaway)
				return interaction.reply({
					content: "Giveaway not found.",
					ephemeral: true,
				});

			const channel = this.client.channels.cache.get(giveaway.channel_id);
			const message = await channel.messages.fetch(giveaway.message_id);
			if (message) await message.delete();

			this.db.delete("active_giveaways", { id, guild_id: guildId });

			await interaction.reply({
				content: `Giveaway **${giveaway.name}** deleted successfully!`,
				ephemeral: true,
			});
		} else if (subcommand === "list") {
			const guildId = interaction.guild.id;
			const activeGiveaways = this.db
				.getAll("active_giveaways")
				.filter((g) => g.guild_id === guildId);
			const completedGiveaways = this.db
				.getAll("completed_giveaways")
				.filter((g) => g.guild_id === guildId);

			const embed = new EmbedBuilder()
				.setTitle("Giveaway List")
				.setColor("#5865f2");

			// Format Active Giveaways
			if (activeGiveaways.length > 0) {
				embed.addFields({
					name: "**Active Giveaways**",
					value: "\u200B",
					inline: false,
				});
				activeGiveaways.forEach((g) => {
					const endTime = `<t:${Math.floor(g.end_time / 1000)}:R>`;
					const messageLink = `https://discord.com/channels/${guildId}/${g.channel_id}/${g.message_id}`;
					embed.addFields(
						{ name: "ID", value: `${g.id}`, inline: true },
						{
							name: "Name",
							value: `[${g.name}](${messageLink})`,
							inline: true,
						},
						{ name: "Ends In", value: `${endTime}`, inline: true },
						{ name: "\u200B", value: "\u200B", inline: false } // Spacer for better readability
					);
				});
			} else {
				embed.addFields({
					name: "Active Giveaways",
					value: "No active giveaways.",
					inline: false,
				});
			}

			// Format Completed Giveaways
			if (completedGiveaways.length > 0) {
				embed.addFields({
					name: "**Ended Giveaways**",
					value: "\u200B",
					inline: false,
				});
				completedGiveaways.forEach((g) => {
					const endTime = `<t:${Math.floor(g.end_time / 1000)}:R>`;
					const messageLink = `https://discord.com/channels/${guildId}/${g.channel_id}/${g.message_id}`;
					embed.addFields(
						{ name: "ID", value: `${g.id}`, inline: true },
						{
							name: "Name",
							value: `[${g.name}](${messageLink})`,
							inline: true,
						},
						{ name: "Ended", value: `${endTime}`, inline: true },
						{ name: "\u200B", value: "\u200B", inline: false } // Spacer for better readability
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
		} else if (subcommand === "reroll") {
			const id = interaction.options.getInteger("id");
			const guildId = interaction.guild.id;

			// Check both active and completed giveaways for the ID
			let giveaway =
				this.db.get("active_giveaways", { id, guild_id: guildId }) ||
				this.db.get("completed_giveaways", { id, guild_id: guildId });

			if (!giveaway)
				return interaction.reply({
					content: "Giveaway not found.",
					ephemeral: true,
				});

			// Fetch the original channel and message
			const channel = this.client.channels.cache.get(giveaway.channel_id);
			const giveawayMessage = await channel.messages.fetch(
				giveaway.message_id
			);

			// Reroll the giveaway
			await this.endGiveaway(
				giveawayMessage,
				this.client.users.cache.get(
					giveaway.actual_winner_ids.split(",")
				),
				true
			);

			await interaction.reply({
				content: `Giveaway **${giveaway.name}** has been rerolled successfully!`,
				ephemeral: true,
			});
		} else if (subcommand === "reset") {
			const guildId = interaction.guild.id;

			this.db.deleteWhere("active_giveaways", { guild_id: guildId });
			this.db.deleteWhere("completed_giveaways", { guild_id: guildId });

			await interaction.reply({
				content: "All giveaway data for this guild has been cleared.",
				ephemeral: true,
			});
		}
	}

	async handleInteraction(interaction) {
		if (interaction.isCommand() && interaction.commandName === "giveaway") {
			await this.execute(interaction);
		} else if (interaction.isButton()) {
			const [action, endTime] = interaction.customId.split("_");

			if (action === "giveaway") {
				const guildId = interaction.guild.id;
				const giveaway = this.db.get("active_giveaways", {
					end_time: parseInt(endTime),
					guild_id: guildId,
				});

				if (!giveaway)
					return interaction.reply({
						content: "Giveaway not found.",
						ephemeral: true,
					});

				let entries = giveaway.entries
					? giveaway.entries.split(",")
					: [];
				if (entries.includes(interaction.user.id)) {
					return interaction.reply({
						content: "You have already entered this giveaway!",
						ephemeral: true,
					});
				}

				entries.push(interaction.user.id);
				this.db.update(
					"active_giveaways",
					{ entries: entries.join(",") },
					{ end_time: parseInt(endTime), guild_id: guildId }
				);

				// Update the embed with the new number of entries
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

				await interaction.reply({
					content: "You have successfully entered the giveaway!",
					ephemeral: true,
				});
			}
		}
	}

	async endGiveaway(giveawayMessage, winners, isReroll = false) {
		const giveaway = this.db.get("active_giveaways", {
			message_id: giveawayMessage.id,
		});

		// Format the timestamp
		const endTimeFormatted = `<t:${Math.floor(
			giveaway.end_time / 1000
		)}:R> (<t:${Math.floor(giveaway.end_time / 1000)}:F>)`;

		const embed = giveawayMessage.embeds[0];
		const endedEmbed = EmbedBuilder.from(embed)
			.setDescription(
				embed.description
					.replace(/Ends in: <t:\d+:R>/, `Ended: ${endTimeFormatted}`)
					.replace(
						/Winners: \*\*\d+\*\*/,
						`Winners: ${winners.map((id) => `<@${id}>`).join(", ")}`
					)
			)
			.setColor("#2f3136");

		await giveawayMessage.edit({ embeds: [endedEmbed], components: [] });

		const channel = this.client.channels.cache.get(giveaway.channel_id);
		await channel.send({
			content: `🥳 Congratulations ${winners
				.map((id) => `<@${id}>`)
				.join(", ")}! You won the **${giveaway.name}**!`,
			reply: { messageReference: giveawayMessage.id },
		});

		if (!isReroll) {
			// Move giveaway to completed_giveaways table
			this.db.insert("completed_giveaways", { ...giveaway });

			// Delete from active_giveaways
			this.db.delete("active_giveaways", { id: giveaway.id });
		}

		// Purge old giveaways
		await this.purgeOldGiveaways();
	}

	async purgeOldGiveaways() {
		const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

		// Purge old completed giveaways
		this.db.deleteWhere("completed_giveaways", {
			end_time: { $lte: sevenDaysAgo },
		});

		console.log("Purged completed giveaways older than 7 days.");
	}

	checkForEndedGiveaways() {
		const now = Date.now();
		const activeGiveaways = this.db.getAll("active_giveaways");

		for (const giveaway of activeGiveaways) {
			if (giveaway.end_time <= now) {
				const channel = this.client.channels.cache.get(
					giveaway.channel_id
				);
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
				// Schedule the giveaway to end at the correct time
				setTimeout(async () => {
					const channel = this.client.channels.cache.get(
						giveaway.channel_id
					);
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
