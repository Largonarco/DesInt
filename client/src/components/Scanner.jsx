import { useState } from "react";
import { Search, Loader2, Globe, Zap, Palette, Type, Image } from "lucide-react";

export default function Scanner({ onScanComplete }) {
	const [url, setUrl] = useState("");
	const [isScanning, setIsScanning] = useState(false);
	const [error, setError] = useState(null);
	const [scanPhase, setScanPhase] = useState("");

	const handleScan = async (e) => {
		e.preventDefault();
		if (!url.trim()) return;

		setIsScanning(true);
		setError(null);
		setScanPhase("Connecting to website...");

		try {
			// simulate phases for UX
			const phases = [
				"Rendering page...",
				"Extracting colors...",
				"Analyzing typography...",
				"Finding logo...",
				"Analyzing brand voice...",
			];

			let phaseIndex = 0;
			const phaseInterval = setInterval(() => {
				if (phaseIndex < phases.length) {
					setScanPhase(phases[phaseIndex]);
					phaseIndex++;
				}
			}, 1500);

			const response = await fetch("/api/scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url: url.trim() }),
			});

			clearInterval(phaseInterval);

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Scan failed");
			}

			const result = await response.json();
			onScanComplete(result);
		} catch (err) {
			setError(err.message);
		} finally {
			setIsScanning(false);
			setScanPhase("");
		}
	};

	return (
		<div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-6 py-20">
			{/* Hero Section */}
			<div className="text-center max-w-3xl mx-auto mb-12">
				<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
					<Zap className="w-4 h-4" />
					Shazam for Design Systems
				</div>

				<h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
					<span className="text-white">Extract </span>
					<span className="gradient-text">Design DNA</span>
					<span className="text-white"> from any website</span>
				</h1>

				<p className="text-xl text-zinc-400 leading-relaxed">
					Enter a URL and we'll analyze its visual identity — colors, typography, logo, and brand
					voice. Powered by intelligent scraping and AI.
				</p>
			</div>

			{/* Search Form */}
			<form
				onSubmit={handleScan}
				className="w-full max-w-2xl mb-8">
				<div className="relative group">
					<div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 blur-lg transition-opacity" />

					<div className="relative flex items-center bg-[#141416] rounded-xl border border-white/10 overflow-hidden">
						<div className="pl-5 text-zinc-500">
							<Globe className="w-5 h-5" />
						</div>

						<input
							type="text"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="Enter website URL (e.g., adopt.ai)"
							className="flex-1 px-4 py-5 bg-transparent text-white text-lg placeholder:text-zinc-600 focus:outline-none"
							disabled={isScanning}
						/>

						<button
							type="submit"
							disabled={isScanning || !url.trim()}
							className="m-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 disabled:from-zinc-700 disabled:to-zinc-700 text-white font-medium rounded-lg transition-all flex items-center gap-2">
							{isScanning ?
								<>
									<Loader2 className="w-5 h-5 animate-spin" />
									Scanning
								</>
							:	<>
									<Search className="w-5 h-5" />
									Analyze
								</>
							}
						</button>
					</div>
				</div>
			</form>

			{/* Scanning Status */}
			{isScanning && (
				<div className="flex flex-col items-center gap-4 mb-8">
					<div className="flex items-center gap-3 text-zinc-400">
						<div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
						<span className="text-sm">{scanPhase}</span>
					</div>

					<div className="flex gap-6 text-zinc-600">
						<div className="flex items-center gap-2 scan-pulse">
							<Palette className="w-4 h-4" />
							<span className="text-xs">Colors</span>
						</div>
						<div
							className="flex items-center gap-2 scan-pulse"
							style={{ animationDelay: "0.2s" }}>
							<Type className="w-4 h-4" />
							<span className="text-xs">Typography</span>
						</div>
						<div
							className="flex items-center gap-2 scan-pulse"
							style={{ animationDelay: "0.4s" }}>
							<Image className="w-4 h-4" />
							<span className="text-xs">Logo</span>
						</div>
					</div>
				</div>
			)}

			{/* Error Message */}
			{error && (
				<div className="w-full max-w-2xl p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
					{error}
				</div>
			)}

			{/* Features Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mt-16">
				{[
					{
						icon: Palette,
						title: "Smart Color Detection",
						description:
							"Identifies primary, secondary, and background colors by analyzing buttons, links, and visual hierarchy.",
					},
					{
						icon: Type,
						title: "Typography Analysis",
						description:
							"Extracts heading and body fonts with weights, distinguishing between display and text styles.",
					},
					{
						icon: Zap,
						title: "AI Brand Analysis",
						description:
							"Uses LLM to analyze tone of voice, target audience, and overall brand vibe from content.",
					},
				].map((feature, i) => (
					<div
						key={i}
						className="p-6 rounded-2xl bg-[#141416] border border-white/5 hover:border-white/10 transition-colors">
						<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
							<feature.icon className="w-6 h-6 text-indigo-400" />
						</div>
						<h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
						<p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
					</div>
				))}
			</div>
		</div>
	);
}
