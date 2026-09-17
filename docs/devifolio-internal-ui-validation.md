# Devifolio — validação do frontend interno

Referência normativa: `devifolio-design-system-SKILL.md` e `prompt_devifolio_dashboard_definitivo.md`, fornecidos pelo usuário em 17/09/2026.

## Implementação

`dashboard.html` importa somente `dashboard-reference.css`. As folhas legadas e compartilhadas não foram alteradas. Todos os componentes internos, inclusive modais e toasts fora de `.app-shell`, recebem o mesmo sistema de tokens. Não há variantes claras, gradientes ou bibliotecas de UI adicionais.

As dimensões aproximadas da imagem são concretizadas pelos valores explicitamente definidos na skill: sidebar de 216 px, header de 56 px, cards com raio de 6 px, controles de 4–6 px. A marca original, as rotas e os dados existentes foram preservados; métricas não existentes na conta não foram inventadas.

## Conferência visual

Comparação lado a lado efetuada usando `dashboard-fidelity.html`, que carrega a referência fornecida e a aplicação real em iframe. Essa página auxilia a revisão local e não é uma entrada do build de produção.

Telas verificadas: Início, Projetos, Meu Portfólio, Editar Portfólio, GitHub, Análise, Indicação, Planos, Perfil e Configurações. O link e o QR Code fazem parte do Dashboard; não foi criada uma rota adicional.

Valores renderizados conferidos em todas as dez telas, nas larguras de 1157 px e 390 px:

| Elemento | Valor observado |
| --- | --- |
| Fundo principal | `#1B1D1F` |
| Sidebar | `#151618` |
| Cards | `#202225` |
| Borda dos cards | `#2E3033`, 1 px |
| Raio dos cards | 6 px |
| Gradientes nos cards | Nenhum |
| Inputs | `#1F2123`; busca transparente sobre o mesmo token |
| Rolagem horizontal da página | Ausente nas dez telas |

## Interações verificadas

- Navegação entre as dez telas com sessão existente e carregamento dos dados disponíveis.
- Sidebar recolhida: 72 px e header alinhado; expansão restaurada.
- Drawer móvel: aberto, overlay visível, `aria-expanded=true`; fecha após navegar para Perfil.
- Modal de visualização do projeto e fechamento.
- Modal de criação, campos, upload visível e cancelamento sem envio.
- Confirmação de exclusão de conta aberta e cancelada, sem executar exclusão.
- Busca de projetos, estado vazio e restauração da lista.
- Cópia do link: conteúdo confirmado na área de transferência do navegador.
- QR Code real renderizado e arquivo PNG baixado; o observador de eventos de download não sinalizou, mas o arquivo foi confirmado na pasta Downloads.
- Console do navegador sem erros registrados durante as verificações.

## Verificações de código e limites

- Build Vite executado com sucesso.
- Sintaxe de `dashboard.js` verificada com `node --check`.
- Não existem scripts de lint, typecheck nem testes automatizados no `package.json`; o projeto usa JavaScript, não TypeScript.
- Hashes dos arquivos da landing, autenticação, portfólio público e bibliotecas de acesso ao Supabase comparados antes/depois: sem alterações nesta rodada.
- Callbacks, submits, queries, autenticação e integrações não foram modificados nesta rodada. Não foram feitas gravações de teste no banco, nova autorização OAuth, login/logout nem operações destrutivas.
- GitHub conectado, erros de servidor e onboarding não foram forçados artificialmente; utilizam as mesmas classes e tokens, mas não foram exercitados como fluxos reais nesta sessão.

O commit inclui somente os arquivos do frontend interno e os materiais de validação. Alterações pré-existentes em páginas públicas e folhas compartilhadas são mantidas fora do commit.
