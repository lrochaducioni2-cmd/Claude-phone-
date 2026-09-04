import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Olá, {session?.user?.name?.split(" ")[0] ?? "bem-vindo"}
      </h1>
      <p className="mt-1 text-slate-500">Aqui está um resumo do seu CRM.</p>
    </div>
  );
}
