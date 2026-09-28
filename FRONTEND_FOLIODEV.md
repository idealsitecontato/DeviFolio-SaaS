# FolioDev — reconstrução do frontend

Especificação: `foliodev-prompt-frontend.md`. Direção: Editorial Mono, “o portfólio como documento”. Implementação em 28/09/2026.

## Fase 0 — auditoria entregue antes da implementação

- **Stack:** HTML e JavaScript em páginas independentes, Vite, CSS, Supabase JS e QRCode. A área interna usa rotas por hash.
- **Acesso:** login por e-mail usa `signInWithPassword`; cadastro usa `signUp`, confirmação de senha, mínimo de oito caracteres e `full_name`. A recuperação já usava `resetPasswordForEmail`, com retorno a `/cadastro.html#login`. Não havia uma tela de nova senha. Google já era um botão “Em breve”, sem autenticação implementada.
- **Sessão:** o cliente existente mantém `persistSession`, `autoRefreshToken`, `detectSessionInUrl` e `devifolio.supabase.auth`. O painel verifica `getSession` e redireciona visitantes sem sessão; logout e expiração continuam usando os mecanismos existentes.
- **GitHub:** login pelo servidor em `/api/auth/github/start`, callback `/api/auth/github/callback`, troca em `/api/auth/github/session`. Conexão, listagem e desconexão usam `/api/github/connect`, `/api/github/connection` e `/api/github/repos`, com o token da sessão atual. Permissões concedidas externamente não foram verificadas nesta execução.
- **Rotas:** landing, cadastro/login, dashboard, portfólio público e 404. No painel: início, portfólios, projetos, modelos, editor, GitHub, análise, Kaptei, perfil, configurações, indicação e QR Code. Publicações e Planos receberam páginas de apresentação no frontend.
- **Contratos:** `src/lib/user-data.js` continua responsável por perfil, projetos, configurações, análises, indicações e conexão GitHub. Permaneceram intactos os buckets, uploads, tabelas, colunas, RPCs e chamadas de publicação, movimentação e exclusão.
- **Organização:** pastas usam as chaves locais `devifolio_folder_names_*`, `devifolio_folder_order_*` e `devifolio_hidden_folders_*`. A localização dos projetos continua codificada no `sort_order` existente. Sidebar mantém suas chaves, limites de 180 a 320 px e ajuste proporcional à viewport.
- **Assets:** logo oficial `assets/devifolio-mark.png`, Google `assets/google-g.png`, GitHub e demais imagens na pasta `assets`. Os estilos anteriores acumulavam diversas camadas de sobrescritas.
- **Limites encontrados:** um portfólio público por conta; pastas são organização. Não há histórico de deploys, plano atual contratado ou checkout disponíveis nos contratos. Kaptei já usa dados de demonstração. Existem dez identificadores de modelos, com três disponíveis.
- **Problemas registrados:** Google ainda indisponível; checkbox de lembrar sessão sem efeito; ausência de interface de nova senha; mensagem genérica de banco para falhas de carregamento; “Seguidores” representava visitantes únicos; controle de pasta publicada não oferecia Undeploy. Foram tratados os textos e controles do frontend, sem migração ou alteração de infraestrutura.

## Implementação por fases

| Fase | Arquivos | Validação | Pendências |
|---|---|---|---|
| 1 — Fundação | `foliodev-system.css`, `foliodev-fonts.css`, `src/ui/components.js`, `assets/fonts/` | Biblioteca visual, fontes Geist, quatro larguras e compilação | Estados assíncronos dependentes da conta real |
| 2 — Autenticação | `cadastro.html`, `auth.js`, `foliodev-auth.css` | Painéis, erros por campo, teclado, mostrar/ocultar senha, recuperação, aviso Google e cancelamento GitHub | Login/cadastro reais, e-mail de recuperação, link recebido, nova senha e persistência da conta |
| 3 — App | `dashboard.html`, `dashboard.js`, `foliodev-app.css`, `plans.js`, `kaptei.js` | Apresentação das 14 páginas internas em 360/768/1280/1920; nove testes existentes de organização; proteção real sem sessão | GitHub autenticado, gravações, arraste com persistência no servidor, Deploy/Undeploy e uploads |
| 4 — Landing | `index.html`, `script.js`, `foliodev-landing.css` | Quatro larguras, FAQ por teclado, menu, pausa e movimento reduzido, indicação preservada, zero chamadas Supabase/API | Comparação de desempenho em produção |
| 5 — Público/erro | `portfolio.html`, `portfolio-page.js`, `404.html`, `foliodev-public.css` | Estado real de portfólio indisponível, 404, apresentação dos três modelos, foto redonda e metadados | Página publicada real, edição do proprietário e confirmação de previews nas redes sociais |
| 6 — Polimento | Ajustes nos arquivos acima; imagens WebP; `public/assets/devifolio-mark.png`; este relatório | Build, console, imagens, contratos e revisões finais responsivas | Aceite dos fluxos autenticados com acesso real disponível |

As avaliações foram reduzidas de aproximadamente 8 MB para 12 KB no total. Os originais foram preservados. A logo em `public/assets/devifolio-mark.png`, usada pelo compartilhamento, é uma cópia byte a byte da logo oficial.

## Decisões e comportamentos

- Tokens do documento, Geist Sans/Mono, branco/cinza, ação principal preta, bordas finas e raios de 8/12/16 px. Azul reservado à marca, foco e seleção. Verde suave para Deploy, amarelo para disponibilidade futura e laranja para desenvolvimento.
- Navegação interna reorganizada, conta no topo, sidebar redimensionável, drawer mobile, visualização grade/lista, lápis de edição e “Salvar Perfil”.
- Publicações apresenta o estado atual e a URL copiável. Não inventa datas ou histórico. Planos mantém IDs, preços e recursos existentes, com assinaturas ainda em breve.
- A recuperação usa a mesma chamada e o mesmo redirect existentes. A nova senha usa o `updateUser` já disponível; o Supabase continua responsável pela sessão e pelo processamento do link. Não há parsing próprio de tokens, novos callbacks ou mudanças de configuração.
- Landing usa os componentes reais com exemplos locais e selecionáveis. Não usa screenshots de interface, dados de contas reais ou chamadas ao Supabase. Avaliações e Kaptei identificam explicitamente os exemplos.
- Foto pública centralizada e redonda, projetos em quadros e marca discreta no rodapé. Os controles do proprietário continuam ligados aos handlers existentes.
- Metadados gerais existem no HTML. Nome, descrição e foto do perfil são atualizados no navegador; personalização para robôs que não executam JavaScript dependeria de trabalho fora deste escopo exclusivamente frontend.

## Evidências e limites dos testes

- `npm run build`: aprovado.
- `node --test tests/project-location.test.js`: 9/9 aprovados, incluindo organização, recuperação da ordem e rollback. Esses testes não validam a gravação real em Supabase.
- Revisão de diferenças: nenhum arquivo em `src/lib`, `api`, `server`, `supabase`, configuração ou dependências foi alterado. As variáveis de ambiente não foram modificadas.
- Comparação dos identificadores técnicos de autenticação, API, sessão e armazenamento: nenhum identificador existente removido ou renomeado.
- Navegador real, sem sessão: nove rotas internas redirecionam para login; estados públicos e de acesso carregam sem erros de execução ou recursos quebrados.
- Apresentações em 360, 768, 1280 e 1920 px: sem transbordamento. As páginas internas e os modelos públicos foram também revisados como componentes com dados locais, sem importar ou substituir o Supabase, sem criar sessão e sem executar gravações.
- FAQ, mostrar senha e menu da landing: teclado verificado. Carrossel: pausa e preferência de movimento reduzido verificadas. Nenhuma chamada Supabase/API na landing.
- Não foi possível acessar a sessão da conta de teste no navegador do usuário. Não foram criados usuários, usadas credenciais inventadas, enviados e-mails de teste ou substituídos fluxos reais por mocks. Os testes que precisam dessa sessão continuam pendentes.

## Checklist de aceite da especificação

- [x] Nenhum arquivo de backend/Supabase/env/migration foi alterado.
- [ ] Login (e-mail e Google), cadastro, logout, recuperação de senha e persistência de sessão funcionam — testes da conta real pendentes; Google já era “Em breve”.
- [x] Rotas autenticadas continuam protegidas — verificado sem sessão em nove rotas.
- [ ] GitHub conecta, lista e vincula repositórios como antes — contratos preservados, teste autenticado pendente.
- [ ] Criar, editar, mover (drag and drop), publicar e despublicar continuam funcionando — testes de organização passam; validação real de persistência pendente.
- [x] Marca “FolioDev” e logo oficial consistentes nas telas, títulos e metadados revisados.
- [x] Nenhum identificador técnico foi renomeado por engano.
- [ ] Todas as telas têm estados de loading, vazio, erro e sucesso — interfaces implementadas; respostas reais de sucesso/erro autenticadas não verificadas.
- [x] Sem gradientes decorativos, glow, blobs ou glassmorphism nos novos estilos. O fade lateral do carrossel segue a exceção da especificação.
- [ ] Responsivo (360, 768, 1280, 1920) e navegável por teclado — quatro larguras e controles públicos verificados; aceite completo do teclado na área autenticada pendente.
- [ ] Console sem erros novos; build de produção passa; sem regressão de performance perceptível — console e build aprovados; comparação em produção pendente.
- [x] Landing usa componentes reais do sistema como preview, sem screenshots estáticas.

As caixas pendentes representam ausência de comprovação, não autorização para alterar a infraestrutura. Backend, OAuth, sessão, tokens, callbacks, endpoints, identificadores, chaves e dependências permanecem preservados.
