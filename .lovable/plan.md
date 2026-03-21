

# Adicionar Data na Programação

## Mudança

### `src/components/public/DailyGamesSection.tsx`
Adicionar a data formatada (ex: "Sex · 21 Mar") ao lado do título "Programação" no header da seção.

- Importar `format` do `date-fns` e `ptBR` do `date-fns/locale`
- Após o badge de "X jogos", adicionar um chip com a data do dia:
```tsx
<span className="text-[10px] text-muted-foreground/60 capitalize font-medium">
  {format(new Date(today + "T12:00:00"), "EEE · d MMM", { locale: ptBR })}
</span>
```

O resultado visual fica:
```text
🏆 Programação  [12 jogos]  [sex · 21 mar]  [2