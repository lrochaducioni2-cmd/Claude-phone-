import { NextResponse } from "next/server";
import { CrmError } from "@/lib/crm-client";
import { TrabalhoError } from "@/lib/trabalhos";

/** Converte erros do fluxo de trabalho/CRM em resposta HTTP. */
export function trabalhoErrorResponse(error: unknown) {
  if (error instanceof TrabalhoError) {
    return NextResponse.json({ error: error.message }, { status: error.httpStatus });
  }
  if (error instanceof CrmError) {
    // 404 do CRM continua 404; qualquer outra falha do CRM é 502 (gateway).
    return NextResponse.json({ error: error.message }, { status: error.status === 404 ? 404 : 502 });
  }
  console.error(error);
  return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
}
