import { useState, useCallback } from "react";
import { useAllBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, CATEGORY_LABELS, CATEGORY_LIST, type BannerCategory } from "@/hooks/useBanners";
import { ProgramacaoTexto } from "@/components/admin/ProgramacaoTexto";
import { DailyGamesManager } from "@/components/admin/DailyGamesManager";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, ArrowUp, ArrowDown, Loader2, Image, Calendar, ClipboardPaste, Clock } from "lucide-react";
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

// --- Helpers ---
function formatCountdown(publishAt: string): string {
  const now = new Date();
  const target = new Date(publishAt);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Em breve";
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) {
    const diffMin = Math.floor(diffMs / (1000 * 60));
    return `Publica em ${diffMin}min`;
  }
  if (diffH < 24) return `Publica em ${diffH}h`;
  const diffDays = Math.floor(diffH / 24);
  return diffDays === 1 ? "Publica amanhã" : `Publica em ${diffDays}d`;
}

// --- Main AdminBanners ---
const AdminBanners = () => {
  const [selectedCategory, setSelectedCategory] = useState<BannerCategory>("cover");
  const { data: banners, isLoading } = useAllBanners(selectedCategory);
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<"categories" | "programacao">("categories");
  const [scheduleDate, setScheduleDate] = useState("");

  const uploadAndCreateCategory = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name?.split(".").pop() || "png";
      const today = new Date().toISOString().split("T")[0];
      const path = `${selectedCategory}/${today}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
      const maxOrder = banners?.reduce((max, b) => Math.max(max, b.sort_order), 0) || 0;

      const bannerData: any = {
        image_url: publicUrl,
        category: selectedCategory,
        sort_order: maxOrder + 1,
      };

      if (scheduleDate) {
        // scheduleDate from datetime-local is "YYYY-MM-DDTHH:MM" (no timezone)
        // new Date() interprets it as local time, .toISOString() converts to UTC
        bannerData.publish_at = new Date(scheduleDate).toISOString();
        bannerData.active = false;
      }

      await createBanner.mutateAsync(bannerData);
      toast.success(scheduleDate ? "Banner agendado!" : "Banner adicionado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar banner");
    } finally {
      setUploading(false);
    }
  }, [selectedCategory, banners, createBanner, scheduleDate]);

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
  const scheduledBanners = banners?.filter((b) => b.publish_at && !b.active).length || 0;
  const inactiveBanners = banners?.filter((b) => !b.active && !b.publish_at).length || 0;
  const totalBanners = banners?.length || 0;

  const isScheduled = (banner: any) => banner.publish_at && !banner.active;

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
        {[
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
          {/* Category pills */}
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
            {/* Header: Title + Status counters */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">{CATEGORY_LABELS[selectedCategory]}</h3>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-emerald-400 font-semibold">{activeBanners} ativos</span>
                  {scheduledBanners > 0 && (
                    <span className="text-amber-400 font-semibold">{scheduledBanners} agendados</span>
                  )}
                  {inactiveBanners > 0 && (
                    <span className="text-muted-foreground">{inactiveBanners} inativos</span>
                  )}
                  <span className="text-muted-foreground/50">{totalBanners} total</span>
                </div>
              </div>

              {/* Upload zone */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <label className="cursor-pointer shrink-0">
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 h-10 text-xs font-semibold hover:brightness-110 transition-all active:scale-[0.97]">
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Upload
                    </span>
                  </label>
                </div>
                <PasteZone onImagePasted={uploadAndCreateCategory} uploading={uploading} />
              </div>
            </div>

            {/* Schedule zone — visually separated */}
            <div className="p-4 border-b border-amber-500/10 bg-amber-500/[0.03]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold text-amber-400">Agendamento</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="flex-1 text-xs h-9 glass-panel border-amber-500/20 focus-visible:ring-amber-500/30"
                  placeholder="Sem agendamento"
                />
                {scheduleDate ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setScheduleDate("")}
                    className="h-9 text-xs text-muted-foreground shrink-0"
                  >
                    Limpar
                  </Button>
                ) : null}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {scheduleDate
                  ? `⏰ Próximo banner ficará inativo até ${new Date(scheduleDate).toLocaleString("pt-BR")}`
                  : "Sem agendamento — banners serão publicados imediatamente"}
              </p>
            </div>

            {/* Banner list */}
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : !banners || banners.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="rounded-xl glass-panel p-4 inline-block"><Image className="h-8 w-8 text-muted-foreground/20" /></div>
                  <p className="text-xs text-muted-foreground">Nenhum banner nesta categoria</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {(() => {
                    // Group banners by date
                    const grouped: Record<string, typeof banners> = {};
                    banners.forEach((b) => {
                      const dateKey = new Date(b.created_at).toLocaleDateString("pt-BR");
                      if (!grouped[dateKey]) grouped[dateKey] = [];
                      grouped[dateKey]!.push(b);
                    });
                    const dateKeys = Object.keys(grouped);
                    return dateKeys.map((dateKey) => (
                      <div key={dateKey}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-bold text-foreground">📅 {dateKey}</span>
                          <span className="text-[10px] text-muted-foreground">— {grouped[dateKey]!.length} banner{grouped[dateKey]!.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="space-y-3">
                          {grouped[dateKey]!.map((banner, idx) => (
                            <div key={banner.id} className="rounded-xl glass-panel overflow-hidden">
                              <div className="relative aspect-[16/9]">
                                <img src={banner.image_url} alt={banner.title || "Banner"} className={`w-full h-full object-cover ${!banner.active ? "opacity-30 grayscale" : ""}`} loading="lazy" />
                                <div className="absolute top-2 right-2 flex items-center gap-1">
                                  {isScheduled(banner) && (
                                    <Badge className="bg-amber-500/90 text-white border-0 text-[9px] px-1.5 py-0.5">
                                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                                      Agendado
                                    </Badge>
                                  )}
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${banner.active ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"}`}>
                                    {banner.active ? "ATIVO" : "OFF"}
                                  </span>
                                </div>
                              </div>
                              <div className="p-3 space-y-1">
                                {isScheduled(banner) && banner.publish_at && (
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-amber-400/80">
                                      ⏰ {new Date(banner.publish_at).toLocaleString("pt-BR")}
                                    </p>
                                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[9px] px-1.5 py-0">
                                      {formatCountdown(banner.publish_at)}
                                    </Badge>
                                  </div>
                                )}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Switch checked={banner.active} onCheckedChange={(v) => updateBanner.mutate({ id: banner.id, active: v })} />
                                    <span className={`text-[10px] font-medium ${banner.active ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                                      {banner.active ? "Ativo" : "Off"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-white/[0.06]" disabled={idx === 0} onClick={() => moveBanner(banner.id, "up")}><ArrowUp className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-white/[0.06]" disabled={idx === grouped[dateKey]!.length - 1} onClick={() => moveBanner(banner.id, "down")}><ArrowDown className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Excluir banner?")) deleteBanner.mutate(banner.id); }}><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
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
