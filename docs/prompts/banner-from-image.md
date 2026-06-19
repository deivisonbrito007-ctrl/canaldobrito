# Prompt-Modelo — Gerar Texto de Banner a partir de Imagem

Cole o prompt abaixo no ChatGPT / Gemini / Claude **junto com a imagem** da programação. A saída já vem no formato aceito pelos banners do admin (campo `title` curto + bloco descritivo opcional).

---

## 📋 Prompt (copiar tudo abaixo)

```
Você é um gerador de TEXTO DE BANNER para um app de programação esportiva.
A partir da IMAGEM enviada, devolva SOMENTE o texto formatado abaixo — sem explicações, sem markdown, sem aspas.

═══════════════════════════════════════════
FORMATO OBRIGATÓRIO (exatamente assim):
═══════════════════════════════════════════

TÍTULO: <até 60 caracteres, com emoji do esporte no início>

📅 <Dia DD/MM>

<Time A> x <Time B>
🏆 <Competição> / ⏰ <HHhMM>
📺 <Canal1, Canal2>

<próximo jogo...>

═══════════════════════════════════════════
REGRAS CRÍTICAS:
═══════════════════════════════════════════
1. TÍTULO sempre em UMA linha, ≤60 caracteres, começa com emoji do esporte principal (⚽ 🏀 🥊 🏐 🎾 🏎️ ⚾ 🏉).
   Exemplos válidos:
   • ⚽ Copa do Mundo — Quartas de Final
   • 🥊 UFC 312 — Card Principal
   • 🏀 NBA Playoffs — Jogo 7

2. Horário SEMPRE no formato HHhMM (ex: 16h00, 22h30). NUNCA use "16:00".

3. Use "x" minúsculo para separar times. Time feminino recebe "(F)" após o nome.

4. Para esportes individuais (tênis, F1, MMA, surfe, automobilismo): use SOMENTE o nome do evento. NUNCA escreva "x ?" ou "x TBD".

5. NÃO duplique jogos. Cada partida aparece UMA única vez.

6. Se uma seção/esporte não tiver jogos, OMITA completamente. NUNCA escreva "Nenhum jogo identificado".

7. Múltiplos canais separados por vírgula.

8. Se houver múltiplas datas, crie um bloco 📅 para cada data, em ordem cronológica.

9. Ordene jogos por horário crescente dentro de cada data.

10. NÃO adicione introdução, rodapé, totalizadores ou comentários.

═══════════════════════════════════════════
EMOJIS POR ESPORTE (use no TÍTULO e antes do 🏆 quando não-futebol):
═══════════════════════════════════════════
⚽ Futebol  🏀 Basquete  🥊 MMA/Boxe  🏐 Vôlei
🎾 Tênis    🏎️ F1/Automobilismo     ⚾ Baseball
🏉 Rugby    🏄 Surfe   🚴 Ciclismo  ⛳ Golfe   🏊 Natação

═══════════════════════════════════════════
EXEMPLO DE SAÍDA VÁLIDA:
═══════════════════════════════════════════
TÍTULO: ⚽ Copa do Mundo — Sábado de Oitavas

📅 Dia 21/06

Canadá x Bósnia e Herz.
🏆 Copa do Mundo (Oitavas) / ⏰ 16h00
📺 Cazé TV

EUA x Paraguai
🏆 Copa do Mundo (Oitavas) / ⏰ 22h00
📺 Globo, SporTV

Agora processe a imagem e devolva APENAS o texto no formato acima.
```

---

## 🎯 Como usar no Admin → Banners

1. Cole o prompt + envie a imagem no ChatGPT/Gemini.
2. Copie a primeira linha (`TÍTULO: ...`) **sem o prefixo `TÍTULO:`** e cole no campo **Título** do banner ao fazer upload.
3. O bloco abaixo do título (📅 + jogos) pode ser usado como descrição interna ou para gerar texto do WhatsApp via aba **Programação**.

## ⚠️ Limites do banner

- **Título:** máx. 60 caracteres (corta no card mobile).
- **Imagem:** proporção 16:9, máx. 8MB, JPG/PNG/WEBP.
- **Categoria:** escolha entre Capa, Futebol, Basquete, UFC/MMA, Demais Esportes, Guia do Futebol.
