

# Criar Página de Assinatura (Landing Page)

## Visão Geral
Criar uma página pública `/assinar` inspirada nas imagens de referência, adaptada ao design dark premium do Canal do Brito. Será o destino dos botões "Assinar agora" e "Assine já" existentes no app.

## Estrutura da Página

### Seções (de cima para baixo)
1. **Header** — Logo + botão voltar para home
2. **Banner de urgência** — Countdown timer + "Oferta expira em" (estilo green/primary)
3. **Prova social** — Stats: "5.000+ Clientes", "5.000+ Canais", "4.9 Avaliação"
4. **Card Streaming & TV** — Ícones dos apps disponíveis (Apple TV, Starz, etc.) + badges "Full HD & 4K", "Multi-telas"
5. **Card de Preço** — "TV COMPLETA · R$ 35/mês" com preço riscado, badge "Sem fidelidade"
6. **O que está incluso** — Lista com ícones: canais ao vivo, filmes/séries, esportes, novelas
7. **Dispositivos** — Pills: Smart TV, Celular, Tablet, TV Box, PC
8. **Informações importantes** — Card com aviso sobre ativação por dispositivo e taxa única
9. **Indicação** — "Você também pode ganhar!" com 1ª, 2ª, 3ª indicação e descontos
10. **FAQ** — Accordion com perguntas frequentes (6 perguntas)
11. **CTA Final** — Formulário simples (nome + sobrenome) ou botão direto para WhatsApp
12. **Footer** — "© 2026 Brito Solutions TV"

### Adaptações ao design existente
- Fundo dark (`--background`) em vez do branco das imagens
- Cards com `glass-panel` / `bg-card border-border`
- Acentos em verde (`--primary`) mantendo a identidade
- Tipografia Bebas Neue + Syne
- Ambient blobs e grain overlay (mesmo do portal)

## Arquivos

### Novo: `src/pages/Assinar.tsx`
Página completa com todas as seções. Countdown timer com state local. FAQ usando componente `Accordion` existente. CTA redireciona para WhatsApp com mensagem pré-preenchida.

### Editado: `src/App.tsx`
Adicionar rota `/assinar` apontando para a nova página.

### Editado: `src/components/public/PromoStrip.tsx`
Alterar o link do "Assinar agora" de WhatsApp direto para `/assinar`.

## Detalhes Técnicos
- Countdown timer: calcula fim do dia atual, decrementa a cada segundo
- FAQ: usa `Accordion` do shadcn/ui já existente
- Sem dependência de banco — tudo estático/hardcoded
- Responsivo mobile-first
- Botão CTA final redireciona para WhatsApp: `wa.me/5511940759046`

