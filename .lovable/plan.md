

## Corrigir erro "invalid input syntax for type json" ao agendar jogos

### Problema

O erro ocorre porque os nomes dos times contêm emojis de bandeiras de paises (ex: 🇧🇷, 🇫🇷). Esses emojis usam "regional indicator symbols" que formam surrogate pairs no Unicode. Quando o Supabase tenta parsear o JSON, os surrogates ficam desemparelhados e gera o erro `"Unicode low surrogate must follow a high surrogate"`.

### Solucao

Remover emojis de bandeiras (regional indicator symbols, range `\u{1F1E6}-\u{1F1FF}`) dos nomes dos times na funcao `cleanText` do `ProgramacaoTexto.tsx`. As bandeiras sao decorativas e nao precisam ser armazenadas no banco.

### Alteracao

**`src/components/admin/ProgramacaoTexto.tsx`** — funcao `cleanText` (linha ~89-96)

Adicionar um `.replace()` para remover regional indicator symbols (bandeiras) e outros emojis problematicos:

```typescript
function cleanText(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*/g, "")
    .replace(/[🏆🎾🏎️🏎🥊🏀🏐📺⏰]/g, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "")  // remove flag emojis
    .replace(/[\u{1F3F4}\u{E0067}-\u{E007F}]/gu, "") // remove subdivision flags (Wales etc)
    .replace(/\s{2,}/g, " ")
    .trim();
}
```

Isso resolve o erro sem afetar o resto do fluxo. Nenhum outro arquivo precisa ser alterado.

