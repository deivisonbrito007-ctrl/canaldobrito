

## Plano: Sistema Completo de Banners por Secao + Compartilhamento WhatsApp Status

### Estrutura de Categorias/Secoes

Baseado nos banners que voce mostrou e nas categorias do OmegaPro, o sistema tera estas secoes pre-definidas:

| Secao | Uso |
|---|---|
| Capa / Destaque | Banner principal de abertura (ex: "AGENDA ESPORTIVA") |
| Futebol | Programacao de futebol do dia |
| Basquete | NBA, NBB, etc. |
| UFC / MMA | Cards de luta |
| Demais Esportes | Tenis, F1, Golf, etc. |
| Guia do Futebol | Guia com ligas/horarios |

Cada secao pode ter **multiplos banners** (carrossel) ou **nenhum** (nao aparece no dia).

---

### Implementacao

#### 1. Infraestrutura (Migracao SQL)
- Bucket `banners` publico para armazenar imagens
- Tabela `banners`: `id`, `image_url`, `category` (enum: cover, football, basketball, ufc, other_sports, football_guide), `title` (opcional), `active`, `sort_order`, `expires_at` (nullable - para banners temporarios), `created_at`
- RLS: leitura publica, CRUD admin

#### 2. Aba "Banners" no Admin (`src/pages/Admin.tsx`)
- Adicionar sistema de tabs: **Jogos** | **Banners**
- Na aba Banners:
  - Filtro por categoria (tabs ou pills horizontais)
  - Botao "Upload Banner" abre dialog com: upload de imagem, selecao de categoria, titulo opcional, toggle ativo
  - Grid de banners com preview, badge da categoria, toggle ativo/inativo, botao remover
  - Contador de banners ativos por categoria

#### 3. Carrossel na Pagina Principal (`src/components/BannerCarousel.tsx`)
- Busca banners ativos agrupados por categoria
- Exibe em carrossel horizontal com auto-play (4s), dots de navegacao, swipe mobile
- Formato responsivo: aspect-ratio adaptado (16:9 desktop, mais alto no mobile)
- Categorias sem banners ativos nao aparecem
- Inserido na `Index.tsx` acima do `SportFilter`

#### 4. FAB de Compartilhamento (`src/components/ShareWhatsApp.tsx` -> redesenhar)
- Substituir botao unico por FAB expansivel com 2 opcoes:
  - **Enviar texto** (funcionalidade atual via wa.me)
  - **Baixar imagem para Status** (baixa o banner de "Capa/Destaque" ou programacao ativa para o celular, usando Web Share API quando disponivel)

#### 5. Otimizacoes Mobile
- Touch targets minimos de 44px nos botoes
- Header compacto ja esta bom, manter
- Carrossel com swipe nativo (Embla ja suporta)
- Safe area padding no FAB

---

### Arquivos

| Arquivo | Acao |
|---|---|
| Migracao SQL | Bucket + tabela `banners` + RLS |
| `src/components/BannerCarousel.tsx` | Criar |
| `src/components/ShareWhatsApp.tsx` | Redesenhar como FAB expansivel |
| `src/pages/Admin.tsx` | Adicionar tabs Jogos/Banners + gestao de banners |
| `src/pages/Index.tsx` | Inserir BannerCarousel |

