
Objetivo: corrigir de forma definitiva o erro ao agendar jogos e aproveitar para limpar 2 pontos de robustez na aba Programação.

Diagnóstico confirmado:
- O erro não está no banco nem no campo `publish_at`.
- O request de insert para `daily_games` ainda está saindo com texto inválido no JSON, por exemplo:
  - `"\uddf9\uddf7 Turquia"`
  - `"\uddee\uddf9 Itália"`
- Isso prova que o problema não são “flags válidas” apenas; o texto já chega/quebra como fragmentos UTF-16 inválidos.
- Por isso a regex atual com `[\u{1F1E6}-\u{1F1FF}]` não resolve: ela só pega codepoints válidos, não surrogates quebrados.

O que será feito:

1. Fortalecer a sanitização em `src/components/admin/ProgramacaoTexto.tsx`
- Substituir a limpeza atual por uma sanitização mais robusta para importação:
  - remover bandeiras válidas
  - remover qualquer surrogate UTF-16 solto ou quebrado (`[\uD800-\uDFFF]`)
  - normalizar espaços
- Aplicar isso em:
  - `home_team`
  - `away_team`
  - `competition`
  - `competition_detail`
  - `channels`

2. Adicionar uma segunda barreira no payload antes do insert
- Em `buildInsertPayload`, sanitizar novamente todos os campos string e arrays de string.
- Assim, mesmo se algum texto “escapar” do parser/edição manual, o payload final sai limpo antes do POST.

3. Melhorar o hook de inserção em `src/hooks/useDailyGames.ts`
- Criar uma sanitização defensiva dentro do fluxo de insert de `daily_games`.
- Isso vira proteção central para qualquer inserção futura de jogos, não só pela Programação.
- Se houver dado inválido, o hook envia a versão limpa, evitando repetir esse erro em outros pontos.

4. Corrigir o warning de ref no diálogo da Programação
- O console mostra warning de `Function components cannot be given refs` ao abrir os AlertDialogs.
- Vou revisar os botões/ações do diálogo em `ProgramacaoTexto.tsx` para seguir o padrão esperado pelo Radix/shadcn e eliminar o warning sem alterar o comportamento.

5. Pequenas melhorias na aba Programação
- Adicionar validação visual antes de publicar/agendar para indicar quando algum item foi “limpo” de emojis problemáticos.
- Melhorar a mensagem de erro para ficar específica se ainda houver falha no insert.
- Garantir que o fluxo “Agendar” e “Publicar” use o mesmo sanitizador.

Arquivos envolvidos:
- `src/components/admin/ProgramacaoTexto.tsx`
- `src/hooks/useDailyGames.ts`

Resultado esperado:
- Jogos com bandeiras/emoji no texto serão agendados normalmente.
- O POST para `daily_games` não enviará mais surrogates inválidos.
- O warning de ref do AlertDialog deixará de aparecer.
- A aba Programação ficará mais resiliente para textos copiados do WhatsApp/TV/feeds.

Melhorias sugeridas depois da correção:
- Mostrar um contador “X nomes foram normalizados” após o processamento.
- Adicionar preview destacando termos limpos automaticamente.
- Criar um botão “Remover emojis/bandeiras do texto” antes do processamento para deixar o comportamento mais explícito.
