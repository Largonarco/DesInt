import fs from "fs";
import cors from "cors";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";
import { DesignScraper } from "./scraper.js";
import { ToneAnalyzer } from "./analyzer.js";
import { ScanDatabase } from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;

const db = new ScanDatabase();
const scraper = new DesignScraper();
const analyzer = new ToneAnalyzer(process.env.OPENAI_API_KEY);

app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === "production") {
	const clientDistPath = path.join(__dirname, "..", "client", "dist");
	console.log(`Serving static files from: ${clientDistPath}`);
	app.use(express.static(clientDistPath));
}

/**
 * POST /api/scan
 * Main endpoint - scrape a website and extract its design system
 */
app.post("/api/scan", async (req, res) => {
	const { url } = req.body;

	if (!url) {
		return res.status(400).json({ error: "URL is required" });
	}

	// validate URL
	let validUrl;
	try {
		validUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
	} catch (e) {
		return res.status(400).json({ error: "Invalid URL format" });
	}

	console.log(`\n🔍 Scanning: ${validUrl.href}`);
	const startTime = Date.now();

	try {
		// ensure database is ready
		await db.ensureReady();

		// scrape website
		console.log("Extracting design elements...");
		const scrapeResult = await scraper.scrape(validUrl.href);

		// analyze tone 
		console.log("Analyzing brand voice...");
		const toneAnalysis = await analyzer.analyze(scrapeResult.heroContent, scrapeResult.colors);

		const result = {
			...scrapeResult,
			tone: toneAnalysis,
		};

		const scanId = db.save(result);

		const duration = ((Date.now() - startTime) / 1000).toFixed(2);

		res.json({
			id: scanId,
			...result,
		});
	} catch (error) {
		res.status(500).json({
			error: "Failed to scan website",
			details: error.message,
		});
	}
});

/**
 * GET /api/scans
 * Get scan history
 */
app.get("/api/scans", async (req, res) => {
	try {
		await db.ensureReady();

		const scans = db.getAll(50);

		res.json(scans);
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch scan history" });
	}
});

/**
 * GET /api/scans/:id
 * Get a specific scan by ID
 */
app.get("/api/scans/:id", async (req, res) => {
	try {
		await db.ensureReady();

		const scan = db.getById(req.params.id);
		if (!scan) {
			return res.status(404).json({ error: "Scan not found" });
		}

		res.json(scan);
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch scan" });
	}
});

/**
 * DELETE /api/scans/:id
 * Delete a scan
 */
app.delete("/api/scans/:id", async (req, res) => {
	try {
		await db.ensureReady();

		db.delete(req.params.id);

		res.json({ success: true });
	} catch (error) {
		res.status(500).json({ error: "Failed to delete scan" });
	}
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
	res.json({
		status: "ok",
		hasOpenAI: !!process.env.OPENAI_API_KEY,
	});
});

// Catch-all for SPA routing in production
if (process.env.NODE_ENV === "production") {
	app.get("*", (req, res) => {
		const indexPath = path.join(__dirname, "..", "client", "dist", "index.html");
		if (fs.existsSync(indexPath)) {
			res.sendFile(indexPath);
		} else {
			res.status(404).send("Client build not found. Run npm run build first.");
		}
	});
}

process.on("SIGINT", async () => {
	console.log("\n🛑 Shutting down...");
	await scraper.close();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	console.log("\n🛑 Received SIGTERM, shutting down...");
	await scraper.close();
	process.exit(0);
});

// Start server after database is ready
async function startServer() {
	try {
		await db.ready;
		console.log("Database initialized successfully");
		
		app.listen(PORT, "0.0.0.0", () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

startServer();

export default app;
