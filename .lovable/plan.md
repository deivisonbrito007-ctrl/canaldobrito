## Diagnóstico (verificado no banco e no código)

Consultei os canais realmente usados em `daily_games` (últimos 60 dias) e comparei com o mapa embutido (`ChannelBadge.tsx`) e com a tabela de mapeamentos (que hoje tem **apenas 6 linhas**: espn, Globo, Max, premiere, Record, sportv — sendo que "Max" está com `logo_key: none`, ou seja, sem logo mesmo tendo asset disponível).

Três problemas distintos:

**1. Nomes quebrados pelo parser entram como canal**
Existem "canais" gravados como `MG)`, `MA)`, `PR`, `Globo (SP`, `Globo (RS`, `SporTV-PFC`, `SporTV-Premiere 6`. São quebras de split por vírgula/hífen dentro de parênteses. Além de poluir a aba Canais e Logos, `PR` casa por substring com **Premiere** (a busca por substring aceita 2 letras), mostrando a logo errada.

**2. Matching por substring gera logo errada e é imprevisível**
`matchChannel` percorre o mapa e aceita qualquer `key.includes(k) || k.includes(key)`, sem ordenar por tamanho e sem mínimo de caracteres. Consequências: `PR` → Premiere; `GE` → GE TV (por sorte); a primeira chave da iteração ganha, então o resultado depende da ordem de declaração do objeto. Também a normalização não remove `(`, `)`, `.`, `/`, `,`, então `Globo (PE)` e `RedeTV!` variantes não casam de forma consistente.

**3. Canais reais sem logo nenhuma (só emoji 📺)**
Com contagem de uso nos últimos 60 dias: `SportyNet` (46) e `SportyNet+` — casam com `snet`, mas a arte usada é a antiga; `YouTube Metrópoles` (25), `LNF TV` / `YouTube LNF TV` (40), `YouTube UOL Esporte` / `UOL Play` (19), `GPTV` (9), `PhizTV` (9), `TV Brasil` (10), `GE` / `GETV` variantes, `CBFS TV` (5), `Record News`, `TV ALERJ`, `YouTube Stock Car`, `YouTube Vôlei Brasil`, `YouTube NBA Brasil`, `YouTube LiveBasketBR`, `YouTube Lance!`, `YouTube Flamengo TV`, `YouTube Botafogo TV`, `YouTube Massa Bruta`, `YouTube Paulistão`, `YouTube STU Channel`, `YouTube Canal Gol BR`, `YouTube Ulisses TV`.
Para todos os `YouTube <algo>` o correto é cair na logo do YouTube quando não houver arte própria — hoje isso é acidental.

## O que vou fazer

### Etapa 1 — Matching confiável (frontend)
- `normalizeChannelName`: remover também `( ) . , / & '` e sufixos numéricos de canal (`SporTV 2`, `ESPN4`, `Premiere 6`) passam a resolver para a marca base de forma explícita, não por acidente.
- Reescrever `matchChannel`: 1) match exato normalizado → 2) alias do banco → 3) regra de prefixo `youtube*` → 4) match por substring **apenas com chave de 4+ caracteres e ordenado do mais longo para o mais curto**. Isso elimina `PR` → Premiere e torna o resultado determinístico.
- Regras derivadas: `SporTV N`, `ESPN N`, `Premiere N`, `Combate N`, `SportyNet+` herdam a marca e ganham o número como sufixo no rótulo (`SporTV 2` continua escrito por extenso, só a logo é herdada).

### Etapa 2 — Cobertura de logos
- Cadastrar mapeamentos + aliases para todos os canais reais listados acima, apontando para logos existentes quando houver marca-mãe (YouTube, GE/Globo, Record News → Record, TV Brasil, SportyNet → SNet, Combate 2 → Combate, Premiere 2-6 → Premiere, HBO Max → Max).
- Corrigir o mapeamento "Max" que está com `logo_key: none` para usar o asset `max.png`.
- Para os canais sem nenhuma arte disponível (PhizTV, GPTV, CBFS TV, LNF TV, TV ALERJ, Metrópoles, UOL), aplicar um **chip de iniciais** consistente (ex.: "LNF", "PHZ") em vez do emoji 📺 genérico — legível e sem parecer erro.

### Etapa 3 — Limpeza dos nomes quebrados
- Normalizar na leitura: canais que são só UF/fragmento (`PR`, `MG)`, `MA)`, `SP`) ou `Globo (XX` são reconhectados ao canal anterior/base e não aparecem mais como badge separado.
- Corrigir o split de canais no parser (`ProgramacaoTexto.tsx` / `gameUtils.ts`) para não quebrar dentro de parênteses, evitando novos casos.
- Migração de limpeza dos registros já gravados nesses formatos.

### Etapa 4 — Melhorias na aba Canais e Logos
- Aba **Órfãos** passa a mostrar por que está órfão (sem mapeamento / mapeamento com `logo_key: none` / arte quebrada) — hoje "Max" não aparece como problema mesmo estando sem logo.
- Janela de descoberta de 30 → 90 dias, com seletor, para não esconder canais de campeonatos sazonais.
- Botão **"Auditar logos"**: testa o carregamento de cada `custom_logo_url`/asset e marca as que retornam 404 ou imagem vazia.
- Contadores de cobertura no topo: `X% dos canais em uso têm logo` + lista dos 5 órfãos mais frequentes.
- Melhorar o auto-vínculo para sugerir também as regras de marca-mãe (YouTube/Premiere/ESPN numerados), não só similaridade de texto.

## Detalhes técnicos
Arquivos afetados: `src/components/public/channelLogos.ts` (normalização e regras), `src/components/public/ChannelBadge.tsx` (matching + chip de iniciais), `src/hooks/useDiscoveredChannels.ts` (janela e classificação de órfão), `src/pages/admin/AdminCanaisLogos.tsx` (auditoria, cobertura, auto-vínculo), `src/lib/gameUtils.ts` e `src/components/admin/ProgramacaoTexto.tsx` (split de canais). Duas migrações: seed/correção de `channel_logo_mappings` + `channel_aliases`, e limpeza dos canais quebrados em `daily_games`. Testes novos em `ChannelBadge.test.tsx` cobrindo `PR`, `SporTV 2`, `YouTube <algo>` e `Globo (PE)`.
