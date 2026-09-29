import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavBar } from "@/components/nav-bar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar userName={session.user?.name ?? session.user?.email ?? "Usuário"} />
      <main className="flex-1 bg-slate-50 print:bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">{children}</div>
      </main>
    </div>
  );
}
