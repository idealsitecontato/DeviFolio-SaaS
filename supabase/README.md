# Configuração do Supabase

1. Instale as dependências com `npm install` e execute o projeto com `npm run dev`. Não abra os arquivos HTML diretamente nem use um servidor estático simples: o Vite precisa carregar as variáveis `VITE_*` e empacotar o cliente Supabase.
2. Abra o SQL Editor do projeto Supabase e execute `schema.sql` uma única vez.
3. Em Authentication > URL Configuration, defina a URL publicada do site como Site URL.
4. Adicione as URLs locais e publicadas de `dashboard.html` e `cadastro.html` à lista de Redirect URLs.
5. Para login com GitHub, habilite o provedor em Authentication > Providers e configure as credenciais OAuth do GitHub.
6. Mantenha a confirmação de e-mail habilitada em produção. Nesse modo, novos usuários entram no dashboard após confirmar o endereço.

O cliente web usa somente a publishable key. Nenhuma chave `secret` ou `service_role` deve ser adicionada ao frontend.
