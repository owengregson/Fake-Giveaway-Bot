const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
const winston = require("winston");

// Setup logging with winston
const logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: "bot.log" }),
	],
});

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

client.commands = [];
client.modules = [];

// Dynamically load all modules
const modulesPath = path.join(__dirname, "modules");
fs.readdirSync(modulesPath).forEach((file) => {
	if (file.endsWith(".js")) {
		const ModuleClass = require(path.join(modulesPath, file));
		const moduleInstance = new ModuleClass(client);
		client.modules.push(moduleInstance);
	}
});

// Register commands with Discord API
client.once("ready", async () => {
	try {
		const commandsData = client.commands.map((command) => command.toJSON());

		await client.application.commands.set(commandsData);
		logger.info("Slash commands registered successfully.");
		logger.info(`Logged in as ${client.user.tag}`);
	} catch (error) {
		logger.error(`Error registering slash commands: ${error.message}`);
	}
});

// Handle interactions
client.on("interactionCreate", async (interaction) => {
	for (const module of client.modules) {
		await module.handleInteraction(interaction);
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);
