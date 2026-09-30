# Integração Software de Inspeção ↔ CRM

Lado **software de inspeção** do contrato definido no `INTEGRACAO.md` do CRM
(branch `claude/crm-project-k92ynn`). Regra: os dois sistemas são
independentes e só se comunicam por **API** — nunca por banco compartilhado.
Toda a lógica de inspeção vive aqui.

## Configuração

```bash
CRM_API_URL="https://crm.exemplo.com.br"   # URL base do CRM
CRM_API_TOKEN="..."                         # token emitido pelo CRM (Bearer)
APP_BASE_URL="https://inspecao.exemplo.com.br"  # usado no link_relatorio
```

Para desenvolver sem o CRM real: `npm run crm:mock` sobe um CRM simulado em
`http://localhost:4000` (token `dev-token`) que implementa o contrato em
memória (`scripts/mock-crm.ts`).

## Fluxo

| Passo | Tela | Chamada ao CRM | Status no CRM |
|---|---|---|---|
| 1. Ver o que foi vendido | Trabalhos | `GET /api/trabalhos?status=vendido` (+ `GET /api/empresas/:id` para nomes) | `vendido` |
| 2. Iniciar execução | Trabalhos → "Iniciar execução" | `GET /api/trabalhos/:id`, `GET /api/empresas/:id` (se não vier embutida), `PATCH /api/trabalhos/:id/status` `{ "status": "em_execucao" }` | `em_execucao` |
| 3. Executar | Instalações, áreas, equipamentos, inspeções Ex | — (tudo local) | `em_execucao` |
| 4. Entregar | Trabalho → "Entregar ao cliente" | `PATCH /api/trabalhos/:id/status` `{ "status": "entregue", "data_entrega", "link_relatorio", "observacoes" }` | `entregue` |

Regras deste lado:

- Só trabalhos `vendido` (ou `em_execucao`, para retomar uma importação
  interrompida) podem ser iniciados. A importação é idempotente (chave:
  id do CRM).
- Empresa e trabalho são **copiados** localmente na importação — a inspeção
  continua funcionando se o CRM ficar fora do ar.
- A entrega exige ao menos uma inspeção vinculada e todas concluídas. Depois
  de entregue, as inspeções do trabalho ficam travadas.
- **Falha ao avisar o CRM não desfaz nada local**: o status local é gravado
  primeiro; se o `PATCH` falhar (rede, token, erro 5xx), o trabalho mostra
  "O CRM ainda não foi avisado" com o motivo e o botão "Reenviar ao CRM".

## Ajustes propostos ao contrato (para alinhar com o CRM)

1. **`em_execucao`**: este software envia `PATCH ... { "status": "em_execucao" }`
   ao iniciar. O CRM deve aceitar a transição `vendido → em_execucao`.
2. **Formato de lista**: aceitamos array puro ou `{ "data": [...] }`. Sugestão:
   array puro.
3. **Empresa embutida**: em `GET /api/trabalhos/:id` aceitamos `empresa`
   embutida ou só `empresa_id`. Sugestão: embutir também na listagem
   `?status=vendido`, evitando uma chamada por empresa.
4. **Idempotência do PATCH**: reenvios do mesmo status (após falha de rede)
   devem responder 200, não erro.
5. **Erros**: 401/403 para token inválido, 404 para id inexistente, 400/422
   com `{ "error": "..." }` para transição inválida.
6. **Datas**: `data_venda`/`data_entrega` como `AAAA-MM-DD`.
7. **`link_relatorio`**: hoje aponta para a página do trabalho neste software
   (exige login). Se o cliente final precisar abrir sem login, combinar um
   link público assinado ou o envio do PDF.
8. **Webhook (futuro)**: quando o CRM puder notificar `vendido`, este lado
   expõe um endpoint para importar automaticamente, substituindo a consulta.
