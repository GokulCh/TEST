"use client";

import { CheckCircle2, Copy, Plus, Trash2, Key, Eye, EyeOff, ExternalLink } from "lucide-react";
import { use, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useGuildData, useGuildWrite } from "@/hooks/use-guild-data";
import type { PlayerApiKeyModel, PlayerApiKeyInput, PlayerApiKeyWithSecret } from "@/lib/db-types";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/panel/confirm-dialog";
import { Button, EmptyState, Field, Panel, Skeleton, TextInput, Toggle } from "@/components/panel/form-parts";
import { Modal } from "@/components/panel/modal";
import { ErrorBanner, PageShell } from "@/components/panel/page-shell";
import { errorMessage } from "@/lib/client/notify";
/** `admin_disabled` is set by the API when a master key deactivates a key; players cannot re-activate it. */
type ApiKeyRow = PlayerApiKeyModel & { admin_disabled?: boolean };

const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.myrbw.dev";

export default function Page({ params }: { params: Promise<{ guildId: string }> }) {
	const { guildId } = use(params);
	const { dbGuildId } = useGuildConfig();
	const write = useGuildWrite();
	const { data: keys, error: loadError, isLoading: loading, mutate: loadApiKeys } = useGuildData<ApiKeyRow[]>("api-keys");
	const apiKeys = Array.isArray(keys) ? keys : [];
	const [isCreating, setIsCreating] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [deleting, setDeleting] = useState<ApiKeyRow | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [expiryError, setExpiryError] = useState<string | null>(null);
	const [newKey, setNewKey] = useState<PlayerApiKeyWithSecret | null>(null);
	const [showNewKeySecret, setShowNewKeySecret] = useState(false);

	// Create form state
	const [newKeyName, setNewKeyName] = useState("");
	const [newKeyExpiry, setNewKeyExpiry] = useState<string>("");

	const handleCreateKey = async () => {
		if (!newKeyName.trim()) return;

		setExpiryError(null);
		// The API rejects expires_at values in the past; a date-only input means end of that day.
		if (newKeyExpiry && new Date(`${newKeyExpiry}T23:59:59`).getTime() <= Date.now()) {
			setExpiryError("Expiration must be in the future");
			return;
		}
		setIsCreating(true);
		try {
			const input: PlayerApiKeyInput = {
				name: newKeyName.trim(),
				expires_at: newKeyExpiry ? new Date(`${newKeyExpiry}T23:59:59`).toISOString() : null,
			};

			const data = await write<PlayerApiKeyWithSecret>("POST", "api-keys", input);
			setNewKey(data);
			setShowNewKeySecret(true);
			setShowCreateModal(false);
			setNewKeyName("");
			setNewKeyExpiry("");
			toast.success("API key created");
			loadApiKeys();
		} catch (err) {
			toast.error("Couldn't create the key", { description: errorMessage(err) });
		} finally {
			setIsCreating(false);
		}
	};

	const handleDeleteKey = async () => {
		if (!deleting) return;
		setIsDeleting(true);
		try {
			await write("DELETE", `api-keys?keyId=${deleting.id}`);
			toast.success("API key deleted");
			setDeleting(null);
			loadApiKeys();
		} catch (err) {
			toast.error("Couldn't delete the key", { description: errorMessage(err) });
		} finally {
			setIsDeleting(false);
		}
	};

	const handleToggleKey = async (keyId: string, isActive: boolean, adminDisabled?: boolean) => {
		if (adminDisabled && !isActive) {
			toast.error("This key was disabled by an administrator and can't be re-activated here");
			return;
		}
		try {
			await write("PUT", "api-keys", { keyId, is_active: !isActive });
			toast.success(isActive ? "API key disabled" : "API key enabled");
			loadApiKeys();
		} catch (err) {
			toast.error("Couldn't update the key", { description: errorMessage(err) });
		}
	};

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Copied to clipboard");
		} catch {
			toast.error("Couldn't copy: the browser blocked clipboard access");
		}
	};

	const formatDate = (dateString: string | null) => {
		if (!dateString) return "Never";
		return new Date(dateString).toLocaleDateString();
	};

	const formatExpiry = (dateString: string | null) => {
		if (!dateString) return "Never";
		const expiry = new Date(dateString);
		const now = new Date();
		const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

		if (daysUntilExpiry <= 0) return "Expired";
		if (daysUntilExpiry === 1) return "1 day";
		if (daysUntilExpiry < 7) return `${daysUntilExpiry} days`;
		return formatDate(dateString);
	};

	return (
		<PageShell eyebrow="Developer" title="API Manager" subtitle={<><p className="text-sm text-fg-muted mt-2">
						Manage your read-only API keys for accessing guild data programmatically
					</p>
					<a
						href="/reference"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 text-xs text-primary-500 hover:text-primary-400 mt-3 transition-colors"
					>
						<ExternalLink className="size-3" />
						<span>View API Documentation</span>
					</a></>} actions={<><Button variant="primary"
					onClick={() => setShowCreateModal(true)}>
					<Plus className="size-3.5" />
					<span>Create API Key</span>
				</Button></>}>

			{loadError && <ErrorBanner>{loadError.message}</ErrorBanner>}

			{/* New Key Display */}
			{newKey && showNewKeySecret && (
				<div className="motion-fade space-y-4 rounded-xl border border-success/30 bg-success/5 p-5">
					<div className="flex items-center gap-2">
						<CheckCircle2 className="size-5 text-success" />
						<h3 className="text-sm font-semibold text-fg-default">
							API Key Created Successfully
						</h3>
					</div>
					<p className="text-sm text-fg-muted">
						Copy this key now. You won’t be able to see it again.
					</p>
					
					{/* API URL */}
					<div className="space-y-2">
						<span className="block text-[13px] font-medium text-fg-default">API endpoint</span>
						<div className="flex items-center gap-2">
							<div className="flex h-9 min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap rounded-lg border border-border-subtle bg-bg-canvas/40 px-3 font-mono text-xs text-fg-default">
								{PUBLIC_API_URL}/v1/guilds/{dbGuildId}
							</div>
							<Button variant="secondary" size="icon"
								onClick={() => copyToClipboard(`${PUBLIC_API_URL}/v1/guilds/${dbGuildId}`)} aria-label="Copy API URL"><Copy className="size-4 text-fg-muted" /></Button>
						</div>
					</div>

					{/* API Key */}
					<div className="space-y-2">
						<span className="block text-[13px] font-medium text-fg-default">API key</span>
						<div className="flex items-center gap-2">
							<div className="flex h-9 min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap rounded-lg border border-border-subtle bg-bg-canvas/40 px-3 font-mono text-xs text-fg-default">
								{showNewKeySecret ? newKey.api_key : "••••••••••••••••••••••••••••••••"}
							</div>
							<Button variant="secondary" size="icon"
								onClick={() => setShowNewKeySecret(!showNewKeySecret)} aria-label={showNewKeySecret ? "Hide key" : "Show key"}>{showNewKeySecret ? <EyeOff className="size-4 text-fg-muted" /> : <Eye className="size-4 text-fg-muted" />}</Button>
							<Button variant="secondary" size="icon"
								onClick={() => copyToClipboard(newKey.api_key)} aria-label="Copy key"><Copy className="size-4 text-fg-muted" /></Button>
						</div>
						<p className="text-xs text-fg-muted">Prefix: {newKey.key_info?.key_prefix || "Unknown"}</p>
					</div>

					{/* Usage Example */}
					<div className="p-3 bg-bg-canvas/20 border border-border-subtle rounded-lg space-y-2">
						<div className="flex items-center gap-2 text-fg-muted">
							<ExternalLink className="size-4" />
							<span className="text-xs">Usage Example</span>
						</div>
						<code className="block text-xs text-fg-muted break-all">
							curl -H "X-API-Key: YOUR_KEY" {PUBLIC_API_URL}/v1/guilds/{dbGuildId}/players
						</code>
					</div>

					<Button variant="secondary"
						onClick={() => setNewKey(null)}>
						Dismiss
					</Button>
				</div>
			)}

			{/* API Keys List */}
			<div className="space-y-4">
				{loading ? (
					<div className="space-y-3">
						<Skeleton className="h-36 rounded-xl" />
						<Skeleton className="h-36 rounded-xl" />
					</div>
				) : apiKeys.length === 0 ? (
					<EmptyState icon={<Key className="size-8 text-fg-muted/40" />}>
						<span className="block text-sm font-semibold text-fg-default">No API keys yet</span>
						<span className="mt-1 block">Create your first API key to start accessing guild data programmatically.</span>
						<Button variant="primary" className="mt-4" icon={<Plus className="size-3.5" />} onClick={() => setShowCreateModal(true)}>
							Create API key
						</Button>
					</EmptyState>
				) : (
					<div className="space-y-3">
						{apiKeys.map((key) => (
							<Panel key={key.id} className="space-y-4">
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-4">
										<div className="p-2.5 bg-primary-500/10 rounded-lg">
											<Key className="size-5 text-primary-500" />
										</div>
										<div className="space-y-1">
											<h4 className="text-sm font-semibold text-fg-default">
												{key.name}
											</h4>
											<div className="flex items-center gap-2 text-xs text-fg-muted">
												<span className="font-mono text-xs bg-bg-canvas/30 px-2 py-0.5 rounded">
													{key.key_prefix}••••••••
												</span>
												<span>•</span>
												<span>Created {formatDate(key.created_at)}</span>
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Toggle
											size="sm"
											checked={key.is_active}
											disabled={key.admin_disabled && !key.is_active}
											onChange={() => handleToggleKey(key.id, key.is_active, key.admin_disabled)}
											onLabel="Active"
											offLabel={key.admin_disabled ? "Admin disabled" : "Disabled"}
										/>
										<Button variant="danger" size="sm" icon={<Trash2 className="size-3.5" />} onClick={() => setDeleting(key)}>
											Delete
										</Button>
									</div>
								</div>

								<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border-subtle/50">
									<div className="space-y-1">
										<span className="block text-xs text-fg-muted">Permission Level</span>
										<span className="font-mono text-xs text-fg-default">
											{key.permission_level}
										</span>
									</div>
									<div className="space-y-1">
										<span className="block text-xs text-fg-muted">Last Used</span>
										<span className="font-mono text-xs text-fg-default">
											{key.last_used_at ? formatDate(key.last_used_at) : "Never"}
										</span>
									</div>
									<div className="space-y-1">
										<span className="block text-xs text-fg-muted">Expires</span>
										<span className={`font-mono text-xs ${key.expires_at && new Date(key.expires_at) < new Date() ? "text-danger" : "text-fg-default"}`}>
											{formatExpiry(key.expires_at)}
										</span>
									</div>
									<div className="space-y-1">
										<span className="block text-xs text-fg-muted">Status</span>
										<span className={`font-mono text-xs ${key.is_active ? "text-success" : "text-fg-muted"}`}>
											{key.is_active ? "Active" : key.admin_disabled ? "Disabled by admin" : "Disabled"}
										</span>
									</div>
								</div>
							</Panel>
						))}
					</div>
				)}
			</div>

			<Modal
				open={showCreateModal}
				title="Create API key"
				description="Read-only key scoped to this server."
				onClose={() => setShowCreateModal(false)}
				footer={
					<>
						<Button variant="secondary" onClick={() => setShowCreateModal(false)}>
							Cancel
						</Button>
						<Button variant="primary" onClick={handleCreateKey} loading={isCreating} disabled={!newKeyName.trim()} icon={<Plus className="size-3.5" />}>
							{isCreating ? "Creating…" : "Create key"}
						</Button>
					</>
				}
			>
				<Field label="Key name">
					<TextInput value={newKeyName} onValueChange={setNewKeyName} placeholder="e.g. My application" autoFocus />
				</Field>
				<Field label="Permission level" hint="Server-specific keys are read-only.">
					<div className="flex h-9 items-center rounded-lg border border-border-subtle bg-bg-canvas/40 px-3 text-sm text-fg-muted">Read only</div>
				</Field>
				<Field label="Expiration (optional)" hint="Leave empty for no expiration." error={expiryError}>
					<input
						type="date"
						value={newKeyExpiry}
						onChange={(e) => setNewKeyExpiry(e.target.value)}
						className="h-9 w-full rounded-lg border border-border-subtle bg-bg-canvas/40 px-3 text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:border-primary-500/60 focus:outline-none focus:ring-2 focus:ring-primary-500/15"
					/>
				</Field>
			</Modal>

			<ConfirmDialog open={!!deleting} title="Delete this API key?" confirmLabel="Delete key" busy={isDeleting} onConfirm={handleDeleteKey} onCancel={() => setDeleting(null)}>
				Anything using <span className="font-medium text-fg-default">{deleting?.name}</span> will stop working immediately. This can’t be undone.
			</ConfirmDialog>
		</PageShell>
	);
}