# Rede Conecta

Primeira versão funcional da plataforma de conexões imobiliárias da Rede Conecta.

## O que está implementado

- Landing page e catálogo público na identidade visual azul-marinho, laranja e branco.
- Convite real por produto: `/convite/SOLARIS-FRANCO-2026`.
- Consentimento específico, registro do produto e do conector de origem.
- Autorização separada para investigação de outras oportunidades.
- Cadastro público de conectores.
- Autenticação com Supabase Auth.
- Painéis demonstrativos de conector, CRM comercial, empresa e administração.
- Banco PostgreSQL real no Supabase, RLS, auditoria, campanhas, recompensas e histórico.
- Deploy em Next.js na Vercel.

## Tecnologias

Next.js 15, React 19, Supabase e Vercel.

## Desenvolvimento

```bash
npm install
npm run dev
```

Variáveis recomendadas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=
CONNECTION_HASH_SECRET=
```

## Critério central

A conexão começa por um produto específico. Somente após falta de aderência e autorização separada o especialista poderá investigar outras necessidades. A origem nunca é apagada.
