import { useState, useEffect } from "react";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Phone, Key, Info, Globe } from "lucide-react";
import { toast } from "sonner";

const AdminConfiguracoes = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const [whatsapp, setWhatsapp] = useState("");
  const [tmdbKey, setTmdbKey] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    if (settings) {
      setWhatsapp(settings.whatsapp || "");
      setTmdbKey(settings.tmdb_api_key || "");
      setSiteUrl(settings.site_url || "");
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({ key: "whatsapp", value: whatsapp });
      await updateSetting.mutateAsync({ key: "tmdb_api_key", value: tmdbKey });
      await updateSetting.mutateAsync({ key: "site_url", value: siteUrl });
      toast.success("Configurações salvas!");
    } catch (err: any) {
      toast.error(err.message);
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
          <p className="text-[10px] text-muted-foreground/50">Número completo com código do país</p>
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
      <Button onClick={handleSave} disabled={updateSetting.isPending} className="w-full min-h-[48px] text-sm font-semibold shadow-lg shadow-primary/20">
        {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar
      </Button>
    </div>
  );
};

export default AdminConfiguracoes;
