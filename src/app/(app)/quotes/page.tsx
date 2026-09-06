import Link from "next/link";

export default function QuotesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Orçamentos</h1>
      <p className="mt-1 max-w-xl text-slate-500">
        O motor de cálculo (mão de obra, despesas, margens e ISS) já foi validado contra a
        planilha do cliente. Ainda falta a tela de criação de orçamento por tipo de serviço e a
        geração de PDF — os 7 tipos (Estudo de Classificação Diária, Projeto, Consultoria,
        Inspeção Inicial, Inspeção Apurada, Inspeção Detalhada e Instalação e Treinamentos)
        ficam disponíveis aqui assim que isso estiver pronto.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/settings/travel-policy"
          className="inline-block rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Configurar política de viagem →
        </Link>
        <Link
          href="/settings/labor-rates"
          className="inline-block rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Configurar tabela de cargos (HH) →
        </Link>
        <Link
          href="/settings/inspection-time-standards"
          className="inline-block rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Configurar tempo padrão de inspeção →
        </Link>
      </div>
    </div>
  );
}
