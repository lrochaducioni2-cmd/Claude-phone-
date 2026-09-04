import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { PipelineBoard } from "@/components/pipeline-board";

export default async function PipelinePage() {
  const userId = await getCurrentUserId();

  const [stages, deals, contacts] = await Promise.all([
    prisma.pipelineStage.findMany({ orderBy: { order: "asc" } }),
    userId
      ? prisma.deal.findMany({
          where: { ownerId: userId },
          include: { contact: { select: { id: true, name: true, company: true } } },
          orderBy: { order: "asc" },
        })
      : Promise.resolve([]),
    userId
      ? prisma.contact.findMany({
          where: { ownerId: userId },
          select: { id: true, name: true, company: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return <PipelineBoard stages={stages} deals={deals} contacts={contacts} />;
}
