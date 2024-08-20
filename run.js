const { spawn } = require("child_process");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const winston = require("winston");

dotenv.config();

const logConfiguration = {
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: "bot.log" }),
	],
	format: winston.format.combine(
		winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		winston.format.printf(
			(info) => `${info.timestamp} ${info.level}: ${info.message}`
		)
	),
};

const logger = winston.createLogger(logConfiguration);

logger.info("Starting the Discord bot monitor...");

const modulesDir = path.join(__dirname, "modules");
if (!fs.existsSync(modulesDir)) {
	logger.error("Modules directory does not exist. Exiting...");
	process.exit(1);
}

function startBot() {
	logger.info("Launching bot.js...");
	const botProcess = spawn("node", ["bot.js"], { stdio: "inherit" });

	botProcess.on("exit", (code, signal) => {
		if (signal !== "SIGTERM" && signal !== "SIGINT") {
			logger.error(
				`Bot process exited with code ${code}. Restarting in 30 seconds...`
			);
			setTimeout(startBot, 30000);
		} else {
			logger.info("Bot process was terminated. Exiting monitor...");
			process.exit(0);
		}
	});

	botProcess.on("error", (err) => {
		logger.error(`Failed to start bot.js: ${err.message}`);
		setTimeout(startBot, 30000);
	});
}

process.on("uncaughtException", (err) => {
	logger.error(`Uncaught Exception: ${err.message}`);
});

process.on("unhandledRejection", (reason, promise) => {
	logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

startBot();
