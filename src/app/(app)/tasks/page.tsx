import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { TasksClient } from "@/components/tasks-client";

export default async function TasksPage() {
  const userId = await getCurrentUserId();

  const [tasks, contacts] = await Promise.all([
    userId
      ? prisma.task.findMany({
          where: { ownerId: userId },
          include: { contact: { select: { id: true, name: true } } },
          orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([]),
    userId
      ? prisma.contact.findMany({
          where: { ownerId: userId },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const taskRows = tasks.map((task) => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
  }));

  return <TasksClient tasks={taskRows} contacts={contacts} />;
}
