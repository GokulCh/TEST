"use client";

import { Folder, Search } from "lucide-react";
import { useState } from "react";
import type { CategoryOption } from "@/hooks/useGuildSnapshot";

interface CategoryDropdownProps {
	value: string;
	onChange: (value: string) => void;
	categoryOptions: CategoryOption[];
	placeholder?: string;
	className?: string;
}

export default function CategoryDropdown({
	value,
	onChange,
	categoryOptions,
	placeholder = "Select a category",
	className = "",
}: CategoryDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const filteredCategories = categoryOptions.filter((cat) =>
		cat.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const selectedCategory = categoryOptions.find((cat) => cat.id === value);

	return (
		<div className={`relative ${className}`}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50 flex items-center justify-between"
			>
				<span className="truncate flex items-center gap-2">
					{selectedCategory ? (
						<>
							<Folder className="size-3.5 text-violet-400" />
							{selectedCategory.name}
						</>
					) : (
						<span className="text-fg-muted">{placeholder}</span>
					)}
				</span>
				<span className="text-fg-muted">▼</span>
			</button>

			{isOpen && (
				<div className="absolute z-50 w-full mt-1 bg-panel-bg border border-border-subtle rounded-lg shadow-lg max-h-64 overflow-hidden">
					{/* Search */}
					<div className="p-2 border-b border-border-subtle/50">
						<div className="relative">
							<Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-fg-muted" />
							<input
								type="text"
								placeholder="Search..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full h-7 pl-8 pr-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-[10px] text-fg-default focus:outline-none focus:border-primary-500/50"
							/>
						</div>
					</div>

					{/* Options */}
					<div className="max-h-48 overflow-y-auto">
						{filteredCategories.length > 0 ? (
							filteredCategories.map((category) => (
								<button
									type="button"
									key={category.id}
									onClick={() => {
										onChange(category.id);
										setIsOpen(false);
										setSearchQuery("");
									}}
									className={`w-full px-3 py-2 text-left font-mono text-[10px] text-fg-default hover:bg-bg-canvas/60 transition-all flex items-center gap-2 ${
										value === category.id ? "bg-primary-500/10 text-primary-500" : ""
									}`}
								>
									<Folder className="size-3.5 text-violet-400" />
									<span className="truncate">{category.name}</span>
								</button>
							))
						) : (
							<div className="p-3 text-center font-mono text-[9px] text-fg-muted">
								No categories found
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}