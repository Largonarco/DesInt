import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ScanDatabase {
	constructor() {
		const dbPath = path.join(__dirname, "..", "data", "scans.db");
		this.db = new Database(dbPath);
		this.init();
	}

	init() {
		// Create tables if they don't exist
		this.db.exec(`
      CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        domain TEXT NOT NULL,
        scanned_at TEXT NOT NULL,
        data TEXT NOT NULL,
        screenshot TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_scans_domain ON scans(domain);
      CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scans(scanned_at DESC);
    `);
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

		const stmt = this.db.prepare(`
      INSERT INTO scans (id, url, domain, scanned_at, data, screenshot)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

		stmt.run(
			id,
			scanResult.url,
			domain,
			scanResult.scrapedAt,
			JSON.stringify(dataWithoutScreenshot),
			screenshot,
		);

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

		return stmt.all(limit).map((row) => ({
			id: row.id,
			url: row.url,
			domain: row.domain,
			scannedAt: row.scanned_at,
			data: JSON.parse(row.data),
		}));
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

		const row = stmt.get(id);
		if (!row) return null;

		return {
			id: row.id,
			url: row.url,
			domain: row.domain,
			scannedAt: row.scanned_at,
			data: JSON.parse(row.data),
			screenshot: row.screenshot,
		};
	}

	/**
	 * Delete a scan
	 */
	delete(id) {
		const stmt = this.db.prepare("DELETE FROM scans WHERE id = ?");
		return stmt.run(id);
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

		return stmt.all(domain).map((row) => ({
			id: row.id,
			url: row.url,
			domain: row.domain,
			scannedAt: row.scanned_at,
			data: JSON.parse(row.data),
		}));
	}
}

export default ScanDatabase;
