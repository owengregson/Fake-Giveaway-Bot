const Database = require("better-sqlite3");
const path = require("path");

class DB {
	constructor(dbName) {
		this.dbPath = path.join(__dirname, `../${dbName}.db`);
		this.db = new Database(this.dbPath);

		console.log(`Connected to the ${dbName} SQLite database.`);
	}

	createTable(tableName, columns) {
		const columnsStr = columns
			.map((col) => `${col.name} ${col.type}`)
			.join(", ");
		const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnsStr})`;
		this.db.prepare(createTableSQL).run();
	}

	insert(tableName, data) {
		const columns = Object.keys(data).join(", ");
		const placeholders = Object.keys(data)
			.map(() => "?")
			.join(", ");
		const values = Object.values(data);
		const insertSQL = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
		const stmt = this.db.prepare(insertSQL);
		return stmt.run(...values);
	}

	update(tableName, data, condition) {
		const setStr = Object.keys(data)
			.map((key) => `${key} = ?`)
			.join(", ");
		const values = Object.values(data);
		const conditionStr = Object.keys(condition)
			.map((key) => `${key} = ?`)
			.join(" AND ");
		const conditionValues = Object.values(condition);
		const updateSQL = `UPDATE ${tableName} SET ${setStr} WHERE ${conditionStr}`;
		const stmt = this.db.prepare(updateSQL);
		return stmt.run(...values, ...conditionValues);
	}

	delete(tableName, condition) {
		const conditionStr = Object.keys(condition)
			.map((key) => `${key} = ?`)
			.join(" AND ");
		const conditionValues = Object.values(condition);
		const deleteSQL = `DELETE FROM ${tableName} WHERE ${conditionStr}`;
		const stmt = this.db.prepare(deleteSQL);
		return stmt.run(...conditionValues);
	}

	deleteWhere(tableName, where) {
		const keys = Object.keys(where);
		const conditions = keys
			.map((key) => {
				if (typeof where[key] === "object" && "$lte" in where[key]) {
					return `${key} <= ?`;
				}
				return `${key} = ?`;
			})
			.join(" AND ");

		const values = keys.map((key) => {
			if (typeof where[key] === "object" && "$lte" in where[key]) {
				return where[key].$lte;
			}
			return where[key];
		});

		const stmt = this.db.prepare(
			`DELETE FROM ${tableName} WHERE ${conditions}`
		);
		return stmt.run(...values);
	}

	runRaw(query) {
		return this.db.prepare(query).run();
	}

	get(tableName, condition) {
		const conditionStr = Object.keys(condition)
			.map((key) => `${key} = ?`)
			.join(" AND ");
		const conditionValues = Object.values(condition);
		const getSQL = `SELECT * FROM ${tableName} WHERE ${conditionStr}`;
		const stmt = this.db.prepare(getSQL);
		return stmt.get(...conditionValues);
	}

	getAll(tableName) {
		const getAllSQL = `SELECT * FROM ${tableName}`;
		return this.db.prepare(getAllSQL).all();
	}
}

module.exports = DB;
