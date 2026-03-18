import { useState, useEffect } from "react";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Settings, Phone, Key } from "lucide-react";
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
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Settings className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle>Configurações</CardTitle>
            <CardDescription className="mt-0.5">Gerencie as configurações globais do sistema</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-semibold">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            WhatsApp
          </Label>
          <Input placeholder="5511940759046" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          <p className="text-[11px] text-muted-foreground/60">Número completo com código do país (ex: 5511940759046)</p>
        </div>

        <div className="section-divider" />

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-semibold">
            <Key className="h-3.5 w-3.5 text-muted-foreground" />
            TMDB API Key
          </Label>
          <Input placeholder="Sua chave da API do TMDB" value={tmdbKey} onChange={(e) => setTmdbKey(e.target.value)} type="password" />
          <p className="text-[11px] text-muted-foreground/60">
            Obtenha em{" "}
            <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
              themoviedb.org
            </a>
          </p>
        </div>

        <Button onClick={handleSave} disabled={updateSetting.isPending} size="lg" className="w-full sm:w-auto">
          {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminConfiguracoes;
