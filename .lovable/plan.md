

# Aplicar Design do Portal no Admin + Correções

## Problemas Encontrados

1. **AdminWhatsApp** usa `glass-card` em vez de `glass-panel` (inconsistente com todas as outras páginas admin)
2. **AdminWhatsApp** usa classe `animate-float-in` que nao existe no CSS
3. **AdminWhatsApp** header usa estilo diferente (`font-display text-lg`) em vez do padrão `glass-panel` com icone usado nas outras páginas
4. **AdminLayout** nao tem os ambient blobs verdes do portal (efeito premium da marca)
5. **AdminLayout** nao tem o grain overlay do portal
6. Admin nao tem o efeito de glow sutil da marca verde

## Plano

### 1. Adicionar Ambient Blobs + Grain ao AdminLayout
Inserir os mesmos blobs verdes animados e o grain overlay que o portal usa, mas com opacidade reduzida para nao competir com o conteudo admin:
- Blob superior-direito (opacity 0.04 em vez de 0.06)
- Blob inferior-esquerdo (opacity 0.03 em vez de 0.04)
- Grain overlay

### 2. Corrigir AdminWhatsApp
- Trocar todas as `glass-card` por `glass-panel` para consistencia
- Remover `animate-float-in` inexistente
- Reestruturar header para usar o padrao de panel com icone (igual AdminConfiguracoes, AdminFilmes, etc.)
- Agrupar "Link do Site" e "Mensagem Personalizada" dentro de panels com header padrao

### 3. Adicionar glow sutil no header do AdminLayout
Aplicar `glow-primary-subtle` (shadow verde sutil) no header, alinhando com a estética premium do portal.

## Arquivos Modificados
- `src/pages/AdminLayout.tsx` — blobs, grain, glow no header
- `src/pages/admin/AdminWhatsApp.tsx` — glass-card → glass-panel, fix classes, padronizar headers

