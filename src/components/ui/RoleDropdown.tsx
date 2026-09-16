"use client";

import { Shield } from "lucide-react";
import type { RoleOption } from "@/hooks/useGuildSnapshot";
import OptionDropdown from "./OptionDropdown";

interface RoleDropdownProps {
	value: string;
	onChange: (value: string) => void;
	roles: RoleOption[];
	placeholder?: string;
	className?: string;
}

export default function RoleDropdown({ value, onChange, roles, placeholder = "Select a role", className = "" }: RoleDropdownProps) {
	return (
		<OptionDropdown
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			ariaLabel="Allowed role"
			className={className}
			options={roles.map((role) => ({
				value: role.id,
				label: role.name,
				searchLabel: role.name,
				icon: <Shield className="size-3.5 shrink-0" style={{ color: `#${role.color}` }} />,
			}))}
		/>
	);
}
