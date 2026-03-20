

# Feature: Leitura de Imagem com IA para Programação

## Resumo

Adicionar botão "📷 Ler Imagem" no ProgramacaoTexto que permite ao admin enviar uma foto de programação esportiva e ter o texto extraído automaticamente no formato esperado pelo parser.

## Alterações

### 1. Criar edge function `read-schedule-image`
- Recebe imagem em base64 via POST
- Chama Lovable AI Gateway com modelo `google/gemini-2.5-flash` (multimodal, rápido e barato)
- System prompt instrui o modelo a retornar texto no formato exato do parser:
  ```
  📅**Dia DD/MM**
  Time A x Time B
  🏆 Competição (detalhe) / ⏰ HHhMM
  📺 Canal1, Canal2
  ```
- Sem streaming — resposta única
- CORS headers incluídos
- Tratamento de erros 429/402

### 2. Atualizar `ProgramacaoTexto.tsx`
- Adicionar botão "📷 Ler Imagem" ao lado dos botões existentes
- Input file oculto para aceitar imagens
- Converter imagem para base64 e chamar edge function via `supabase.functions.invoke`
- Preencher o textarea com o resultado retornado
- Loading state durante processamento
- Toast de sucesso/erro

### 3. Atualizar `supabase/config.toml`
- Adicionar entrada para `read-schedule-image` com `verify_jwt = false`

## Detalhes técnicos

- Modelo: `google/gemini-2.5-flash` — suporta imagens, custo baixo, já incluso no Lovable Cloud
- `LOVABLE_API_KEY` já está configurado nos secrets
- A imagem é enviada como data URI base64 no campo `image_url` do array de messages
- Nenhum secret adicional necessário

