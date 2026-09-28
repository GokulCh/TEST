"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";

export function PublicEditLauncher() {
  return (
    <Link
      href="?edit=1"
      className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-[#0b1720]/95 px-4 py-3 text-sm font-semibold text-cyan-100 shadow-2xl shadow-cyan-950/40 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-[#102532]"
    >
      <Pencil className="size-4" />
      Edit this site
    </Link>
  );
}
