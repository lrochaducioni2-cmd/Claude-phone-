# CRM

Sistema de CRM (Customer Relationship Management) para gestão de contatos/leads,
pipeline de vendas, tarefas de follow-up e (em breve) orçamentos.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- [Prisma 7](https://www.prisma.io) + PostgreSQL
- [NextAuth.js v4](https://next-auth.js.org) (login por e-mail/senha)
- [@react-pdf/renderer](https://react-pdf.org) (geração de PDF dos orçamentos)

## Funcionalidades

- **Autenticação**: cadastro e login por e-mail/senha.
- **Contatos**: cadastro de empresas/leads (nome, empresa, e-mail, telefone, status, observações).
- **Pipeline de vendas**: kanban com estágios configuráveis, arraste os negócios entre colunas.
- **Tarefas**: follow-ups com data de vencimento, vinculados a um contato.
- **Orçamentos** *(em desenvolvimento)*: geração de orçamento em PDF para os serviços
  (Estudo de Classificação Diária, Projeto, Consultoria, Inspeção Inicial, Inspeção Apurada,
  Instalação e Treinamentos), com cálculo de mão de obra (H&H), materiais, despesas
  (incluindo política de viagem a partir de Criciúma/SC), margem e impostos.
- **Inspeção Ex** (ABNT NBR IEC 60079-17): cadastro de instalações do cliente, áreas
  classificadas (gás/poeira, zona, grupo, classe de temperatura) e equipamentos Ex
  (TAG, tipos de proteção, marcação, EPL, IP, certificado), com verificação automática
  de adequação do equipamento à área (EPL × zona, grupo, classe T / temperatura de
  superfície). Inspeções Visual/Apurada/Detalhada geram um checklist por equipamento
  conforme o tipo de proteção (Tabelas 1, 2 e 3 da norma), com resultado
  Conforme/Não conforme/Pendente e relatório imprimível (salvar como PDF pelo navegador).
- **Trabalhos (integração com o CRM)**: lista os trabalhos `vendido` do CRM, importa
  empresa e trabalho **por API** ao iniciar a execução e avisa o CRM na entrega
  (`em_execucao` → `entregue`, com data e link do relatório). Detalhes e ajustes
  propostos ao contrato em [`INTEGRACAO.md`](./INTEGRACAO.md). Para desenvolver sem o
  CRM real: `npm run crm:mock`.

## Rodando localmente

### 1. Pré-requisitos

- Node.js 20+
- Docker (para o PostgreSQL local) — ou um Postgres já rodando em outro lugar

### 2. Instalar dependências

```bash
npm install
```

### 3. Subir o banco de dados

```bash
docker compose up -d
```

Isso sobe um Postgres local em `localhost:5432` (usuário/senha/banco: `crm`).

### 4. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Gere um valor para `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 5. Rodar as migrations e popular dados iniciais

```bash
npm run db:migrate
npm run db:seed
```

O seed cria os estágios padrão do pipeline e um usuário de teste:

- **E-mail:** `demo@crm.local`
- **Senha:** `demo1234`

### 6. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts úteis

| Comando              | Descrição                                          |
| --------------------- | --------------------------------------------------- |
| `npm run dev`         | Servidor de desenvolvimento                          |
| `npm run build`       | Build de produção                                    |
| `npm run lint`        | Lint (ESLint)                                        |
| `npm run db:migrate`  | Aplica migrations do Prisma                          |
| `npm run db:seed`     | Popula estágios do pipeline + usuário demo           |
| `npm run db:studio`   | Abre o Prisma Studio (explorar/editar dados)         |
| `npx tsx scripts/verify-ex-inspection.ts` | Verifica regras de adequação e checklist Ex |

## Notas técnicas

- **Prisma 7**: a URL do banco não fica mais em `schema.prisma` — está em `prisma.config.ts`
  (usado pela CLI) e em `src/lib/prisma.ts` (usado em runtime via driver adapter `@prisma/adapter-pg`).
- **Next.js 16**: o arquivo `middleware.ts` foi renomeado para `src/proxy.ts` (mesma função,
  usado aqui para proteger as rotas autenticadas via NextAuth).
- Antes de rodar `npx tsc --noEmit` isoladamente (fora de `next dev`/`next build`), rode
  `npx next typegen` para gerar os tipos de rota (`PageProps`, `LayoutProps`).
