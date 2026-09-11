# Configuração do Supabase

1. Instale as dependências com `npm install` e execute o projeto com `npm run dev`. Não abra os arquivos HTML diretamente nem use um servidor estático simples: o Vite precisa carregar as variáveis `VITE_*` e empacotar o cliente Supabase.
2. Em um projeto novo, abra o SQL Editor do Supabase e execute `schema.sql` uma única vez. Em um projeto que já possua o schema anterior, execute `migrations/20260911_real_portfolios.sql`; a migração é idempotente e pode ser reaplicada com segurança.
3. Em Authentication > URL Configuration, defina a URL publicada do site como Site URL.
4. Adicione as URLs locais e publicadas de `dashboard.html` e `cadastro.html` à lista de Redirect URLs.
5. Para login com GitHub, habilite o provedor em Authentication > Providers e configure as credenciais OAuth do GitHub.
6. Em Authentication > Sign In / Providers > Email, desative **Confirm email** para que o cadastro gere uma sessão imediatamente.

## Variáveis no ambiente publicado

O arquivo `.env.local` é propositalmente ignorado pelo Git e não acompanha clones ou deploys. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` também no painel do serviço que executa o build. Depois de alterar essas variáveis, gere um novo build; reiniciar apenas o navegador não atualiza valores Vite.

Este projeto usa cadastro com acesso imediato. Em Authentication > Sign In / Providers > Email, a opção **Confirm email** deve permanecer desativada (`mailer_autoconfirm: true`).

O cliente web usa somente a publishable key. Nenhuma chave `secret` ou `service_role` deve ser adicionada ao frontend.
