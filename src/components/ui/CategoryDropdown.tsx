"use client";

import { Folder } from "lucide-react";
import type { CategoryOption } from "@/hooks/useGuildSnapshot";
import OptionDropdown from "./OptionDropdown";

interface CategoryDropdownProps {
	value: string;
	onChange: (value: string) => void;
	categoryOptions: CategoryOption[];
	placeholder?: string;
	className?: string;
}

export default function CategoryDropdown({ value, onChange, categoryOptions, placeholder = "Select a category", className = "" }: CategoryDropdownProps) {
	return (
		<OptionDropdown
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			ariaLabel="Category"
			className={className}
			emptyLabel="No categories found"
			options={categoryOptions.map((category) => ({
				value: category.id,
				label: category.name,
				searchLabel: category.name,
				icon: <Folder className="size-3.5 shrink-0 text-violet-400" />,
			}))}
		/>
	);
}
