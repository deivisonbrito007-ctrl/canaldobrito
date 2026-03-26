

## Problema: PWA mostra versão antiga após publicação

O `registerType: "autoUpdate"` no `vite-plugin-pwa` registra o SW automaticamente, mas **não força a ativação imediata** do novo SW. O comportamento padrão do browser é: o novo SW fica "waiting" até que todas as abas sejam fechadas. Isso faz com que usuários com o PWA instalado continuem vendo a versão antiga.

Além disso, o `main.tsx` não tem nenhum código para detectar atualizações do SW e recarregar a página.

## Solução: Forçar `skipWaiting` + reload automático

### 1. `src/sw.ts` — Adicionar `skipWaiting` e `clientsClaim`

No topo do service worker, após o `precacheAndRoute`, adicionar:

```ts
import { clientsClaim } from "workbox-core";
clientsClaim();
self.skipWaiting();
```

Isso faz o novo SW assumir o controle imediatamente, sem esperar fechar abas.

### 2. `src/main.tsx` — Detectar atualização e recarregar

Após montar o React, registrar um listener que detecta quando o SW é atualizado e recarrega a página automaticamente:

```ts
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}
```

### 3. `src/sw.ts` — Limpar caches antigos na ativação

Adicionar listener de `activate` que limpa caches obsoletos:

```ts
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== "google-fonts" && name !== "tmdb-images")
          .filter((name) => !name.startsWith("workbox-precache"))
          .map((name) => caches.delete(name))
      )
    )
  );
});
```

### Resultado esperado

- Ao publicar, o novo SW é instalado e assume controle imediatamente (`skipWaiting` + `clientsClaim`)
- A página recarrega automaticamente quando o novo SW ativa (`controllerchange`)
- Caches obsoletos são limpos na ativação
- Usuários com PWA instalado recebem a versão nova sem precisar fechar e reabrir o app

### Arquivos alterados
- `src/sw.ts` (2 adições: imports + activate listener)
- `src/main.tsx` (1 adição: controllerchange listener)

