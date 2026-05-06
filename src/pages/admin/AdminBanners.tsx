import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAllBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, CATEGORY_LABELS, CATEGORY_LIST, type BannerCategory } from "@/hooks/useBanners";
import { ProgramacaoTexto } from "@/components/admin/ProgramacaoTexto";
import { DailyGamesManager } from "@/components/admin/DailyGamesManager";
import { ArchivedGamesManager } from "@/components/admin/ArchivedGamesManager";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Upload, ArrowUp, ArrowDown, Loader2, Image, ClipboardPaste, Clock, PowerOff, AlertCircle } from "lucide-react";
import { formatCountdown, getScheduleDate, isFutureSchedule } from "@/lib/dateUtils";
import { toast } from "sonner";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

const validateImageFile = (file: File): string | null => {
  if (!file.type.startsWith("image/")) return `${file.name}: não é imagem`;
  if (file.size > MAX_FILE_BYTES) return `${file.name}: maior que 5MB`;
  return null;
};

const PasteZone = ({
  onFiles,
  uploading,
}: { onFiles: (files: File[]) => void; uploading: boolean }) => {
  const [highlight, setHighlight] = useState(false);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const f = items[i].getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      onFiles(files);
    }
  }, [onFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setHighlight(true); }, []);
  const handleDragLeave = useCallback(() => { setHighlight(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setHighlight(false);
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(files);
  }, [onFiles]);

  return (
    <div
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onFocus={() => setHighlight(true)}
      onBlur={() => setHighlight(false)}
      tabIndex={0}
      role="button"
      aria-label="Cole (Ctrl+V) ou arraste imagens aqui para enviar (várias permitidas)"
      aria-busy={uploading}
      className={`relative rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        highlight ? "border-primary/60 bg-primary/5" : "border-border/30 hover:border-border/50 bg-transparent"
      } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
    >
      <div className="flex flex-col items-center gap-1.5">
        {uploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <ClipboardPaste className="h-5 w-5 text-muted-foreground/50" />}
        <span className="text-[11px] text-muted-foreground/70">
          {uploading ? "Enviando..." : "Cole (Ctrl+V) ou arraste imagens aqui — várias permitidas"}
        </span>
      </div>
    </div>
  );
};

const AdminBanners = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "categories" ? "categories" : "programacao";
  const [activeSection, setActiveSection] = useState<"categories" | "programacao">(initialTab);

  const [selectedCategory, setSelectedCategory] = useState<BannerCategory>("cover");
  const { data: banners, isLoading } = useAllBanners(selectedCategory);
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [scheduleMode, setScheduleMode] = useState<"none" | "00" | "06" | "12" | "custom">("00");
  const [scheduleDate, setScheduleDate] = useState(() => getScheduleDate(0));
  const listEndRef = useRef<HTMLDivElement>(null);

  // Confirmations
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  // Live countdown tick (60s) — local only, doesn't refetch.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const handleSetSection = useCallback((section: "categories" | "programacao") => {
    setActiveSection(section);
    setSearchParams(section === "programacao" ? {} : { tab: section });
  }, [setSearchParams]);

  // Schedule validation
  const minDatetime = getScheduleDate(0).slice(0, 16);
  const scheduleInvalid = scheduleMode === "custom" && !isFutureSchedule(scheduleDate);

  const uploadMany = useCallback(async (files: File[]) => {
    if (!files.length) return;
    if (scheduleInvalid) {
      toast.error("Data de agendamento inválida (use uma data futura)");
      return;
    }

    // Validate
    const valid: File[] = [];
    const errors: string[] = [];
    for (const f of files) {
      const err = validateImageFile(f);
      if (err) errors.push(err);
      else valid.push(f);
    }
    if (errors.length) toast.error(`${errors.length} arquivo(s) ignorado(s)`, { description: errors.slice(0, 3).join("; ") });
    if (!valid.length) return;

    setUploading(true);
    setProgress({ current: 0, total: valid.length });

    let baseOrder = banners?.reduce((max, b) => Math.max(max, b.sort_order), 0) || 0;
    let okCount = 0;
    let failCount = 0;

    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      try {
        const ext = file.name?.split(".").pop()?.toLowerCase() || "png";
        const today = new Date().toISOString().split("T")[0];
        const path = `${selectedCategory}/${today}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);

        baseOrder += 1;
        const bannerData: any = {
          image_url: publicUrl,
          category: selectedCategory,
          sort_order: baseOrder,
        };
        if (scheduleMode !== "none" && scheduleDate) {
          bannerData.publish_at = new Date(scheduleDate).toISOString();
          bannerData.active = false;
        }
        await createBanner.mutateAsync(bannerData);
        okCount += 1;
      } catch (err: any) {
        failCount += 1;
        toast.error(`Falha em ${file.name}`, { description: err?.message?.slice(0, 100) });
      } finally {
        setProgress({ current: i + 1, total: valid.length });
      }
    }

    setUploading(false);
    setTimeout(() => setProgress(null), 1500);
    if (okCount && !failCount) toast.success(`${okCount} banner${okCount > 1 ? "s" : ""} ${scheduleMode !== "none" ? "agendado(s)" : "enviado(s)"}`);
    else if (okCount && failCount) toast.warning(`${okCount} enviado(s), ${failCount} com erro`);
    setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: "smooth" }), 500);
  }, [selectedCategory, banners, createBanner, scheduleDate, scheduleMode, scheduleInvalid]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    await uploadMany(files);
    e.target.value = "";
  };

  // Optimistic reorder
  const moveBanner = async (id: string, direction: "up" | "down") => {
    if (!banners) return;
    const idx = banners.findIndex((b) => b.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= banners.length) return;
    try {
      await Promise.all([
        updateBanner.mutateAsync({ id: banners[idx].id, sort_order: banners[swapIdx].sort_order }),
        updateBanner.mutateAsync({ id: banners[swapIdx].id, sort_order: banners[idx].sort_order }),
      ]);
    } catch {
      toast.error("Erro ao reordenar");
    }
  };

  const performDeactivateAll = async () => {
    if (!banners) return;
    const activeOnes = banners.filter((b) => b.active);
    if (activeOnes.length === 0) { toast.info("Nenhum banner ativo nesta categoria"); return; }
    const results = await Promise.allSettled(
      activeOnes.map((b) => updateBanner.mutateAsync({ id: b.id, active: false }))
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const fail = results.length - ok;
    if (fail === 0) toast.success(`${ok} banner(s) desativado(s)`);
    else toast.warning(`${ok} desativado(s), ${fail} com erro`);
  };

  const performDelete = async (id: string) => {
    try {
      await deleteBanner.mutateAsync(id);
      toast.success("Banner excluído");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const activeBanners = banners?.filter((b) => b.active).length || 0;
  const scheduledBanners = banners?.filter((b) => b.publish_at && !b.active).length || 0;
  const inactiveBanners = banners?.filter((b) => !b.active && !b.publish_at).length || 0;
  const totalBanners = banners?.length || 0;
  const isScheduled = (banner: any) => banner.publish_at && !banner.active;

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Seções do admin"
        className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-3 px-3 sm:mx-0 sm:px-0"
      >
        {[
          { key: "programacao" as const, label: "📋 Programação" },
          { key: "categories" as const, label: "📁 Categorias" },
        ].map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={activeSection === s.key}
            onClick={() => handleSetSection(s.key)}
            className={`shrink-0 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all min-h-[44px] ${
              activeSection === s.key
                ? "glass-panel bg-white/[0.06] text-foreground border-white/[0.12]"
                : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.03]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === "programacao" && (
        <div className="space-y-4">
          <ProgramacaoTexto />
          <DailyGamesManager />
          <ArchivedGamesManager />
        </div>
      )}

      {activeSection === "categories" && (
        <>
          <div
            role="tablist"
            aria-label="Categoria de banner"
            className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]"
          >
            {CATEGORY_LIST.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all min-h-[44px] ${
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
            {/* Header */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                <h3 className="text-sm font-bold text-foreground">{CATEGORY_LABELS[selectedCategory]}</h3>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px]">
                  <span className="text-emerald-400 font-semibold">{activeBanners} ativos</span>
                  {scheduledBanners > 0 && <span className="text-amber-400 font-semibold">{scheduledBanners} agendados</span>}
                  {inactiveBanners > 0 && <span className="text-muted-foreground">{inactiveBanners} inativos</span>}
                  <span className="text-muted-foreground/50">{totalBanners} total</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <label className="cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleUpload}
                      aria-label="Selecionar imagens para upload"
                    />
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 min-h-[44px] text-xs font-semibold hover:brightness-110 transition-all active:scale-[0.97]">
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Upload (vários)
                    </span>
                  </label>
                  {activeBanners > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDeactivate(true)}
                      className="text-[11px] text-destructive hover:bg-destructive/10 gap-1.5 min-h-[44px]"
                    >
                      <PowerOff className="h-3.5 w-3.5" />
                      Desativar todos
                    </Button>
                  )}
                </div>

                {progress && (
                  <div className="space-y-1" role="status" aria-live="polite">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Enviando {progress.current}/{progress.total}</span>
                      <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                    </div>
                    <Progress value={(progress.current / progress.total) * 100} className="h-1.5" />
                  </div>
                )}

                <PasteZone onFiles={uploadMany} uploading={uploading} />
              </div>
            </div>

            {/* Schedule */}
            <div className="p-4 border-b border-amber-500/10 bg-amber-500/[0.03]">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold text-amber-400">Agendamento</span>
              </div>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {([
                  { key: "00" as const, label: "Amanhã 00h" },
                  { key: "06" as const, label: "Amanhã 06h" },
                  { key: "12" as const, label: "Amanhã 12h" },
                  { key: "custom" as const, label: "Personalizado" },
                  { key: "none" as const, label: "Sem agendamento" },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setScheduleMode(opt.key);
                      if (opt.key === "00") setScheduleDate(getScheduleDate(0));
                      else if (opt.key === "06") setScheduleDate(getScheduleDate(6));
                      else if (opt.key === "12") setScheduleDate(getScheduleDate(12));
                      else if (opt.key === "none") setScheduleDate("");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all min-h-[36px] ${
                      scheduleMode === opt.key
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "glass-panel text-muted-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {scheduleMode === "custom" && (
                <Input
                  type="datetime-local"
                  value={scheduleDate}
                  min={minDatetime}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="text-xs h-10 glass-panel border-amber-500/20 focus-visible:ring-amber-500/30 mb-2"
                  aria-invalid={scheduleInvalid}
                />
              )}
              {scheduleInvalid && (
                <div role="alert" className="flex items-center gap-1.5 text-[10px] text-destructive mb-2">
                  <AlertCircle className="h-3 w-3" />
                  <span>Selecione uma data e hora futuras.</span>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                {scheduleMode === "none"
                  ? "Banners serão publicados imediatamente"
                  : `⏰ Agendado para ${scheduleDate ? new Date(scheduleDate).toLocaleString("pt-BR") : "—"}`}
              </p>
            </div>

            {/* Banner list */}
            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="aspect-[16/9] rounded-xl skeleton-shimmer" />
                  ))}
                </div>
              ) : !banners || banners.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="rounded-xl glass-panel p-4 inline-block"><Image className="h-8 w-8 text-muted-foreground/20" /></div>
                  <p className="text-xs text-muted-foreground">Nenhum banner nesta categoria</p>
                  <p className="text-[10px] text-muted-foreground/60">Cole, arraste ou clique em "Upload" para começar</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {(() => {
                    const grouped: Record<string, typeof banners> = {};
                    banners.forEach((b) => {
                      const dateKey = new Date(b.created_at).toLocaleDateString("pt-BR");
                      if (!grouped[dateKey]) grouped[dateKey] = [];
                      grouped[dateKey]!.push(b);
                    });
                    const globalIdx = new Map<string, number>();
                    banners.forEach((b, i) => globalIdx.set(b.id, i));

                    return Object.keys(grouped).map((dateKey) => (
                      <div key={dateKey}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-bold text-foreground">📅 {dateKey}</span>
                          <span className="text-[10px] text-muted-foreground">— {grouped[dateKey]!.length} banner{grouped[dateKey]!.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="space-y-3">
                          {grouped[dateKey]!.map((banner) => {
                            const gIdx = globalIdx.get(banner.id) ?? 0;
                            const altText = banner.title || `Banner ${CATEGORY_LABELS[selectedCategory]} de ${dateKey}`;
                            return (
                              <div key={banner.id} className="rounded-xl glass-panel overflow-hidden">
                                <div className="relative aspect-[16/9]">
                                  <img
                                    src={banner.image_url}
                                    alt={altText}
                                    className={`w-full h-full object-cover ${!banner.active ? "opacity-30 grayscale" : ""}`}
                                    loading="lazy"
                                  />
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
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-[10px] text-amber-400/80">⏰ {new Date(banner.publish_at).toLocaleString("pt-BR")}</p>
                                      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[9px] px-1.5 py-0">
                                        {formatCountdown(banner.publish_at)}
                                      </Badge>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={banner.active}
                                        onCheckedChange={(v) => updateBanner.mutate({ id: banner.id, active: v })}
                                        aria-label={`${banner.active ? "Desativar" : "Ativar"} banner`}
                                      />
                                      <span className={`text-[10px] font-medium ${banner.active ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                                        {banner.active ? "Ativo" : "Off"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label="Mover para cima"
                                        className="h-11 w-11 sm:h-9 sm:w-9 rounded-lg hover:bg-white/[0.06]"
                                        disabled={gIdx === 0}
                                        onClick={() => moveBanner(banner.id, "up")}
                                      >
                                        <ArrowUp className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label="Mover para baixo"
                                        className="h-11 w-11 sm:h-9 sm:w-9 rounded-lg hover:bg-white/[0.06]"
                                        disabled={gIdx === banners.length - 1}
                                        onClick={() => moveBanner(banner.id, "down")}
                                      >
                                        <ArrowDown className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label="Excluir banner"
                                        className="h-11 w-11 sm:h-9 sm:w-9 rounded-lg text-destructive hover:bg-destructive/10"
                                        onClick={() => setDeleteId(banner.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                  <div ref={listEndRef} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente o banner. Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) performDelete(deleteId); setDeleteId(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate-all confirmation */}
      <AlertDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar todos os banners?</AlertDialogTitle>
            <AlertDialogDescription>
              {activeBanners} banner(s) ativo(s) em {CATEGORY_LABELS[selectedCategory]} ficarão ocultos do público.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { performDeactivateAll(); setConfirmDeactivate(false); }}>
              Desativar todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBanners;
