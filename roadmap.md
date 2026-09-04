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
