# Animações do painel FolioDev

## Implementação

Os tokens ficam em `dashboard-theme.css`, no escopo de `body.dashboard-app`: `--motion-fast: 180ms`, `--motion: 200ms`, `--motion-normal: 220ms`, `--ease: cubic-bezier(.2, 0, 0, 1)`, entrada de 8 px e elevação de 2 px. O código de arraste lê duração e curva desses tokens. Todas as animações novas usam `transform` e/ou `opacity`.

| Interação | Feedback |
| --- | --- |
| Pressionar botões e capa clicável | Escala de 0,98 por 180 ms. |
| Passar o mouse em card de projeto | Elevação de 2 px por 180 ms. |
| Arrastar projeto | Cursor de mão, escala 1,01 e opacidade 0,82 no item ativo; destaque discreto da área de destino. |
| Reordenar e soltar | Itens vizinhos se movem por FLIP em 180 ms; o item solto assenta com escala 0,99 → 1 e opacidade 0,88 → 1. |
| Abrir e fechar menu e modal | Fade com deslocamento de 8 px; menu e saída em 180 ms, entrada de modal em 220 ms. |
| Foco por teclado | Anel de foco existente preservado. Espaço inicia/solta a reordenação de projeto, setas mudam a posição, Escape cancela; uma região de status anuncia a operação. |

O ZIP `dnd-kit-main.zip` foi usado como referência de movimento por `transform`, reordenação e anúncio acessível. O projeto usa JavaScript sem React e já tinha controlador de arraste nativo; `DragOverlay`, sensores do pacote e a biblioteca inteira não foram incorporados. Nenhuma dependência foi adicionada e nenhum trecho foi copiado. A licença consultada no ZIP é MIT, copyright 2021 Claudéric Demers.

`prefers-reduced-motion: reduce` elimina as transições e animações novas. A movimentação e o foco continuam disponíveis.

## Verificação

- `npm run lint`, `npm run typecheck`, `npm test` (15 testes) e `npm run build`: sem erro.
- Navegação das 10 rotas em 390 px e 1440 px, claro e escuro: sem erro de JavaScript ou overflow horizontal.
- Abertura e fechamento de modal e menu nos dois temas: concluídos. Em movimento reduzido, a duração computada do modal foi `0s` e o fechamento ocorreu imediatamente.
- Reordenação isolada no navegador: ordem `1,2` → `2,1`, callback de persistência recebido, foco preservado, `aria-grabbed` limpo ao soltar, Escape restaurando a ordem em andamento. Os vizinhos animaram no modo normal e não animaram no reduzido.
- As operações de persistência foram verificadas com callbacks simulados; não houve acesso a uma conta real.
