# Configuração do Supabase

1. Abra o SQL Editor do projeto Supabase e execute `schema.sql` uma única vez.
2. Em Authentication > URL Configuration, defina a URL publicada do site como Site URL.
3. Adicione as URLs locais e publicadas de `dashboard.html` e `cadastro.html` à lista de Redirect URLs.
4. Para login com GitHub, habilite o provedor em Authentication > Providers e configure as credenciais OAuth do GitHub.
5. Mantenha a confirmação de e-mail habilitada em produção. Nesse modo, novos usuários entram no dashboard após confirmar o endereço.

O cliente web usa somente a publishable key. Nenhuma chave `secret` ou `service_role` deve ser adicionada ao frontend.
