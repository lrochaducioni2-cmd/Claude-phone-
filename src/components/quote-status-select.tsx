"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUOTE_STATUS_LABELS } from "@/lib/labels";

export function QuoteStatusSelect({ quoteId, status }: { quoteId: string; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);

  async function handleChange(value: string) {
    setCurrent(value);
    setLoading(true);
    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-60"
    >
      {Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
