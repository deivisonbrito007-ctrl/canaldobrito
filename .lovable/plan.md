

# Adicionar botão "Assine Já" ao lado do branding Brito Solutions

## O que será feito

Adicionar um botão CTA "Assine Já" ao lado do nome "Brito Solutions" no `CategoryIconsCarousel`, que direciona para o WhatsApp da Brito Solutions com uma mensagem pré-formatada de interesse em assinatura.

## Mudanças

### `src/components/public/CategoryIconsCarousel.tsx`
- Reorganizar o header para layout `flex` com o nome à esquerda e o botão à direita
- Adicionar botão "Assine Já" com ícone do WhatsApp (SVG inline), estilizado em verde WhatsApp (`hsl(142,70%,38%)`)
- Ao clicar, abre `https://wa.me/5511940759046?text=...` com mensagem: "Olá! Tenho interesse em assinar o plano Brito Solutions 📺"
- Botão compacto com animação hover (scale + brilho), bordas arredondadas, min-height 44px para acessibilidade

### Sugestões adicionais
- **Pulse sutil**: animação `animate-pulse` discreta no botão para chamar atenção na primeira visita
- **Ícone WhatsApp**: usar SVG do WhatsApp (já presente no projeto via `WhatsAppFab`) para consistência visual

## Resultado esperado
- Branding "Brito Solutions" à esquerda, botão "Assine Já" à direita na mesma linha
- Toque no botão abre WhatsApp com mensagem de interesse pré-preenchida

