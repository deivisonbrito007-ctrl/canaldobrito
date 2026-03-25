import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Web Push signing utilities using Web Crypto API
async function generateJWT(
  vapidPrivateKeyBase64url: string,
  vapidPublicKeyBase64url: string,
  audience: string,
  subject: string
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: subject,
  };

  const enc = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const unsigned = `${headerB64}.${payloadB64}`;

  // Import VAPID private key
  const privKeyRaw = base64urlToBytes(vapidPrivateKeyBase64url);
  const pubKeyRaw = base64urlToBytes(vapidPublicKeyBase64url);

  // Build JWK for P-256
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: bytesToBase64url(pubKeyRaw.slice(1, 33)),
    y: bytesToBase64url(pubKeyRaw.slice(33, 65)),
    d: bytesToBase64url(privKeyRaw),
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(unsigned)
  );

  // Convert DER signature to raw r||s (64 bytes)
  const sigBytes = new Uint8Array(signature);
  const sigB64 = bytesToBase64url(sigBytes);

  return `${unsigned}.${sigB64}`;
}

function base64urlToBytes(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Encrypt payload using aes128gcm (RFC 8291)
async function encryptPayload(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string
): Promise<{ body: Uint8Array; headers: Record<string, string> }> {
  const enc = new TextEncoder();
  const payloadBytes = enc.encode(payload);

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const localPubRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // Import subscriber's public key
  const subPubBytes = base64urlToBytes(subscription.p256dh);
  const subPubKey = await crypto.subtle.importKey(
    "raw",
    subPubBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: subPubKey },
      localKeyPair.privateKey,
      256
    )
  );

  // Auth secret
  const authSecret = base64urlToBytes(subscription.auth);

  // HKDF-based key derivation (simplified for aes128gcm)
  const ikmInfo = enc.encode("WebPush: info\0");
  const ikmInput = new Uint8Array([
    ...ikmInfo,
    ...subPubBytes,
    ...localPubRaw,
  ]);

  const prkAuth = await crypto.subtle.importKey(
    "raw",
    authSecret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const ikm = new Uint8Array(
    await crypto.subtle.sign("HMAC", prkAuth, sharedSecret)
  );

  // Derive PRK
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prkSalt = await crypto.subtle.importKey(
    "raw",
    salt,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const prk = new Uint8Array(
    await crypto.subtle.sign("HMAC", prkSalt, ikm)
  );

  // Derive content encryption key
  const cekInfo = enc.encode("Content-Encoding: aes128gcm\0");
  const prkKey = await crypto.subtle.importKey(
    "raw",
    prk,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const cekFull = new Uint8Array(
    await crypto.subtle.sign("HMAC", prkKey, new Uint8Array([...cekInfo, 1]))
  );
  const cek = cekFull.slice(0, 16);

  // Derive nonce
  const nonceInfo = enc.encode("Content-Encoding: nonce\0");
  const nonceFull = new Uint8Array(
    await crypto.subtle.sign("HMAC", prkKey, new Uint8Array([...nonceInfo, 1]))
  );
  const nonce = nonceFull.slice(0, 12);

  // Encrypt with AES-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    cek,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Add padding delimiter (0x02 for final record)
  const padded = new Uint8Array([...payloadBytes, 2]);

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      aesKey,
      padded
    )
  );

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65)
  const rs = new ArrayBuffer(4);
  new DataView(rs).setUint32(0, padded.length + 16 + 1); // record size
  const header = new Uint8Array([
    ...salt,
    ...new Uint8Array(rs),
    65,
    ...localPubRaw,
  ]);

  const body = new Uint8Array([...header, ...encrypted]);

  return {
    body,
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
    },
  };
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ ok: boolean; status: number }> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const jwt = await generateJWT(
    vapidPrivateKey,
    vapidPublicKey,
    audience,
    "mailto:contato@canalbrito.com"
  );

  const { body, headers: encHeaders } = await encryptPayload(
    subscription,
    payload
  );

  const resp = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      ...encHeaders,
      Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
      TTL: "86400",
      Urgency: "high",
      "Content-Length": body.byteLength.toString(),
    },
    body,
  });

  return { ok: resp.ok, status: resp.status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    const sb = createClient(supabaseUrl, serviceRoleKey);

    // Get VAPID public key from settings
    const { data: settingRow } = await sb
      .from("settings")
      .select("value")
      .eq("key", "vapid_public_key")
      .single();

    if (!settingRow) {
      return new Response(JSON.stringify({ error: "No VAPID public key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const vapidPublicKey = settingRow.value;

    // Find games starting in ~15 minutes (±2min tolerance)
    // Get current time in Brasília timezone
    const now = new Date();
    const brasiliaOffset = -3 * 60; // UTC-3
    const brasiliaTime = new Date(now.getTime() + (brasiliaOffset + now.getTimezoneOffset()) * 60000);
    
    const todayStr = brasiliaTime.toISOString().split("T")[0];
    const currentMinutes = brasiliaTime.getHours() * 60 + brasiliaTime.getMinutes();
    const targetMinutes = currentMinutes + 15;

    // Get today's games
    const { data: games } = await sb
      .from("daily_games")
      .select("id, home_team, away_team, game_time, competition, sport_type")
      .eq("date", todayStr)
      .eq("active", true);

    if (!games || games.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no games" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter games that start in ~15 min
    const upcomingGames = games.filter((g) => {
      const [h, m] = (g.game_time as string).split(":").map(Number);
      const gameMinutes = h * 60 + m;
      return Math.abs(gameMinutes - targetMinutes) <= 2;
    });

    if (upcomingGames.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no upcoming" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gameIds = upcomingGames.map((g) => g.id);

    // Find subscriptions with these game_ids
    const { data: subs } = await sb
      .from("push_subscriptions")
      .select("*")
      .overlaps("game_ids", gameIds);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no subs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    const errors: string[] = [];

    for (const sub of subs) {
      // Find which games this sub is interested in
      const relevantGames = upcomingGames.filter((g) =>
        (sub.game_ids as string[]).includes(g.id)
      );

      for (const game of relevantGames) {
        const title = game.away_team
          ? `${game.home_team} x ${game.away_team}`
          : game.home_team;

        const payload = JSON.stringify({
          title: "⚽ Começa em 15 min!",
          body: `${title} — ${game.competition}`,
          tag: `game-${game.id}`,
          url: "/#esportes",
        });

        try {
          const result = await sendPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload,
            vapidPublicKey,
            vapidPrivateKey
          );

          if (result.ok) {
            sent++;
          } else if (result.status === 410 || result.status === 404) {
            // Subscription expired, delete it
            await sb.from("push_subscriptions").delete().eq("id", sub.id);
          } else {
            errors.push(`${sub.endpoint}: ${result.status}`);
          }
        } catch (err) {
          errors.push(`${sub.endpoint}: ${err}`);
        }

        // Remove notified game_id from subscription
        const updatedIds = (sub.game_ids as string[]).filter(
          (id) => id !== game.id
        );
        await sb
          .from("push_subscriptions")
          .update({ game_ids: updatedIds })
          .eq("id", sub.id);
      }
    }

    return new Response(
      JSON.stringify({ sent, errors: errors.length > 0 ? errors : undefined }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("send-push-notifications error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
