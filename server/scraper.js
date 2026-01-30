import puppeteer from "puppeteer";

/**
 * Design Intelligence Engine - Core Scraper
 * 
 * WHY PUPPETEER?
 * - We need COMPUTED styles, not just CSS files. A site might use CSS variables,
 *   Tailwind classes, or inline styles. Puppeteer renders the page like a real
 *   browser and gives us the actual computed values.
 * - We can execute JavaScript to find interactive elements (buttons, links)
 *   and extract their actual rendered colors.
 * - Better logo detection - we can check actual rendered sizes and visibility.
 */

export class DesignScraper {
	constructor() {
		this.browser = null;
	}

	async init() {
		// Configure Puppeteer for different environments
		const launchOptions = {
			headless: "new",
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-dev-shm-usage",
				"--disable-accelerated-2d-canvas",
				"--no-first-run",
				"--no-zygote",
				"--single-process",
				"--disable-gpu"
			]
		};

		// Use system Chrome in Docker/Railway environment
		if (process.env.PUPPETEER_EXECUTABLE_PATH) {
			launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
		}

		this.browser = await puppeteer.launch(launchOptions);
	}

	async close() {
		if (this.browser) {
			await this.browser.close();
		}
	}

	async scrape(url) {
		if (!this.browser) await this.init();

		const page = await this.browser.newPage();
		await page.setViewport({ width: 1920, height: 1080 });

		await page.setUserAgent(
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		);

		try {
			await page.goto(url, {
				waitUntil: "networkidle2",
				timeout: 30000,
			});

			// small delay for page to load
			await new Promise((r) => setTimeout(r, 2000));

			// extracts all design data in parallel
			const [colors, typography, logo, heroContent, screenshot] = await Promise.all([
				this.extractColors(page),
				this.extractTypography(page),
				this.extractLogo(page, url),
				this.extractHeroContent(page),
				this.takeScreenshot(page),
			]);

			await page.close();

			return {
				url,
				scrapedAt: new Date().toISOString(),
				colors,
				typography,
				logo,
				heroContent,
				screenshot,
			};
		} catch (error) {
			await page.close();
			throw error;
		}
	}

	async extractColors(page) {
		const colorData = await page.evaluate(() => {
			const colors = {
				buttons: [],
				links: [],
				backgrounds: [],
				text: [],
				borders: [],
				svgColors: [],
				accentElements: [],
				all: new Map(),
			};

			// converts RGB to hex
			const rgbToHex = (rgb) => {
				if (!rgb || rgb === "transparent" || rgb === "rgba(0, 0, 0, 0)") return null;
				const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
				if (!match) return null;
				const [, r, g, b] = match;
				return "#" + [r, g, b].map((x) => parseInt(x).toString(16).padStart(2, "0")).join("");
			};

			// checks if color is too neutral (grayscale)
			const isNeutral = (hex) => {
				if (!hex) return true;
				const r = parseInt(hex.slice(1, 3), 16);
				const g = parseInt(hex.slice(3, 5), 16);
				const b = parseInt(hex.slice(5, 7), 16);
				const max = Math.max(r, g, b);
				const min = Math.min(r, g, b);
				const saturation = max === 0 ? 0 : (max - min) / max;
				return saturation < 0.15; // Low saturation = neutral/grayscale
			};

			// checks if color is too light or too dark
			const getLuminance = (hex) => {
				if (!hex) return 0;
				const r = parseInt(hex.slice(1, 3), 16) / 255;
				const g = parseInt(hex.slice(3, 5), 16) / 255;
				const b = parseInt(hex.slice(5, 7), 16) / 255;
				return 0.299 * r + 0.587 * g + 0.114 * b;
			};

			// extracts hex colors from a string (for SVG attributes)
			const extractHexColors = (str) => {
				if (!str) return [];
				const hexPattern = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
				const matches = str.match(hexPattern) || [];
				return matches.map((c) =>
					c.length === 4 ? "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c.toLowerCase(),
				);
			};

			// 1. BUTTONS - Most important for primary color
			const buttons = document.querySelectorAll(
				'button, [role="button"], a[class*="btn"], a[class*="button"], input[type="submit"], .cta, [class*="cta"]',
			);
			buttons.forEach((btn) => {
				const style = window.getComputedStyle(btn);
				const bgColor = rgbToHex(style.backgroundColor);
				const rect = btn.getBoundingClientRect();

				if (bgColor && rect.width > 50 && rect.height > 20) {
					colors.buttons.push({
						color: bgColor,
						area: rect.width * rect.height,
						text: btn.textContent?.trim().slice(0, 50),
						isVisible: rect.top < window.innerHeight && rect.top > 0,
					});
				}
			});

			// 2. LINKS - For secondary/accent colors
			const links = document.querySelectorAll('a:not([class*="btn"]):not([class*="button"])');
			links.forEach((link) => {
				const style = window.getComputedStyle(link);
				const color = rgbToHex(style.color);
				if (color && !isNeutral(color)) {
					colors.links.push(color);
				}
			});

			// 3. BACKGROUNDS - Large sections
			const sections = document.querySelectorAll(
				'header, nav, section, footer, main, [class*="hero"], [class*="banner"]',
			);
			sections.forEach((section) => {
				const style = window.getComputedStyle(section);
				const bgColor = rgbToHex(style.backgroundColor);
				const rect = section.getBoundingClientRect();

				if (bgColor && rect.width > 200 && rect.height > 100) {
					colors.backgrounds.push({
						color: bgColor,
						area: rect.width * rect.height,
						isHero: rect.top < 200,
					});
				}
			});

			// 4. TEXT COLORS
			const textElements = document.querySelectorAll("h1, h2, h3, p, span, li");
			textElements.forEach((el) => {
				const style = window.getComputedStyle(el);
				const color = rgbToHex(style.color);
				if (color) {
					colors.text.push(color);
				}
			});

			// 5. BORDERS - Sometimes used for accents
			const allElements = document.querySelectorAll("*");
			allElements.forEach((el) => {
				const style = window.getComputedStyle(el);
				const borderColor = rgbToHex(style.borderColor);
				if (borderColor && !isNeutral(borderColor)) {
					colors.borders.push(borderColor);
				}
			});

			// 6. SVG COLORS - Extract colors from inline SVGs (often contain brand colors)
			const svgs = document.querySelectorAll("svg");
			svgs.forEach((svg) => {
				const rect = svg.getBoundingClientRect();
				const inHeader =
					svg.closest('header, nav, [class*="header"], [class*="nav"], [class*="logo"]') !== null;

				// getting all fill and stroke colors from SVG elements
				const svgElements = svg.querySelectorAll("*");
				svgElements.forEach((el) => {
					const fill = el.getAttribute("fill");
					const stroke = el.getAttribute("stroke");
					const style = window.getComputedStyle(el);

					// checking fill attribute
					if (fill && fill !== "none" && fill !== "transparent") {
						const hexColors = extractHexColors(fill);
						hexColors.forEach((c) => {
							if (!isNeutral(c)) {
								colors.svgColors.push({ color: c, inHeader, area: rect.width * rect.height });
							}
						});
						// also checking computed fill
						const computedFill = rgbToHex(style.fill);
						if (computedFill && !isNeutral(computedFill)) {
							colors.svgColors.push({
								color: computedFill,
								inHeader,
								area: rect.width * rect.height,
							});
						}
					}

					// checking stroke attribute
					if (stroke && stroke !== "none" && stroke !== "transparent") {
						const hexColors = extractHexColors(stroke);
						hexColors.forEach((c) => {
							if (!isNeutral(c)) {
								colors.svgColors.push({ color: c, inHeader, area: rect.width * rect.height });
							}
						});
					}
				});

				// also check the SVG's own style
				const svgStyle = window.getComputedStyle(svg);
				const svgFill = rgbToHex(svgStyle.fill);
				const svgColor = rgbToHex(svgStyle.color);
				if (svgFill && !isNeutral(svgFill)) {
					colors.svgColors.push({ color: svgFill, inHeader, area: rect.width * rect.height });
				}
				if (svgColor && !isNeutral(svgColor)) {
					colors.svgColors.push({ color: svgColor, inHeader, area: rect.width * rect.height });
				}
			});

			// 7. ACCENT ELEMENTS - Look for elements with vibrant colors that stand out
			const accentSelectors = [
				'[class*="accent"]',
				'[class*="highlight"]',
				'[class*="primary"]',
				'[class*="brand"]',
				'[class*="feature"]',
				'[class*="badge"]',
				'[class*="tag"]',
				'[class*="pill"]',
				'[class*="chip"]',
			];
			accentSelectors.forEach((selector) => {
				try {
					document.querySelectorAll(selector).forEach((el) => {
						const style = window.getComputedStyle(el);
						const bgColor = rgbToHex(style.backgroundColor);
						const textColor = rgbToHex(style.color);
						const rect = el.getBoundingClientRect();

						if (bgColor && !isNeutral(bgColor)) {
							colors.accentElements.push({ color: bgColor, area: rect.width * rect.height });
						}
						if (textColor && !isNeutral(textColor)) {
							colors.accentElements.push({ color: textColor, area: rect.width * rect.height });
						}
					});
				} catch (e) {}
			});

			return colors;
		});

		// processes and classifies colors
		return this.classifyColors(colorData);
	}

	classifyColors(colorData) {
		const colorScores = new Map();

		// calculates color vibrancy/saturation
		const getColorVibrancy = (hex) => {
			if (!hex) return 0;
			const r = parseInt(hex.slice(1, 3), 16);
			const g = parseInt(hex.slice(3, 5), 16);
			const b = parseInt(hex.slice(5, 7), 16);
			const max = Math.max(r, g, b);
			const min = Math.min(r, g, b);
			const saturation = max === 0 ? 0 : (max - min) / max;
			const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
			// Penalize very dark or very light colors
			const luminancePenalty = luminance < 0.15 || luminance > 0.85 ? 0.3 : 1;
			return saturation * luminancePenalty;
		};

		// checks if color is too neutral (grayscale/dark)
		const isNeutralOrDark = (hex) => {
			if (!hex) return true;
			const r = parseInt(hex.slice(1, 3), 16);
			const g = parseInt(hex.slice(3, 5), 16);
			const b = parseInt(hex.slice(5, 7), 16);
			const max = Math.max(r, g, b);
			const min = Math.min(r, g, b);
			const saturation = max === 0 ? 0 : (max - min) / max;
			const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
			// Consider it neutral if low saturation OR very dark
			return saturation < 0.25 || luminance < 0.15;
		};

		// adds score to a color
		const addScore = (color, score, category) => {
			if (!color) return;
			const normalized = color.toLowerCase();
			if (!colorScores.has(normalized)) {
				colorScores.set(normalized, {
					total: 0,
					categories: {},
					vibrancy: getColorVibrancy(normalized),
				});
			}
			const entry = colorScores.get(normalized);
			entry.total += score;
			entry.categories[category] = (entry.categories[category] || 0) + score;
		};

		// scores button colors heavily - these are almost always primary
		// But give EXTRA weight to vibrant/saturated button colors
		colorData.buttons.forEach((btn) => {
			const vibrancy = getColorVibrancy(btn.color);
			const baseScore = btn.isVisible ? 100 : 50;
			const areaBonus = Math.min(btn.area / 1000, 50);
			// Vibrant colors get a significant bonus (up to 100 extra points)
			const vibrancyBonus = vibrancy * 100;
			addScore(btn.color, baseScore + areaBonus + vibrancyBonus, "button");
		});

		// scores link colors for secondary
		const linkCounts = {};
		colorData.links.forEach((color) => {
			linkCounts[color] = (linkCounts[color] || 0) + 1;
		});
		Object.entries(linkCounts).forEach(([color, count]) => {
			const vibrancy = getColorVibrancy(color);
			addScore(color, count * 10 + vibrancy * 30, "link");
		});

		// scores backgrounds
		colorData.backgrounds.forEach((bg) => {
			const score = bg.isHero ? 30 : 15;
			addScore(bg.color, score, "background");
		});

		// scores border colors (often accent colors)
		const borderCounts = {};
		colorData.borders.forEach((color) => {
			borderCounts[color] = (borderCounts[color] || 0) + 1;
		});
		Object.entries(borderCounts).forEach(([color, count]) => {
			const vibrancy = getColorVibrancy(color);
			if (vibrancy > 0.3) {
				// Only score vibrant borders
				addScore(color, count * 15 + vibrancy * 40, "border");
			}
		});

		// Score SVG colors - VERY important for brand colors (logos!)
		// Colors in header SVGs get highest weight
		if (colorData.svgColors) {
			colorData.svgColors.forEach((svg) => {
				const vibrancy = getColorVibrancy(svg.color);
				// Header SVGs (likely logos) get massive bonus
				const headerBonus = svg.inHeader ? 150 : 50;
				const vibrancyBonus = vibrancy * 80;
				addScore(svg.color, headerBonus + vibrancyBonus, "svg");
			});
		}

		// scores accent elements
		if (colorData.accentElements) {
			colorData.accentElements.forEach((accent) => {
				const vibrancy = getColorVibrancy(accent.color);
				addScore(accent.color, 60 + vibrancy * 60, "accent");
			});
		}

		// filters and sorts colors
		const isValidBrandColor = (hex) => {
			if (!hex) return false;
			const r = parseInt(hex.slice(1, 3), 16);
			const g = parseInt(hex.slice(3, 5), 16);
			const b = parseInt(hex.slice(5, 7), 16);

			// Check if it's not pure white/black
			const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
			if (luminance > 0.95 || luminance < 0.05) return false;

			// Check saturation
			const max = Math.max(r, g, b);
			const min = Math.min(r, g, b);
			const saturation = max === 0 ? 0 : (max - min) / max;

			return saturation > 0.1 || (luminance > 0.1 && luminance < 0.9);
		};

		// Get sorted colors by score
		const sortedColors = Array.from(colorScores.entries())
			.filter(([color]) => isValidBrandColor(color))
			.sort((a, b) => b[1].total - a[1].total);

		// Find primary - prefer vibrant button colors over neutral ones
		// First, try to find a vibrant button color
		let primaryColor = sortedColors.find(
			([color, data]) =>
				data.categories.button && data.categories.button > 50 && !isNeutralOrDark(color),
		);

		// If no vibrant button color, fall back to any high-scoring vibrant color
		if (!primaryColor) {
			primaryColor = sortedColors.find(
				([color, data]) => !isNeutralOrDark(color) && data.total > 50,
			);
		}

		// Last resort: highest scoring button color
		if (!primaryColor) {
			primaryColor = sortedColors.find(
				([color, data]) => data.categories.button && data.categories.button > 50,
			);
		}

		// Find secondary (highest scoring non-primary vibrant color)
		const secondaryColor =
			sortedColors.find(
				([color, data]) =>
					color !== primaryColor?.[0] &&
					(data.categories.link || data.categories.button || data.categories.border) &&
					!isNeutralOrDark(color),
			) ||
			sortedColors.find(
				([color, data]) =>
					color !== primaryColor?.[0] && (data.categories.link || data.categories.button),
			);

		// Find background colors
		const bgColors = colorData.backgrounds
			.filter((bg) => bg.area > 50000)
			.sort((a, b) => b.area - a.area)
			.slice(0, 3)
			.map((bg) => bg.color);

		// Find text colors
		const textCounts = {};
		colorData.text.forEach((color) => {
			textCounts[color] = (textCounts[color] || 0) + 1;
		});
		const textColors = Object.entries(textCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 2)
			.map(([color]) => color);

		// Find accent (third most prominent vibrant color)
		const accentColor = sortedColors.find(
			([color]) =>
				color !== primaryColor?.[0] && color !== secondaryColor?.[0] && !isNeutralOrDark(color),
		);

		return {
			primary: primaryColor?.[0] || sortedColors[0]?.[0] || null,
			secondary: secondaryColor?.[0] || sortedColors[1]?.[0] || null,
			background: bgColors[0] || "#ffffff",
			backgrounds: [...new Set(bgColors)],
			text: textColors[0] || "#000000",
			textColors: [...new Set(textColors)],
			accent: accentColor?.[0] || sortedColors[2]?.[0] || null,
			palette: sortedColors.slice(0, 8).map(([color, data]) => ({
				color,
				score: data.total,
				usage: Object.keys(data.categories),
			})),
		};
	}

	async extractTypography(page) {
		return await page.evaluate(() => {
			const fonts = {
				headings: new Map(),
				body: new Map(),
			};

			// Extract heading fonts
			const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
			headings.forEach((h) => {
				const style = window.getComputedStyle(h);
				const fontFamily = style.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
				const fontSize = style.fontSize;
				const fontWeight = style.fontWeight;

				const key = fontFamily;
				if (!fonts.headings.has(key)) {
					fonts.headings.set(key, { count: 0, sizes: [], weights: [] });
				}
				const entry = fonts.headings.get(key);
				entry.count++;
				entry.sizes.push(fontSize);
				entry.weights.push(fontWeight);
			});

			// Extract body fonts
			const bodyElements = document.querySelectorAll("p, span, li, a, div");
			bodyElements.forEach((el) => {
				const style = window.getComputedStyle(el);
				const fontSize = parseFloat(style.fontSize);

				// Only consider text-sized elements (12-20px typically)
				if (fontSize >= 12 && fontSize <= 24) {
					const fontFamily = style.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
					const fontWeight = style.fontWeight;

					const key = fontFamily;
					if (!fonts.body.has(key)) {
						fonts.body.set(key, { count: 0, sizes: [], weights: [] });
					}
					const entry = fonts.body.get(key);
					entry.count++;
					entry.sizes.push(style.fontSize);
					entry.weights.push(fontWeight);
				}
			});

			// Convert to arrays and sort by frequency
			const headingFonts = Array.from(fonts.headings.entries())
				.map(([font, data]) => ({
					family: font,
					count: data.count,
					avgSize: data.sizes[0],
					weights: [...new Set(data.weights)],
				}))
				.sort((a, b) => b.count - a.count);

			const bodyFonts = Array.from(fonts.body.entries())
				.map(([font, data]) => ({
					family: font,
					count: data.count,
					avgSize: data.sizes[Math.floor(data.sizes.length / 2)],
					weights: [...new Set(data.weights)],
				}))
				.sort((a, b) => b.count - a.count);

			return {
				heading: {
					family: headingFonts[0]?.family || "System Default",
					weights: headingFonts[0]?.weights || ["400"],
					fallback: headingFonts[1]?.family,
				},
				body: {
					family: bodyFonts[0]?.family || "System Default",
					weights: bodyFonts[0]?.weights || ["400"],
					fallback: bodyFonts[1]?.family,
				},
				all: [...new Set([...headingFonts, ...bodyFonts].map((f) => f.family))],
			};
		});
	}

	async extractLogo(page, baseUrl) {
		const logoData = await page.evaluate(() => {
			const candidates = [];

			// gets absolute URL
			const getAbsoluteUrl = (src) => {
				if (!src) return null;
				if (src.startsWith("data:")) return src;
				if (src.startsWith("http")) return src;
				if (src.startsWith("//")) return "https:" + src;
				if (src.startsWith("/")) return window.location.origin + src;
				return window.location.origin + "/" + src;
			};

			// looks for images with "logo" in attributes
			const images = document.querySelectorAll("img");
			images.forEach((img) => {
				const src = img.src || img.getAttribute("data-src");
				const alt = img.alt || "";
				const className = img.className || "";
				const id = img.id || "";
				const parent = img.closest('header, nav, [class*="header"], [class*="nav"]');

				const isLikelyLogo =
					/logo/i.test(src) ||
					/logo/i.test(alt) ||
					/logo/i.test(className) ||
					/logo/i.test(id) ||
					/brand/i.test(className) ||
					parent !== null;

				if (isLikelyLogo && src) {
					const rect = img.getBoundingClientRect();
					candidates.push({
						type: "img",
						src: getAbsoluteUrl(src),
						width: img.naturalWidth || rect.width,
						height: img.naturalHeight || rect.height,
						inHeader: parent !== null,
						hasLogoKeyword: /logo/i.test(src + alt + className + id),
						format:
							src.includes(".svg") ? "svg"
							: src.includes(".png") ? "png"
							: src.startsWith("data:image/svg") ? "svg"
							: src.startsWith("data:image/png") ? "png"
							: "other",
					});
				}
			});

			// looks for SVGs in header/nav
			const headerNav = document.querySelectorAll('header, nav, [class*="header"], [class*="nav"]');
			headerNav.forEach((container) => {
				const svgs = container.querySelectorAll("svg");
				svgs.forEach((svg) => {
					const rect = svg.getBoundingClientRect();
					if (rect.width > 20 && rect.height > 20) {
						// Serialize SVG to string
						const serializer = new XMLSerializer();
						const svgString = serializer.serializeToString(svg);
						candidates.push({
							type: "svg",
							src: "data:image/svg+xml," + encodeURIComponent(svgString),
							width: rect.width,
							height: rect.height,
							inHeader: true,
							hasLogoKeyword: true,
							format: "svg",
						});
					}
				});
			});

			// checks for favicon
			const favicon = document.querySelector('link[rel*="icon"]');
			if (favicon) {
				candidates.push({
					type: "favicon",
					src: getAbsoluteUrl(favicon.href),
					width: 32,
					height: 32,
					inHeader: false,
					hasLogoKeyword: false,
					format: favicon.href.includes(".svg") ? "svg" : "other",
				});
			}

			return candidates;
		});

		// scores and ranks logo candidates
		const scored = logoData
			.map((logo) => {
				let score = 0;

				// Prefer SVG
				if (logo.format === "svg") score += 50;
				else if (logo.format === "png") score += 30;

				// Prefer larger images (but not too large)
				const area = logo.width * logo.height;
				if (area > 500 && area < 50000) score += 30;

				// Prefer images in header
				if (logo.inHeader) score += 40;

				// Prefer images with "logo" keyword
				if (logo.hasLogoKeyword) score += 30;

				return { ...logo, score };
			})
			.sort((a, b) => b.score - a.score);

		const best = scored[0];

		return {
			url: best?.src || null,
			format: best?.format || null,
			width: best?.width || null,
			height: best?.height || null,
			alternatives: scored.slice(1, 4).map((l) => ({
				url: l.src,
				format: l.format,
			})),
		};
	}

	async extractHeroContent(page) {
		return await page.evaluate(() => {
			// finds H1 or the largest heading in the hero area
			const h1 = document.querySelector("h1");
			const heroSection = document.querySelector(
				'[class*="hero"], [class*="banner"], header + section, main > section:first-child',
			);

			let headline = h1?.textContent?.trim() || "";
			let tagline = "";

			// looks for tagline near the headline
			if (h1) {
				const nextP = h1.nextElementSibling;
				if (nextP && (nextP.tagName === "P" || nextP.tagName === "H2")) {
					tagline = nextP.textContent?.trim() || "";
				}
			}

			// if no H1, tries to find prominent text in hero
			if (!headline && heroSection) {
				const heroH = heroSection.querySelector("h1, h2, h3");
				headline = heroH?.textContent?.trim() || "";
				const heroP = heroSection.querySelector("p");
				tagline = heroP?.textContent?.trim() || "";
			}

			// gets meta description as fallback
			const metaDesc = document.querySelector('meta[name="description"]')?.content || "";

			// gets page title
			const title = document.title || "";

			return {
				headline: headline.slice(0, 200),
				tagline: tagline.slice(0, 500),
				metaDescription: metaDesc.slice(0, 300),
				pageTitle: title,
			};
		});
	}

	async takeScreenshot(page) {
		const screenshot = await page.screenshot({
			encoding: "base64",
			type: "jpeg",
			quality: 80,
			clip: {
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
			},
		});
		return `data:image/jpeg;base64,${screenshot}`;
	}
}

export default DesignScraper;
