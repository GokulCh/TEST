/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	env: {
		// Expose Discord client ID to the browser for the bot invite link in SetupWizard
		NEXT_PUBLIC_DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
		// Public API URL for API key consumers
		NEXT_PUBLIC_API_URL: process.env.PUBLIC_API_URL || "https://api.myrbw.dev",
	},
};

export default nextConfig;
