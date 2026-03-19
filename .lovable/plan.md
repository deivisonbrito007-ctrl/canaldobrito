

# Remover Lupa do Navbar

Remover o botão de busca (lupa) do `AppNavbar.tsx` sem afetar nenhuma outra funcionalidade.

## Mudança

**Arquivo**: `src/components/public/AppNavbar.tsx`
- Remover o `<button>` com o ícone `<Search>` (linhas 28-30)
- Remover o import de `Search` do lucide-react (já que não será mais usado)

Nenhum outro componente depende deste botão — ele não tem funcionalidade conectada, é apenas visual.

## Sugestão

- **Adicionar busca funcional no futuro**: Quando quiser implementar busca de verdade, podemos criar um modal de busca com filtros por categoria (filmes, séries, jogos) usando o componente `CommandDialog` que já existe no projeto.

