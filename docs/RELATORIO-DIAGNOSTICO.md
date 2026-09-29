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

## Fase 3 — implementação e decisões documentadas

- Hero reconstruída em HTML/CSS: navbar flutuante, três linhas do título, CTAs, foto com transparência ancorada na base, quatro cards independentes, spinner e entrada sequencial. As referências ficam somente em docs/referencias. Apenas a mulher foi extraída como asset; a imagem inteira nunca é servida como página ou fundo.
- SVGs separados para FolioDev, Google, GitHub e Kaptei; fotografia WebP em 480/880/1200 px com srcset e dimensões. As regiões ocultas pelos cards da referência foram removidas da máscara e ficam sob os cards reais.
- Login e Cadastro compartilham AuthLayout, AuthInput, AuthButton, SocialButton e Logo, renderizados no HTML pelo Vite. Divisão 50/50 no desktop; formulário central e painel azul oculto em telas menores.
- Persistência real por checkbox: storage do Supabase alterna entre localStorage e sessionStorage, migra tokens/PKCE ao trocar a opção e remove tokens dos dois locais no logout. O navegador mantém sessionStorage durante a sessão; o fechamento da sessão encerra essa persistência conforme comportamento do navegador.
- Cadastro exige nome, e-mail, senha com letras/números, confirmação e termos. Validação tanto no formulário quanto no novo endpoint /api/auth/signup; aceite datado registrado em metadados no cadastro por e-mail. Recuperação e redefinição existentes preservadas, com mensagens em pt-BR e resposta de recuperação sem enumeração de contas.
- Google usa signInWithOAuth do Supabase e verifica o provedor antes de redirecionar. Como está desabilitado no projeto, exibe uma mensagem no formulário. GitHub mantém o OAuth próprio, cookies seguros e callback existente. As rotas privadas continuam verificando a sessão.
- Termos e Privacidade agora são páginas acessíveis, com links reais. Navbar, FAQ, menu móvel, estados de foco e âncoras foram verificados. Landing inclui funcionalidades, etapas, integrações, captura de leads, preços, FAQ, CTA e footer. Valores e disponibilidade dos planos vêm do módulo existente.
- Kaptei continua identificado como demonstração; +20 descreve expansão. A landing não passa a prometer uma integração que o backend não oferece. A seção de leads direciona aos recursos de contato existentes; não foi criado um backend fictício de captura.
- CSS antigo da landing/autenticação foi substituído e suas importações isoladas das telas internas. Arquivos históricos sem uso compartilhados com outras telas não foram apagados indiscriminadamente.

### Medições e fonte

A imagem prevaleceu sobre valores aproximados do prompt: cantos da Hero #0072F6, região central #067CFE, painel do Login #046EFF, faixa inferior #F8FCFF e verde superior do card +20 #0C8D5C. Valores e regiões estão em comparativos/medidas.json. Os textos adicionais abaixo do recorte da referência receberam cores mais escuras para cumprir contraste acessível.

Foram renderizadas Google Sans, Plus Jakarta Sans, Outfit, Figtree, DM Sans e Manrope no mesmo título/parágrafo. Google Sans, já disponível no projeto, foi a mais próxima no desenho de j/f/ç/ó, e permanece global com font-display: swap. A prancha comparativos/comparacao-fontes.png documenta a escolha. O cadastro segue o layout de Login porque não há imagem de cadastro no ZIP.

### Comparação automatizada

Playwright/Edge capturou Hero em 1512×801 e Login em 1456×816. As referências foram normalizadas diretamente para esses canvases; as capturas implementadas não foram retocadas. Pixelmatch, threshold 0,1, com antialiasing excluído, encontrou **6,172%** de pixels diferentes na Hero e **2,662%** no Login. Isso é uma contagem de pixels pelo algoritmo, não uma porcentagem de qualidade nem prova de identidade.

Diferenças restantes: métricas de alguns glifos, brilho/sombras rasterizados da referência versus CSS, reconstrução vetorial dos símbolos e bordas da máscara da foto. Os campos vazios e o botão de mostrar senha são diferenças funcionais previstas no prompt. Não se declara o requisito de diferença imperceptível integralmente atingido.

| Comparação | Lado a lado | Diferença |
|---|---|---|
| Hero | [Referência / implementação](comparativos/hero-lado-a-lado.png) | [Mapa pixelmatch](comparativos/hero-diferenca.png) |
| Login | [Referência / implementação](comparativos/login-lado-a-lado.png) | [Mapa pixelmatch](comparativos/login-diferenca.png) |

## Fase 4 — validação e limites verificáveis

- Build, ESLint sem warnings, TypeScript e **12 testes** passaram; npm audit: **zero vulnerabilidades**.
- **32 resultados** no navegador: Hero/Login/Cadastro, sete rotas em 375/768/1280/1920 px, imagens/âncoras, menu por teclado, FAQ, visibilidade da senha, recuperação, troca de formulários, termos, rejeição de senhas diferentes, redirecionamento de dashboard sem sessão e aviso do Google desabilitado. Zero pageerrors e zero requests falhadas nessa navegação. Evidência: comparativos/verificacao-browser.json.
- Lighthouse 13.5, perfil móvel padrão, preview do build: **Performance 99, Acessibilidade 100, SEO 100**. No domínio de **produção: Performance 100, Acessibilidade 100, SEO 100**. Evidências completas: comparativos/lighthouse-landing.json e comparativos/lighthouse-producao.json. A primeira execução encontrou contraste insuficiente nos textos adicionados abaixo da Hero e robots.txt ausente; ambos corrigidos. As notas são do cenário medido, não garantia em toda conexão.
- A navegação com 32 resultados foi repetida no domínio público, com zero pageerrors e requests falhadas. As capturas da produção reproduziram os mesmos resultados visuais do build local; os comparativos entregues são da produção.
- Publicação da aplicação comprovada no commit **467e549a9560fe4f8b24551122e7ef635fea8283**: /version.json HTTP 200/no-store e meta build-sha iguais. OAuth GitHub retorna 302 para github.com com callback correto, escopo read:user user:email e cookie HttpOnly/Secure/SameSite=Lax. Cadastro inválido retorna 422, método GET retorna 405 e Origin externo retorna 403; nenhuma conta criada. Registro em [publicacao-final.json](publicacao-final.json). A revisão posterior contém somente documentos/scripts de verificação; seu SHA também será conferido no domínio após o push.
- Não há conta de teste fornecida nem sessão autenticada acessível. Login bem-sucedido, recuperação recebida por e-mail e conclusão interativa do consentimento GitHub não foram comprovados nesta execução. Não foram criados usuários fictícios no banco.
- Google está desabilitado no provedor; o checklist de três métodos de autenticação funcionando integralmente permanece pendente dessa configuração e de um teste com conta real.

### Passos manuais restantes — somente Google e validação autenticada

1. No Supabase, abra o projeto usado em VITE_SUPABASE_URL → Authentication → Sign In / Providers → Google e habilite o provedor.
2. No Google Cloud → Google Auth Platform → Clients, configure OAuth Client ID do tipo Web application. Authorized JavaScript origins = https://devi-folio-saa-s.vercel.app. Authorized redirect URIs = https://mzawmkfdjceaqiicjinz.supabase.co/auth/v1/callback. Configure também Audience, Branding e os escopos openid, userinfo.email e userinfo.profile.
3. Informe Client ID e Client Secret nos campos do provedor Google no Supabase e salve. O segredo fica no provedor, nunca numa variável VITE_ ou no Git.
4. Supabase → Authentication → URL Configuration: Site URL = https://devi-folio-saa-s.vercel.app. Em Redirect URLs, inclua os três destinos usados pelo código: https://devi-folio-saa-s.vercel.app/dashboard.html#inicio; https://devi-folio-saa-s.vercel.app/dashboard.html?onboarding=1#inicio; https://devi-folio-saa-s.vercel.app/cadastro.html#redefinir. Para previews, cadastre somente os domínios de teste desejados.
5. Execute login por e-mail, Google e GitHub com sua conta; verifique dashboard, sair, recuperação e persistência com a opção marcada/desmarcada.

Não há ação manual pendente de DNS, branch ou variáveis públicas para atualizar a produção: o problema de deploy foi corrigido e validado na Fase 1.

Configuração conferida nas documentações oficiais de [Google no Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google) e [URLs de retorno](https://supabase.com/docs/guides/auth/redirect-urls). A disponibilidade e a allowlist externas devem ser confirmadas no painel; credenciais administrativas do Supabase/Google não estão disponíveis nesta sessão.

### Como evitar a recorrência e verificar uma publicação

O domínio de produção acompanha main. Um push apenas para ajuste-visual-frontend publica Preview. Antes de enviar a main, execute npm ci, npm run lint, npm run typecheck, npm test e npm run build. Após o push, espere Production READY e compare git rev-parse HEAD com https://devi-folio-saa-s.vercel.app/version.json; confira também a meta build-sha no HTML. /version.json usa no-store, e os assets compilados têm nomes com hash. O registro da publicação final será anexado em docs/publicacao-final.json.

## Arquivos e commits

Lista completa com resumo por arquivo: [ARQUIVOS-ALTERADOS.md](ARQUIVOS-ALTERADOS.md). Os commits respeitam a sequência: 9c25d96 (deploy), 28aea0f (revisão), 467e549 (front-end), seguido do registro de validação. Os arquivos não versionados que já existiam, inclusive guio-service, não foram publicados nem apagados.
