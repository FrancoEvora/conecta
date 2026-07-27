# Rede Conecta

Versão funcional da plataforma de conexões imobiliárias da Rede Conecta.

## O que está implementado

- Landing page e catálogo público na identidade visual azul-marinho, laranja e branco.
- Convites reais por produto:
  - `/convite/SOLARIS-FRANCO-2026`
  - `/convite/PARQUE-FRANCO-2026`
  - `/convite/FUTURA-FRANCO-2026`
- Estúdio de compartilhamento em `/compartilhar/[code]`.
- Mensagem personalizada pelo conector, salva somente no aparelho.
- Assinatura oficial e não editável com origem, produto e orientação de segurança.
- Compartilhamento nativo, WhatsApp e cópia integral da mensagem com o link.
- Pré-visualização social dinâmica em PNG para WhatsApp, redes sociais e mensageiros.
- Metadados Open Graph e Twitter específicos por produto e por conector.
- Registro de compartilhamentos por canal sem armazenar o conteúdo da mensagem pessoal.
- Consentimento específico, registro do produto e do conector de origem.
- Autorização separada para investigação de outras oportunidades.
- Cadastro público de conectores.
- Autenticação com Supabase Auth.
- Painel do conector com compartilhamento funcional; CRM, empresa e administração permanecem parcialmente demonstrativos nesta etapa.
- Banco PostgreSQL real no Supabase, RLS, auditoria, campanhas, recompensas e histórico.
- Deploy automático em Next.js na Vercel.

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

A mensagem pessoal é editável, mas a assinatura de origem e segurança é montada automaticamente pela plataforma e não pode ser removida no fluxo oficial de compartilhamento.
