import { CalendarDays } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { DailyGamesSection } from "./DailyGamesSection";

const ScheduleTab = () => (
  <div className="px-4 pt-5 pb-3 space-y-5">
    <SectionHeader icon={CalendarDays} title="Programação" subtitle="Jogos do dia" />
    <DailyGamesSection />
  </div>
);

export default ScheduleTab;
