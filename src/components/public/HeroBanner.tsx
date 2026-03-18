import { useDailyBanner } from "@/hooks/useDailyBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";
import { useState } from "react";

export const HeroBanner = () => {
  const { data: banner, isLoading } = useDailyBanner();
  const [imgError, setImgError] = useState(false);

  if (isLoading) {
    return <Skeleton className="w-full aspect-[16/9] rounded-xl" />;
  }

  if (!banner || imgError) {
    return (
      <div className="w-full aspect-[16/9] rounded-xl bg-card border border-border/50 flex items-center justify-center">
        <div className="text-center text-muted-foreground space-y-2">
          <ImageOff className="h-10 w-10 mx-auto opacity-40" />
          <p className="text-sm">Nenhum banner para hoje</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/30 glow-primary">
      <img
        src={banner.image_url}
        alt="Banner do dia"
        className="w-full aspect-[16/9] object-cover"
        loading="lazy"
        onError={() => setImgError(true)}
      />
    </div>
  );
};
