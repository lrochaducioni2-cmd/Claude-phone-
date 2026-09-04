"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TaskFormModal, type TaskFormValues } from "@/components/task-form-modal";

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null; // ISO string
  done: boolean;
  contact: { id: string; name: string } | null;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function TasksClient({
  tasks,
  contacts,
}: {
  tasks: TaskRow[];
  contacts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskFormValues | undefined>(undefined);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function openNew() {
    setEditing({ title: "", description: "", dueDate: "", contactId: "" });
    setModalOpen(true);
  }

  function openEdit(task: TaskRow) {
    setEditing({
      id: task.id,
      title: task.title,
      description: task.description ?? "",
      dueDate: toDateInputValue(task.dueDate),
      contactId: task.contact?.id ?? "",
    });
    setModalOpen(true);
  }

  async function toggleDone(task: TaskRow) {
    setTogglingId(task.id);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    setTogglingId(null);
    router.refresh();
  }

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tarefas</h1>
          <p className="mt-1 text-sm text-slate-500">Follow-ups e lembretes com seus contatos.</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Nova tarefa
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Pendentes ({pending.length})
          </h2>
          <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {pending.length === 0 && (
              <p className="p-4 text-sm text-slate-500">Nenhuma tarefa pendente.</p>
            )}
            {pending.map((task) => {
              const dueValue = toDateInputValue(task.dueDate);
              const overdue = dueValue !== "" && dueValue < today;
              return (
                <div key={task.id} className="flex items-start gap-3 p-4">
                  <input
                    type="checkbox"
                    checked={task.done}
                    disabled={togglingId === task.id}
                    onChange={() => toggleDone(task)}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <button onClick={() => openEdit(task)} className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-900">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 text-sm text-slate-500">{task.description}</p>
                    )}
                    <div className="mt-1 flex gap-3 text-xs text-slate-400">
                      {task.contact && <span>{task.contact.name}</span>}
                      {dueValue && (
                        <span className={overdue ? "font-medium text-red-600" : ""}>
                          {overdue ? "Atrasada — " : "Vence em "}
                          {dateFormatter.format(new Date(`${dueValue}T00:00:00`))}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {done.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Concluídas ({done.length})
            </h2>
            <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {done.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-4">
                  <input
                    type="checkbox"
                    checked={task.done}
                    disabled={togglingId === task.id}
                    onChange={() => toggleDone(task)}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <button onClick={() => openEdit(task)} className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-500 line-through">{task.title}</p>
                    {task.contact && <p className="mt-0.5 text-xs text-slate-400">{task.contact.name}</p>}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {editing && (
        <TaskFormModal
          key={editing.id ?? "new"}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          initialValues={editing}
          contacts={contacts}
        />
      )}
    </div>
  );
}
