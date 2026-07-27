# Rede Conecta

Plataforma operacional de conexões imobiliárias com origem protegida, atendimento centralizado, CRM, gestão de parceiros, empreendimentos, corretores, negócios, recompensas e conciliação.

## Modelo operacional

- Conectores criam a própria conta e aguardam validação interna.
- A Rede Conecta aprova, suspende e administra os conectores.
- A equipe interna cadastra parceiros, empreendimentos, produtos, campanhas e corretores.
- Leads, dados pessoais, contatos, tarefas, propostas e negócios são operados exclusivamente pela Rede Conecta.
- Empreendedores e corretores acessam painéis de leitura sem dados pessoais dos leads.
- Produto, campanha, conector, consentimento e janela de proteção são imutáveis na origem.
- Vendas de parceiros são conciliadas por identificadores protegidos; divergências geram alertas de possível circunvenção.

## Recursos

- Cadastro direto e aprovação de conectores.
- Convites seguros para equipe interna, corretores e usuários de parceiros.
- RBAC granular por permissão.
- Painéis separados para equipe, conector, parceiro e corretor.
- Cadastro e publicação de empreendimentos, produtos e campanhas.
- Controle de CRECI, produtos vinculados e treinamento de corretores.
- CRM com etapas, dados protegidos, atividades, tarefas, agenda e negócio.
- Gestão de recompensas, pagamentos e extratos.
- Fila de e-mail e WhatsApp, com provedores automáticos ou fallback manual.
- Conciliação de vendas e alertas de não circunvenção.
- Auditoria, consentimentos, RLS e documentos privados.
- Estúdio de compartilhamento com mensagem personalizada e prévia oficial.

## Tecnologias

Next.js 15, React 19, Supabase PostgreSQL/Auth/Storage e Vercel.

## Desenvolvimento

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` e configure o projeto Supabase. Credenciais de Resend, WhatsApp ou webhooks são opcionais; sem elas, a fila administrativa gera links para envio manual.

## Segurança

- Sessões em cookies HttpOnly.
- Políticas RLS por registro e finalidade.
- Operações sensíveis apenas por RPCs com verificação de permissão.
- Dados pessoais de leads não são expostos a parceiros ou corretores.
- Visualizações de PII são auditadas.
- Origem do lead é protegida por trigger e não pode ser reatribuída.
- Documentos de negócio e credenciais usam buckets privados.

## Publicação

A branch `main` é a fonte de produção do projeto Vercel `conecta`. Antes do lançamento comercial amplo, valide a qualificação societária, contratos, termos, canal de privacidade, configurações de e-mail/WhatsApp e os dados da empresa responsável.
