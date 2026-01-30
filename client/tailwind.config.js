/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				mono: ["JetBrains Mono", "monospace"],
				sans: ["Inter", "system-ui", "sans-serif"],
			},
			animation: {
				gradient: "gradient 8s ease infinite",
				"pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
			},
			keyframes: {
				gradient: {
					"50%": { backgroundPosition: "100% 50%" },
					"0%, 100%": { backgroundPosition: "0% 50%" },
				},
			},
		},
	},
	plugins: [],
};
