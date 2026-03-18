import { useState, useEffect } from "react";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Phone, Key, Info } from "lucide-react";
import { toast } from "sonner";

const AdminConfiguracoes = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const [whatsapp, setWhatsapp] = useState("");
  const [tmdbKey, setTmdbKey] = useState("");

  useEffect(() => {
    if (settings) {
      setWhatsapp(settings.whatsapp || "");
      setTmdbKey(settings.tmdb_api_key || "");
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({ key: "whatsapp", value: whatsapp });
      await updateSetting.mutateAsync({ key: "tmdb_api_key", value: tmdbKey });
      toast.success("Configurações salvas!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Identidade */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Phone className="h-4 w-4 text-emerald-400" />
            Identidade & Contato
          </h3>
        </div>
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp</Label>
            <Input placeholder="5511940759046" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="glass-panel border-white/[0.1]" />
            <p className="text-[11px] text-muted-foreground/50">Número completo com código do país (ex: 5511940759046)</p>
          </div>
        </div>
      </div>

      {/* API */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Key className="h-4 w-4 text-blue-400" />
            Integrações & API
          </h3>
        </div>
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">TMDB API Key</Label>
            <Input placeholder="Sua chave da API do TMDB" value={tmdbKey} onChange={(e) => setTmdbKey(e.target.value)} type="password" className="glass-panel border-white/[0.1]" />
            <p className="text-[11px] text-muted-foreground/50">
              Obtenha em{" "}
              <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">themoviedb.org</a>
            </p>
          </div>
        </div>
      </div>

      {/* Sobre */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Sobre o Sistema
          </h3>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs text-muted-foreground">Brito Solutions — Painel de Gerenciamento v1.0</p>
        </div>
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={updateSetting.isPending} size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20">
        {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar Configurações
      </Button>
    </div>
  );
};

export default AdminConfiguracoes;
