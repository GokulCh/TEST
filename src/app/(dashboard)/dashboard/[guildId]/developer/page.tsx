"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, Clock, Code, Lock, Shield } from "lucide-react";
import { GuardedTabs } from "@/components/panel/guarded-tabs";
import { PageShell, PageSkeleton } from "@/components/panel/page-shell";
import { AccessTab, PreviewToggle } from "@/features/developer/access-tab";
import { NavigationTab } from "@/features/developer/navigation-tab";
import { UpdateLogsTab } from "@/features/developer/update-logs-tab";
import { useDeveloperConfig } from "@/hooks/use-developer-config";
import { useGuildWrite } from "@/hooks/use-guild-data";
import { useSectionForm } from "@/hooks/use-section-form";
import { useSession } from "@/hooks/use-session";
import { useTabGuard } from "@/hooks/use-tab-guard";
import type { DeveloperCategoryConfig, DeveloperConfig, DeveloperPageConfig, DeveloperUpdateLog } from "@/lib/db-types";
import { defaultDeveloperNavigation } from "@/lib/navigation";

type Tab = "logs" | "navigation" | "access";

interface FormValue {
	updateLogs: DeveloperUpdateLog[];
	pageConfigs: DeveloperPageConfig[];
	categoryConfigs: DeveloperCategoryConfig[];
}

const TABS = [
	{ key: "logs" as const, title: "Update Logs", label: <><Clock className="size-3.5" /> Update Logs</> },
	{ key: "navigation" as const, title: "Navigation Control", label: <><Code className="size-3.5" /> Navigation Control</> },
	{ key: "access" as const, title: "Access Control", label: <><Lock className="size-3.5" /> Access Control</> },
];

export default function Page() {
	const guildId = useParams()?.guildId as string | undefined;
	const { isDeveloper, isLoading: sessionLoading } = useSession();
	const { data: stored, error, isLoading, mutate } = useDeveloperConfig(isDeveloper ? guildId : undefined);
	const write = useGuildWrite();

	const [activeTab, setActiveTab] = useState<Tab>("logs");
	const [preview, setPreview] = useState(false);

	// Until something has been saved the console starts from the full page list.
	const defaults = useMemo<FormValue>(() => {
		const { pages, categories } = defaultDeveloperNavigation();
		return { updateLogs: [], pageConfigs: pages, categoryConfigs: categories };
	}, []);
	const saved = useMemo<FormValue | null>(() => {
		if (error) return defaults; // the config could not be read: edit the defaults
		if (!stored) return null;
		return {
			updateLogs: stored.update_logs ?? [],
			pageConfigs: stored.page_configs?.length ? stored.page_configs : defaults.pageConfigs,
			categoryConfigs: stored.category_configs?.length ? stored.category_configs : defaults.categoryConfigs,
		};
	}, [stored, error, defaults]);

	const { value, setValue, isDirty, submit, saving, justSaved, error: saveError } = useSectionForm<FormValue>(saved, defaults, async (v) => {
		const body: DeveloperConfig = { update_logs: v.updateLogs, page_configs: v.pageConfigs, category_configs: v.categoryConfigs };
		await write("PUT", "developer-config", body);
		await mutate(body, { revalidate: false }); // the sidebar and access guard read the same cache
	});

	const tabGuard = useTabGuard<Tab>({
		activeTab,
		setActiveTab,
		tabSnapshots: {
			logs: { local: value.updateLogs, saved: saved?.updateLogs ?? null },
			navigation: {
				local: { pages: value.pageConfigs, categories: value.categoryConfigs },
				saved: saved && { pages: saved.pageConfigs, categories: saved.categoryConfigs },
			},
		},
		onDiscard: (tab) => {
			if (!saved) return;
			if (tab === "logs") setValue((v) => ({ ...v, updateLogs: saved.updateLogs }));
			else if (tab === "navigation") setValue((v) => ({ ...v, pageConfigs: saved.pageConfigs, categoryConfigs: saved.categoryConfigs }));
		},
	});

	if (sessionLoading || (isDeveloper && isLoading)) return <PageSkeleton />;

	if (!isDeveloper) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center space-y-4">
					<Lock className="size-12 text-fg-muted mx-auto" />
					<p className="text-sm text-fg-muted">Developer Access Required</p>
					<p className="font-mono text-xs text-fg-muted">This page is only accessible to authorized developers.</p>
				</div>
			</div>
		);
	}

	return (
		<PageShell
			eyebrow="Developer"
			title="Live Configuration Panel"
			onSave={submit}
			saving={saving}
			dirty={isDirty}
			justSaved={justSaved}
			error={saveError}
			actions={<PreviewToggle preview={preview} onToggle={() => setPreview(!preview)} className="px-3" />}
		>
			<div className="p-4 border border-primary-500/20 bg-primary-500/5 rounded-xl flex items-start gap-3">
				<Shield className="size-5 text-primary-500 shrink-0 mt-0.5" />
				<div className="space-y-1 text-left">
					<h3 className="text-[13px] font-semibold text-fg-default">Developer Mode Active</h3>
					<p className="text-xs text-fg-muted leading-relaxed">You have full access to live configuration controls. Changes here affect the entire system immediately.</p>
				</div>
			</div>

			{error && (
				<div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl flex items-start gap-3">
					<AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
					<div className="space-y-1 text-left">
						<h3 className="text-[13px] font-semibold text-fg-default">Database Not Configured</h3>
						<p className="text-xs text-fg-muted leading-relaxed">Developer configuration changes cannot be saved to the database. Changes will only persist in the current session.</p>
					</div>
				</div>
			)}

			<GuardedTabs tabs={TABS} active={activeTab} guard={tabGuard} />

			{activeTab === "logs" && <UpdateLogsTab logs={value.updateLogs} onChange={(updateLogs) => setValue((v) => ({ ...v, updateLogs }))} />}
			{activeTab === "navigation" && (
				<NavigationTab
					pages={value.pageConfigs}
					categories={value.categoryConfigs}
					preview={preview}
					onPages={(pageConfigs) => setValue((v) => ({ ...v, pageConfigs }))}
					onCategories={(categoryConfigs) => setValue((v) => ({ ...v, categoryConfigs }))}
				/>
			)}
			{activeTab === "access" && <AccessTab preview={preview} onPreview={setPreview} />}
		</PageShell>
	);
}
