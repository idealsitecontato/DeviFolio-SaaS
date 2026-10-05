# Tarefa 3 — Modelos de sites

## Decisão de escopo

O commit `3b230f3` havia retirado a rota **Modelos**, o catálogo de 10 opções e a coluna `profiles.selected_model`. O usuário autorizou expressamente restaurar a tela e o fluxo, mesmo exigindo alterações de frontend e banco nesta tarefa. Os 10 modelos históricos foram recuperados sem trocar seus IDs ou imagens; os 20 abaixo foram acrescentados.

Os sites completos ficam em `public/models/<slug>/`. A prévia abre o site original em nova aba. **Aplicar** grava o ID no perfil e atualiza a identidade visual do portfólio público e a prévia do painel. O conteúdo editável do portfólio continua vindo do banco; os arquivos HTML de demonstração não são um editor de conteúdo integrado. Para personalizar a estrutura completa de um site, edite os arquivos do respectivo diretório.

## Os 20 novos modelos

| Nome | Categoria | Slug | Autor / licença indicada |
|---|---|---|---|
| Agency Studio | Agência | `startbootstrap-agency-1.0.2` | Start Bootstrap, Apache 2.0 |
| Clean Blog | Blog | `startbootstrap-clean-blog-1.0.2` | Start Bootstrap, Apache 2.0 |
| Freelancer | Portfólio | `startbootstrap-freelancer-1.0.2` | Start Bootstrap, Apache 2.0 |
| Grayscale | Landing page | `startbootstrap-grayscale-1.0.3` | Start Bootstrap, Apache 2.0 |
| SB Admin | Painel | `startbootstrap-sb-admin-1.0.2` | Start Bootstrap, Apache 2.0 |
| SB Admin 2 | Painel | `startbootstrap-sb-admin-2-1.0.5` | Start Bootstrap, Apache 2.0 |
| Stylish Portfolio | Portfólio | `startbootstrap-stylish-portfolio-1.0.2` | Start Bootstrap, Apache 2.0 |
| City Square | Empresa | `city-square-bootstrap-responsive-web-template` | WebThemez, crédito no rodapé |
| Green Corp | Empresa | `green-corp-flat-free-responsive-mobile-website` | WebThemez, crédito no rodapé |
| Sam Portfolio | Portfólio | `free-portfolio-html5-responsive-website-sam` | WebThemez, crédito no rodapé |
| Get Doctor | Saúde | `getdoctor-free-bootstrap-responsive-website-template` | WebThemez, CC BY 3.0 |
| Traveller | Viagem | `traveller-bootstrap-responsive-web-template` | WebThemez, crédito no rodapé |
| TreeHut | Restaurante | `free-bootstrap-template-restaurant-website-treehut` | WebThemez, CC BY 3.0 |
| Coffee Shop | Cafeteria | `coffee-shop-free-html5-template` | WebThemez, MIT do ZIP; crédito preservado |
| Wow Portfolio | Portfólio | `wow-portfolio-multi-purpose-html5-template` | WebThemez, CC BY 3.0 |
| Grand | Empresa | `grand-free-bootstrap-responsive-website-template` | WebThemez, CC BY 3.0 |
| Learn | Educação | `learn-educational-free-responsive-web-template` | WebThemez, CC BY 3.0 |
| SkyTouch | Landing page | `skytouch-onepage-bootstrap-responsive-web-template` | WebThemez, crédito no rodapé |
| Me Resume | Currículo | `me-resume-personal-portfolio-responsive-template` | WebThemez, crédito no rodapé |
| Park City | Imobiliária | `park-city-bootstrap-html-real-estate-responsive-template` | WebThemez, CC BY 3.0 |

## Correções nos arquivos originais

- **Agency Studio e Freelancer:** ajustados nomes de dois scripts para a capitalização real dos arquivos; isso evita 404 em hospedagem sensível a maiúsculas.
- **SB Admin e SB Admin 2:** imagens de avatar remotas substituídas por SVG local; gráficos sem contêiner não inicializam no SB Admin. No SB Admin 2, páginas de demonstração das bibliotecas vendorizadas foram retiradas, as bibliotecas foram movidas para um caminho servido pelo Vite e nomes de arquivos com diferença de maiúsculas foram corrigidos. A tabela secundária rola dentro do seu cartão no celular.
- **TreeHut:** removida inicialização de mapa dependente de API não incluída; galeria e controle de carrossel corrigidos no celular.
- **Wow Portfolio e Grand:** removido manipulador JavaScript que tentava ligar um clique a elemento inexistente; ícones de galeria ausentes foram substituídos por SVGs locais.
- **Learn:** jQuery e Bootstrap agora são servidos localmente a partir do ZIP; o script da lightbox foi incluído. Corrigidos link de curso e três links da galeria. O slider só inicia na página que o contém e a inicialização de mapa sem contêiner foi removida da página de contato.
- **Me Resume:** galeria e imagens de largura fixa ajustadas no celular.
- **Park City:** referências de plugins não incluídos foram removidas; fundo ausente substituído por imagem do próprio modelo. O mapa da página de contato foi limitado à largura da tela.
- **City Square, Green Corp, Sam Portfolio, Get Doctor, Traveller, Coffee Shop, Grayscale, Clean Blog, Stylish Portfolio e SkyTouch:** não exigiram correção de script na página inicial. Fontes Bootstrap e fundos opcionais ausentes foram completados com arquivos locais onde necessário.
- **Todos:** thumbnails JPEG locais de 640 × 360; IDs únicos; referências de HTML e CSS verificadas em todas as páginas internas, inclusive diferenças de maiúsculas importantes em Linux. Readmes e licenças próprios permaneceram nos diretórios.

## Triagem e licenças

A planilha [MODELOS-TRIAGEM-2026-10-04.csv](MODELOS-TRIAGEM-2026-10-04.csv) inventaria **174** diretórios do ZIP, a decisão por template e os motivos automatizados de descarte. Exemplos relevantes:

| Template descartado | Motivo |
|---|---|
| `agile-agency-free-bootstrap-web-template` | README próprio proíbe redistribuição a terceiros. |
| `amaze-photography-bootstrap-html5-template` | Mesma proibição, apesar da indicação CC BY. |
| `golden-hotel-free-html5-bootstrap-web-template` | Mesma proibição e referências locais ausentes. |
| `cloud-hosting-free-bootstrap-responsive-website-template` | Mesma proibição e plugins ausentes. |
| `css3-photo-two` | Largura fixa com overflow relevante no celular. |
| `sample_site` | Links e assets locais ausentes. |

O `SOURCE-LICENSE.txt` conserva a licença MIT do repositório de origem (Dawid Olko, 2024). As licenças individuais Apache 2.0 e readmes de atribuição prevalecem para seus modelos. Os créditos WebThemez no rodapé foram mantidos. Alguns readmes informam que fotografias são **apenas demonstrativas** e não garantem direitos sobre todas as imagens; substitua essas fotografias antes de uso comercial específico. Fontes Google opcionais e links externos de crédito permanecem em alguns demos, mas os recursos essenciais da página são locais.

## Validação e implantação

- Catálogo: 30 cards no total (10 históricos + 20 novos), busca, categorias e paginação. Prévia e aplicação verificadas com conta simulada; seleção persistiu após recarregar e alterou o estilo do portfólio público.
- As **54 páginas HTML** dos 20 modelos foram abertas pelo servidor do FolioDev em desktop e celular, com captura de erros JavaScript, 404, imagens quebradas e largura horizontal: **54 aprovadas**.
- Referências locais de todas as páginas HTML e folhas CSS dos 20 diretórios verificadas: **zero referências ausentes** após os ajustes.
- `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passaram. O lint ignora somente as bibliotecas externas vendorizadas em `public/models` e a área temporária de validação.
- A migração `supabase/migrations/20261004_restore_portfolio_models.sql` precisa ser aplicada ao banco de produção antes da ação **Aplicar** funcionar para usuários reais. Não havia conexão administrativa Supabase configurada neste checkout para executá-la.

## Arquivos FolioDev alterados nesta tarefa

`dashboard.html`, `dashboard.js`, `models.css`, `portfolio.html`, `portfolio-page.js`, `portfolio-models.css`, `src/lib/portfolio-models.js`, `src/lib/user-data.js`, `supabase/schema.sql`, `supabase/migrations/20261004_restore_portfolio_models.sql`, `eslint.config.js`, `assets/models/`, `public/models/` e esta documentação. A restrição original de não tocar frontend foi substituída pela autorização posterior do usuário para restaurar tela e fluxo.
