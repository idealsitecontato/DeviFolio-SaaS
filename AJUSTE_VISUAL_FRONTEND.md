# Ajuste visual do frontend FolioDev

Especificação: `prompt-codex-ajuste-frontend-foliodev.md`, as cinco capturas anexadas e `FolioDev_logos(2).zip`, fornecidos em 29/09/2026. Branch de entrega: `ajuste-visual-frontend`. Base: `a123fcf`.

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

As etapas seguintes e o checklist final serão preenchidos após as verificações.

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
