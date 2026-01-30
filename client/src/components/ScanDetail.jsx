import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Results from "./Results";

export default function ScanDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [scan, setScan] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchScan();
	}, [id]);

	const fetchScan = async () => {
		try {
			const response = await fetch(`/api/scans/${id}`);
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("Scan not found");
				}
				throw new Error("Failed to fetch scan");
			}
			const data = await response.json();

			const reconstructed = {
				id: data.id,
				url: data.url,
				scrapedAt: data.scannedAt,
				screenshot: data.screenshot,
				...data.data,
			};

			setScan(reconstructed);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
					<p className="text-zinc-500 mb-6">{error}</p>
					<button
						onClick={() => navigate("/history")}
						className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
						Back to History
					</button>
				</div>
			</div>
		);
	}

	return <Results scan={scan} />;
}
