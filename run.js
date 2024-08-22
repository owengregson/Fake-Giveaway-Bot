const { spawn } = require("child_process");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const Logger = require("./utils/logger");

dotenv.config();

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

logger.alert("Bot loading...");

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
				`Bot process exited with code ${code}. Restarting in 10 seconds...`
			);
			setTimeout(startBot, 10000);
		} else {
			logger.info("Bot process was terminated. Exiting monitor...");
			process.exit(0);
		}
	});

	botProcess.on("error", (err) => {
		logger.error(`Failed to start bot.js: ${err.message}`);
		setTimeout(startBot, 10000);
	});
}

process.on("uncaughtException", (err) => {
	logger.error(`Uncaught Exception: ${err.message}`);
});

process.on("unhandledRejection", (reason, promise) => {
	logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

startBot();
