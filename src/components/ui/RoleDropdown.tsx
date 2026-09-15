"use client";

import { Search, Shield } from "lucide-react";
import { useState } from "react";
import type { RoleOption } from "@/hooks/useGuildSnapshot";

interface RoleDropdownProps {
	value: string;
	onChange: (value: string) => void;
	roles: RoleOption[];
	placeholder?: string;
	className?: string;
}

export default function RoleDropdown({
	value,
	onChange,
	roles,
	placeholder = "Select a role",
	className = "",
}: RoleDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const filteredRoles = roles.filter((role) =>
		role.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const selectedRole = roles.find((role) => role.id === value);

	return (
		<div className={`relative ${className}`}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50 flex items-center justify-between"
			>
				<span className="truncate flex items-center gap-2">
					{selectedRole ? (
						<>
							<Shield className="size-3.5" style={{ color: `#${selectedRole.color}` }} />
							{selectedRole.name}
						</>
					) : (
						<span className="text-fg-muted">{placeholder}</span>
					)}
				</span>
				<span className="text-fg-muted">▼</span>
			</button>

			{isOpen && (
				<div className="absolute z-[100] w-full mt-1 bg-panel-bg border border-border-subtle rounded-lg shadow-lg max-h-64 overflow-hidden">
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
						{filteredRoles.length > 0 ? (
							filteredRoles.map((role) => (
								<button
									type="button"
									key={role.id}
									onClick={() => {
										onChange(role.id);
										setIsOpen(false);
										setSearchQuery("");
									}}
									className={`w-full px-3 py-2 text-left font-mono text-[10px] text-fg-default hover:bg-bg-canvas/60 transition-all flex items-center gap-2 ${
										value === role.id ? "bg-primary-500/10 text-primary-500" : ""
									}`}
								>
									<Shield className="size-3.5" style={{ color: `#${role.color}` }} />
									<span className="truncate">{role.name}</span>
								</button>
							))
						) : (
							<div className="p-3 text-center font-mono text-[9px] text-fg-muted">
								No roles found
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}