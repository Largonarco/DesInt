import OpenAI from "openai";

export class ToneAnalyzer {
	constructor(apiKey) {
		this.openai = apiKey ? new OpenAI({ apiKey }) : null;
	}

	async analyze(heroContent, colors) {
		if (!this.openai) {
			// fallback
			return this.fallbackAnalysis(heroContent);
		}

		const prompt = `Analyze this website's brand voice and visual identity based on the following content:

HEADLINE: ${heroContent.headline || "N/A"}
TAGLINE: ${heroContent.tagline || "N/A"}
PAGE TITLE: ${heroContent.pageTitle || "N/A"}
META DESCRIPTION: ${heroContent.metaDescription || "N/A"}

PRIMARY COLOR: ${colors.primary || "N/A"}
SECONDARY COLOR: ${colors.secondary || "N/A"}

Based on this information, provide a JSON analysis with the following structure:
{
  "tone": "One word describing the tone (e.g., Professional, Friendly, Bold, Minimalist, Playful, Corporate, Innovative)",
  "audience": "Target audience in 2-3 words (e.g., Enterprise Teams, Developers, Small Businesses, Consumers)",
  "vibe": "Visual/brand aesthetic in 2-3 words (e.g., Tech Minimalist, Corporate Modern, Startup Energy, Premium Luxury)",
  "personality": "2-3 adjectives describing the brand personality",
  "summary": "One sentence summary of the brand's positioning"
}

Respond ONLY with valid JSON, no other text.`;

		try {
			const response = await this.openai.chat.completions.create({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "system",
						content:
							"You are a brand strategist and design expert. Analyze websites and provide concise, insightful brand analysis. Always respond with valid JSON only.",
					},
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 0.7,
				max_tokens: 300,
			});

			const content = response.choices[0]?.message?.content || "";

			const jsonMatch = content.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				return JSON.parse(jsonMatch[0]);
			}

			return this.fallbackAnalysis(heroContent);
		} catch (error) {
			console.error("LLM analysis failed:", error.message);
			return this.fallbackAnalysis(heroContent);
		}
	}

	fallbackAnalysis(heroContent) {
		const text =
			`${heroContent.headline} ${heroContent.tagline} ${heroContent.metaDescription}`.toLowerCase();

		// simple keyword-based analysis
		let tone = "Professional";
		let audience = "General";
		let vibe = "Modern";

		// tone detection
		if (text.includes("enterprise") || text.includes("business") || text.includes("solution")) {
			tone = "Corporate";
			audience = "Enterprise Teams";
		} else if (
			text.includes("developer") ||
			text.includes("api") ||
			text.includes("code") ||
			text.includes("build")
		) {
			tone = "Technical";
			audience = "Developers";
		} else if (text.includes("ai") || text.includes("intelligent") || text.includes("automat")) {
			tone = "Innovative";
			audience = "Tech-Forward Teams";
		} else if (text.includes("simple") || text.includes("easy") || text.includes("fast")) {
			tone = "Friendly";
			audience = "Small Businesses";
		}

		// vibe detection
		if (text.includes("ai") || text.includes("future") || text.includes("next")) {
			vibe = "Tech Forward";
		} else if (text.includes("premium") || text.includes("luxury")) {
			vibe = "Premium";
		} else if (text.includes("startup") || text.includes("grow")) {
			vibe = "Startup Energy";
		}

		return {
			tone,
			audience,
			vibe,
			personality: "Modern, Focused, Clear",
			summary: "A modern digital presence focused on clear communication.",
			note: "Analysis generated without LLM - add OPENAI_API_KEY for deeper insights",
		};
	}
}

export default ToneAnalyzer;
