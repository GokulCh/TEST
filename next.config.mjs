/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	env: {
		// Expose Discord client ID to the browser for the bot invite link in SetupWizard
		NEXT_PUBLIC_DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
	},
};

export default nextConfig;
