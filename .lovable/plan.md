

## Agenda Brito Solutions TV - Plano Ajustado com Limites Reais das APIs

### Limites Reais de Cada API

| API | Plano Free | Limite | Dados Disponíveis (Free) | Limitações |
|-----|-----------|--------|--------------------------|------------|
| **BALLDONTLIE** | Grátis | **5 req/min**, 1 esporte apenas | Teams, Players, Games (básico) | SEM live box scores, SEM odds, SEM standings, SEM stats avançadas no free. Precisa pagar $9.99/mês POR ESPORTE para dados estendidos |
| **API-Football** | Grátis (RapidAPI) | **100 req/dia** | Fixtures, standings, ligas | Limitado a 100 chamadas/dia |
| **PandaScore** | Grátis | **1000 req/hora** | Matches, teams, tournaments (CS2, LoL, Dota2, Valorant) | Mais generoso no free tier |
| **BALLDONTLIE MCP (GitHub)** | Mesmo da API | Usa a mesma API key BALLDONTLIE | É apenas um servidor MCP, não uma API separada. Consome os mesmos limites da BALLDONTLIE API | Não adiciona requests extras |

**Importante sobre o GitHub MCP:** O repositório `balldontlie-api/mcp` é um servidor MCP (Model Context Protocol) -- serve para integrar com assistentes de IA (como Claude Desktop), NÃO é uma API REST separada. Ele usa a mesma BALLDONTLIE API por trás, com os mesmos limites. Para o nosso sistema web, usaremos a API REST diretamente.

---

### Estrategia Otimizada (Respeitando Limites)

Dado que os planos gratuitos são limitados, a melhor estrategia é:

1. **Sincronizar 1x por dia** (de manhã) em vez de polling constante
2. **Cachear no Supabase** -- buscar dados da API uma vez e servir do banco
3. **Distribuir as chamadas** entre as APIs para não estourar nenhuma
4. **Admin pode adicionar/editar manualmente** jogos que as APIs não cobrem

**Distribuição por API:**

| Esporte | API Principal | Motivo |
|---------|--------------|--------|
| **Futebol** (Brasileirão, Champions, etc.) | **API-Football** | Melhor cobertura de ligas brasileiras. ~10 req para buscar fixtures do dia de 5 ligas |
| **NBA / Basketball** | **BALLDONTLIE** | Boa cobertura NBA no free. ~3 req para games do dia |
| **Esports** (CS2, LoL) | **PandaScore** | Melhor free tier (1000 req/h), dados detalhados de esports |
| **MMA / UFC** | **BALLDONTLIE** | Cobre MMA. ~2 req para eventos do dia |

**Total estimado por sync diário:** ~20 requests (bem dentro dos limites de todas as APIs)

---

### Fluxo de Dados

```text
[Edge Function: sync-daily-games]
        │
        ├── API-Football → fixtures do dia (Futebol)
        ├── BALLDONTLIE  → games do dia (NBA + MMA)
        └── PandaScore   → matches do dia (CS2, LoL)
        │
        ▼
[Normalizar para formato único]
        │
        ▼
[Salvar na tabela `games` do Supabase]
        │
        ▼
[Frontend lê do Supabase] ← sempre rápido, sem depender de API externa
```

**Benefícios do cache no Supabase:**
- Frontend carrega instantaneamente (sem esperar APIs externas)
- Não consome requests das APIs a cada visitante
- Admin pode editar/corrigir dados depois da sync
- Se uma API cair, os dados do dia já estão salvos

---

### O Que Será Construído

**Etapa 1 -- Frontend completo com dados mock:**
- Design system dark premium com marca Brito Solutions (verde #4CAF50 + navy #0F172A)
- Header com logo, data de hoje, botão compartilhar WhatsApp
- Filtros por esporte (Todos / ⚽ / 🏀 / 🎮 / 🥊)
- Seção "Destaques" no topo com jogos principais
- Feed de cards agrupados por liga com status (Agendado + countdown / AO VIVO com pulse / Encerrado)
- Dialog de detalhes ao clicar no card
- Banner OG (1200x630) + meta tags para preview profissional no WhatsApp
- Botão flutuante de compartilhamento WhatsApp
- Rodapé "Powered by Brito Solutions TV"
- Dados mock realistas para os 4 esportes

**Etapa 2 -- Backend Supabase:**
- Tabelas: `sports`, `leagues`, `games` com RLS (leitura pública)
- Auth para admin
- Painel admin com CRUD de jogos + botão "Sincronizar Hoje"

**Etapa 3 -- Edge Functions para APIs:**
- `sync-daily-games`: busca dados das 3 APIs, normaliza e salva
- Secrets para as 3 API keys
- Lógica de fallback: se uma API falhar, as outras continuam

---

### Sugestões de Melhorias

- **Botão "Atualizar Placares"** no admin para re-sync durante o dia (atualizar placares de jogos em andamento), consumindo ~5 requests extras
- **Indicador de última atualização** no footer ("Atualizado às 08:30")
- **Notificação visual** quando há jogos AO VIVO (badge no header)
- **PWA** para clientes salvarem como app no celular
- **Modo "Só ao vivo"** -- filtro rápido para ver apenas jogos em andamento

