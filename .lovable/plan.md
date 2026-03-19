

# Simplificar Aba WhatsApp — Apenas Textos de Compartilhamento

## O que muda

Remover toda a seção de geração de imagens (canvas, StatusPreview, drawStatusCanvas, roundRect) e manter apenas os cards de mensagens prontas com botões "Copiar" e "Enviar no WhatsApp".

## Sugestoes de melhoria

1. **Copiar apenas o link** — adicionar um botao dedicado para copiar somente a URL do site (sem mensagem), util para colar em qualquer lugar
2. **Template com lista de jogos do dia** — gerar automaticamente um texto com os jogos formatados (horario + times + competicao) pronto para colar
3. **Mensagem personalizada** — campo de texto livre onde o admin digita o que quiser e o link e adicionado automaticamente no final

## Alteracoes

### `src/pages/admin/AdminWhatsApp.tsx`
- Remover: `drawStatusCanvas`, `roundRect`, `StatusPreview`, tipos `StatusTemplate`, `GameData`, `ContentData`, imports de `useRef`, `useCallback`, `Download`, `Zap`, `useActiveMovies`, `useActiveSeries`
- Remover: toda a seção "Imagens para Status (9:16)" do JSX
- Adicionar: botao "Copiar Link" que copia apenas a URL
- Adicionar: template "Jogos do Dia" que lista automaticamente os jogos com horario e times
- Adicionar: campo de texto livre para mensagem personalizada com link auto-anexado
- Atualizar header e descricao da pagina

