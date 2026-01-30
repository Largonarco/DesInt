import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import initSqlJs from "sql.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * SQLite database using sql.js (pure JavaScript, no native bindings)
 * Works in any environment including Docker containers
 */
export class ScanDatabase {
	constructor() {
		this.dbPath = path.join(__dirname, "..", "data", "scans.db");
		this.db = null;
		this.ready = this.init();
	}

	async init() {
		const SQL = await initSqlJs();
		
		// Load existing database or create new one
		try {
			if (fs.existsSync(this.dbPath)) {
				const fileBuffer = fs.readFileSync(this.dbPath);
				this.db = new SQL.Database(fileBuffer);
			} else {
				this.db = new SQL.Database();
			}
		} catch (err) {
			console.log("Creating new database...");
			this.db = new SQL.Database();
		}

		// Create tables if they don't exist
		this.db.run(`
			CREATE TABLE IF NOT EXISTS scans (
				id TEXT PRIMARY KEY,
				url TEXT NOT NULL,
				domain TEXT NOT NULL,
				scanned_at TEXT NOT NULL,
				data TEXT NOT NULL,
				screenshot TEXT,
				created_at TEXT DEFAULT CURRENT_TIMESTAMP
			)
		`);
		
		this.db.run(`CREATE INDEX IF NOT EXISTS idx_scans_domain ON scans(domain)`);
		this.db.run(`CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scans(scanned_at DESC)`);
		
		// Save initial state
		this.persist();
		
		return this;
	}

	/**
	 * Persist database to disk
	 */
	persist() {
		try {
			const data = this.db.export();
			const buffer = Buffer.from(data);
			fs.writeFileSync(this.dbPath, buffer);
		} catch (err) {
			console.error("Failed to persist database:", err.message);
		}
	}

	/**
	 * Ensure database is ready
	 */
	async ensureReady() {
		if (!this.db) {
			await this.ready;
		}
	}

	/**
	 * Save a scan result
	 */
	save(scanResult) {
		const id = uuidv4();
		const domain = new URL(scanResult.url).hostname;

		// Store screenshot separately to keep main data lean
		const screenshot = scanResult.screenshot;
		const dataWithoutScreenshot = { ...scanResult };
		delete dataWithoutScreenshot.screenshot;

		this.db.run(
			`INSERT INTO scans (id, url, domain, scanned_at, data, screenshot) VALUES (?, ?, ?, ?, ?, ?)`,
			[id, scanResult.url, domain, scanResult.scrapedAt, JSON.stringify(dataWithoutScreenshot), screenshot]
		);

		this.persist();
		return id;
	}

	/**
	 * Get all scans (for history view)
	 */
	getAll(limit = 50) {
		const stmt = this.db.prepare(`
			SELECT id, url, domain, scanned_at, data
			FROM scans
			ORDER BY scanned_at DESC
			LIMIT ?
		`);
		stmt.bind([limit]);

		const results = [];
		while (stmt.step()) {
			const row = stmt.getAsObject();
			results.push({
				id: row.id,
				url: row.url,
				domain: row.domain,
				scannedAt: row.scanned_at,
				data: JSON.parse(row.data),
			});
		}
		stmt.free();
		return results;
	}

	/**
	 * Get a single scan by ID
	 */
	getById(id) {
		const stmt = this.db.prepare(`
			SELECT id, url, domain, scanned_at, data, screenshot
			FROM scans
			WHERE id = ?
		`);
		stmt.bind([id]);

		if (stmt.step()) {
			const row = stmt.getAsObject();
			stmt.free();
			return {
				id: row.id,
				url: row.url,
				domain: row.domain,
				scannedAt: row.scanned_at,
				data: JSON.parse(row.data),
				screenshot: row.screenshot,
			};
		}
		stmt.free();
		return null;
	}

	/**
	 * Delete a scan
	 */
	delete(id) {
		this.db.run("DELETE FROM scans WHERE id = ?", [id]);
		this.persist();
	}

	/**
	 * Get scans by domain
	 */
	getByDomain(domain) {
		const stmt = this.db.prepare(`
			SELECT id, url, domain, scanned_at, data
			FROM scans
			WHERE domain = ?
			ORDER BY scanned_at DESC
		`);
		stmt.bind([domain]);

		const results = [];
		while (stmt.step()) {
			const row = stmt.getAsObject();
			results.push({
				id: row.id,
				url: row.url,
				domain: row.domain,
				scannedAt: row.scanned_at,
				data: JSON.parse(row.data),
			});
		}
		stmt.free();
		return results;
	}
}

export default ScanDatabase;
