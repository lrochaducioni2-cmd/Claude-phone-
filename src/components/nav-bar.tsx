"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const LINKS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/contacts", label: "Contatos" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/tasks", label: "Tarefas" },
  { href: "/quotes", label: "Orçamentos" },
  { href: "/ex", label: "Inspeção Ex" },
];

export function NavBar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <span className="text-lg font-semibold text-slate-900">CRM</span>
          <nav className="flex gap-1">
            {LINKS.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
