

# Remover botoes de compartilhamento do footer publico

## Contexto
Os botoes de WhatsApp e Compartilhar no footer sao funcionalidades de divulgacao — pertencem ao admin (que ja tem a pagina `/admin/whatsapp`). O visitante so precisa consumir o conteudo.

## Mudanca

### `src/components/public/PublicFooter.tsx`
- Remover os botoes de WhatsApp e Compartilhar
- Manter apenas: logo/brand + link oculto para login
- Footer fica minimalista e limpo

## Sugestao extra
- Adicionar um link de contato via WhatsApp do suporte (nao compartilhamento, mas canal direto com a Brito Solutions) — isso sim faz sentido para o visitante. Um botao discreto "Fale conosco" que abre o WhatsApp com o numero da empresa. Se quiser, posso incluir isso.

