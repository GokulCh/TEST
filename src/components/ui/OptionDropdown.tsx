"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

export interface DropdownOption {
	value: string;
	label: string;
	icon?: React.ReactNode;
	searchLabel?: string;
	disabled?: boolean;
}

interface OptionDropdownProps {
	value: string;
	onChange: (value: string) => void;
	options: DropdownOption[];
	placeholder?: string;
	searchPlaceholder?: string;
	emptyLabel?: string;
	className?: string;
	ariaLabel?: string;
}

export default function OptionDropdown({
	value,
	onChange,
	options,
	placeholder = "Select an option",
	searchPlaceholder = "Search...",
	emptyLabel = "No options found",
	className = "",
	ariaLabel,
}: OptionDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const rootRef = useRef<HTMLDivElement>(null);
	const searchId = useId();
	const selected = options.find((option) => option.value === value);
	const filteredOptions = options.filter((option) =>
		(option.searchLabel ?? option.label).toLowerCase().includes(searchQuery.toLowerCase()),
	);

	useEffect(() => {
		if (!isOpen) return;
		const handlePointerDown = (event: MouseEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
		};
		document.addEventListener("mousedown", handlePointerDown);
		return () => document.removeEventListener("mousedown", handlePointerDown);
	}, [isOpen]);

	const selectOption = (option: DropdownOption) => {
		if (option.disabled) return;
		onChange(option.value);
		setIsOpen(false);
		setSearchQuery("");
	};

	return (
		<div ref={rootRef} className={`relative ${className}`}>
			<button
				type="button"
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				aria-label={ariaLabel}
				onClick={() => setIsOpen((open) => !open)}
				className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border-subtle bg-bg-canvas/40 px-3 text-left font-mono text-sm text-fg-default transition-[border-color,box-shadow,background-color] duration-200 focus:border-primary-500/60 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
			>
				<span className={`flex min-w-0 items-center gap-2 truncate ${selected ? "" : "text-fg-muted"}`}>
					{selected?.icon}
					<span className="truncate">{selected?.label ?? placeholder}</span>
				</span>
				<ChevronDown className={`size-3.5 shrink-0 text-fg-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
			</button>

			{isOpen && (
				<div className="absolute inset-x-0 top-full z-[100] mt-1 overflow-hidden rounded-lg border border-border-subtle bg-panel-bg shadow-xl shadow-black/30">
					<div className="border-b border-border-subtle/60 p-2">
						<div className="relative">
							<Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-muted" />
							<input
								id={searchId}
								autoFocus
								value={searchQuery}
								placeholder={searchPlaceholder}
								aria-label={searchPlaceholder}
								onChange={(event) => setSearchQuery(event.target.value)}
								className="h-9 w-full rounded-md border border-border-subtle bg-bg-canvas/40 pl-8 pr-2 font-mono text-sm text-fg-default outline-none placeholder:text-fg-muted focus:border-primary-500/60"
							/>
						</div>
					</div>
					<div role="listbox" aria-label={ariaLabel ?? placeholder} className="max-h-56 overflow-y-auto p-1">
						{filteredOptions.length > 0 ? filteredOptions.map((option) => (
							<button
								type="button"
								role="option"
								aria-selected={option.value === value}
								disabled={option.disabled}
								key={option.value}
								onClick={() => selectOption(option)}
								className={`flex min-h-10 w-full items-center gap-2 rounded-md px-3 py-2 text-left font-mono text-sm text-fg-default transition-[background-color,color] duration-150 hover:bg-bg-canvas/70 disabled:cursor-not-allowed disabled:opacity-50 ${option.value === value ? "bg-primary-500/10 text-primary-400" : ""}`}
							>
								{option.icon}
								<span className="min-w-0 flex-1 truncate">{option.label}</span>
								{option.value === value && <Check className="size-3.5 shrink-0" />}
							</button>
						)) : <div className="px-3 py-4 text-center font-mono text-[10px] text-fg-muted">{emptyLabel}</div>}
					</div>
				</div>
			)}
		</div>
	);
}
