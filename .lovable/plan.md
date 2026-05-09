## Objetivo

Garantir que **nenhuma chamada à IA** aconteça na aba Banners → Programação sem o usuário pedir explicitamente.

## Onde a IA é disparada hoje

1. **Colar imagem (Ctrl+V) no textarea** → dispara `handleReadImage` automaticamente, que chama a edge function `read-schedule-image` (IA). ❌ Não solicitado.
2. **Selecionar arquivo via "📷 Ler Imagem"** → chama `handleReadImage` (IA). ✅ Já é ação explícita.
3. **Botão "Normalizar com IA"** → IA. ✅ Já é ação explícita.
4. **OCR de imagem em `ImageUpload`/banner upload** (se existir) → verificar.

## Mudanças propostas

### 1. Colar imagem deixa de chamar IA automaticamente

No `onPaste` do textarea: quando uma imagem é detectada, **não** chamar `handleReadImage` direto. Em vez disso:
- Guardar o arquivo em `pendingImage` (state).
- Mostrar um banner discreto acima do textarea: *"📷 Imagem colada — pronta para extrair com IA"* + dois botões: **"Extrair com IA"** (dispara `handleReadImage`) e **"Descartar"**.
- Nada é enviado para o backend até o clique.

### 2. Renomear "📷 Ler Imagem" → "📷 Ler Imagem (IA)"

Deixa explícito ao usuário que esse botão consome IA/créditos. Mesmo comportamento, só rótulo + tooltip *"Usa IA para extrair texto da imagem"*.

### 3. Remover o auto-toast "📷 Imagem detectada, processando..."

Era a confirmação de que estava chamando IA sem pedir. Não faz mais sentido.

### 4. Verificação extra

Auditar `src/components/admin/AdminBanners.tsx`, `BannerUpload`, e qualquer outro componente da aba Banners para confirmar que nenhum upload de banner também chama IA silenciosamente. Se chamar, aplicar o mesmo padrão (pedir confirmação).

## Sugestões adicionais

- **Indicador de custo**: badge "IA" cinza nos dois botões que consomem créditos (📷 Ler Imagem e Normalizar com IA), para reforçar visualmente.
- **Atalho de teclado**: `Ctrl+Shift+I` para extrair a `pendingImage` sem precisar clicar — mantém produtividade para quem quer.
- **Preferência persistida** (opcional, OFF por default): toggle em Configuração *"Auto-extrair imagens coladas com IA"*. Quem realmente quer o comportamento antigo pode reativar. Salva em `localStorage`.

## Arquivos afetados

- `src/components/admin/ProgramacaoTexto.tsx` — alterar `onPaste`, adicionar UI de confirmação, renomear botão, novo state `pendingImage`.
- (verificar) `src/components/admin/AdminBanners.tsx` e correlatos.

## Confirmações que preciso

1. Quer incluir o **toggle "Auto-extrair colando imagem"** (default OFF) ou prefere manter sempre manual?
2. Quer o **atalho Ctrl+Shift+I** para extração rápida da imagem pendente?
