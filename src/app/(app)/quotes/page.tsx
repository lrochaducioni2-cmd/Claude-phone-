import Link from "next/link";

export default function QuotesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Orçamentos</h1>
      <p className="mt-1 max-w-xl text-slate-500">
        Estamos finalizando o modelo de cálculo (H&amp;H, materiais, despesas, margem e
        impostos) a partir da planilha atual. Assim que confirmado, os 6 tipos de orçamento —
        Estudo de Classificação Diária, Projeto, Consultoria, Inspeção Inicial, Inspeção Apurada
        e Instalação e Treinamentos — ficam disponíveis aqui, com geração de PDF.
      </p>

      <Link
        href="/settings/travel-policy"
        className="mt-4 inline-block rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Configurar política de viagem →
      </Link>
    </div>
  );
}
