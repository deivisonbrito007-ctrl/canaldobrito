import { useState } from "react";
import { useAllBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, CATEGORY_LABELS, CATEGORY_LIST, type BannerCategory } from "@/hooks/useBanners";
import { useAllDailyBanners, useCreateDailyBanner, useUpdateDailyBanner, useDeleteDailyBanner } from "@/hooks/useDailyBanners";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 border-b border-white/[0.06]">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Calendar className="h-4 w-4 text-emerald-400" />
            Banners do Dia
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-emerald-400 font-semibold">{activeBanners}</span> ativos / {totalBanners} total
          </p>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto text-xs h-9 glass-panel border-white/[0.1]" />
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <span className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-xs font-semibold hover:brightness-110 transition-all duration-300 shadow-lg shadow-primary/20 active:scale-[0.97]">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? "Enviando..." : "Upload"}
            </span>
          </label>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !banners || banners.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="rounded-2xl glass-panel p-6 inline-block">
              <Image className="h-12 w-12 text-muted-foreground/20" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">Nenhum banner para {selectedDate}</p>
            <p className="text-xs text-muted-foreground/50">Faça upload de uma imagem para começar</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((banner, idx) => (
              <div key={banner.id} className="rounded-xl glass-panel glass-panel-hover overflow-hidden group">
                <div className="relative aspect-[16/9]">
                  <img src={banner.image_url} alt={banner.title || "Banner do dia"} className={`w-full h-full object-cover transition-all duration-300 ${!banner.active ? "opacity-30 grayscale" : ""}`} loading="lazy" />
                  <div className="absolute top-2 right-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${banner.active ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"}`}>
                      {banner.active ? "ATIVO" : "INATIVO"}
                    </span>
                  </div>
                  {banner.title && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="bg-black/70 backdrop-blur-sm text-foreground text-[11px] px-2 py-1 rounded-md font-medium">{banner.title}</span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={banner.active} onCheckedChange={(v) => updateBanner.mutate({ id: banner.id, active: v })} />
                    <span className={`text-[11px] font-medium ${banner.active ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                      {banner.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-white/[0.06]" disabled={idx === 0} onClick={() => moveBanner(banner.id, "up")}><ArrowUp className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-white/[0.06]" disabled={idx === banners.length - 1} onClick={() => moveBanner(banner.id, "down")}><ArrowDown className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Excluir banner?")) deleteBanner.mutate(banner.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
      {/* Section Toggle */}
      <div className="flex gap-2">
        {[
          { key: "daily" as const, label: "📺 Banners do Dia" },
          { key: "categories" as const, label: "📁 Por Categoria" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
              activeSection === s.key
                ? "glass-panel bg-white/[0.06] text-foreground border-white/[0.12]"
                : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.03]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === "daily" && <DailyBannerManager />}

      {activeSection === "categories" && (
        <>
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_LIST.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  selectedCategory === cat
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "glass-panel text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.05]"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-foreground">{CATEGORY_LABELS[selectedCategory]}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-emerald-400 font-semibold">{activeBanners}</span> ativos / {totalBanners} total
                </p>
              </div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                <span className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-xs font-semibold hover:brightness-110 transition-all duration-300 shadow-lg shadow-primary/20 active:scale-[0.97]">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploading ? "Enviando..." : "Upload"}
                </span>
              </label>
            </div>
            <div className="p-5 sm:p-6">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : !banners || banners.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <div className="rounded-2xl glass-panel p-6 inline-block">
                    <Image className="h-12 w-12 text-muted-foreground/20" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">Nenhum banner nesta categoria</p>
                  <p className="text-xs text-muted-foreground/50">Faça upload de uma imagem para começar</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {banners.map((banner, idx) => (
                    <div key={banner.id} className="rounded-xl glass-panel glass-panel-hover overflow-hidden group">
                      <div className="relative aspect-[16/9]">
                        <img src={banner.image_url} alt={banner.title || "Banner"} className={`w-full h-full object-cover transition-all duration-300 ${!banner.active ? "opacity-30 grayscale" : ""}`} loading="lazy" />
                        <div className="absolute top-2 right-2">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${banner.active ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"}`}>
                            {banner.active ? "ATIVO" : "INATIVO"}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch checked={banner.active} onCheckedChange={(v) => updateBanner.mutate({ id: banner.id, active: v })} />
                          <span className={`text-[11px] font-medium ${banner.active ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                            {banner.active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-white/[0.06]" disabled={idx === 0} onClick={() => moveBanner(banner.id, "up")}><ArrowUp className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-white/[0.06]" disabled={idx === banners.length - 1} onClick={() => moveBanner(banner.id, "down")}><ArrowDown className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Excluir banner?")) deleteBanner.mutate(banner.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminBanners;
