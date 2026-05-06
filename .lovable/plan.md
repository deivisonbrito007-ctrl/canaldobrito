
## Atualizar página `/login` para alinhar com o branding

### Comparativo

| Item | `/login` (atual) | `LoginModal` (já atualizado) | Decisão |
|---|---|---|---|
| Background | `bg-gradient-to-b ... via-secondary/20` (tom roxo do print) | dark com primary verde | Usar dark + ambient blobs verdes |
| Botão CTA | shadcn padrão (sem cor primary verde) | `bg-primary` verde | `bg-primary` verde com glow |
| Tipografia título | `font-display text-xl` | bold com primary destacado | `font-display text-2xl uppercase tracking-wider` |
| Inputs | shadcn `Input` (visual roxo no print) | inputs custom dark com `bg-white/[0.04]` | Inputs custom para combinar com modal |
| Logo | sem glow | inline com tema | Logo com halo verde sutil |
| Suporte WhatsApp | ausente | presente | Adicionar |
| iOS/mobile | sem `100dvh`, sem safe-area | usa `visualViewport` | Usar `min-h-[100dvh]`, áreas de toque ≥44px |
| Validação | sem maxLength | sem | Adicionar `maxLength` (255 email / 128 senha) e `email.trim()` |

### Arquivos a editar
- `src/pages/Login.tsx` — reescrita visual mantendo lógica atual (`signIn`, redirect `/admin`, toggle senha, `Navigate` se já admin).
- `src/components/public/LoginModal.tsx` — pequenos ajustes pontuais para paridade:
  - Adicionar `maxLength` nos inputs.
  - `email.trim()` antes do `signIn`.
  - Ícone `Loader2` no botão durante loading.
  - Email placeholder consistente: `admin@britosolutions.tv` (alinhar com o site).

### Mudanças de UI principais em `/login`
- Container: `min-h-[100dvh]` + `bg-gradient from-background to-surface` + 2 ambient blobs `bg-primary/[0.06-0.08]`.
- Card: `rounded-3xl border-white/[0.08] bg-card/90 backdrop-blur-xl` com glow externo verde.
- Logo com halo verde (`bg-primary/20 blur-xl`).
- Título "ADMIN LOGIN" em `font-display` uppercase tracking-wider.
- Inputs custom dark (`bg-white/[0.04]`, focus ring verde).
- Botão "Entrar": `bg-primary` (verde #00ff87) com `shadow-primary/20`, ícone de cadeado, `Loader2` quando carregando, `disabled` se email/senha vazios.
- Divisor "ACESSO RESTRITO" igual ao modal.
- Footer: link "← Voltar para a agenda" + linha "Problemas? Fale com o suporte" (WhatsApp).

### Não muda
- Lógica `useAuth().signIn()` e redirecionamento.
- Rota `/login` em `App.tsx`.
- Sem mudança de banco / RLS / auth providers.

### Sugestões adicionais (opcionais — só se aprovar)
- Caps Lock detector no campo senha (avisar quando ligado).
- Rate limit visual: após 3 tentativas erradas, mostrar contador de cooldown (5s).
- Lembrar email no `localStorage` (checkbox "Lembrar email").

Por padrão **não** vou implementar as opcionais; me avise se quiser alguma.
