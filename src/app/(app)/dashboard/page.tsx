import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { LEAD_STATUS_LABELS } from "@/lib/labels";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  const [contactsCount, openDeals, wonDeals, pendingTasks, upcomingTasks, recentContacts] =
    await Promise.all([
      prisma.contact.count({ where: { ownerId: userId } }),
      prisma.deal.findMany({
        where: { ownerId: userId, stage: { name: { notIn: ["Fechado - Ganho", "Fechado - Perdido"] } } },
        select: { value: true },
      }),
      prisma.deal.findMany({
        where: { ownerId: userId, stage: { name: "Fechado - Ganho" } },
        select: { value: true },
      }),
      prisma.task.count({ where: { ownerId: userId, done: false } }),
      prisma.task.findMany({
        where: { ownerId: userId, done: false },
        include: { contact: { select: { name: true } } },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 5,
      }),
      prisma.contact.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const openValue = openDeals.reduce((sum, d) => sum + d.value, 0);
  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const today = new Date().toISOString().slice(0, 10);

  const stats = [
    { label: "Contatos", value: contactsCount.toString(), href: "/contacts" },
    { label: "Negócios em aberto", value: `${openDeals.length} · ${currencyFormatter.format(openValue)}`, href: "/pipeline" },
    { label: "Fechados (ganho)", value: currencyFormatter.format(wonValue), href: "/pipeline" },
    { label: "Tarefas pendentes", value: pendingTasks.toString(), href: "/tasks" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Olá, {session?.user?.name?.split(" ")[0] ?? "bem-vindo"}
      </h1>
      <p className="mt-1 text-slate-500">Aqui está um resumo do seu CRM.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Próximas tarefas</h2>
            <Link href="/tasks" className="text-xs font-medium text-slate-500 hover:text-slate-900">
              Ver todas
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {upcomingTasks.length === 0 && (
              <p className="text-sm text-slate-500">Nenhuma tarefa pendente. 🎉</p>
            )}
            {upcomingTasks.map((task) => {
              const dueValue = task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null;
              const overdue = dueValue !== null && dueValue < today;
              return (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{task.title}</p>
                    {task.contact && <p className="text-xs text-slate-400">{task.contact.name}</p>}
                  </div>
                  {task.dueDate && (
                    <span className={overdue ? "text-xs font-medium text-red-600" : "text-xs text-slate-400"}>
                      {dateFormatter.format(task.dueDate)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Contatos recentes</h2>
            <Link href="/contacts" className="text-xs font-medium text-slate-500 hover:text-slate-900">
              Ver todos
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {recentContacts.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum contato cadastrado ainda.</p>
            )}
            {recentContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-900">{contact.name}</p>
                  <p className="text-xs text-slate-400">{contact.company || "—"}</p>
                </div>
                <span className="text-xs text-slate-400">{LEAD_STATUS_LABELS[contact.status]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
