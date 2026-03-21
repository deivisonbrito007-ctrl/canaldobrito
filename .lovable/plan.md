

# Simplificar Exemplo UFC/MMA no Placeholder

## Mudança

### `src/components/admin/ProgramacaoTexto.tsx`
Remover o bloco "UFC 315 (Preliminar)" do placeholder, mantendo apenas o Card Principal como exemplo:

```
UFC 315 (Card Principal)
🥊 MMA / ⏰ 23h00
📺 Combate
```

Isso simplifica o exemplo sem perder a funcionalidade — o admin ainda pode postar múltiplos cards se quiser, mas o exemplo mostra apenas o formato principal.

### Duração MMA permanece 180min
A duração de 3h + 15min buffer continua cobrindo um card completo. Sem outras mudanças necessárias.

