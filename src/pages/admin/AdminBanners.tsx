import { useState } from "react";
import { useAllBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, CATEGORY_LABELS, CATEGORY_LIST, type BannerCategory } from "@/hooks/useBanners";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Upload, ImageOff, ArrowUp, ArrowDown, Loader2, Image } from "lucide-react";
import { toast } from "sonner";

const AdminBanners = () => {
  const [selectedCategory, setSelectedCategory] = useState<BannerCategory>("cover");
  const { data: banners, isLoading } = useAllBanners(selectedCategory);
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${selectedCategory}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
      const maxOrder = banners?.reduce((max, b) => Math.max(max, b.sort_order), 0) || 0;
      await createBanner.mutateAsync({ image_url: publicUrl, category: selectedCategory, sort_order: maxOrder + 1 });
      toast.success("Banner adicionado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar banner");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const moveBanner = async (id: string, direction: "up" | "down") => {
    if (!banners) return;
    const idx = banners.findIndex((b) => b.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= banners.length) return;
    await updateBanner.mutateAsync({ id: banners[idx].id, sort_order: banners[swapIdx].sort_order });
    await updateBanner.mutateAsync({ id: banners[swapIdx].id, sort_order: banners[idx].sort_order });
  };

  const activeBanners = banners?.filter((b) => b.active).length || 0;
  const totalBanners = banners?.length || 0;

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as BannerCategory)}>
        <TabsList className="w-full flex-wrap h-auto gap-1">
          {CATEGORY_LIST.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="text-xs py-1.5 px-2">
              {CATEGORY_LABELS[cat]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">{CATEGORY_LABELS[selectedCategory]}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{activeBanners} ativos / {totalBanners} total</p>
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              {uploading ? "Enviando..." : "Upload"}
            </span>
          </label>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !banners || banners.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Image className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum banner nesta categoria</p>
              <p className="text-xs text-muted-foreground/60">Faça upload de uma imagem para começar</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {banners.map((banner, idx) => (
                <div key={banner.id} className="rounded-lg border border-border/50 bg-secondary/20 overflow-hidden">
                  <div className="relative aspect-[16/9]">
                    <img
                      src={banner.image_url}
                      alt={banner.title || "Banner"}
                      className={`w-full h-full object-cover ${!banner.active ? "opacity-40 grayscale" : ""}`}
                      loading="lazy"
                    />
                    {!banner.active && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black/60 text-foreground text-xs px-2 py-1 rounded">Inativo</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={banner.active}
                        onCheckedChange={(v) => updateBanner.mutate({ id: banner.id, active: v })}
                      />
                      <span className="text-[10px] text-muted-foreground">{banner.active ? "Ativo" : "Inativo"}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0} onClick={() => moveBanner(banner.id, "up")}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === banners.length - 1} onClick={() => moveBanner(banner.id, "down")}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => { if (confirm("Excluir banner?")) deleteBanner.mutate(banner.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBanners;
