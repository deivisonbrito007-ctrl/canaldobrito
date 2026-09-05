# Roadmap — Refino geral Canal do Brito

- [x] Fase 1 — Menu/rotas: Banners→Programação, redirects, 404 admin, login modal
- [x] Fase 2 — Programação pública: busca, chips status/esporte/canal, ordenação, desktop grid, Horário de Brasília
- [x] Fase 3 — Canais/Logos: type + primary_color, mesclar, canal desconhecido no import
- [x] Fase 4 — Revisão antes de publicar, arquivados paginados, Filmes/Séries público + admin, Novidades agenda
- [x] Fase 5 — WhatsApp: bugs, rótulos, botões, histórico
- [x] Fase 6 — Dashboard: gráfico único, checklist saúde, ações rápidas
- [x] Fase 7 — Analytics: CTR, funil
- [x] Fase 8 — Auditoria triggers + filtros, Segurança last scan
- [x] Fase 9 — Acessibilidade/responsividade + testes (suite verde; checagem visual mobile/desktop)

## Etapa Canais (set/2026)
- [x] Regra central de normalização (`channelResolver`) usada por admin e público
- [x] Badges públicos: nome oficial, cor do canal, fallback iniciais, "+N" expansível
- [x] Admin Canais: filtros (Sem logo/Com logo/Conflitos/Inativos), busca por apelido, apelidos no cadastro, deep-link ?novo=
- [x] Importação: avisos por jogo (desconhecido / sem logo / normalizado) + ações "Criar canal" e "Apelido de…"; canais salvos já normalizados
- [x] Checklist do dashboard: canais desconhecidos, sem cadastro, sem logo, apelidos em conflito
- [x] Seed de 23 canais + apelidos
- [ ] Logo quebrada (URL externa) — só detectável no navegador; badge cai para iniciais automaticamente

- [x] Programação pública: busca (time/competição/esporte/canal/alias), status "Em breve" = tudo por começar, ordem padrão por horário (Agora/Próximos/Mais tarde/Encerrados), chips de canal com logo, +N expansível nos cards, estados vazios e analytics de filtros.

## Etapa WhatsApp (set/2026)
- [x] Formatos: Completa, Curta, Ao vivo (fallback próximos), Próximos (qtd configurável), Filmes/Séries
- [x] Prévia estilo WhatsApp, editar, restaurar padrão, link rastreado (whatsapp-*), ?date= preservado no link curto
- [x] Últimos envios: formato, aba, data, nº de jogos, acessos 7d, ver/copiar/reenviar

## Polimento final geral — concluído
- Menu admin: "Canais/Logos" → "Canais"; Diagnóstico GitHub saiu do menu (fica em Configurações › Ferramentas técnicas); rotas antigas mantidas.
- Nomenclatura: ação de exclusão padronizada como "Remover" em todo o admin; termos técnicos (payload, tab_view, shares, landings, utm_content, CTR seco) traduzidos em Auditoria, Analytics, WhatsApp e Laboratório A/B.
- Estados vazios com orientação + CTA em Filmes, Séries, Novidades, Canais, Auditoria, Histórico WhatsApp e Atividade recente do dashboard.
- Confirmação adicionada para desativação em massa (Filmes/Séries/Novidades).
- Teste novo: `src/pages/__tests__/adminRoutes.test.ts` garante que todo item do menu tem rota (sem 404) e sem nomes antigos.
- Type-check, 417 testes e build OK; sem scroll horizontal em 375/1280.

## SportsAPI Pro (concluído)
- [x] Backend seguro (`sportsapi-sync`) com chave só no servidor, cache 10 min, limite 120 req/min
- [x] Tabelas de sugestões/execuções + campos de placar/status em daily_games
- [x] Classificação: só Brasil ou canal reconhecido; país embutido no nome ("(Bra)", "(Usa)") tratado
- [x] Admin: aba "Sugestões da API" (importar/ignorar/atualizar/associar canal) + Configurações
- [x] Público: placar e relógio ao vivo discretos; jogos da API sem canal nunca aparecem
- [x] WhatsApp: placar/relógio em jogos ao vivo/encerrados
- [x] Canais: indicador de uso pela SportsAPI
- [x] Atualização ao vivo agendada a cada 3 min (segredo interno; pula se desligada/sem jogos)
- [x] Auditoria: trigger corrigido (settings sem campo `active`); funções internas com EXECUTE restrito
- [x] 438 testes passando, build OK, sem scroll horizontal 375/1280

## SportsAPI revisão (concluída)
- [x] Filtro Brasil: isBrazilBroadcast + canal estrangeiro por nome + status ignorado_canal_estrangeiro
- [x] Ao vivo: atualizar jogos manuais correspondentes; live para todos esportes
- [x] Automação: cron sugestões (hoje+amanhã, horário comercial) + live adaptativo por config
- [x] Cota: contagem dia/mês, painel técnico, testar conexão
- [x] Configurações + painel admin (motivos, filtros, resumo)
- [x] Testes, build, browser
