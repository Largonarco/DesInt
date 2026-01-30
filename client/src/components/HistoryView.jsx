import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Globe, Trash2, ChevronRight, Loader2, FolderOpen } from "lucide-react";

export default function HistoryView() {
	const [scans, setScans] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		fetchScans();
	}, []);

	const fetchScans = async () => {
		try {
			const response = await fetch("/api/scans");
			if (!response.ok) throw new Error("Failed to fetch history");
			const data = await response.json();
			setScans(data);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const deleteScan = async (id, e) => {
		e.stopPropagation();
		if (!confirm("Delete this scan?")) return;

		try {
			await fetch(`/api/scans/${id}`, { method: "DELETE" });
			setScans(scans.filter((s) => s.id !== id));
		} catch (err) {
			console.error("Failed to delete:", err);
		}
	};

	const formatDate = (dateStr) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const groupedScans = scans.reduce((acc, scan) => {
		const domain = scan.domain;
		if (!acc[domain]) acc[domain] = [];
		acc[domain].push(scan);
		return acc;
	}, {});

	if (loading) {
		return (
			<div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
			</div>
		);
	}

	return (
		<div className="max-w-5xl mx-auto px-6 py-8">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-bold text-white mb-2">Scan History</h1>
					<p className="text-zinc-500">
						{scans.length} {scans.length === 1 ? "scan" : "scans"} saved
					</p>
				</div>
			</div>

			{error && (
				<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
					{error}
				</div>
			)}

			{scans.length === 0 ?
				<div className="text-center py-20">
					<div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
						<FolderOpen className="w-10 h-10 text-zinc-600" />
					</div>
					<h2 className="text-xl font-semibold text-white mb-2">No scans yet</h2>
					<p className="text-zinc-500 mb-6">Start by analyzing a website</p>
					<button
						onClick={() => navigate("/")}
						className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-400 hover:to-purple-400 transition-all">
						Scan a Website
					</button>
				</div>
			:	<div className="space-y-8">
					{Object.entries(groupedScans).map(([domain, domainScans]) => (
						<div key={domain}>
							{/* Domain Header */}
							<div className="flex items-center gap-3 mb-4">
								<div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
									<Globe className="w-4 h-4 text-zinc-400" />
								</div>
								<h2 className="text-lg font-semibold text-white">{domain}</h2>
								<span className="text-sm text-zinc-500">
									{domainScans.length} {domainScans.length === 1 ? "scan" : "scans"}
								</span>
							</div>

							{/* Scans List */}
							<div className="space-y-3">
								{domainScans.map((scan) => (
									<div
										key={scan.id}
										onClick={() => navigate(`/scan/${scan.id}`)}
										className="group p-4 rounded-xl bg-[#141416] border border-white/5 hover:border-white/10 cursor-pointer transition-all">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-4">
												{/* Color Preview */}
												<div className="flex -space-x-2">
													{[
														scan.data.colors?.primary,
														scan.data.colors?.secondary,
														scan.data.colors?.background,
													]
														.filter(Boolean)
														.slice(0, 3)
														.map((color, i) => (
															<div
																key={i}
																className="w-8 h-8 rounded-full border-2 border-[#141416]"
																style={{ backgroundColor: color }}
															/>
														))}
												</div>

												<div>
													<div className="text-white font-medium group-hover:text-indigo-400 transition-colors">
														{scan.url}
													</div>
													<div className="flex items-center gap-2 text-sm text-zinc-500">
														<Clock className="w-3 h-3" />
														{formatDate(scan.scannedAt)}
													</div>
												</div>
											</div>

											<div className="flex items-center gap-2">
												{/* Tone Badge */}
												{scan.data.tone?.tone && (
													<span className="px-3 py-1 rounded-full bg-white/5 text-xs text-zinc-400">
														{scan.data.tone.tone}
													</span>
												)}

												<button
													onClick={(e) => deleteScan(scan.id, e)}
													className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
													<Trash2 className="w-4 h-4" />
												</button>

												<ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			}
		</div>
	);
}
