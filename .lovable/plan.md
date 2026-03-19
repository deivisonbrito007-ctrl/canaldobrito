

# Melhorias na Tela de Login

## Problemas Identificados

1. **Visual básico demais** — fundo plano sem profundidade, card simples sem destaque visual
2. **Sem feedback visual de segurança** — apenas um ícone de cadeado no botão, sem transmitir confiança
3. **Erro exibido sem destaque** — mensagem de erro é só texto vermelho, fácil de ignorar
4. **Link "Voltar" usa `<a>` em vez de React Router** — causa reload completo da página
5. **Sem toggle de visibilidade da senha** — comum em telas de login modernas
6. **Sem redirecionamento automático** — se o usuário já está logado como admin, deveria ir direto para `/admin`

## Plano de Melhorias

### 1. Redirect se já autenticado
- Usar `useAuth()` para checar `isAdmin` e redirecionar com `<Navigate>` se já logado

### 2. Visual mais premium
- Adicionar gradient sutil no fundo (`from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f]`)
- Glow effect atrás do card com `before:` pseudo-element via classe
- Logo maior (`h-16`) com leve animação de entrada

### 3. Toggle mostrar/ocultar senha
- Botão com ícone `Eye`/`EyeOff` dentro do campo de senha

### 4. Erro com estilo melhor
- Usar div com background `bg-destructive/10` e borda `border-destructive/30` em vez de texto simples

### 5. Link "Voltar" com React Router
- Trocar `<a href="/">` por `<Link to="/">` para evitar reload

### Arquivo alterado
- `src/pages/Login.tsx`

