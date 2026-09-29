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
