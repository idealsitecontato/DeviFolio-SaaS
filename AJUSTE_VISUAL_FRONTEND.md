# Ajuste visual do frontend FolioDev

Especificação: `prompt-codex-ajuste-frontend-foliodev.md`, as cinco capturas anexadas e `FolioDev_logos(2).zip`, fornecidos em 29/09/2026. Branch de entrega: `ajuste-visual-frontend`. Base: `a123fcf`.

## Reabertura da revisão — versão publicada e sessão real

Após o relato de que as alterações não apareciam, o frontend local e o endereço `https://devi-folio-saa-s.vercel.app` foram abertos no navegador. O endereço publicado ainda mostra a logo anterior; o HTML não tem o novo asset do ZIP nem o nome “Portifólios e Projetos”. A implantação de produção é da branch `main`, publicada em 28/09/2026. O push da branch de revisão não a substituiu.

O preview da branch `ajuste-visual-frontend`, commit `cf4c242`, falhou no build por ausência de `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. A listagem de configurações confirmou que as sete variáveis do projeto existem somente em Production. Nenhum valor, escopo de variável ou configuração de backend foi modificado para contornar a falha.

Correções adicionais de apresentação nesta revisão:

- Modelos passa a ter cinco colunas também entre 1201 e 1440 px. Nessa faixa, o rodapé do card usa duas linhas para preservar os textos e botões; a grade tem largura máxima para evitar crescimento dos cards em monitores maiores.
- Organização e próximos passos do Início ficam numa seção recolhível abaixo dos projetos. Os controles e seus handlers continuam presentes.
- O acesso GitHub e a explicação sobre publicação nas pastas ficam numa seção recolhível, reduzindo a presença de conteúdo ausente da referência sem remover o acesso funcional.

Build local e os nove testes existentes passaram após essas correções. Os atalhos recolhíveis foram exercitados por teclado e seus botões aparecem ao abrir. A comparação visual de componentes e a validação pública foram repetidas; elas **não comprovam o resultado das cinco telas com uma conta autenticada**.

O frontend local está em `http://127.0.0.1:5173`. Um transporte temporário de desenvolvimento, fora dos arquivos versionados, encaminha `/api` para os endpoints reais já existentes do mesmo projeto; foi confirmada a mesma URL de Supabase nos frontends local e publicado. As APIs responderam com JSON e 401 sem sessão, conforme esperado. Não há mocks de dados, login ou API nesse servidor.

Os perfis de teste disponíveis redirecionaram para login. O acesso à aba existente pelo conector falhou com erro de ACL do ambiente. Uma janela interativa de revisão foi aberta para login na conta existente, sem pedir ou ler senha pelo chat. A verificação visual autenticada das cinco telas e dos repositórios reais está pendente dessa sessão; o aceite integral permanece em aberto.

Também foi preparado um build completo da Vercel com as configurações de produção já existentes, sem editar variáveis. A tentativa de disponibilizá-lo num endereço separado, sem promoção do domínio, foi bloqueada pela revisão automática: o pedido autorizou commit/push da branch, mas não publicação externa. O usuário escolheu manter a revisão somente no ambiente local; nenhum novo deployment foi criado. Em seguida, solicitou commit e push das correções locais, mesmo com a validação autenticada pendente. A revisão visual real das cinco telas continua em aberto e não é considerada concluída pelo envio da branch.

## Auditoria e medidas antes da implementação

- Projeto existente: HTML, JavaScript e Vite. Não há troca de framework ou dependências.
- Login, sessão, recuperação, OAuth, queries, endpoints e persistência permanecem nos módulos atuais. As alterações se limitam a HTML de apresentação, CSS, imagens, fontes e textos visíveis.
- As referências anexadas correspondem aos cinco arquivos citados no MD. Foram abertas integralmente antes das alterações; os caminhos temporários do chat foram usados como fonte das imagens.
- Sidebar nas capturas: aproximadamente 205–227 px, mantendo largura ajustável. Barra superior: 52 px. Conteúdo das telas comuns: aproximadamente 1110 px; contêiner de 1200 px com padding lateral de 40 px.
- Títulos: 32 px; subtítulos: 14 px; botões: 44 px; bordas dos cards: 12 px; gaps: 18 px. Google Sans hospedada localmente, com licença oficial.
- Início: métricas de 104 px, dupla de cards de aproximadamente 653/440 px e altura de 321 px, projetos em toda a largura abaixo.
- Planos: quatro colunas, cards de aproximadamente 267 × 542 px e gap de 14 px.
- GitHub: conta conectada com 94 px de altura; repositórios carvão com aproximadamente 66 px de altura, raio de 16 px e gap de 20 px.
- Portifólios e Projetos: coluna de pastas com 212 px, cards com cerca de 86 px de altura; painel vazio com 460 px de altura.
- Modelos: cinco colunas no desktop, cards com cerca de 226 px de altura, previews com proporção de 235 × 142 px; duas colunas no tablet e uma no celular.

## Limites identificados

- A logo do ZIP tem um símbolo F; as capturas têm um símbolo diferente. A exigência de usar o asset oficial prevalece. Os bytes das imagens são preservados. O CSS enquadra a área do wordmark sem distorcer ou alterar o arquivo.
- O catálogo existente contém 10 modelos, com 3 disponíveis. A captura mostra 15 e outro catálogo. IDs, nomes de dados, disponibilidade e fluxo de aplicação são preservados.
- “Modelos” acima de “Perfil” e “Portifólios e Projetos” são alterações expressas do MD, embora as capturas mostrem outra ordem e outro título.
- As cores dos planos seguem a aparência das imagens, conforme a cláusula de prioridade visual do MD: cinza claro e azul mais saturado que os hexadecimais do texto.
- Dados de usuários, métricas, pastas e repositórios continuam vindo do sistema. Exemplos usados apenas em renderização local de componentes não substituem autenticação, dados ou APIs e não integram o produto.

## Etapas e verificações

### Logo, fonte e sidebar

Arquivos: `assets/brand/*`, `public/assets/brand/*`, `assets/fonts/google-sans-latin.woff2`, `assets/fonts/Google-Sans-OFL.txt`, `foliodev-fonts.css`, `foliodev-system.css`, `foliodev-dashboard-visual.css`, `foliodev-landing.css`, `foliodev-public.css`, `index.html`, `cadastro.html`, `dashboard.html`, `404.html`, `portfolio.html`, `portfolio-page.js`, `src/ui/components.js`.

Verificado: integridade dos assets em relação ao ZIP; ordem dos links e conservação das rotas; carregamento real das páginas públicas e proteção do painel sem sessão. Pendência: teste com conta autenticada, pois o acesso ao navegador existente falhou.

### Início

Arquivos: `dashboard.js`, `foliodev-dashboard-visual.css`.

Alterações: métricas seguidas de importação GitHub e compartilhamento/QR lado a lado, com projetos em toda a largura. Os atalhos de organização e próximos passos continuam disponíveis abaixo. Nenhum contador ou endereço de exemplo foi colocado no produto.

Verificado: comparação visual em 1800 × 873 px, métricas em y=193 px, cards em y=315 px com altura de 321 px, projetos em y=654 px; os alinhamentos principais diferem da captura em aproximadamente 1–2 px. Renderização dos componentes existentes em 360, 768, 1280 e 1920 px, sem erros ou overflow horizontal. Pendência: cópia e download do QR com a conta real e fluxos autenticados.

### Planos

Arquivos: `dashboard.js` (classe de apresentação), `foliodev-dashboard-visual.css`.

Alterações: quatro cards de 542 px, espaçamento de 14 px, cinza claro, azul saturado e gradiente azul/preto, preços alinhados e botões de 41 px. O arquivo `plans.js`, os valores e os botões desabilitados não mudaram.

Verificado: comparação visual em 1798 × 875 px; primeiro card em x=459,5/y=236,2 px, largura de 267,5 px e altura de 542 px, praticamente coincidindo com a referência. As cores foram comparadas com pixels da captura; o último gradiente foi ajustado à aparência da imagem. Pendência: não há checkout ativo para testar, conforme o comportamento já existente.

### GitHub

Arquivos: `dashboard.js` (markup do estado conectado), `foliodev-dashboard-visual.css`.

Alterações: conta conectada com ícone oficial existente, repositórios carvão, ícones brancos e chips de visibilidade derivados de `repository.private`. Checkbox, importação, menu, paginação, sincronização, desconexão e estados de erro continuam nos mecanismos originais. A seleção aparece ao passar o mouse, ao focar ou ao selecionar; em telas pequenas permanece visível.

Verificado: renderização isolada do estado conectado em 1787 × 880 px, sem importar Supabase/API; conta em y=196,8 px/94 px de altura, painel em y=312,8 px/270,4 px de altura e linhas com 66 px. Pendência: conexão, importação, sincronização e desconexão com a conta real, pois não há sessão de teste acessível ao agente.

### Portifólios e Projetos

Arquivos: `dashboard.js` (título e renderização), `foliodev-dashboard-visual.css`.

Alterações: nome exato exigido pelo MD, coluna de pastas de 212 px, cards de 86 px, pastas amarelas e painel de projetos de 886 × 460 px. A rota `portfolio`, atributos de drag/drop, dados de localização, menus e animação da pasta permanecem. O atalho GitHub e a explicação sobre pastas foram mantidos, embora não apareçam na captura.

Verificado: comparação em 1805 × 871 px; conteúdo em x=451 px, painel em x=685/y=267,2 px e altura de 460 px. Pendência: mover, persistir e publicar projetos da conta real; a renderização isolada não comprova essas operações.

### Modelos

Arquivos: `dashboard.js` (card), `foliodev-dashboard-visual.css`.

Alterações: previews de cor sólida, sem texturas; cards de aproximadamente 267 × 225 px; cinco colunas no desktop de referência. Responsividade: três colunas entre 1201–1440 px, duas até 1200 px, uma até 640 px. Os 10 IDs e os 3 modelos disponíveis continuam exatamente no catálogo original. Aplicar, pré-visualizar, modal e carregamento usam os handlers anteriores. Os templates publicados e seus assets não foram alterados.

Verificado: comparação em 1672 × 941 px; grade em x=244/y=170,8 px, previews de aproximadamente 233 × 141 px. Testados os 10 botões, 7 indicadores de bloqueio e abertura/fechamento do modal original em renderização isolada. Pendência: aplicar/persistir modelo com a conta real. A referência tem 15 modelos, nomes, cores e ordem diferentes; não foram criados modelos artificiais.

## Verificação final

- Build Vite concluído sem erros.
- Cinco telas em 320, 360, 768, 1024, 1280, 1672 e 1800 px: nenhuma imagem quebrada, erro JavaScript ou scroll horizontal. Estados com projetos também renderizados.
- Sidebar: os controladores originais foram exercitados em renderização isolada, incluindo recolher/expandir, redimensionar por mouse e teclado, persistir a largura local, abrir conta e abrir/fechar o menu no celular.
- Seleção de repositórios por mouse e teclado, rótulos público/privado, modal de modelos e botões de planos desabilitados verificados em componentes isolados.
- Páginas reais: landing, login, cadastro, recuperação, redefinição sem token, 404 e estado público sem username. Sem erros e imagens quebradas nas larguras de 360, 768, 1280 e 1920 px. Validação de campos vazios, mostrar senha e acesso à recuperação verificados. Nove rotas protegidas redirecionaram corretamente para o login sem sessão.
- A suíte existente de localização de projetos passou nos 9 testes. Esses testes não comprovam persistência na conta real.
- Comparação de código com `a123fcf`: `auth.js`, `src/lib/*`, `api/*`, `server/*`, `supabase/*`, planos, dependências e configuração não foram alterados. No dashboard, mudaram somente cinco funções de apresentação e o texto do breadcrumb/título. Os handlers e chamadas reais permanecem iguais.

## Checklist de aceite — somente verificações realizadas

- [x] Logos extraídas do ZIP, com os mesmos bytes e proporção preservada; nenhuma logo antiga nas páginas ativas.
- [x] Nome FolioDev, GitHub preto na sidebar e Modelos imediatamente acima de Perfil.
- [x] Estrutura e medidas das cinco telas comparadas às capturas; diferenças justificadas abaixo.
- [x] Planos com altura, alinhamentos e aparência das cores comparados à referência, mantendo “Em breve”.
- [x] Cards GitHub carvão, ícone branco e visibilidade real derivada dos dados verificados no renderer.
- [x] Nome exato Portifólios e Projetos; rota e atributos do explorer preservados.
- [x] Modelos compactos; quantidade e disponibilidade existentes verificadas.
- [x] Responsividade, imagens e ausência de erros verificadas nas larguras descritas.
- [x] Handlers existentes e módulos protegidos conferidos contra a base, sem mudanças de infraestrutura.
- [x] Build sem erros e suíte existente com 9 testes passando.
- [ ] Igualdade pixel a pixel: não alcançada pelos conflitos abaixo e por diferenças de renderização da fonte/imagens.
- [ ] Login/cadastro completos e sessão autenticada com a conta de teste.
- [ ] Envio de recuperação por e-mail e redefinição com token válido.
- [ ] OAuth, sincronização, importação e desconexão reais do GitHub.
- [ ] Drag and drop com persistência, deploy/undeploy e aplicação de modelo na conta real.

## Diferenças e suposições de entrega

1. A logo oficial do ZIP tem um símbolo F diferente daquele das capturas; foi usada a versão `FolioDev-logo-branca.png` nas superfícies claras, sem redesenhar ou recolorir.
2. O catálogo atual tem 10 modelos e outra paleta/ordem; a referência tem 15. A disponibilidade real prevalece sobre o texto “Disponível” mostrado em cards com cadeado na captura.
3. Nome da seção e posição de Modelos seguem as instruções expressas do MD. Dados pessoais, nomes de pastas, quantidades, URLs e repositórios dependem da conta real e não foram copiados das capturas.
4. Atalhos funcionais extras do Início e o controle GitHub das pastas foram preservados; sua presença difere das capturas.
5. Foi usada Google Sans oficial conforme o MD. Peso, contornos e antialiasing podem diferir da fonte efetivamente renderizada nas imagens. Não foram adicionadas texturas para reproduzir ruído/compressão da captura.
6. As cores e o gradiente dos planos foram aproximados dos pixels da referência, usando a cláusula “a referência vence”; não são os hexadecimais sólidos citados como exemplo no texto.
7. Nenhuma sessão autenticada ficou acessível ao agente: o acesso ao navegador existente falhou por erro do ambiente. As revisões isoladas de componentes não foram tratadas como testes autenticados e não substituíram fluxos reais.

Entrega em commits pequenos por etapa na branch `ajuste-visual-frontend`. O resultado do push e o hash final são informados na resposta de entrega. A branch principal permanece na base anterior.
