# Devifolio — Design system interno

## Identidade

A interface interna usa fundo cinza muito claro, superfícies brancas, texto azul-marinho quase preto e azul vivo para ações e destaques. O dashboard de Início é o gabarito visual para todas as demais telas.

## Tokens principais

- Azul primário: `#087CFF`
- Azul secundário: `#006EF0`
- Fundo: `#F7F9FB`
- Superfície: `#FFFFFF`
- Texto principal: `#0D1A2E`
- Texto secundário: `#49627F`
- Borda: `#D8E1EA`
- Raio padrão: `7px`
- Sidebar desktop: `328px`
- Espaçamento-base: `8px`; intervalos usuais de `16px`, `24px`, `32px` e `48px`

## Tipografia

Fonte principal: DM Sans, com Google Sans e fontes do sistema como fallback. Títulos usam peso 700; texto funcional usa pesos 400–600.

## Componentes

`Sidebar`, `MetricCard`, `StatusBadge`, `DataTable`, `Modal`, `Button`, `Input`, `Toast`, `QRCard`, `URLField`, `EmptyState` e estados de carregamento compartilham os tokens acima. A implementação fica centralizada em `dashboard.js`, e a apresentação do sistema claro em `dashboard-v2.css`.

## Responsividade

A sidebar é fixa no desktop, vira painel lateral no tablet e é acionada pelo menu no mobile. Grades de três colunas passam para duas e depois uma coluna, preservando leitura, ações e feedback.
