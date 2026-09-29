# Projeto CRM — Contexto

## Status atual
Repositório iniciado, ainda sem código de aplicação — este documento registra o
que foi combinado até agora para dar continuidade em qualquer sessão futura.

- **Repositório:** `lrochaducioni2-cmd/claude-phone-`
- **Branch de desenvolvimento:** `claude/crm-project-k92ynn`

## Objetivo do projeto
CRM (Customer Relationship Management) para gestão de relacionamento com
clientes.

## Funcionalidades planejadas para o MVP
- Cadastro e gestão de contatos/leads
- Pipeline de vendas (kanban)
- Tarefas / follow-ups
- Autenticação de usuários

## Stack
Ainda não definida. Direção provável: web app full-stack (frontend + backend
+ banco de dados), com deploy que permita acesso via link (inclusive pelo
celular).

## Decisões pendentes
- Escolha final da stack técnica
- Priorização das funcionalidades
- Hospedagem/deploy para acesso público via link

## Próximo passo combinado
Criar um protótipo navegável do CRM com link acessível, para o usuário testar
(inclusive pelo celular).

## Projetos relacionados
Existe um segundo software, maior que este CRM, para **execução do serviço
de inspeção**. Será desenvolvido em uma sessão/repositório separado (projeto
maior). Os dois sistemas vão se comunicar via API: o CRM cadastra empresa e
fecha a venda; o software de inspeção puxa esses dados para executar o
trabalho e devolve o status de entrega ao CRM.

O contrato dessa integração (entidades, endpoints, fluxo de status) está
detalhado em [`INTEGRACAO.md`](./INTEGRACAO.md) — leia esse arquivo antes de
implementar a API do CRM ou o consumo dela pelo software de inspeção.
