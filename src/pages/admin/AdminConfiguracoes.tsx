import { useState, useEffect } from "react";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2 } from "lucide-react";
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
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Configurações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">WhatsApp</label>
          <Input placeholder="5511940759046" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          <p className="text-[10px] text-muted-foreground">Número completo com código do país</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">TMDB API Key</label>
          <Input placeholder="Sua chave da API do TMDB" value={tmdbKey} onChange={(e) => setTmdbKey(e.target.value)} type="password" />
          <p className="text-[10px] text-muted-foreground">
            Obtenha em{" "}
            <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-primary underline">
              themoviedb.org
            </a>
          </p>
        </div>

        <Button onClick={handleSave} disabled={updateSetting.isPending}>
          {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Salvar
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminConfiguracoes;
