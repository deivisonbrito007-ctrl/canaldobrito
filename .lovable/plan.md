Identifiquei dois problemas principais:

1. A transmissão repetida vem do mapeamento por competição aplicado de forma genérica. Hoje `Libertadores` e `Sudamericana` estão cadastradas para sempre preencher todos os jogos com `Paramount+, ESPN Brasil, SBT`. Isso faz aparecer a mesma lista em vários eventos, mesmo quando SBT só exibe um jogo específico.
2. A sincronização está trazendo tudo que a API retorna para 11 esportes, incluindo ligas sem relevância/transmissão no Brasil. Na data atual há 214 eventos, com muitos exemplos como K League, Copa Ecuador, ligas chinesas, israelenses, divisões menores de hóquei etc.

Plano de correção:

1. Ajustar a prioridade dos canais
   - Manter canais vindos diretamente da API (`eventstv.php`) quando forem específicos do evento.
   - Parar de aplicar automaticamente canais genéricos em competições onde a transmissão é por jogo selecionado, especialmente:
     - Libertadores
     - Sul-Americana
     - Champions League
     - Copa do Brasil
     - Brasileirão/Série A/Série B
     - NBA, MLB, NHL, NFL e ligas internacionais
   - Resultado: se a API não confirmar canal para aquele evento, o jogo fica com “Sem transmissão confirmada”, em vez de copiar Paramount+/ESPN/SBT para todos.

2. Reformular `broadcast_overrides`
   - Usar a tabela de aliases apenas para casos confiáveis ou específicos.
   - Remover/desativar seeds genéricas que causam erro, como `libertadores -> Paramount+, ESPN Brasil, SBT` e `sudamericana -> Paramount+, ESPN Brasil, SBT`.
   - Acrescentar um modo de uso recomendado: cadastrar padrões mais específicos, por exemplo:
     - `Sporting Cristal.*Palmeiras` via regex -> canal correto daquele jogo
     - `Deportivo Riestra.*Grêmio` via regex -> canal correto daquele jogo
   - Se necessário, adicionar suporte no sync para match por nome do evento completo (`home_team + away_team + competition`), não apenas competição.

3. Criar filtro persistente de ligas principais
   - Adicionar uma tabela/configuração para permitir somente competições relevantes na programação pública e no sync.
   - Sugestão de estrutura: `league_allowlist` com:
     - `competition_pattern`
     - `match_type` (`contains`, `exact`, `regex`)
     - `sport_type`
     - `priority`
     - `active`
     - `notes`
   - Seed inicial com ligas principais que fazem sentido para o público brasileiro, por exemplo:
     - Futebol Brasil: Brasileirão A/B/C, Copa do Brasil, estaduais relevantes
     - Conmebol: Libertadores, Sul-Americana, Recopa
     - Europa principais: Champions, Europa League, Conference, Premier League, La Liga, Serie A Itália, Bundesliga, Ligue 1
     - Seleções: Copa do Mundo, Eliminatórias, Copa América, Euro
     - Esportes selecionados: NBA, NFL, MLB, NHL, F1, MotoGP, UFC, Superliga
   - Tudo fora da allowlist será ignorado no sync, evitando ligas sem transmissão e excesso de cards.

4. Atualizar a função `sync-thesportsdb`
   - Aplicar a allowlist antes de inserir/atualizar eventos.
   - Registrar no audit log quantos eventos foram ignorados por liga não permitida.
   - Garantir que eventos existentes vindos da API e fora da allowlist possam ser limpos/arquivados após a correção.
   - Corrigir o bug de chamada atual: `lookupBroadcastFallback(competition, sportType)` está sendo chamado com dois argumentos, mas a função aceita apenas um; vou ajustar a assinatura/uso.

5. Melhorar o painel Admin
   - Evoluir `/admin/canais` para deixar claro que overrides genéricos podem ser perigosos.
   - Adicionar campos/filtros para aliases por evento específico quando necessário.
   - Criar ou adicionar uma área de “Ligas permitidas” para o admin ativar/desativar competições sem mexer em código.
   - No “Sync Stats”, mostrar:
     - ligas ignoradas pela allowlist
     - eventos sem canal confirmado
     - eventos com canal vindo da API
     - eventos com override manual

6. Limpeza dos dados atuais
   - Após ajustar a regra, limpar/arquivar os eventos TheSportsDB do dia que estão fora da allowlist.
   - Reexecutar a sincronização para repopular somente ligas principais.
   - Remover canais genéricos aplicados incorretamente nos jogos atuais, preservando apenas canais confirmados pela API ou overrides específicos.

Resultado esperado:
- A programação deixa de mostrar centenas de ligas irrelevantes.
- Libertadores/Sul-Americana não recebem automaticamente a mesma transmissão em todos os jogos.
- SBT só aparecerá quando cadastrado especificamente ou confirmado pela API.
- Paramount+ pode continuar aparecendo em múltiplos jogos apenas quando houver confirmação confiável ou override consciente.
- O admin ganha controle persistente para ajustar canais e ligas sem novo deploy.