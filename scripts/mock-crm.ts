// CRM simulado — implementa o contrato de INTEGRACAO.md em memória, para
// desenvolver e testar o software de inspeção sem depender do CRM real.
//
// Roda com: npm run crm:mock   (porta 4000, token "dev-token")
// Variáveis opcionais: MOCK_CRM_PORT, MOCK_CRM_TOKEN.
//
// Endpoints:
//   GET   /api/empresas/:id
//   GET   /api/trabalhos?status=vendido
//   GET   /api/trabalhos/:id
//   PATCH /api/trabalhos/:id/status
// Extra (só no mock, para inspecionar o estado): GET /__estado

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const PORT = Number(process.env.MOCK_CRM_PORT ?? 4000);
const TOKEN = process.env.MOCK_CRM_TOKEN ?? "dev-token";

const STATUS = ["orcamento", "vendido", "em_execucao", "entregue", "cancelado"] as const;
type Status = (typeof STATUS)[number];

const empresas: Record<string, Record<string, string>> = {
  "emp-1": {
    id: "emp-1",
    razao_social: "Petroquímica Sul Ltda.",
    nome_fantasia: "PetroSul",
    cnpj: "12.345.678/0001-90",
    endereco: "Rod. SC-443, km 12 — Criciúma/SC",
    telefone: "(48) 3333-0000",
    email: "manutencao@petrosul.example",
    contato_responsavel: "Carla Menezes",
  },
  "emp-2": {
    id: "emp-2",
    razao_social: "Distribuidora de Combustíveis Litoral S.A.",
    nome_fantasia: "Litoral Combustíveis",
    cnpj: "98.765.432/0001-10",
    endereco: "Av. Portuária, 500 — Imbituba/SC",
    telefone: "(48) 3255-1000",
    email: "seguranca@litoral.example",
    contato_responsavel: "João Pereira",
  },
};

type Trabalho = {
  id: string;
  empresa_id: string;
  descricao_escopo: string;
  valor: number;
  data_venda: string;
  status: Status;
  data_entrega: string | null;
  link_relatorio: string | null;
  observacoes?: string | null;
};

const trabalhos: Record<string, Trabalho> = {
  "101": {
    id: "101",
    empresa_id: "emp-1",
    descricao_escopo: "Inspeção Detalhada de equipamentos Ex — casa de bombas e tancagem",
    valor: 28500,
    data_venda: "2026-09-20",
    status: "vendido",
    data_entrega: null,
    link_relatorio: null,
  },
  "102": {
    id: "102",
    empresa_id: "emp-2",
    descricao_escopo: "Inspeção Visual periódica — base de distribuição",
    valor: 9800,
    data_venda: "2026-09-25",
    status: "vendido",
    data_entrega: null,
    link_relatorio: null,
  },
  "103": {
    id: "103",
    empresa_id: "emp-1",
    descricao_escopo: "Estudo de classificação de áreas (ainda em orçamento)",
    valor: 15000,
    data_venda: "2026-09-28",
    status: "orcamento",
    data_entrega: null,
    link_relatorio: null,
  },
};

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "null");
  } catch {
    return undefined;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const log = (status: number) => console.log(`${req.method} ${url.pathname}${url.search} → ${status}`);

  if (url.pathname === "/__estado") return send(res, 200, { empresas, trabalhos });

  if (req.headers.authorization !== `Bearer ${TOKEN}`) {
    log(401);
    return send(res, 401, { error: "Token inválido." });
  }

  let match: RegExpMatchArray | null;

  if (req.method === "GET" && (match = url.pathname.match(/^\/api\/empresas\/([^/]+)$/))) {
    const empresa = empresas[decodeURIComponent(match[1])];
    log(empresa ? 200 : 404);
    return empresa ? send(res, 200, empresa) : send(res, 404, { error: "Empresa não encontrada." });
  }

  if (req.method === "GET" && url.pathname === "/api/trabalhos") {
    const status = url.searchParams.get("status");
    const list = Object.values(trabalhos).filter((t) => !status || t.status === status);
    log(200);
    return send(res, 200, list);
  }

  if (req.method === "GET" && (match = url.pathname.match(/^\/api\/trabalhos\/([^/]+)$/))) {
    const trabalho = trabalhos[decodeURIComponent(match[1])];
    log(trabalho ? 200 : 404);
    if (!trabalho) return send(res, 404, { error: "Trabalho não encontrado." });
    return send(res, 200, { ...trabalho, empresa: empresas[trabalho.empresa_id] });
  }

  if (req.method === "PATCH" && (match = url.pathname.match(/^\/api\/trabalhos\/([^/]+)\/status$/))) {
    const trabalho = trabalhos[decodeURIComponent(match[1])];
    if (!trabalho) {
      log(404);
      return send(res, 404, { error: "Trabalho não encontrado." });
    }
    const body = (await readJson(req)) as Partial<Trabalho> | undefined;
    if (!body || !STATUS.includes(body.status as Status)) {
      log(400);
      return send(res, 400, { error: "status inválido." });
    }
    if (body.status === "entregue" && !body.data_entrega) {
      log(400);
      return send(res, 400, { error: "data_entrega é obrigatória ao entregar." });
    }
    trabalho.status = body.status as Status;
    if (body.data_entrega !== undefined) trabalho.data_entrega = body.data_entrega;
    if (body.link_relatorio !== undefined) trabalho.link_relatorio = body.link_relatorio;
    if (body.observacoes !== undefined) trabalho.observacoes = body.observacoes;
    console.log("  ↳", JSON.stringify(body));
    log(200);
    return send(res, 200, trabalho);
  }

  log(404);
  send(res, 404, { error: "Rota não encontrada." });
});

server.listen(PORT, () => {
  console.log(`CRM simulado em http://localhost:${PORT} (token: ${TOKEN})`);
});
