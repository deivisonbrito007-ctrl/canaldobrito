# Plano — Corrigir prompt-modelo de geração de banner

## Problemas detectados na saída que você colou

Comparando a saída com o formato esperado em `docs/prompts/banner-from-image.md`:

1. **Tudo numa linha só.** A IA juntou `Time x Time 🏆 ... ⏰ ... 📺 ...` em uma única linha. O formato exige **3 linhas separadas** (linha 1: confronto/evento, linha 2: 🏆/⏰, linha 3: 📺).
2. **📅 Dia 19/06 aparece duas vezes** (uma para futebol, outra para o resto). Deve haver **apenas um bloco 📅 por data**, com todos os esportes daquele dia ordenados por horário.
3. **Título genérico** ("Copa do Mundo — Jogos de Sexta") apesar de o dia ter F1/MotoGP/Tênis/Boxe/MLB/Rugby/Vôlei/Futsal/Golfe. Falta regra clara de como escolher o título quando há múltiplos esportes.
4. **Eventos individuais misturando FORMATO A e B**: a linha "Moto3 — Grande Prêmio da Chéquia (Prática)" repete o nome do GP no 🏆. Falta regra para evitar redundância e padronizar a fase/sessão entre parênteses.
5. **Possível duplicação** (MotoGP aparece 05h45 e 10h00 — pode ser sessão diferente, mas a IA não rotulou; Moto3/Moto2 também). Precisa exigir **rótulo da sessão** (Treino Livre 1, Classificação, Corrida, Sprint, etc.) entre parênteses.
6. **Ordenação cronológica não respeitada** dentro do dia (pulou de 21h30 do futebol pra 03h55 do MotoGP — porque o usuário separou em duas datas erradas).

## O que vou alterar em `docs/prompts/banner-from-image.md`

Reescrever o bloco do prompt para:

- **Forçar quebra de linha real** entre cada elemento, com instrução explícita: "Cada jogo ocupa EXATAMENTE 3 linhas. NÃO concatene em uma única linha mesmo se a imagem da programação estiver assim."
- **Unificar datas**: "Crie UM ÚNICO bloco `📅 Dia DD/MM` por data. Liste TODOS os esportes daquela data dentro do mesmo bloco, ordenados por horário crescente."
- **Regra de TÍTULO multi-esporte**: "Se houver múltiplos esportes relevantes no mesmo dia, use formato genérico: `🗓️ Programação Esportiva — DD/MM` ou destaque o esporte com maior número de eventos. Não force 'Copa do Mundo' se não for o foco."
- **Sessões obrigatórias para esportes B** (F1/MotoGP/Tênis/Golfe/Boxe): "Indique SEMPRE a sessão entre parênteses: (Treino Livre 1), (Treino Livre 2), (Classificação), (Sprint), (Corrida), (Qualifying), (Oitavas), (Quartas), (Semifinal), (Final), (Card Preliminar), (Card Principal), (1ª Rodada), (2ª Rodada), (Round 18), etc."
- **Anti-redundância no 🏆**: "Não repita no campo 🏆 algo que já está na linha 1. Se a linha 1 diz 'Moto3 — GP da Chéquia (Treino Livre)', a linha 🏆 deve ser apenas 🏎️ MotoGP / ⏰ HHhMM (sem repetir 'Grande Prêmio da Chéquia')."
- **Checklist final obrigatório** (a IA deve auto-validar antes de responder):
  - [ ] Cada evento tem 3 linhas
  - [ ] Linha em branco entre eventos
  - [ ] Apenas 1 bloco 📅 por data
  - [ ] Eventos ordenados por horário crescente
  - [ ] Nenhum evento duplicado (mesma sessão + mesmo horário)
  - [ ] Cada sessão de F1/MotoGP/tênis/golfe está rotulada
  - [ ] Nenhuma linha tem "x ?" ou "x TBD"
  - [ ] Horários em HHhMM
- **Aumentar o exemplo de saída válida** com um dia multi-esporte (futebol + MotoGP + tênis + boxe) para a IA ter referência visual de como fica.
- **Adicionar instrução anti-perda**: "Liste TODOS os eventos visíveis na imagem, mesmo que sejam treinos, classificações ou eventos noturnos. Não filtre por relevância."

## Arquivos afetados

- `docs/prompts/banner-from-image.md` — reescrever bloco do prompt e exemplo
- `src/pages/admin/AdminBanners.tsx` — atualizar a constante `BANNER_PROMPT_MODEL` para refletir o novo prompt (já existe o botão "Copiar prompt-modelo")

## Fora do escopo

- Não vou alterar a edge function `read-schedule-image` (essa é usada na aba Programação do admin com IA própria e já tem regras corretas). O foco é só o prompt que você cola no ChatGPT/Gemini externo.

Posso seguir com essas alterações?
