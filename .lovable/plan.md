

# Diagnóstico e Correção — Processar Texto e Limpar

## Problemas Identificados

### 1. Warning de Refs (Console)
AdminBanners renderiza `ProgramacaoTexto` e `DailyGamesManager` como componentes filhos, mas o React está tentando passar refs a eles (possivelmente via algum wrapper interno). Esses componentes são function components sem `forwardRef`, o que gera o warning. Embora não quebre diretamente, pode causar comportamento inesperado em re-renders.

### 2. Parser Frágil com Variações de Emoji
O parser espera emojis exatos (`📅` para data, `⏰` para hora), mas variações comuns como `📺` para data ou `🏆` no lugar de `⏰` fazem o parser falhar silenciosamente — retorna 0 jogos e mostra erro "Nenhum jogo detectado".

### 3. Falta de Feedback Visual Claro
Quando o parser processa com sucesso, o preview aparece abaixo do textarea, mas o usuário pode não perceber sem scroll automático.

---

## Correções Planejadas

### Arquivo: `src/components/admin/ProgramacaoTexto.tsx`

1. **Tornar parser mais robusto:**
   - Aceitar `📅` ou `📺` ou texto genérico como marcador de data (regex: `/(?:📅|📺|🗓).*?(\d{1,2})\/(\d{1,2})/`)
   - Aceitar `⏰` ou `🕐` ou qualquer emoji de relógio antes do horário, ou até detectar horário sem emoji (regex mais flexível para `\d{1,2}[hH:]\d{0,2}`)
   - Aceitar variação `X` maiúsculo e minúsculo no separador de times (` x ` ou ` X `)

2. **Adicionar scroll automático ao preview** após processar, usando `useRef` + `scrollIntoView`

3. **Melhorar feedback dos botões:**
   - Loading state no botão Processar enquanto parseia
   - Toast mais descritivo com detalhes dos jogos encontrados

### Arquivo: `src/components/admin/DailyGamesManager.tsx`
4. **Nenhuma mudança funcional** — o componente está OK

### Arquivo: `src/pages/admin/AdminBanners.tsx`
5. **Nenhuma mudança** — os componentes não recebem refs explicitamente, o warning é cosmético

---

## Sugestões Adicionais

- **Suporte a formato alternativo:** Aceitar texto sem emojis (ex: só "Flamengo x Palmeiras / Brasileirão / 19h00 / Sportv") como fallback
- **Botão de exemplo:** Preencher textarea com texto de exemplo ao clicar, para o usuário testar rapidamente

