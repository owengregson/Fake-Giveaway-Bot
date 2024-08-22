const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord.js");
const Logger = require("./utils/logger");
require("dotenv").config();

const startTimestamp = new Date();
const logFileName = `${startTimestamp
	.toLocaleDateString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
	})
	.replace(/\//g, "_")}_${startTimestamp
	.toLocaleTimeString("en-US", {
		hour12: false,
		hour: "2-digit",
		minute: "2-digit",
	})
	.replace(/:/g, "-")}.log`;

const logger = new Logger(logFileName);

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

client.commands = [];
client.modules = [];

const modulesPath = path.join(__dirname, "modules");
fs.readdirSync(modulesPath).forEach((file) => {
	if (file.endsWith(".js")) {
		const ModuleClass = require(path.join(modulesPath, file));
		const moduleInstance = new ModuleClass(client);
		client.modules.push(moduleInstance);

		if (moduleInstance.registerCommands) {
			moduleInstance.registerCommands();
		}
	}
});

client.once("ready", async () => {
	try {
		const commandsData = client.commands.map((command) => command);

		const uniqueCommandsData = commandsData.filter(
			(value, index, self) =>
				index === self.findIndex((t) => t.name === value.name)
		);

		logger.info(
			`Registering the following commands: ${JSON.stringify(
				uniqueCommandsData
			)}`
		);

		const rest = new REST({ version: "10" }).setToken(
			process.env.DISCORD_BOT_TOKEN
		);
		await rest.put(Routes.applicationCommands(client.user.id), {
			body: uniqueCommandsData,
		});

		logger.info("Slash commands registered successfully.");
		logger.alert(`Logged in as ${client.user.tag}!`);
	} catch (error) {
		logger.error(`Error registering slash commands: ${error.message}`);
	}
});

client.on("interactionCreate", async (interaction) => {
	for (const module of client.modules) {
		if (module.handleInteraction) {
			await module.handleInteraction(interaction);
		}
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);
