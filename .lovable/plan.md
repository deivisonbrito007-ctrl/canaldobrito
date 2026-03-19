

# Diagnóstico e Correções

## Problemas encontrados

### 1. "Ao Vivo" e "Programação" vazios
A query `daily_games` retorna `[]` para a data de hoje (2026-03-19). Ambos `LiveNowSection` e `DailyGamesSection` retornam `null` quando não há dados -- o usuario nao ve nada. O codigo esta correto, mas falta um **estado vazio** (empty state) para informar o usuario.

### 2. LiveNowSection com filtro desnecessario
Na home, `LiveNowSection` esta envolvido por `{show(["sports"]) && ...}`. A funcao `show` depende do estado `filter` que nunca muda (CategoryPills foi removido). Embora funcione (filter="all" retorna true), o wrapper `show()` e codigo morto que deve ser limpo.

### 3. Aba "Perfil" para remover
Basta remover do array `navItems` e a logica `navigate("/login")` no `handleTab`.

---

## Plano de implementacao

### 1. `src/components/public/BottomNav.tsx`
- Remover item `profile` do `navItems`
- Remover import `User`
- Remover logica `if (id === "profile")` no `handleTab`
- Remover `useNavigate` se nao for mais usado

### 2. `src/pages/Index.tsx`
- Remover wrapper `show()` do `LiveNowSection` (renderizar direto)
- Remover wrapper `show()` do `NewsReleasesSection`
- Limpar imports nao usados: `CategoryPills`, `ReleaseBanner`, tipo `FilterId`, estado `filter`

### 3. `src/components/public/LiveNowSection.tsx`
- Sem mudancas necessarias (ja funciona corretamente -- mostra quando ha jogos ao vivo, esconde quando nao ha)

### 4. `src/components/public/DailyGamesSection.tsx`
- Adicionar empty state visual quando `games.length === 0` em vez de retornar `null`
- Mostrar mensagem tipo "Nenhum jogo programado para hoje" com icone

---

## Sugestao extra
- Manter o link oculto de acesso admin no footer (ja existe) como alternativa ao perfil removido

