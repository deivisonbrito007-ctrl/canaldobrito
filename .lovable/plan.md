

## Correções no Sistema PWA + Push Notifications

### Problemas encontrados

**1. Bug critico na criptografia das notificações push (Edge Function)**

No arquivo `supabase/functions/send-push-notifications/index.ts`, a funcao `encryptPayload` tem um erro na derivacao de chaves. A variavel `ikmInput` (linha 74) e calculada mas **nunca usada**. O fluxo correto segundo a RFC 8291 e:

```text
Passo 1: PRK_key  = HMAC(auth_secret, shared_secret)        ✓ feito (linha 77)
Passo 2: IKM      = HMAC(PRK_key, key_info || 0x01)         ✗ FALTANDO
Passo 3: PRK      = HMAC(salt, IKM)                         ✓ feito (mas usa resultado errado)
Passo 4: CEK/Nonce derivados do PRK                          ✓ feito
```

O passo 2 esta faltando — o codigo pula direto do passo 1 para o 3, usando `PRK_key` como se fosse `IKM`. Resultado: a criptografia gera dados que o navegador **nao consegue descriptografar**, entao as notificacoes push nunca aparecem no dispositivo do cliente, mesmo que o envio retorne status 201.

**Correcao:** Na funcao `encryptPayload`, apos calcular `ikm` (que na verdade e `PRK_key`), adicionar o passo de HKDF-Expand usando `ikmInput` para derivar o IKM real:

```typescript
// Step 1: PRK_key = HMAC(auth_secret, shared_secret)
const prkAuth = await crypto.subtle.importKey("raw", authSecret, ...);
const prkKey1 = new Uint8Array(await crypto.subtle.sign("HMAC", prkAuth, sharedSecret));

// Step 2: IKM = HMAC(PRK_key, key_info || 0x01)  ← ADICIONAR
const prkKey1Import = await crypto.subtle.importKey("raw", prkKey1, ...);
const ikm = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey1Import, 
  new Uint8Array([...ikmInput, 1])));

// Step 3: PRK = HMAC(salt, IKM)  ← agora usa o IKM correto
```

**2. Manifesto PWA duplicado/conflitante**

O arquivo `public/manifest.json` tem apenas um icone de favicon (48x48). Porem o `vite.config.ts` gera um manifesto completo com icones 192 e 512. No build, o VitePWA gera o manifesto correto, mas o `index.html` aponta para `/manifest.json` (o estatico). No build final o VitePWA injeta o link correto, mas o arquivo estatico pode causar confusao.

**Correcao:** Remover `public/manifest.json` (o estatico) e remover o `<link rel="manifest">` do `index.html` — o VitePWA ja injeta o link automaticamente no build.

**3. Emoji no titulo da notificacao pode falhar em alguns push services**

O payload usa `"⚽ Começa em 15 min!"` como titulo. Alguns push services intermediarios podem cortar/corromper o emoji. Nao e critico, mas seria mais seguro usar texto puro.

### Resumo das alteracoes

| Arquivo | O que muda |
|---------|-----------|
| `supabase/functions/send-push-notifications/index.ts` | Corrigir HKDF step 2 na `encryptPayload` |
| `public/manifest.json` | Remover arquivo (VitePWA gera o correto) |
| `index.html` | Remover `<link rel="manifest">` manual |

### Resultado esperado

- Notificacoes push serao **realmente recebidas** pelos clientes (hoje a criptografia esta quebrada)
- PWA instalara com os icones corretos sem manifesto duplicado
- Cada cliente que ativar o lembrete de um jogo recebera sua notificacao individual 15 minutos antes

