"use client";

import {
	FileKey,
	Globe,
	ShieldAlert,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import type { RegistrationVerificationConfig } from "@/lib/db-types";

const REG_MODE_META = {
	database_only: { label: "Database Only", hint: "Trust stored usernames without live checks" },
	network_api: { label: "Network API", hint: "Verify against a built-in server network API" },
	custom_api: { label: "Custom API", hint: "Verify against your own profile API endpoint" },
} as const;

export function PlayerManagementSection() {
	const { config, isLoading, isSaving, saveConfigSection } = useGuildConfig();

	const [regMode, setRegMode] = useState<RegistrationVerificationConfig["mode"]>("network_api");
	const [networkPreset, setNetworkPreset] = useState<"auto" | "jartex" | "pika">("auto");
	const [customProfileUrl, setCustomProfileUrl] = useState("");
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	// Sync from DB
	useEffect(() => {
		if (!config) return;
		if (config.registration_verification) {
			setRegMode(config.registration_verification.mode ?? "network_api");
			setNetworkPreset(config.registration_verification.network_preset_id ?? "auto");
			setCustomProfileUrl(config.registration_verification.custom_profile_url ?? "");
		}
	}, [config]);

	const flashSuccess = () => {
		setSaveSuccess(true);
		setTimeout(() => setSaveSuccess(false), 2500);
	};

	const handleSave = async () => {
		setSaveError(null);
		try {
			await saveConfigSection("registration-verification", {
				mode: regMode,
				network_preset_id: networkPreset,
				custom_profile_url: customProfileUrl || null,
			});
			flashSuccess();
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : "Save failed");
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="size-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
			</div>
		);
	}

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Player Management Layer
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Player Profiles
					</h2>
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saveSuccess && (
						<span className="flex items-center gap-1.5 font-mono text-[10px] text-success uppercase tracking-wider">
							<span className="size-3.5 bg-success rounded-full" /> Saved
						</span>
					)}
					<button
						onClick={handleSave}
						disabled={isSaving}
						className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-60"
					>
						{isSaving ? (
							<div className="size-3.5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
						) : (
							<span className="size-3.5">💾</span>
						)}
						<span>{isSaving ? "Saving..." : "Save Changes"}</span>
					</button>
				</div>
			</div>

			{saveError && (
				<div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger">
					<ShieldAlert className="size-4 shrink-0" />
					<p className="font-mono text-[10px] uppercase">{saveError}</p>
				</div>
			)}

			{/* Registration Verification */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
				<div className="lg:col-span-2">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-5 shadow-sm">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<FileKey className="size-4 text-amber-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Username Validation Strategy</h3>
						</div>
						<div className="space-y-1.5 text-left">
							<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Verification Mode</label>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								{(Object.keys(REG_MODE_META) as Array<keyof typeof REG_MODE_META>).map((m) => (
									<button key={m} onClick={() => setRegMode(m)} className={`p-3 border rounded-lg text-left transition-all cursor-pointer ${regMode === m ? "border-primary-500/50 bg-primary-500/10" : "border-border-subtle bg-bg-canvas/20 hover:border-border-subtle/80"}`}>
										<div className="font-mono text-[10px] font-black text-fg-default uppercase tracking-wider">{REG_MODE_META[m].label}</div>
										<p className="font-mono text-[8px] text-fg-muted uppercase tracking-wide mt-1 leading-relaxed">{REG_MODE_META[m].hint}</p>
									</button>
								))}
							</div>
						</div>
						{regMode === "network_api" ? (
							<div className="space-y-1.5 text-left">
								<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Network API Preset</label>
								<div className="grid grid-cols-3 gap-3">
									{(["auto", "jartex", "pika"] as const).map((p) => (
										<button key={p} onClick={() => setNetworkPreset(p)} className={`h-9 px-3 border rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${networkPreset === p ? "border-primary-500/50 text-primary-500 bg-primary-500/10" : "border-border-subtle text-fg-muted bg-bg-canvas/20 hover:text-fg-default"}`}>{p}</button>
									))}
								</div>
							</div>
						) : regMode === "custom_api" ? (
							<div className="space-y-1.5 text-left">
								<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Custom Profile API URL</label>
								<input type="url" value={customProfileUrl} onChange={(e) => setCustomProfileUrl(e.target.value)} placeholder="https://api.example.net/v1/profile/{username}" className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
							</div>
						) : (
							<div className="p-3 border border-border-subtle/40 rounded-lg bg-bg-canvas/20 text-left">
								<p className="font-mono text-[9px] text-fg-muted uppercase leading-relaxed">database_only trusts pre-seeded username records without any live network verification during registration.</p>
							</div>
						)}
					</div>
				</div>
				<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2 text-left h-fit">
					<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
						<Globe className="size-3.5 text-primary-500" /> Preset Coverage
					</div>
					<p className="font-mono text-[9px] text-fg-muted uppercase leading-normal">The auto preset resolves the target network at runtime; jartex and pika pin a fixed API provider.</p>
				</div>
			</div>
		</div>
	);
}
