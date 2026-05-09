## Diagnóstico

Seu texto usa um **terceiro formato** que o parser nativo não reconhece. Ele só entende:

- **Formato A** (multi-linha com 🏆/📍/⏰/📺)
- **Formato A inline** (com `/ ⏰` na mesma linha)

O texto enviado segue o padrão **inline com travessão**:

```
🏀 Basquete — Jogos do Dia (09/05)         ← cabeçalho com esporte + data
WNBA                                        ← competição (subseção)
Dallas Wings x Indiana Fever — ESPN 3 — 14:00   ← jogo numa única linha
```

E ainda variantes:
- Evento sem adversário: `GP da França — Free Practice — ESPN 4 — 03:35`
- Sessões soltas sob um evento: `06:00 — ESPN 2` (Italian Open / PGA Tour)

Por isso os jogos não são detectados.

## Solução em duas camadas

### Camada 1 — Parser nativo: novo "Formato C" (inline com `—`)

Estender `parseScheduleText` para reconhecer:

1. **Cabeçalho de seção com esporte + data**
   `🏀 Basquete — Jogos do Dia (09/05)` → captura sport + data via regex `\((\d{1,2})\/(\d{1,2})\)`.

2. **Subseção como competição** (WNBA, NBA, NBB, Moto3, MotoGP, Boxe…)
   Linhas curtas em maiúsculas/título sem `—` viram `currentCompetition`.

3. **Linha de jogo inline** com 2 ou 3 segmentos separados por `—`/`-`/`–`:
   - `Dallas Wings x Indiana Fever — ESPN 3 — 14:00`
     → home/away + canal + horário
   - `GP da França — Free Practice — ESPN 4 — 03:35`
     → evento (sem `x`) + detail + canal + horário
   - `06:00 — ESPN 2` (sob `Italian Open`)
     → reusa o último `currentEventTitle` como home_team

4. Aceitar travessões `—`, `–`, `-` e horários `HH:MM` ou `HHhMM`.

5. Ignorar separadores `---`, `📞 Contato:`, linhas só com emoji.

### Camada 2 — Botão "Normalizar com IA" (fallback universal)

A edge function `read-schedule-image` já aceita `text` no body e usa o Lovable AI Gateway para devolver o formato canônico. Vou adicionar um botão **🪄 Normalizar com IA** ao lado de "Detectar jogos" que:

- Envia o conteúdo do textarea para a função
- Substitui o texto pelo retorno formatado (Formato A canônico)
- Mostra estado "Normalizando…" e respeita os toasts já melhorados

Assim, qualquer formato que o parser nativo não pegar pode ser convertido com 1 toque.

### Camada 3 — Testes

Adicionar em `sports_parser.test.ts`:
- WNBA/NBA/NBB inline `Time x Time — Canal — HH:MM`
- MotoGP `GP da França — Sprint Race — ESPN 4 — 10:00` (evento + detail)
- Boxe `Angelo Leo x Ra'eese Aleem — ESPN 3 — 21:00`
- Tênis Italian Open com múltiplas sessões `06:00 — ESPN 2`
- Data extraída de `(09/05)` no cabeçalho de seção
- Convivência: texto novo + texto antigo no mesmo input

### Arquivos afetados

- `src/components/admin/ProgramacaoTexto.tsx` — parser (Formato C) + botão "Normalizar com IA"
- `src/components/admin/__tests__/sports_parser.test.ts` — novos testes
- (sem mudança no edge function — já suporta `text`)

### Sugestões extras

- **Pré-preview ao colar**: já que o parser passa a entender mais formatos, posso fazer ele rodar automaticamente (debounce 400ms) ao colar no textarea, mostrando contagem em tempo real ("12 jogos detectados").
- **Diagnóstico inline**: linhas que parecem jogo mas falharam na detecção poderiam aparecer numa seção "Não reconhecidas — clique para corrigir" abaixo do preview.

Confirma seguir com **Camada 1 + 2 + 3** + a primeira sugestão extra (preview automático)?
