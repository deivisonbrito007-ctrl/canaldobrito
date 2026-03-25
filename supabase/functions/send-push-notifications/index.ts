import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Web Push crypto utilities ───────────────────────────────────────

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

async function generateJWT(
  vapidPrivateKeyBase64url: string,
  vapidPublicKeyBase64url: string,
  audience: string,
  subject: string
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };

  const enc = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unsigned = `${headerB64}.${payloadB64}`;

  const privKeyRaw = base64urlToBytes(vapidPrivateKeyBase64url);
  const pubKeyRaw = base64urlToBytes(vapidPublicKeyBase64url);

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: bytesToBase64url(pubKeyRaw.slice(1, 33)),
    y: bytesToBase64url(pubKeyRaw.slice(33, 65)),
    d: bytesToBase64url(privKeyRaw),
  };

  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(unsigned));
  return `${unsigned}.${bytesToBase64url(new Uint8Array(signature))}`;
}

async function encryptPayload(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string
): Promise<{ body: Uint8Array; headers: Record<string, string> }> {
  const enc = new TextEncoder();
  const payloadBytes = enc.encode(payload);

  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));

  const subPubBytes = base64urlToBytes(subscription.p256dh);
  const subPubKey = await crypto.subtle.importKey("raw", subPubBytes, { name: "ECDH", namedCurve: "P-256" }, false, []);

  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: subPubKey }, localKeyPair.privateKey, 256));
  const authSecret = base64urlToBytes(subscription.auth);

  const ikmInfo = enc.encode("WebPush: info\0");
  const ikmInput = new Uint8Array([...ikmInfo, ...subPubBytes, ...localPubRaw]);

  const prkAuth = await crypto.subtle.importKey("raw", authSecret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const ikm = new Uint8Array(await crypto.subtle.sign("HMAC", prkAuth, sharedSecret));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prkSalt = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", prkSalt, ikm));

  const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

  const cekInfo = enc.encode("Content-Encoding: aes128gcm\0");
  const cekFull = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, new Uint8Array([...cekInfo, 1])));
  const cek = cekFull.slice(0, 16);

  const nonceInfo = enc.encode("Content-Encoding: nonce\0");
  const nonceFull = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, new Uint8Array([...nonceInfo, 1])));
  const nonce = nonceFull.slice(0, 12);

  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const padded = new Uint8Array([...payloadBytes, 2]);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, padded));

  const rs = new ArrayBuffer(4);
  new DataView(rs).setUint32(0, padded.length + 16 + 1);
  const header = new Uint8Array([...salt, ...new Uint8Array(rs), 65, ...localPubRaw]);

  return {
    body: new Uint8Array([...header, ...encrypted]),
    headers: { "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream" },
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

  const jwt = await generateJWT(vapidPrivateKey, vapidPublicKey, audience, "mailto:contato@canalbrito.com");
  const { body, headers: encHeaders } = await encryptPayload(subscription, payload);

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

// ── Helpers ─────────────────────────────────────────────────────────

const BATCH_SIZE = 500;
const PARALLEL_SENDS = 10;

async function fetchAllSubscriptions(
  sb: ReturnType<typeof createClient>,
  gameIds: string[]
) {
  const allSubs: any[] = [];
  let offset = 0;

  while (true) {
    const { data } = await sb
      .from("push_subscriptions")
      .select("*")
      .overlaps("game_ids", gameIds)
      .range(offset, offset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;
    allSubs.push(...data);
    if (data.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  return allSubs;
}

async function sendInParallel(
  tasks: Array<() => Promise<{ ok: boolean; status: number; endpoint: string; subId: string }>>,
) {
  const results: Array<{ ok: boolean; status: number; endpoint: string; subId: string; error?: string }> = [];

  for (let i = 0; i < tasks.length; i += PARALLEL_SENDS) {
    const batch = tasks.slice(i, i + PARALLEL_SENDS);
    const settled = await Promise.allSettled(batch.map((fn) => fn()));

    for (const r of settled) {
      if (r.status === "fulfilled") {
        results.push(r.value);
      } else {
        results.push({ ok: false, status: 0, endpoint: "unknown", subId: "", error: String(r.reason) });
      }
    }
  }

  return results;
}

// ── Main handler ────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    const sb = createClient(supabaseUrl, serviceRoleKey);

    // Get VAPID public key
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

    // Find games starting in ~15 minutes (Brasília UTC-3)
    const now = new Date();
    const brasiliaOffset = -3 * 60;
    const brasiliaTime = new Date(now.getTime() + (brasiliaOffset + now.getTimezoneOffset()) * 60000);

    const todayStr = brasiliaTime.toISOString().split("T")[0];
    const currentMinutes = brasiliaTime.getHours() * 60 + brasiliaTime.getMinutes();
    const targetMinutes = currentMinutes + 15;

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

    const upcomingGames = games.filter((g) => {
      const [h, m] = (g.game_time as string).split(":").map(Number);
      return Math.abs(h * 60 + m - targetMinutes) <= 2;
    });

    if (upcomingGames.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no upcoming" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gameIds = upcomingGames.map((g) => g.id);

    // Fetch ALL subscriptions with pagination
    const subs = await fetchAllSubscriptions(sb, gameIds);

    if (subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no subs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build send tasks
    const tasks: Array<() => Promise<{ ok: boolean; status: number; endpoint: string; subId: string }>> = [];

    for (const sub of subs) {
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

        tasks.push(async () => {
          const result = await sendPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload,
            vapidPublicKey,
            vapidPrivateKey
          );
          return { ...result, endpoint: sub.endpoint, subId: sub.id };
        });
      }
    }

    // Send in parallel batches
    const results = await sendInParallel(tasks);

    let sent = 0;
    const errors: string[] = [];
    const expiredSubIds: string[] = [];

    for (const r of results) {
      if (r.ok) {
        sent++;
      } else if (r.status === 410 || r.status === 404) {
        expiredSubIds.push(r.subId);
      } else if (r.error) {
        errors.push(`${r.endpoint}: ${r.error}`);
      } else {
        errors.push(`${r.endpoint}: ${r.status}`);
      }
    }

    // Delete expired subscriptions in one go
    if (expiredSubIds.length > 0) {
      await sb.from("push_subscriptions").delete().in("id", expiredSubIds);
    }

    // Batch-remove notified game_ids atomically per subscription
    for (const sub of subs) {
      const notifiedIds = upcomingGames
        .filter((g) => (sub.game_ids as string[]).includes(g.id))
        .map((g) => g.id);

      if (notifiedIds.length > 0) {
        await sb.rpc("remove_multiple_game_ids", {
          _endpoint: sub.endpoint,
          _ids: notifiedIds,
        });
      }
    }

    return new Response(
      JSON.stringify({ sent, total_subs: subs.length, errors: errors.length > 0 ? errors : undefined }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-push-notifications error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
