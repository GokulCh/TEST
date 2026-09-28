"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";

/** The mobile drawer: the same page list as the desktop sidebar, focus-trapped and closed by Escape. */
export function MobileSidebar() {
	const [open, setOpen] = useState(false);

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Trigger className="cursor-pointer rounded-lg p-2 text-fg-muted transition-colors hover:bg-panel-bg hover:text-fg-default" aria-label="Open navigation">
				<Menu className="size-5" />
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay data-slot="overlay" className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" />
				<Dialog.Content
					aria-describedby={undefined}
					className="motion-fade fixed inset-y-0 left-0 z-50 flex w-64 select-none flex-col border-r border-border-subtle bg-panel-bg shadow-2xl focus:outline-none"
				>
					<div className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle px-4">
						<Dialog.Title className="font-display font-bold">Ranked Bedwars</Dialog.Title>
						<Dialog.Close aria-label="Close navigation" className="cursor-pointer rounded-md p-1 text-fg-muted transition-colors hover:text-fg-default">
							<X className="size-5" />
						</Dialog.Close>
					</div>
					<nav className="scrollbar-thin flex-1 space-y-1.5 overflow-y-auto p-3 pb-16">
						<SidebarNav onNavigate={() => setOpen(false)} />
					</nav>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
