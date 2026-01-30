import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Sparkles, History, ArrowRight } from "lucide-react";
import Scanner from "./components/Scanner";
import Results from "./components/Results";
import HistoryView from "./components/HistoryView";
import ScanDetail from "./components/ScanDetail";

function App() {
	const [currentScan, setCurrentScan] = useState(null);
	const navigate = useNavigate();

	const handleScanComplete = (result) => {
		setCurrentScan(result);
		navigate("/results");
	};

	return (
		<div className="min-h-screen bg-[#0a0a0b]">
			{/* Navigation */}
			<nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
				<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
					<a
						href="/"
						className="flex items-center gap-3 group">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
							<Sparkles className="w-5 h-5 text-white" />
						</div>
						<span className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
							Design Intelligence
						</span>
					</a>

					<div className="flex items-center gap-4">
						<a
							href="/history"
							className="flex items-center gap-2 px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
							<History className="w-4 h-4" />
							<span className="text-sm font-medium">History</span>
						</a>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main className="pt-20">
				<Routes>
					<Route
						path="/"
						element={<Scanner onScanComplete={handleScanComplete} />}
					/>
					<Route
						path="/results"
						element={<Results scan={currentScan} />}
					/>
					<Route
						path="/history"
						element={<HistoryView />}
					/>
					<Route
						path="/scan/:id"
						element={<ScanDetail />}
					/>
				</Routes>
			</main>
		</div>
	);
}

export default App;
