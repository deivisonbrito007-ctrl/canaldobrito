## Normalização do `matchChannel` em ChannelBadge

**Problema:** `"Cazé TV"` (com espaço/acento) não bate com chave `"cazetv"`, cai no FALLBACK roxo sem logo. Mesmo bug pode afetar `"X Sports"`, `"Apple TV"`, etc.

**Mudança em `src/components/public/ChannelBadge.tsx`** (linhas 71-77):

Substituir `matchChannel` por versão que normaliza chaves e nome de entrada removendo acentos, espaços, hífen, underscore e pontuação:

```ts
const normalizeKey = (s: string) =>
  s.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // remove acentos
    .replace(/[\s\-_!+]/g, "")          // remove espaços/símbolos
    .trim();

const NORMALIZED_MAP: Record<string, ChannelConfig> = Object.fromEntries(
  Object.entries(CHANNEL_MAP).map(([k, v]) => [normalizeKey(k), v])
);

function matchChannel(name: string): ChannelConfig {
  const key = normalizeKey(name);
  if (NORMALIZED_MAP[key]) return NORMALIZED_MAP[key];
  for (const [k, v] of Object.entries(NORMALIZED_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return FALLBACK;
}
```

**Resultado:**
- `"Cazé TV"` → `"cazetv"` → bate com config lime + logo `/channels/cazetv-v2.png`
- `"X Sports"` → `"xsports"` → bate com nova config vermelha + logo
- `"Apple TV"`, `"HBO Max"`, `"Prime Video"`, `"RedeTV!"` → todos resolvidos

**Arquivos alterados:**
- `src/components/public/ChannelBadge.tsx`

Aprove para aplicar.
