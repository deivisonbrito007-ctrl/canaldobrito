

# Melhorias no Processamento de Imagens e Texto da Programação

## Problemas Atuais
1. IA às vezes gera saída fora do formato (ex: "ATP e WTA x ?")
2. Parser não detecta sport_type automaticamente a partir dos emojis da IA
3. Sem validação/feedback visual de problemas nos jogos parseados
4. Modelo atual (gemini-2.5-flash) pode errar em imagens complexas

## Correções Planejadas

### 1. Upgrade do modelo de IA para melhor precisão
**`read-schedule-image/index.ts`**: Trocar de `google/gemini-2.5-flash` para `google/gemini-2.5-pro` — modelo superior para imagem+texto+raciocínio complexo, reduzindo erros de extração significativamente.

### 2. Melhorar o prompt com regras mais explícitas
**`read-schedule-image/index.ts`**: Adicionar regras extras ao prompt:
- Reforçar: "NUNCA coloque 'x ?' ou 'x TBD' — se não há adversário, use FORMATO B"
- Adicionar: "Se houver múltiplos esportes no mesmo horário, liste CADA UM separadamente"
- Adicionar: "Inclua SEMPRE o detalhe entre parênteses: fase, rodada, etapa, local do torneio"
- Adicionar suporte a texto colado (não só imagem) no prompt

### 3. Detectar sport_type pelos emojis da IA no parser
**`ProgramacaoTexto.tsx`**: Quando a linha de competição começa com 🎾, 🏎️, 🥊, 🏀, 🏐, usar essa informação para pré-definir o `sport_type` no jogo parseado, em vez de depender apenas do `detectSportType()` no momento da publicação. Isso garante categorização correta mesmo quando o nome da competição é ambíguo.

### 4. Validação visual dos jogos parseados
**`ProgramacaoTexto.tsx`**: Adicionar indicadores visuais de problemas nos cards do preview:
- Ícone de alerta amarelo se `game_time` é "00:00" (horário não detectado)
- Ícone de alerta se `channels` está vazio
- Ícone de alerta se `competition` está vazio
- Badge com o `sport_type` detectado para confirmar categorização

### 5. Limpeza automática mais robusta
**`ProgramacaoTexto.tsx`** — expandir `cleanupGame`:
- Remover emojis residuais do `home_team` (ex: 🎾, 🏆)
- Limpar asteriscos/markdown (`**texto**` → `texto`)
- Normalizar espaços duplos
- Se `away_team` contém apenas "?" ou símbolos, limpar para ""

### 6. Suporte a texto colado no edge function
**`read-schedule-image/index.ts`**: Aceitar campo `text` além de `image`, para que textos colados também possam ser processados pela IA (corrigindo formatação irregular de textos do WhatsApp).

## Arquivos
- `supabase/functions/read-schedule-image/index.ts` — modelo, prompt, suporte a texto
- `src/components/admin/ProgramacaoTexto.tsx` — sport_type por emoji, validação visual, cleanup

