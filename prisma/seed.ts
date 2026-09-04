import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEFAULT_STAGES = [
  { name: "Novo Lead", order: 0, color: "#64748b" },
  { name: "Contato Feito", order: 1, color: "#3b82f6" },
  { name: "Proposta Enviada", order: 2, color: "#f59e0b" },
  { name: "Negociação", order: 3, color: "#a855f7" },
  { name: "Fechado - Ganho", order: 4, color: "#22c55e" },
  { name: "Fechado - Perdido", order: 5, color: "#ef4444" },
];

async function main() {
  for (const stage of DEFAULT_STAGES) {
    await prisma.pipelineStage.upsert({
      where: { order: stage.order },
      update: { name: stage.name, color: stage.color },
      create: stage,
    });
  }

  const demoEmail = "demo@crm.local";
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!existing) {
    const password = await bcrypt.hash("demo1234", 10);
    const user = await prisma.user.create({
      data: {
        name: "Usuário Demo",
        email: demoEmail,
        password,
      },
    });

    const stages = await prisma.pipelineStage.findMany({ orderBy: { order: "asc" } });

    const contact = await prisma.contact.create({
      data: {
        name: "Maria Silva",
        email: "maria.silva@example.com",
        phone: "(11) 98888-0000",
        company: "Acme Ltda.",
        status: "CONTACTED",
        ownerId: user.id,
      },
    });

    await prisma.deal.create({
      data: {
        title: "Plano Anual - Acme Ltda.",
        value: 12000,
        contactId: contact.id,
        stageId: stages[1].id,
        ownerId: user.id,
      },
    });

    await prisma.task.create({
      data: {
        title: "Ligar para Maria sobre a proposta",
        description: "Confirmar interesse no plano anual e enviar contrato.",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        contactId: contact.id,
        ownerId: user.id,
      },
    });

    console.log("Usuário demo criado: demo@crm.local / demo1234");
  }

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
