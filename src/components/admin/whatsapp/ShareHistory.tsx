import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { History, Copy, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ShareRow {
  id: string;
  created_at: string;
  surface: string | null;
  tab: string | null;
  utm_content: string | null;
  props: Record<string, unknown> | null;
}

const SURFACE_LABEL: Record<string, string> = {
  "admin-whatsapp-day": "Agenda do dia",
  "admin-whatsapp-template": "Texto pronto",
  "admin-whatsapp-custom": "Mensagem personalizada",
  "admin-whatsapp-ab": "Teste A/B",
  "admin-whatsapp-quick": "Link rápido",
};

const TAB_LABEL: Record<string, string> = {
  live: "Ao Vivo",
  novidades: "Novidades",
  suggestions: "Sugestões",
  schedule: "Programação",
};

const useShareHistory = (limit = 20) =>
  useQuery({
    queryKey: ["analytics", "share_history", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("id, created_at, surface, tab, utm_content, props")
        .eq("event", "link_share")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ShareRow[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

/** Últimos envios/cópias feitos pela aba WhatsApp (registrados em analytics). */
export const ShareHistory = () => {
  const { data, isLoading } = useShareHistory();

  return (
    <section className="glass-panel rounded-xl p-3 sm:p-4 space-y-3" aria-labelledby="share-history-title">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <History className="h-4 w-4 text-primary" />
        </div>
        <h2 id="share-history-title" className="text-sm font-bold text-foreground">Últimos envios</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Nenhum envio registrado ainda. Use "Enviar" ou "Copiar" acima e o histórico aparece aqui.
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {data.map((row) => {
            const action = (row.props?.action as string) ?? "open";
            const isCopy = action === "copy";
            const surface = SURFACE_LABEL[row.surface ?? ""] ?? row.surface ?? "WhatsApp";
            const tab = row.tab ? TAB_LABEL[row.tab] ?? row.tab : null;
            const when = formatDistanceToNow(new Date(row.created_at), { addSuffix: true, locale: ptBR });
            return (
              <li key={row.id} className="flex items-center gap-3 py-2 min-h-11">
                <span
                  className={`p-1.5 rounded-md shrink-0 ${isCopy ? "bg-white/[0.04] text-muted-foreground" : "bg-emerald-500/10 text-emerald-300"}`}
                  aria-label={isCopy ? "Copiado" : "Enviado pelo WhatsApp"}
                >
                  {isCopy ? <Copy className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {surface}
                    {tab && <span className="text-muted-foreground font-normal"> · {tab}</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 truncate">
                    {isCopy ? "Copiado" : "Enviado"} {when}
                    {row.utm_content ? ` · ${row.utm_content}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
