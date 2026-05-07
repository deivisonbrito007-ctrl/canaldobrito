## Objetivo
Restaurar o acesso ao painel `/admin` (que está bloqueando você por causa de uma recursão de RLS introduzida na migration de segurança) e melhorar a tela de "Acesso Restrito".

## 1. Migration: corrigir `has_role`

Voltar a função para `SECURITY DEFINER` (padrão recomendado para checagem de roles, evita recursão na policy de `user_roles`). EXECUTE permanece restrito a usuários autenticados.

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
```

O linter vai voltar a mostrar 1 warning ("authenticated can execute SECURITY DEFINER") — vou marcá-lo como **aceito** com justificativa (a função só retorna boolean, não vaza dados, e é o padrão oficial Supabase para evitar recursão). Atualizo também o `@security-memory` registrando isso.

## 2. Melhorias de UX na tela de Acesso Restrito

Em `src/components/admin/RequireAdmin.tsx` e `src/contexts/AuthContext.tsx`:

- **Loading state correto**: adicionar flag `roleChecked` no `AuthContext` para que `RequireAdmin` mostre um skeleton/spinner enquanto a checagem de role está em andamento, em vez de mostrar "Acesso Restrito" por uma fração de segundo.
- **Mensagem mais útil**: exibir o e-mail logado (`Conta: solutionsbrito@gmail.com`) para confirmar qual usuário foi autenticado.
- **Botão "Tentar novamente"**: re-executa `checkAdmin(user.id)` sem precisar deslogar (útil quando o role acabou de ser concedido).
- Manter os botões existentes "Voltar ao site" e "Trocar de conta".

## Arquivos afetados
- `supabase/migrations/<nova>.sql` (nova migration)
- `src/contexts/AuthContext.tsx` (expor `roleChecked` + função `recheckAdmin`)
- `src/components/admin/RequireAdmin.tsx` (loading + UI melhorada)
- `@security-memory` (registrar warning aceito)

## Resultado esperado
- `/admin` libera novamente para sua conta.
- Sem warnings críticos do linter; o único warning restante fica documentado e justificado.
- Tela de bloqueio mais informativa nos casos legítimos.
