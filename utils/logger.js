const winston = require("winston");
const path = require("path");
const fs = require("fs");

class Logger {
	constructor(logFileName) {
		const logsDir = path.join(__dirname, "../logs");

		if (!fs.existsSync(logsDir)) {
			fs.mkdirSync(logsDir, { recursive: true });
		}

		const logFilePath = path.join(logsDir, logFileName);

		this.logger = winston.createLogger({
			level: "info",
			format: winston.format.combine(
				winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
				winston.format.printf(
					(info) => `${info.timestamp} ${info.level}: ${info.message}`
				)
			),
			transports: [
				new winston.transports.File({ filename: logFilePath }),
			],
		});
	}

	info(message) {
		this.logger.info(message);
	}

	alert(message) {
		console.log("[!] " + message);
		this.logger.info(message);
	}

	error(message) {
		console.log("[X] " + message);
		this.logger.error(message);
	}

	warn(message) {
		this.logger.warn(message);
	}

	debug(message) {
		this.logger.debug(message);
	}
}

module.exports = Logger;
