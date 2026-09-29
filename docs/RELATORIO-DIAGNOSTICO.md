# Relatório de Diagnóstico — FolioDev

## Fase 1 — causa raiz comprovada

Os pushes foram enviados para `ajuste-visual-frontend`, mas a Vercel publica `main`; além disso, os previews falhavam porque as duas variáveis públicas obrigatórias do Supabase existiam somente em Production.

Evidências coletadas em 29/09/2026:

- `git ls-remote origin`: revisão `8f9226f7c9e820fd6ca6cf374bf70878bcf81956`; main `a123fcfe2c7672ef843a1d941ebaba4a76911b8c`.
- API Vercel `/v9/projects/prj_IjEiVkDfoRYPbOLaJ7hIOVgvcn5X`: `link.productionBranch=main`. Domínio de produção ligado a `dpl_6XW673ar5114RE35bA1X8gfHg5br`, SHA `a123fcf`.
- `vercel inspect ...fpxzucg57... --logs`: clone da branch de revisão no SHA `8f9226f`, seguido de `Configuração obrigatória ausente: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY` e exit 1.
- `vercel env ls`: sete variáveis existentes, todas somente em Production. Valores secretos não foram expostos.
- Webhook funciona: o push produziu deployment Preview, com autor reconhecido como `idealsitecontato`.
- `curl -I`: HTTP 200, `Cache-Control: public, max-age=0, must-revalidate`; domínio aponta para o deployment de main. Não há Service Worker nem diretórios compilados versionados. A idade do cache não é a causa raiz.
- Um único lockfile; nenhum stash, submódulo, conflito de nomes por maiúsculas/minúsculas ou arquivo ativo ignorado. Arquivos não versionados existentes pertencem a revisões anteriores e foram preservados.
- Build local e nove testes iniciais passaram; `npm audit` reportou zero vulnerabilidades.

Correções de código: preset Vite, `npm ci`, build e saída `dist` explícitos; meta `build-sha` em todas as páginas e `/version.json` sem cache. O SHA é injetado pelo ambiente Git da Vercel, com fallback local para Git. A verificação de ambiente permanece obrigatória.

Fluxo definitivo: revisar/validar na branch de trabalho e enviar os commits aprovados a `main` com atualização fast-forward, sem force push. Apenas enviar a branch de revisão não publica o domínio de produção.

Preview: configurar as duas variáveis públicas no escopo Preview. OAuth de preview exige aplicativo GitHub próprio e callback correspondente; não copiar os segredos de produção para callbacks diferentes.

Portão da fase 1: **cumprido antes de alterar o visual**. Commit `9c25d969b7cadb5e3a79d5d6c40e53ef25decf92`, push fast-forward a main e revisão, Production e Preview READY. O domínio público respondeu HTTP 200 em `/version.json`, `Cache-Control: no-store`, com esse mesmo SHA; o HTML também contém a meta correspondente. Evidências em `phase1-version.json` e `phase1-version-headers.txt`. As duas variáveis públicas foram habilitadas em Preview preservando seus valores; os segredos permaneceram somente em Production.

## Fase 2 — revisão geral, antes do visual

Problemas e correções:

1. Não existiam comandos de lint, tipos ou testes no package.json: adicionados ESLint, TypeScript e comandos reproduzíveis. O projeto é JavaScript; o TypeScript valida resolução/sintaxe dos módulos legados, com checagem de tipos completa nos novos módulos marcados `@ts-check`.
2. OAuth aceitava o e-mail público do perfil GitHub sem consultar sua verificação: agora exige a lista de e-mails verificados, com escopo `user:email` na autorização.
3. Troca do ticket de sessão sem validação de Origin: validação adicionada, além dos cookies HttpOnly/Secure/SameSite e tickets criptografados já presentes.
4. Perfis locais do navegador apareciam como não versionados: ignorados para prevenir envio de dados privados.
5. Google era somente uma mensagem “Em breve”; persistência era sempre localStorage, sem checkbox; aceitação de termos ausente. Correções funcionais preparadas em módulo separado e integração programada na Fase 3, junto dos controles exigidos pelo prompt.

Não há autenticação própria por senha no servidor: e-mail/senha usam o Supabase Auth, que valida e aplica rate limits no serviço. Os endpoints GitHub usam validação de sessão e state criptografado. O RLS existente restringe escritas por auth.uid(); tokens GitHub ficam cifrados, inacessíveis ao cliente. Rate limits reais e provedores dependem da configuração do Supabase; não foram substituídos por limitadores de memória em funções distribuídas.

Os arquivos de revisões anteriores e o diretório guio-service não versionado foram preservados. Não foi feita migração de framework, alteração de planos, dados ou IDs do dashboard.

6. O lint encontrou nove declarações/funções sem uso, incluindo um fluxo antigo de geração de QR/link: removidos somente trechos sem chamadas. O handler ativo de QR/download, as rotas, o banco e a apresentação do dashboard não mudaram.

Consulta real a `/auth/v1/settings` retornou HTTP 200, e-mail habilitado, `google=false`, signup habilitado e confirmação automática de e-mail. GitHub usa os endpoints próprios existentes, por isso o indicador `github=false` no Supabase não desativa esse fluxo. Google requer habilitação externa e credenciais próprias; não há credenciais Google fornecidas.

Portão da fase 2: **cumprido** com lint sem erros/warnings, `tsc --noEmit` limpo, 11 testes passando, build limpo e audit com zero vulnerabilidades. Commit da revisão concluído antes de alterar HTML/CSS da landing ou autenticação. A integração dos controles novos ocorrerá na fase visual; a configuração externa do Google está documentada.
