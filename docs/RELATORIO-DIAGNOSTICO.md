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

Portão da fase 1: aguardando push e prova do SHA público, ou documentação de eventual bloqueio externo.
