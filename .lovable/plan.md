
## Objetivo

Definir um **formato canônico único** que o parser de Programação (`parseScheduleText` em `src/components/admin/ProgramacaoTexto.tsx`) reconhece com 100% de confiabilidade, mais um **prompt para GPT** que sempre produz texto neste formato — eliminando os erros de leitura.

---

## Diagnóstico do parser atual

O parser entende dois formatos:

- **Formato A (canônico, blocos com emojis):** linha do confronto seguida de linhas-metadata começando por `🏆`, `⏰`, `📺`. **É o caminho mais robusto.**
- **Formato C (inline):** `Time A x Time B — Canal — HH:MM` em uma única linha — passa por um pré-processador que converte para o Formato A.

Falhas observadas no Formato C:
- Linhas sem `—` (em-dash) ou misturando `-` e `—` quebram o split.
- Datas só no cabeçalho (ex.: `Jogos do Dia (09/05)`) às vezes não propagam para subseções.
- Eventos solo (Tênis/Golfe/F1) sem `x` viram seções fantasma.
- Caracteres invisíveis colados do WhatsApp (NBSP, ZWSP) bagunçam regex.
- Competições multi-linha (ex.: `PGA Tour — Terceira Rodada` + horários soltos abaixo) perdem o `competition_detail`.

**Solução:** padronizar tudo no **Formato A** (blocos com emoji), que não depende de em-dash nem de inferência contextual.

---

## Formato canônico proposto (Formato A — à prova de falhas)

Estrutura rígida, uma linha por campo, sempre nesta ordem:

```text
📅 DD/MM

[EMOJI ESPORTE] NOME DO ESPORTE

Time A x Time B
🏆 Competição (Detalhe opcional)
⏰ HH:MM
📺 Canal1, Canal2

Time C x Time D
🏆 Competição
⏰ HH:MM
📺 Canal
```

Regras obrigatórias:

1. **Data:** primeira linha de cada bloco de dia, `📅 DD/MM` (ano = ano atual).
2. **Cabeçalho de esporte:** emoji + nome em **MAIÚSCULAS** (`⚽ FUTEBOL`, `🏀 BASQUETE`, `🏎️ AUTOMOBILISMO`, `🥊 COMBATE`, `🎾 TÊNIS`, `⛳ GOLFE`, `🏐 VÔLEI`, `🏈 NFL`, `⚾ BEISEBOL`, `🏒 HÓQUEI`, `🏉 RUGBY`, `🏄 SURF`, `🚴 CICLISMO`).
3. **Confronto:** `Time Mandante x Time Visitante` (sempre `x` minúsculo cercado de espaços). Para futebol feminino, sufixar `(F)`.
4. **Eventos solo** (tênis/golfe/MMA/F1/etc., sem adversário): usar apenas o nome do evento na linha do confronto. Ex.: `GP da França — Sprint Race`.
5. **🏆 Competição:** uma linha. Detalhe entre parênteses: `🏆 Brasileirão Série A (Rodada 32)`.
6. **⏰ Horário:** sempre `HH:MM` 24h (Brasília). Nunca `HHhMM` nem `9:00`.
7. **📺 Canais:** separados por vírgula. Sem prefixo. Ex.: `📺 Globo, Premiere, SporTV`.
8. **Separação:** linha em branco entre cada jogo. Linha em branco + cabeçalho novo para mudar de esporte.
9. **Proibido:** asteriscos `*`, bandeiras 🇧🇷, traços `—` no meio do confronto, números de telefone, “Contato:”, qualquer rodapé.

Esse formato cobre 100% dos caminhos felizes do parser atual, sem depender do pré-processador Formato C.

---

## Sugestões de melhorias adicionais (fora deste plano, opt-in)

- **Validador no admin:** botão “Validar formato” que destaca linha por linha o que está fora do padrão antes de tentar parsear.
- **Botão “Copiar template vazio”** no admin para o operador colar no GPT.
- **Whitelist de canais conhecidos:** sugerir correção quando aparecer `Spo TV` → `SporTV`.
- **Normalização silenciosa de invisíveis** (NBSP/ZWSP → espaço) já no `parseScheduleText`.
- **Suporte a múltiplos dias** num único paste (`📅 09/05` … `📅 10/05` …) — o parser já suporta, só reforçar no template.

(Essas melhorias não fazem parte do entregável agora — apenas registradas como recomendações.)

---

## Entregável principal: PROMPT pronto para o GPT

Copie e cole no ChatGPT (ou qualquer LLM) junto com o texto bagunçado da fonte:

````text
Você é um formatador de programação esportiva para o Canal do Brito.
Receberá um texto bruto (WhatsApp, site, lista solta) e deve devolver
APENAS o texto reformatado no padrão abaixo, sem comentários, sem
explicações, sem markdown extra.

═══════════════ PADRÃO OBRIGATÓRIO ═══════════════

📅 DD/MM

EMOJI_ESPORTE NOME_DO_ESPORTE_EM_MAIUSCULAS

Time Mandante x Time Visitante
🏆 Nome da Competição (Detalhe opcional)
⏰ HH:MM
📺 Canal1, Canal2, Canal3

Time C x Time D
🏆 Competição
⏰ HH:MM
📺 Canal

══════════════════════════════════════════════════

REGRAS RÍGIDAS:
1. Primeira linha de cada dia: 📅 DD/MM (use o ano atual implicitamente).
2. Cabeçalho de esporte SEMPRE em MAIÚSCULAS, com um destes emojis:
   ⚽ FUTEBOL · 🏀 BASQUETE · 🎾 TÊNIS · 🏎️ AUTOMOBILISMO ·
   🥊 COMBATE · ⛳ GOLFE · 🏐 VÔLEI · 🏈 NFL · ⚾ BEISEBOL ·
   🏒 HÓQUEI · 🏉 RUGBY · 🏄 SURF · 🚴 CICLISMO
3. Confronto: "Time A x Time B" (x minúsculo, espaços ao redor).
   Futebol feminino: adicione " (F)" no final do confronto.
4. Eventos sem adversário (Tênis/Golfe/F1/MMA solo): use só o nome
   do evento na linha do confronto. Ex.: "GP da França - Sprint Race".
5. ⏰ horário SEMPRE no formato HH:MM (24h, horário de Brasília).
   Converta "9h", "9h00", "21h30", "9:00 AM" → "09:00", "21:30".
6. 📺 canais separados por vírgula. Normalize nomes:
   "sportv" → "SporTV", "espn brasil" → "ESPN", "premiere fc" → "Premiere",
   "disney+" → "Disney+", "globo" → "Globo", "band" → "Band".
7. UMA linha em branco entre cada jogo.
8. UMA linha em branco antes de cada cabeçalho de esporte novo.
9. Detalhes da competição entre parênteses no 🏆 (ex.: "🏆 NBA (Playoffs)").
10. PROIBIDO no output: asteriscos *, bandeiras 🇧🇷, traços — dentro do
    confronto, telefones, "Contato:", rodapés, observações, links.
11. Se faltar canal, omita a linha 📺. Se faltar horário, use ⏰ 00:00.
12. Se houver múltiplos dias no texto, repita o bloco 📅 DD/MM para cada.
13. Ordene os jogos por horário crescente dentro de cada esporte.

═══════════════ EXEMPLO DE SAÍDA VÁLIDA ═══════════════

📅 09/05

⚽ FUTEBOL

Flamengo x Palmeiras
🏆 Brasileirão Série A
⏰ 16:00
📺 Globo, Premiere

São Paulo x Corinthians (F)
🏆 Brasileirão Feminino
⏰ 18:30
📺 SporTV

🏀 BASQUETE

Lakers x Celtics
🏆 NBA (Playoffs)
⏰ 21:00
📺 ESPN 4

Dallas Wings x Indiana Fever
🏆 WNBA
⏰ 14:00
📺 ESPN 3

🏎️ AUTOMOBILISMO

GP da França - Qualificação
🏆 Fórmula 1
⏰ 05:50
📺 ESPN 4

GP da França - Sprint Race
🏆 Fórmula 1
⏰ 10:00
📺 ESPN 4

🥊 COMBATE

Angelo Leo x Ra'eese Aleem
🏆 Boxe
⏰ 21:00
📺 ESPN 3

🎾 TÊNIS

Italian Open
🏆 ATP Masters 1000
⏰ 06:00
📺 ESPN 2

Italian Open
🏆 ATP Masters 1000
⏰ 10:00
📺 ESPN 2

⛳ GOLFE

PGA Tour - Terceira Rodada
🏆 PGA Tour
⏰ 14:00
📺 ESPN 3

══════════════════════════════════════════════════

Agora reformate o texto a seguir seguindo EXATAMENTE este padrão.
Retorne SOMENTE o texto formatado, nada mais.

TEXTO BRUTO:
[COLE AQUI O TEXTO ORIGINAL]
````

---

## O que muda no código?

**Nada.** Esta entrega é puramente um padrão documentado + prompt de GPT. O parser atual já lê esse Formato A com 100% de fidelidade. As melhorias listadas (validador no admin, botão “Copiar template”, normalização de invisíveis) ficam como sugestões para um próximo ciclo, se você aprovar.

