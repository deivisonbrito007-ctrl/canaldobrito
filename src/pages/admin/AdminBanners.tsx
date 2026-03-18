import { useState, useCallback } from "react";
import { useAllBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, CATEGORY_LABELS, CATEGORY_LIST, type BannerCategory } from "@/hooks/useBanners";
import { ProgramacaoTexto } from "@/components/admin/ProgramacaoTexto";
import { DailyGamesManager } from "@/components/admin/DailyGamesManager";
import { useAllDailyBanners, useCreateDailyBanner, useUpdateDailyBanner, useDeleteDailyBanner } from "@/hooks/useDailyBanners";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Trash2, Upload, ArrowUp, ArrowDown, Loader2, Image, Calendar, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";

const PasteZone = ({ onImagePasted, uploading }: { onImagePasted: (file: File) => void; uploading: boolean }) => {
  const [highlight, setHighlight] = useState(false);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) onImagePasted(file);
        return;
      }
    }
  }, [onImagePasted]);

  return (
    <div
      onPaste={handlePaste}
      onFocus={() => setHighlight(true)}
      onBlur={() => setHighlight(false)}
      tabIndex={0}
      className={`relative rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all duration-200 outline-none ${
        highlight
          ? "border-primary/60 bg-primary/5"
          : "border-border/30 hover:border-border/50 bg-transparent"
      } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
    >
      <div className="flex flex-col items-center gap-1.5">
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <ClipboardPaste className="h-5 w-5 text-muted-foreground/50" />
        )}
        <span className="text-[11px] text-muted-foreground/70">
          {uploading ? "Enviando..." : "Clique aqui e cole uma imagem (Ctrl+V)"}
        </span>
      </div>
    </div>
  );
};

const DailyBannerManager = () => {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const { data: banners, isLoading } = useAllDailyBanners(selectedDate);
  const createBanner = useCreateDailyBanner();
  const updateBanner = useUpdateDailyBanner();
  const deleteBanner = useDeleteDailyBanner();
  const [uploading, setUploading] = useState(false);

  const uploadAndCreate = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name?.split(".").pop() || "png";
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
    }
  }, [selectedDate, banners, createBanner]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAndCreate(file);
    e.target.value = "";
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
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Calendar className="h-4 w-4 text-emerald-400" />
            Banners do Dia
          </h3>
          <span className="text-[10px] text-muted-foreground">
            <span className="text-emerald-400 font-semibold">{activeBanners}</span>/{totalBanners}
          </span>
        </div>
        <div className="flex gap-2">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="flex-1 text-xs h-10 glass-panel border-white/[0.1]" />
          <label className="cursor-pointer shrink-0">
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 h-10 text-xs font-semibold hover:brightness-110 transition-all active:scale-[0.97]">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? "..." : "Upload"}
            </span>
          </label>
        </div>
        <PasteZone onImagePasted={uploadAndCreate} uploading={uploading} />
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : !banners || banners.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="rounded-xl glass-panel p-4 inline-block"><Image className="h-8 w-8 text-muted-foreground/20" /></div>
            <p className="text-xs text-muted-foreground">Nenhum banner para {selectedDate}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner, idx) => (
              <div key={banner.id} className="rounded-xl glass-panel overflow-hidden">
                <div className="relative aspect-[16/9]">
                  <img src={banner.image_url} alt={banner.title || "Banner"} className={`w-full h-full object-cover ${!banner.active ? "opacity-30 grayscale" : ""}`} loading="lazy" />
                  <div className="absolute top-2 right-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${banner.active ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"}`}>
                      {banner.active ? "ATIVO" : "OFF"}
                    </span>
                  </div>
                  {banner.title && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="bg-black/70 backdrop-blur-sm text-foreground text-[10px] px-2 py-0.5 rounded-md font-medium">{banner.title}</span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={banner.active} onCheckedChange={(v) => updateBanner.mutate({ id: banner.id, active: v })} />
                    <span className={`text-[10px] font-medium ${banner.active ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                      {banner.active ? "Ativo" : "Off"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-white/[0.06]" disabled={idx === 0} onClick={() => moveBanner(banner.id, "up")}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-white/[0.06]" disabled={idx === banners.length - 1} onClick={() => moveBanner(banner.id, "down")}><ArrowDown className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Excluir banner?")) deleteBanner.mutate(banner.id); }}><Trash2 className="h-4 w-4" /></Button>
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
  const [activeSection, setActiveSection] = useState<"daily" | "categories" | "programacao">("daily");

  const uploadAndCreateCategory = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name?.split(".").pop() || "png";
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
    }
  }, [selectedCategory, banners, createBanner]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAndCreateCategory(file);
    e.target.value = "";
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
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
        {[
          { key: "daily" as const, label: "📺 Dia" },
          { key: "categories" as const, label: "📁 Categorias" },
          { key: "programacao" as const, label: "📋 Programação" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`shrink-0 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all min-h-[40px] ${
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

      {activeSection === "programacao" && (
        <div className="space-y-4">
          <ProgramacaoTexto />
          <DailyGamesManager />
        </div>
      )}

      {activeSection === "categories" && (
        <>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
            {CATEGORY_LIST.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all min-h-[36px] ${
                  selectedCategory === cat
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "glass-panel text-muted-foreground/70 hover:text-foreground"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{CATEGORY_LABELS[selectedCategory]}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    <span className="text-emerald-400 font-semibold">{activeBanners}</span>/{totalBanners}
                  </p>
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 h-10 text-xs font-semibold hover:brightness-110 transition-all active:scale-[0.97]">
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Upload
                  </span>
                </label>
              </div>
              <PasteZone onImagePasted={uploadAndCreateCategory} uploading={uploading} />
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : !banners || banners.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="rounded-xl glass-panel p-4 inline-block"><Image className="h-8 w-8 text-muted-foreground/20" /></div>
                  <p className="text-xs text-muted-foreground">Nenhum banner nesta categoria</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {banners.map((banner, idx) => (
                    <div key={banner.id} className="rounded-xl glass-panel overflow-hidden">
                      <div className="relative aspect-[16/9]">
                        <img src={banner.image_url} alt={banner.title || "Banner"} className={`w-full h-full object-cover ${!banner.active ? "opacity-30 grayscale" : ""}`} loading="lazy" />
                        <div className="absolute top-2 right-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${banner.active ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"}`}>
                            {banner.active ? "ATIVO" : "OFF"}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch checked={banner.active} onCheckedChange={(v) => updateBanner.mutate({ id: banner.id, active: v })} />
                          <span className={`text-[10px] font-medium ${banner.active ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                            {banner.active ? "Ativo" : "Off"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-white/[0.06]" disabled={idx === 0} onClick={() => moveBanner(banner.id, "up")}><ArrowUp className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-white/[0.06]" disabled={idx === banners.length - 1} onClick={() => moveBanner(banner.id, "down")}><ArrowDown className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Excluir banner?")) deleteBanner.mutate(banner.id); }}><Trash2 className="h-4 w-4" /></Button>
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
