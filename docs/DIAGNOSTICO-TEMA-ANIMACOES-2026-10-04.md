# Diagnóstico prévio — tema e interações

Data: 04/10/2026. Escopo: revisão do código da versão atual antes das correções.

| Arquivo | Gravidade | Problema encontrado |
| --- | --- | --- |
| `folio-adjustments.css` | Alta | Valores brancos e texto escuro fixos nos filtros Kaptei, na prévia de portfólio e nos controles de edição prevalecem sobre os tokens do tema. |
| `folio-adjustments.css` | Alta | As métricas da prévia usam `#101010` mesmo quando a superfície está escura. |
| `redesign-app.css` | Alta | Regras tardias de perfil, análise, leads e planos usam superfícies e textos de tema claro com `!important`; a folha `dashboard-theme.css` cobre apenas parte dessas combinações. |
| `dashboard-theme.css` | Média | Algumas superfícies escuras dependem de seletores corretivos específicos; falta tratamento coerente de autofill, seleção e estados de foco nos controles internos. |
| `dashboard-master.css` e `foliodev-app.css` | Média | O arraste já tem reordenação visual, mas a folha final neutraliza o movimento do item de origem e o feedback de alvo/foco é pouco claro. |
| `dashboard.html` | Baixa | O tema é lido de `localStorage` antes do conteúdo visível, mas a cor da barra do navegador permanece clara após a troca de tema. |
| `dashboard.js` | Média | A escolha do tema persiste; o metadado `theme-color` e o esquema do documento não acompanham a mudança. |

Observações de escopo: QR codes precisam de uma área branca para preservar a leitura da imagem; cards escuros da marca e badges coloridos também têm cores intencionais. Esses valores não devem ser substituídos indiscriminadamente. O projeto não usa React; seus erros de console são os de JavaScript e carregamento. O catálogo de Modelos foi removido no commit `3b230f3`, junto da coluna `selected_model`; a terceira tarefa exige uma decisão posterior porque proíbe alterar frontend e lógica de negócio.

Validação inicial: `npm run lint`, `npm run typecheck`, `npm test` (15 testes) e `npm run build` passaram antes das alterações.

Inspeção visual antes das correções: as 10 rotas existentes foram abertas em 390 px e 1440 px, nos temas claro e escuro, com dados simulados e sem acesso ao banco. Não houve exceções de JavaScript nem overflow horizontal. Falhas confirmadas: texto quase preto sobre fundo escuro em `portfolio` e `analise`; descrições de planos com contraste fraco no escuro; título, descrição e preço brancos sobre o card claro do plano Avançado; avatar do editor de perfil com iniciais pouco visíveis. O verificador também apontou elementos decorativos e cards com gradiente, que exigem inspeção visual antes de serem tratados como defeitos.

Após as correções da Tarefa 1: a varredura foi repetida nas mesmas 40 combinações e nos modais e menu de usuário. Os textos funcionais medidos alcançaram o limiar WCAG AA usado no verificador; a pasta decorativa, as bolinhas do plano Plus sobre gradiente e um ícone decorativo do Kaptei permanecem como falsos positivos da análise de cores sem rasterização. Capturas foram inspecionadas para portfólio, planos, análise, perfil e modal. `npm run lint`, `npm run typecheck`, `npm test` (15 testes) e `npm run build` passaram. O teste usa sessão e respostas de API simuladas; fluxos autenticados com conta real não foram exercitados.
