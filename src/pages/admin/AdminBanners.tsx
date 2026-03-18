import { useState } from "react";
import { useAllBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, CATEGORY_LABELS, CATEGORY_LIST, type BannerCategory } from "@/hooks/useBanners";
import { useAllDailyBanners, useCreateDailyBanner, useUpdateDailyBanner, useDeleteDailyBanner } from "@/hooks/useDailyBanners";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Upload, ArrowUp, ArrowDown, Loader2, Image, Calendar } from "lucide-react";
import { toast } from "sonner";

const DailyBannerManager = () => {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const { data: banners, isLoading } = useAllDailyBanners(selectedDate);
  const createBanner = useCreateDailyBanner();
  const updateBanner = useUpdateDailyBanner();
  const deleteBanner = useDeleteDailyBanner();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `daily/${selectedDate}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
      const maxOrder = banners?.reduce((max, b) => Math.max(max, b.sort_order), 0) || 0;
      await createBanner.mutateAsync({ image_url: publicUrl, date: selectedDate, sort_order: maxOrder + 1 });
      toast.success("Banner do dia adicionado!");
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Banners do Dia
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-primary font-semibold">{activeBanners}</span> ativos / {totalBanners} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto text-xs h-9"
          />
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <span className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-xs font-semibold hover:brightness-110 transition-all duration-200 shadow-md shadow-primary/20 active:scale-[0.97]">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? "Enviando..." : "Upload"}
            </span>
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !banners || banners.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="rounded-2xl bg-secondary/50 p-5 inline-block border border-border/20">
              <Image className="h-10 w-10 text-muted-foreground/25" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Nenhum banner para {selectedDate}</p>
            <p className="text-xs text-muted-foreground/50">Faça upload de uma imagem para começar</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {banners.map((banner, idx) => (
              <div key={banner.id} className="rounded-xl border border-border/30 bg-secondary/20 overflow-hidden transition-all duration-200 hover:border-border/50 hover:bg-secondary/30">
                <div className="relative aspect-[16/9]">
                  <img
                    src={banner.image_url}
                    alt={banner.title || "Banner do dia"}
                    className={`w-full h-full object-cover transition-all duration-300 ${!banner.active ? "opacity-30 grayscale" : ""}`}
                    loading="lazy"
                  />
                  {!banner.active && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-background/80 backdrop-blur-sm text-foreground/70 text-xs px-3 py-1.5 rounded-lg font-medium border border-border/30">Inativo</span>
                    </div>
                  )}
                  {banner.title && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="bg-background/80 backdrop-blur-sm text-foreground text-[11px] px-2 py-1 rounded-md font-medium">{banner.title}</span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={banner.active}
                      onCheckedChange={(v) => updateBanner.mutate({ id: banner.id, active: v })}
                    />
                    <span className={`text-[11px] font-medium ${banner.active ? "text-primary" : "text-muted-foreground/60"}`}>
                      {banner.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" disabled={idx === 0} onClick={() => moveBanner(banner.id, "up")}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" disabled={idx === banners.length - 1} onClick={() => moveBanner(banner.id, "down")}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                      onClick={() => { if (confirm("Excluir banner?")) deleteBanner.mutate(banner.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AdminBanners = () => {
  const [selectedCategory, setSelectedCategory] = useState<BannerCategory>("cover");
  const { data: banners, isLoading } = useAllBanners(selectedCategory);
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<"daily" | "categories">("daily");

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
    <div className="space-y-5">
      {/* Section toggle */}
      <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as "daily" | "categories")}>
        <TabsList className="w-full h-auto gap-1 bg-secondary/50 border border-border/20 rounded-xl p-1">
          <TabsTrigger value="daily" className="flex-1 text-xs py-2.5 rounded-lg font-semibold">
            📺 Banners do Dia
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex-1 text-xs py-2.5 rounded-lg font-semibold">
            📁 Por Categoria
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeSection === "daily" && <DailyBannerManager />}

      {activeSection === "categories" && (
        <>
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as BannerCategory)}>
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-secondary/50 border border-border/20 rounded-xl p-1">
              {CATEGORY_LIST.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="text-xs py-2 px-3 rounded-lg font-semibold">
                  {CATEGORY_LABELS[cat]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>{CATEGORY_LABELS[selectedCategory]}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-primary font-semibold">{activeBanners}</span> ativos / {totalBanners} total
                </p>
              </div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                <span className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-xs font-semibold hover:brightness-110 transition-all duration-200 shadow-md shadow-primary/20 active:scale-[0.97]">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploading ? "Enviando..." : "Upload"}
                </span>
              </label>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !banners || banners.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="rounded-2xl bg-secondary/50 p-5 inline-block border border-border/20">
                    <Image className="h-10 w-10 text-muted-foreground/25" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Nenhum banner nesta categoria</p>
                  <p className="text-xs text-muted-foreground/50">Faça upload de uma imagem para começar</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {banners.map((banner, idx) => (
                    <div key={banner.id} className="rounded-xl border border-border/30 bg-secondary/20 overflow-hidden transition-all duration-200 hover:border-border/50 hover:bg-secondary/30">
                      <div className="relative aspect-[16/9]">
                        <img
                          src={banner.image_url}
                          alt={banner.title || "Banner"}
                          className={`w-full h-full object-cover transition-all duration-300 ${!banner.active ? "opacity-30 grayscale" : ""}`}
                          loading="lazy"
                        />
                        {!banner.active && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-background/80 backdrop-blur-sm text-foreground/70 text-xs px-3 py-1.5 rounded-lg font-medium border border-border/30">Inativo</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={banner.active}
                            onCheckedChange={(v) => updateBanner.mutate({ id: banner.id, active: v })}
                          />
                          <span className={`text-[11px] font-medium ${banner.active ? "text-primary" : "text-muted-foreground/60"}`}>
                            {banner.active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" disabled={idx === 0} onClick={() => moveBanner(banner.id, "up")}>
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" disabled={idx === banners.length - 1} onClick={() => moveBanner(banner.id, "down")}>
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                            onClick={() => { if (confirm("Excluir banner?")) deleteBanner.mutate(banner.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminBanners;
