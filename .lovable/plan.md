

# Auditoria: Jogos Anteriores e Status Ao Vivo

## Situação Atual

### Dados no banco
| Data | Total | Ativos |
|------|-------|--------|
| 2026-03-18 | 27 | 27 |
| 2026-03-19 | 11 | 11 |
| 2026-03-20 | 22 | 22 |
| **2026-03-21 (hoje)** | **71** | **71** |

**Problema**: Jogos de dias anteriores (18, 19, 20) ainda estão no banco. Não existe nenhum mecanismo automático de limpeza — eles ficam acumulando.

### O que funciona
- Jogos de hoje estão todos `active: true` (71 jogos)
- A UI filtra por data, então jogos antigos **não aparecem** na tela pública
- O cálculo de "ao vivo" usa `SPORT_DURATION` + buffer de 15min corretamente

### O que falta
- **Limpeza automática** de jogos de datas passadas para não acumular lixo no banco

## Plano

### 1. Limpeza automática na Edge Function `activate-scheduled`
Adicionar ao final da função existente um `DELETE` que remove jogos com `date < hoje`:

```sql
DELETE FROM daily_games WHERE date < CURRENT_DATE
```

Isso roda a cada minuto (já tem cron), então jogos antigos são limpos automaticamente após meia-noite.

### 2. Alternativa: também limpar ao inserir novos jogos
No `ProgramacaoTexto.tsx`, quando o admin posta jogos para uma nova data, o sistema já usa `useDeleteDailyGamesByDate` para limpar a data alvo. Mas não limpa datas antigas. Podemos adicionar uma limpeza de datas passadas no mesmo fluxo.

**Recomendação**: Implementar a limpeza na Edge Function (opção 1) — é automático e não depende do admin.

### Resultado
- Jogos anteriores removidos automaticamente toda meia-noite
- Jogos ao vivo permanecem visíveis enquanto dentro da duração do esporte + 15min buffer
- Banco limpo sem acúmulo de dados antigos

