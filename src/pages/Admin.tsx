import { useState, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Trash2, LogOut, ArrowLeft, RefreshCw,
  Image, Upload, Eye, EyeOff,
  ChevronUp, ChevronDown,
} from "lucide-react";
import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  useBanners,
  useUploadBanner,
  useToggleBanner,
  useDeleteBanner,
  BANNER_CATEGORIES,
  type BannerCategory,
  type Banner,
} from "@/hooks/useBanners";

const Admin = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const queryClient = useQueryClient();

  // Banner state
  const [bannerCategory, setBannerCategory] = useState<BannerCategory | "all">("all");
  const [bannerUploadOpen, setBannerUploadOpen] = useState(false);
  const [bannerUploadCategory, setBannerUploadCategory] = useState<BannerCategory>("cover");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: banners = [], isLoading: bannersLoading } = useBanners(
    bannerCategory === "all" ? "all" : bannerCategory,
    false
  );

  const { data: allBannersForStats = [] } = useBanners("all", false);

  const uploadBanner = useUploadBanner();
  const toggleBanner = useToggleBanner();
  const deleteBanner = useDeleteBanner();

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("banners")
        .update({ sort_order: newOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });

  const moveBanner = useCallback(
    (banner: Banner, direction: "up" | "down") => {
      const idx = banners.findIndex((b) => b.id === banner.id);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= banners.length) return;

      const other = banners[swapIdx];
      reorderMutation.mutate({ id: banner.id, newOrder: other.sort_order });
      reorderMutation.mutate({ id: other.id, newOrder: banner.sort_order });
    },
    [banners, reorderMutation]
  );

  const bannerStats = useMemo(() => {
    return {
      total: allBannersForStats.length,
      active: allBannersForStats.filter((b) => b.active).length,
      inactive: allBannersForStats.filter((b) => !b.active).length,
    };
  }, [allBannersForStats]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg text-destructive font-semibold">Acesso negado. Apenas administradores.</p>
        <Button variant="outline" onClick={() => signOut()}>Sair</Button>
      </div>
    );
  }

  const handleBannerFileChange = (file: File) => {
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBannerPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleBannerFileChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleBannerFileChange(file);
  };

  const handleBannerUpload = async () => {
    if (!bannerFile) {
      toast.error("Selecione uma imagem.");
      return;
    }
    try {
      await uploadBanner.mutateAsync({
        file: bannerFile,
        category: bannerUploadCategory,
        title: bannerTitle || undefined,
      });
      toast.success("Banner enviado com sucesso!");
      setBannerUploadOpen(false);
      setBannerFile(null);
      setBannerPreview(null);
      setBannerTitle("");
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Brito Solutions" className="h-9 w-auto" />
            <div>
              <h1 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                Painel Admin
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                  PRO
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Gerenciamento de banners
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Início</span>
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={signOut} className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 px-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: bannerStats.total, icon: <Image className="h-5 w-5" />, color: "text-primary" },
            { label: "Ativos", value: bannerStats.active, icon: <Eye className="h-5 w-5" />, color: "text-[hsl(142,70%,45%)]" },
            { label: "Inativos", value: bannerStats.inactive, icon: <EyeOff className="h-5 w-5" />, color: "text-muted-foreground" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <p className="font-display text-2xl sm:text-3xl font-black text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setBannerCategory("all")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-all min-h-[36px]",
              bannerCategory === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            Todos
            <span className={cn("rounded-full px-1.5 text-[10px] font-bold",
              bannerCategory === "all" ? "bg-primary-foreground/20" : "bg-secondary"
            )}>{bannerStats.total}</span>
          </button>
          {BANNER_CATEGORIES.map((cat) => {
            const count = allBannersForStats.filter((b) => b.category === cat.value).length;
            return (
              <button
                key={cat.value}
                onClick={() => setBannerCategory(cat.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-all min-h-[36px]",
                  bannerCategory === cat.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <span>{cat.icon}</span>
                <span className="hidden sm:inline">{cat.label}</span>
                {count > 0 && (
                  <span className={cn("rounded-full px-1.5 text-[10px] font-bold",
                    bannerCategory === cat.value ? "bg-primary-foreground/20" : "bg-secondary"
                  )}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {banners.length} banner{banners.length !== 1 ? "s" : ""}
          </p>
          <Dialog open={bannerUploadOpen} onOpenChange={(open) => {
            setBannerUploadOpen(open);
            if (!open) {
              setBannerFile(null);
              setBannerPreview(null);
              setBannerTitle("");
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 shadow-sm">
                <Upload className="h-4 w-4" />
                Upload Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border/50 bg-card sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                    <Image className="h-4 w-4 text-primary" />
                  </div>
                  Novo Banner
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Drag & Drop Upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200",
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.02]"
                      : bannerPreview
                        ? "border-border/50 bg-secondary/20"
                        : "border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/40"
                  )}
                >
                  {bannerPreview ? (
                    <div className="space-y-3">
                      <img
                        src={bannerPreview}
                        alt="Preview"
                        className="mx-auto max-h-52 rounded-lg object-contain shadow-md"
                      />
                      <p className="text-xs text-muted-foreground">
                        {bannerFile?.name} • {bannerFile ? (bannerFile.size / 1024 / 1024).toFixed(1) : 0} MB
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBannerFile(null);
                          setBannerPreview(null);
                        }}
                        className="text-xs text-muted-foreground"
                      >
                        Trocar imagem
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Arraste uma imagem ou clique aqui
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          JPG, PNG ou WebP • Máx 10 MB
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Categoria</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {BANNER_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setBannerUploadCategory(cat.value)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all",
                          bannerUploadCategory === cat.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
                        )}
                      >
                        <span className="text-base">{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Título (opcional)</Label>
                  <Input
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="Ex: Jogos do Dia - 18/03"
                    className="bg-secondary/30 border-border/50"
                  />
                </div>

                <Button
                  onClick={handleBannerUpload}
                  disabled={!bannerFile || uploadBanner.isPending}
                  className="w-full h-11 font-medium"
                >
                  {uploadBanner.isPending ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Enviar Banner
                    </span>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Banner Grid */}
        {bannersLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
              <Image className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="font-display text-lg font-semibold text-foreground">
              Nenhum banner encontrado
            </p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Clique em "Upload Banner" para adicionar seu primeiro banner.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {banners.map((banner, idx) => {
                const cat = BANNER_CATEGORIES.find((c) => c.value === banner.category);
                return (
                  <motion.div
                    key={banner.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group rounded-xl border bg-card overflow-hidden transition-all hover:shadow-lg",
                      banner.active
                        ? "border-border/50 hover:border-primary/30"
                        : "border-border/30 opacity-70 hover:opacity-100"
                    )}
                  >
                    {/* Image with overlay */}
                    <div
                      className="relative aspect-[16/9] overflow-hidden bg-secondary cursor-pointer"
                      onClick={() => setPreviewBanner(banner)}
                    >
                      <img
                        src={banner.image_url}
                        alt={banner.title || cat?.label || "Banner"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 backdrop-blur-md">
                        <span className="text-xs">{cat?.icon}</span>
                        <span className="text-[10px] font-semibold text-foreground">{cat?.label}</span>
                      </div>
                      <div className={cn(
                        "absolute top-2 right-2 h-2.5 w-2.5 rounded-full ring-2 ring-background",
                        banner.active ? "bg-[hsl(142,70%,45%)]" : "bg-muted-foreground/50"
                      )} />
                      {!banner.active && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="rounded-full bg-background/90 px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
                            <EyeOff className="h-3.5 w-3.5 inline mr-1.5" />
                            Inativo
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                      </div>
                    </div>

                    {/* Info & Actions */}
                    <div className="p-3 space-y-2.5">
                      {banner.title && (
                        <p className="text-sm font-medium text-foreground truncate">
                          {banner.title}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(banner.created_at), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={banner.active}
                            onCheckedChange={(v) =>
                              toggleBanner.mutate({ id: banner.id, active: v })
                            }
                          />
                          <span className={cn("text-xs font-medium", banner.active ? "text-[hsl(142,70%,45%)]" : "text-muted-foreground")}>
                            {banner.active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => moveBanner(banner, "up")}
                            disabled={idx === 0}
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => moveBanner(banner, "down")}
                            disabled={idx === banners.length - 1}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive/70 hover:text-destructive"
                            onClick={() => {
                              if (confirm("Remover este banner permanentemente?"))
                                deleteBanner.mutate(banner);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Full Preview Dialog */}
        <Dialog open={!!previewBanner} onOpenChange={(open) => !open && setPreviewBanner(null)}>
          <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-border/50 bg-card">
            {previewBanner && (
              <>
                <div className="relative">
                  <img
                    src={previewBanner.image_url}
                    alt={previewBanner.title || "Banner"}
                    className="w-full object-contain max-h-[80vh]"
                  />
                </div>
                <div className="px-6 pb-6 pt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {BANNER_CATEGORIES.find((c) => c.value === previewBanner.category)?.icon}
                    </span>
                    <p className="font-display text-lg font-semibold text-foreground">
                      {previewBanner.title || BANNER_CATEGORIES.find((c) => c.value === previewBanner.category)?.label}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Criado em {format(new Date(previewBanner.created_at), "dd/MM/yyyy 'às' HH:mm")}
                    {" • "}
                    {previewBanner.active ? "✅ Ativo" : "⏸️ Inativo"}
                  </p>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Admin;
