# Integração CRM ↔ Software de Inspeção

Este documento define o contrato de integração entre o CRM (este repositório)
e o software de inspeção (projeto maior, desenvolvido separadamente). O CRM é
a **fonte da verdade** para dados de empresa e status comercial; o software de
inspeção consome esses dados para executar o trabalho e devolve o status ao
final.

## Fluxo de negócio

1. CRM cadastra a **empresa** (cliente).
2. CRM cria um **orçamento** para essa empresa.
3. Quando a venda é fechada, o orçamento vira um **trabalho** com status
   `vendido` — pronto para execução.
4. O software de inspeção consulta o CRM, puxa os dados da empresa e do
   trabalho, e executa o serviço (fora do escopo do CRM).
5. Ao concluir e entregar, o software de inspeção informa o CRM, que atualiza
   o status do trabalho para `entregue`.

```
CRM (cadastro + orçamento + venda) --> [API] --> Software de Inspeção (execução)
CRM <-- [API] atualização de status <-- Software de Inspeção (entrega)
```

## Entidades compartilhadas

### Empresa
| Campo | Tipo | Descrição |
|---|---|---|
| id | string/uuid | identificador único (gerado pelo CRM) |
| razao_social | string | |
| nome_fantasia | string | |
| cnpj | string | |
| endereco | string | |
| telefone | string | |
| email | string | |
| contato_responsavel | string | pessoa de contato na empresa |

### Trabalho (orçamento vendido)
| Campo | Tipo | Descrição |
|---|---|---|
| id | string/uuid | identificador único (gerado pelo CRM) |
| empresa_id | string/uuid | referência à empresa |
| descricao_escopo | string | o que foi vendido / escopo da inspeção |
| valor | number | valor do orçamento |
| data_venda | date | quando a venda foi fechada |
| status | enum | `orcamento` \| `vendido` \| `em_execucao` \| `entregue` \| `cancelado` |
| data_entrega | date \| null | preenchido quando a inspeção conclui |
| link_relatorio | string \| null | opcional: link do relatório final, se o software de inspeção quiser anexar |

## Contrato de API (a ser exposto pelo CRM)

Autenticação: token/API key emitido pelo CRM para o software de inspeção
(Bearer token em cada requisição).

- `GET /api/empresas/:id` — retorna dados cadastrais da empresa
- `GET /api/trabalhos?status=vendido` — lista trabalhos prontos para execução
  (o software de inspeção usa isso para "puxar" o que precisa fazer)
- `GET /api/trabalhos/:id` — detalhes de um trabalho específico (inclui dados
  da empresa embutidos ou referenciados)
- `PATCH /api/trabalhos/:id/status` — o software de inspeção atualiza o
  status do trabalho.
  Body exemplo:
  ```json
  {
    "status": "entregue",
    "data_entrega": "2026-10-15",
    "link_relatorio": "https://...",
    "observacoes": "opcional"
  }
  ```

Alternativa futura (não obrigatória agora): o CRM pode notificar o software
de inspeção via **webhook** quando um trabalho vira `vendido`, em vez do
software de inspeção precisar consultar (`polling`) periodicamente.

## Direção de implementação

- Este repositório (CRM) deve, quando o backend for construído, implementar
  os endpoints acima como parte da API do CRM.
- O software de inspeção (projeto separado) é responsável por consumir essa
  API — nenhuma lógica de inspeção deve viver neste repositório.
- Os dois projetos são independentes (repositórios/sessões diferentes) e se
  comunicam **apenas via API**, nunca por banco de dados compartilhado.

## Status
Este contrato é o ponto de partida e pode ser ajustado quando os dois lados
forem implementados. Nenhum código de API foi implementado ainda neste
repositório — este documento serve para alinhar o desenvolvimento do software
de inspeção em paralelo.
