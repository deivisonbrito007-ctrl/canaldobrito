

# Colar Imagem no Textarea (Ctrl+V)

## O que será feito

Adicionar suporte para colar imagens diretamente no textarea da programação usando Ctrl+V. Quando o admin colar uma imagem (ex: screenshot do WhatsApp), ela será automaticamente enviada para a IA extrair o texto — sem precisar clicar no botão "📷 Ler Imagem".

## Alterações

### 1. Adicionar handler `onPaste` no Textarea (`ProgramacaoTexto.tsx`)
- Interceptar evento `paste` no textarea
- Verificar se o clipboard contém imagem (`clipboardData.items` com tipo `image/*`)
- Se contiver imagem: prevenir o paste padrão, extrair o `File`, e chamar `handleReadImage(file)` (função já existente)
- Se for texto normal: deixar o comportamento padrão do paste acontecer
- Mostrar toast informativo "Imagem detectada, processando..." ao detectar imagem colada

### 2. Feedback visual
- Adicionar texto auxiliar abaixo do textarea: "💡 Cole uma imagem (Ctrl+V) para extrair a programação automaticamente"
- Durante processamento, o textarea fica desabilitado (já acontece via `readingImage`)

## Detalhes técnicos

- Reutiliza 100% da função `handleReadImage` já existente — zero duplicação
- Única mudança: adicionar `onPaste` handler no `<Textarea>` (linhas 366-371)
- Adicionar hint text abaixo do textarea (1 linha de JSX)
- Nenhuma mudança em edge function ou backend

