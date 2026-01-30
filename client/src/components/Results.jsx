import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	Palette,
	Type,
	Image,
	MessageSquare,
	Copy,
	Check,
	ExternalLink,
	Download,
} from "lucide-react";
import { useState } from "react";

export default function Results({ scan }) {
	const navigate = useNavigate();
	const [copiedColor, setCopiedColor] = useState(null);

	if (!scan) {
		navigate("/");
		return null;
	}

	const copyToClipboard = (text, id) => {
		navigator.clipboard.writeText(text);
		setCopiedColor(id);
		setTimeout(() => setCopiedColor(null), 2000);
	};

	const downloadJSON = () => {
		const dataStr = JSON.stringify(scan, null, 2);
		const blob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `design-system-${new URL(scan.url).hostname}.json`;
		a.click();
	};

	return (
		<div className="max-w-7xl mx-auto px-6 py-8">
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div className="flex items-center gap-4">
					<button
						onClick={() => navigate("/")}
						className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
						<ArrowLeft className="w-5 h-5" />
					</button>
					<div>
						<h1 className="text-2xl font-bold text-white">Design System Analysis</h1>
						<a
							href={scan.url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm text-zinc-500 hover:text-indigo-400 flex items-center gap-1 transition-colors">
							{scan.url}
							<ExternalLink className="w-3 h-3" />
						</a>
					</div>
				</div>

				<button
					onClick={downloadJSON}
					className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors">
					<Download className="w-4 h-4" />
					Export JSON
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column - Screenshot & Logo */}
				<div className="lg:col-span-1 space-y-6">
					{/* Screenshot */}
					{scan.screenshot && (
						<div className="rounded-2xl overflow-hidden border border-white/10">
							<img
								src={scan.screenshot}
								alt="Website screenshot"
								className="w-full h-auto"
							/>
						</div>
					)}

					{/* Logo */}
					<div className="p-6 rounded-2xl bg-[#141416] border border-white/5">
						<div className="flex items-center gap-2 mb-4">
							<Image className="w-5 h-5 text-indigo-400" />
							<h2 className="text-lg font-semibold text-white">Logo</h2>
						</div>

						{scan.logo?.url ?
							<div className="flex flex-col items-center gap-4">
								<div className="w-full p-8 rounded-xl bg-white/5 flex items-center justify-center">
									<img
										src={scan.logo.url}
										alt="Logo"
										className="max-w-full max-h-24 object-contain"
										style={{ filter: "drop-shadow(0 0 20px rgba(255,255,255,0.1))" }}
									/>
								</div>
								<div className="text-sm text-zinc-500">
									Format: <span className="text-zinc-300 uppercase">{scan.logo.format}</span>
									{scan.logo.width && (
										<span className="ml-3">
											Size:{" "}
											<span className="text-zinc-300">
												{scan.logo.width}×{scan.logo.height}
											</span>
										</span>
									)}
								</div>
							</div>
						:	<p className="text-zinc-500 text-sm">No logo detected</p>}
					</div>
				</div>

				{/* Middle Column - Colors */}
				<div className="lg:col-span-1 space-y-6">
					<div className="p-6 rounded-2xl bg-[#141416] border border-white/5">
						<div className="flex items-center gap-2 mb-6">
							<Palette className="w-5 h-5 text-indigo-400" />
							<h2 className="text-lg font-semibold text-white">Color Palette</h2>
						</div>

						{/* Primary Colors */}
						<div className="space-y-4">
							{[
								{ label: "Primary", color: scan.colors?.primary, desc: "Main brand color" },
								{ label: "Secondary", color: scan.colors?.secondary, desc: "Supporting color" },
								{ label: "Background", color: scan.colors?.background, desc: "Page background" },
								{ label: "Text", color: scan.colors?.text, desc: "Primary text color" },
							]
								.filter((c) => c.color)
								.map((item, i) => (
									<div
										key={i}
										className="flex items-center gap-4">
										<div
											className="w-14 h-14 rounded-xl border border-white/10 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
											style={{ backgroundColor: item.color }}
											onClick={() => copyToClipboard(item.color, `main-${i}`)}
										/>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-white">{item.label}</span>
												<button
													onClick={() => copyToClipboard(item.color, `main-${i}`)}
													className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
													{copiedColor === `main-${i}` ?
														<Check className="w-3 h-3 text-green-400" />
													:	<Copy className="w-3 h-3" />}
												</button>
											</div>
											<div className="text-xs text-zinc-500">{item.desc}</div>
											<code className="text-xs text-zinc-400 font-mono">{item.color}</code>
										</div>
									</div>
								))}
						</div>

						{/* Full Palette */}
						{scan.colors?.palette?.length > 0 && (
							<div className="mt-6 pt-6 border-t border-white/5">
								<h3 className="text-sm font-medium text-zinc-400 mb-3">Extended Palette</h3>
								<div className="flex flex-wrap gap-2">
									{scan.colors.palette.map((item, i) => (
										<div
											key={i}
											className="group relative w-10 h-10 rounded-lg border border-white/10 cursor-pointer hover:scale-110 transition-transform"
											style={{ backgroundColor: item.color }}
											onClick={() => copyToClipboard(item.color, `palette-${i}`)}>
											<div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-zinc-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
												{item.color}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Right Column - Typography & Tone */}
				<div className="lg:col-span-1 space-y-6">
					{/* Typography */}
					<div className="p-6 rounded-2xl bg-[#141416] border border-white/5">
						<div className="flex items-center gap-2 mb-6">
							<Type className="w-5 h-5 text-indigo-400" />
							<h2 className="text-lg font-semibold text-white">Typography</h2>
						</div>

						<div className="space-y-6">
							{/* Heading Font */}
							<div>
								<div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Headings</div>
								<div
									className="text-2xl font-bold text-white mb-1"
									style={{ fontFamily: scan.typography?.heading?.family }}>
									{scan.typography?.heading?.family || "System Default"}
								</div>
								<div className="text-xs text-zinc-500">
									Weights: {scan.typography?.heading?.weights?.join(", ") || "400"}
								</div>
							</div>

							{/* Body Font */}
							<div>
								<div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Body</div>
								<div
									className="text-lg text-white mb-1"
									style={{ fontFamily: scan.typography?.body?.family }}>
									{scan.typography?.body?.family || "System Default"}
								</div>
								<div className="text-xs text-zinc-500">
									Weights: {scan.typography?.body?.weights?.join(", ") || "400"}
								</div>
							</div>

							{/* All Fonts */}
							{scan.typography?.all?.length > 0 && (
								<div className="pt-4 border-t border-white/5">
									<div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
										All Detected Fonts
									</div>
									<div className="flex flex-wrap gap-2">
										{scan.typography.all.slice(0, 6).map((font, i) => (
											<span
												key={i}
												className="px-3 py-1 rounded-full bg-white/5 text-xs text-zinc-300">
												{font}
											</span>
										))}
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Tone Analysis */}
					<div className="p-6 rounded-2xl bg-[#141416] border border-white/5">
						<div className="flex items-center gap-2 mb-6">
							<MessageSquare className="w-5 h-5 text-indigo-400" />
							<h2 className="text-lg font-semibold text-white">Brand Voice</h2>
						</div>

						{scan.tone && (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="p-4 rounded-xl bg-white/5">
										<div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Tone</div>
										<div className="text-lg font-semibold text-white">{scan.tone.tone}</div>
									</div>
									<div className="p-4 rounded-xl bg-white/5">
										<div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Vibe</div>
										<div className="text-lg font-semibold text-white">{scan.tone.vibe}</div>
									</div>
								</div>

								<div className="p-4 rounded-xl bg-white/5">
									<div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
										Target Audience
									</div>
									<div className="text-base font-medium text-white">{scan.tone.audience}</div>
								</div>

								{scan.tone.personality && (
									<div className="p-4 rounded-xl bg-white/5">
										<div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
											Personality
										</div>
										<div className="text-base text-white">{scan.tone.personality}</div>
									</div>
								)}

								{scan.tone.summary && (
									<div className="pt-4 border-t border-white/5">
										<p className="text-sm text-zinc-400 italic">"{scan.tone.summary}"</p>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Hero Content */}
					{scan.heroContent?.headline && (
						<div className="p-6 rounded-2xl bg-[#141416] border border-white/5">
							<div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
								Hero Headline
							</div>
							<p className="text-white font-medium">{scan.heroContent.headline}</p>
							{scan.heroContent.tagline && (
								<p className="text-sm text-zinc-400 mt-2">{scan.heroContent.tagline}</p>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
