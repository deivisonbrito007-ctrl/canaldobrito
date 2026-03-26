

## Remover variável `tabIndex` órfã

### Arquivo: `src/pages/Index.tsx`

Remover a linha 55 que contém:
```ts
const tabIndex = TAB_ORDER.indexOf(activeTab as typeof TAB_ORDER[number]);
```

Esta variável não é mais referenciada em nenhum lugar após a remoção do drag/swipe. A constante `TAB_ORDER` ainda é usada no listener de eventos, então permanece.

