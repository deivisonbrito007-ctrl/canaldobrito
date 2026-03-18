import { useState } from "react";
import { cn } from "@/lib/utils";

interface TeamLogoProps {
  name: string;
  logo?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-12 w-12 text-base",
};

export const TeamLogo = ({ name, logo, size = "md", className }: TeamLogoProps) => {
  const [imgError, setImgError] = useState(false);

  if (logo && !imgError) {
    return (
      <img
        src={logo}
        alt={name}
        className={cn(sizeClasses[size], "rounded-full object-contain", className)}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  // Fallback: first letter in colored circle
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className={cn(
        sizeClasses[size],
        "flex shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-foreground",
        className
      )}
    >
      {initial}
    </div>
  );
};
