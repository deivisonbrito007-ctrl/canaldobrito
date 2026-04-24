import { useState, useEffect, useMemo } from "react";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Phone, Key, Info, Globe, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const AdminConfiguracoes = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const [whatsapp, setWhatsapp] = useState("");
  const [tmdbKey, setTmdbKey] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (settings) {
      setWhatsapp(settings.whatsapp || "");
      setTmdbKey(settings.tmdb_api_key || "");
      setSiteUrl(settings.site_url || "");
    }
  }, [settings]);

  const isDirty = useMemo(() => {
    if (!settings) return false;
    return (
      whatsapp !== (settings.whatsapp || "") ||
      tmdbKey !== (settings.tmdb_api_key || "") ||
      siteUrl !== (settings.site_url || "")
    );
  }, [whatsapp, tmdbKey, siteUrl, settings]);

  const handleSave = async () => {
    if (whatsapp && !/^\d{10,15}$/.test(whatsapp)) {
      toast.error("WhatsApp inválido — use apenas números (10-15 dígitos)");
      return;
    }

    if (siteUrl) {
      try {
        const u = new URL(siteUrl);
        if (!/^https?:$/.test(u.protocol)) throw new Error("protocolo");
      } catch {
        toast.error("URL do site inválida — use o formato https://meusite.com");
        return;
      }
    }

    try {
      console.log("[AdminConfiguracoes:save]", { whatsapp: !!whatsapp, hasTmdb: !!tmdbKey, siteUrl });
      await Promise.all([
        updateSetting.mutateAsync({ key: "whatsapp", value: whatsapp }),
        updateSetting.mutateAsync({ key: "tmdb_api_key", value: tmdbKey }),
        updateSetting.mutateAsync({ key: "site_url", value: siteUrl }),
      ]);
      setSaved(true);
      toast.success("Configurações salvas!");
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCopyUrl = () => {
    if (siteUrl) {
      navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      toast.success("URL copiada!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 max-w-lg">
      {/* Contact */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Phone className="h-4 w-4 text-emerald-400" />
            Contato
          </h3>
        </div>
        <div className="p-4 space-y-2">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp</Label>
          <Input placeholder="5511940759046" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="glass-panel border-white/[0.1] h-10" />
          <p className="text-[10px] text-muted-foreground/50">Número completo com código do país (apenas números, 10-15 dígitos)</p>
        </div>
      </div>

      {/* Site URL */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4 text-purple-400" />
            URL do Site
          </h3>
        </div>
        <div className="p-4 space-y-2">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">URL Pública</Label>
          <div className="flex gap-2">
            <Input placeholder="https://meusite.lovable.app" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className="glass-panel border-white/[0.1] h-10 flex-1" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopyUrl}
              disabled={!siteUrl}
              className="h-10 w-10 shrink-0"
              title="Copiar URL"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/50">URL pública do site usada nos links de compartilhamento (WhatsApp, etc). Publique o app e cole a URL aqui.</p>
        </div>
      </div>

      {/* API */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Key className="h-4 w-4 text-blue-400" />
            API
          </h3>
        </div>
        <div className="p-4 space-y-2">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">TMDB API Key</Label>
          <Input placeholder="Sua chave da API do TMDB" value={tmdbKey} onChange={(e) => setTmdbKey(e.target.value)} type="password" className="glass-panel border-white/[0.1] h-10" />
          <p className="text-[10px] text-muted-foreground/50">
            Obtenha em{" "}
            <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">themoviedb.org</a>
          </p>
        </div>
      </div>

      {/* About */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Brito Solutions — Painel v1.0</p>
        </div>
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={updateSetting.isPending || !isDirty}
        className="w-full min-h-[48px] text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-200"
        aria-label={saved ? "Configurações salvas" : "Salvar configurações"}
      >
        {updateSetting.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : saved ? (
          <Check className="h-4 w-4 mr-2 text-emerald-400" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        {saved ? "Salvo!" : "Salvar"}
      </Button>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {saved ? "Configurações salvas com sucesso" : ""}
      </p>
    </div>
  );
};

export default AdminConfiguracoes;
