# Templates de autenticação — Rede Conecta

## Confirmação de e-mail

**Assunto recomendado:** `Confirme seu e-mail | Rede Conecta`

Arquivo: `confirmation.html`

Aplicação no Supabase:

1. Authentication → Email Templates → Confirm signup.
2. Substituir o conteúdo pelo HTML de `confirmation.html`.
3. Definir o assunto recomendado.
4. Salvar.

## Recuperação de senha

**Assunto recomendado:** `Recupere seu acesso | Rede Conecta`

Arquivo: `recovery.html`

Aplicação no Supabase:

1. Authentication → Email Templates → Reset password.
2. Substituir o conteúdo pelo HTML de `recovery.html`.
3. Definir o assunto recomendado.
4. Salvar.

## Observações

- Os templates usam apenas HTML e CSS compatíveis com os principais clientes de e-mail.
- Não dependem de imagens externas para exibir a marca.
- A confirmação usa `{{ .TokenHash }}` e `{{ .SiteURL }}` para a rota própria da aplicação.
- A recuperação usa `{{ .ConfirmationURL }}` gerada pelo Supabase.
- O cadastro de conectores está configurado para confirmação administrativa pelo backend; o template de confirmação permanece aplicável a outros fluxos que exijam validação de e-mail.
