"use client";

import Link from "next/link";
import { useUpdateStatus } from "@/lib/use-update-status";

export function UpdateIndicator() {
  const { status } = useUpdateStatus();

  if (status.state !== 'available') return null;

  return (
    <Link
      href="/updates"
      className="block px-4 py-1 text-xs font-medium text-orange-500 hover:text-orange-400 transition-colors"
    >
      Update available: v{status.version}
    </Link>
  );
}
