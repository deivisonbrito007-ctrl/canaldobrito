import { type LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
}

export const SectionHeader = ({ icon: Icon, title, subtitle, badge }: SectionHeaderProps) => (
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 shadow-[0_0_10px_hsl(var(--primary)/0.1)]">
      <Icon className="h-[18px] w-[18px] text-primary" />
    </div>
    <div className="flex flex-col gap-0.5">
      <h2 className="font-body text-[15px] sm:text-base font-bold text-foreground leading-tight tracking-tight">
        {title} <span className="text-foreground/70">Canal do Brito</span>
      </h2>
      <p className="text-[10px] text-muted-foreground/60 font-body tracking-wide leading-none">
        {subtitle}
      </p>
    </div>
    {badge}
  </div>
);
