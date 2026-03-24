

# Auditoria da Aba Configuracoes no Admin

## Bugs Encontrados

### 1. TMDB API Key exposta publicamente (VULNERABILIDADE DE SEGURANCA)
A tabela `settings` tem RLS policy "Anyone can read settings" para SELECT. Isso significa que qualquer pessoa pode fazer `supabase.from("settings").select("*")` e ler a chave TMDB armazenada em texto plano. A chave da API fica visivel no network tab do browser de qualquer visitante.

**Correcao**: Mover a TMDB API key para a tabela de secrets do backend (ja existe `TMDB_API_KEY` como secret? Nao, mas deveria). Alternativa mais simples e sem breaking change: criar uma RLS policy que restringe leitura de settings com `key = 'tmdb_api_key'` apenas para admins. Implementar via uma coluna `is_secret` na tabela settings, com policy que filtra rows secretas para usuarios nao-admin.

**Abordagem escolhida**: Adicionar coluna `is_secret boolean default false` a tabela settings. Alterar a RLS policy de SELECT para excluir rows secretas para usuarios anonimos. Marcar `tmdb_api_key` como `is_secret = true`. O edge function `tmdb-proxy` ja usa service_role_key, entao continua lendo normalmente.

### 2. Save faz 3 mutations sequenciais — falha parcial possivel (BUG)
Se a segunda chamada falhar, a primeira ja foi salva. O usuario ve erro mas WhatsApp ja mudou. Nenhum rollback.

**Correcao**: Usar `Promise.all` para enviar as 3 em paralelo — ou usar um unico upsert batch. Mais simples: trocar para `Promise.all` com as 3 mutations.

### 3. Sem validacao do numero de WhatsApp (UX)
Aceita qualquer texto. Deveria validar que contem apenas numeros e tem pelo menos 10 digitos.

**Correcao**: Adicionar validacao basica antes do save com regex `/^\d{10,15}$/`.

### 4. Sem indicador de estado sujo (dirty state) (UX)
O botao Salvar esta sempre habilitado mesmo sem mudancas. Nao ha indicacao visual de que algo mudou.

**Correcao**: Comparar valores atuais com `settings` original e desabilitar botao quando nao ha mudancas.

### 5. Sem testes unitarios
Nenhum teste existe para AdminConfiguracoes nem useSettings.

## Melhorias Propostas

### 6. Feedback visual de valor salvo com sucesso
Apos salvar, mostrar um check verde temporario ao lado de cada campo confirmando que foi persistido.

### 7. Botao de copiar URL do site
Adicionar icone de clipboard ao lado do campo URL do Site para facilitar copiar a URL configurada.

## Arquivos modificados
- Migration SQL: adicionar coluna `is_secret` a tabela settings, atualizar RLS policy, marcar `tmdb_api_key` como secreta
- `src/pages/admin/AdminConfiguracoes.tsx` — `Promise.all` no save, validacao WhatsApp, dirty state, botao copiar URL
- `src/hooks/useSettings.ts` — sem mudancas necessarias (admin le via authenticated, edge function via service_role)

