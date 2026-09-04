import { CalendarX2, Clapperboard } from "lucide-react";

interface Props {
  onSeeTomorrow?: () => void;
}

const goToMovies = () => {
  try {
    window.dispatchEvent(new CustomEvent("nav-tab-change", { detail: { tab: "novidades" } }));
  } catch {
    /* noop */
  }
};

export const EmptyDayState = ({ onSeeTomorrow }: Props) => (
  <div className="text-center py-14 px-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] md:max-w-[560px] md:mx-auto">
    <div
      className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
      style={{ background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.2)" }}
    >
      <CalendarX2 className="w-6 h-6 text-[#00ff87]" aria-hidden />
    </div>
    <p className="text-white font-semibold text-[16px]">Ainda não há jogos publicados para este dia</p>
    <p className="text-white/55 text-[13px] mt-1.5 max-w-[320px] mx-auto">
      A programação é atualizada diariamente. Volte mais tarde ou aproveite para ver os filmes e séries.
    </p>
    <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
      {onSeeTomorrow && (
        <button
          onClick={onSeeTomorrow}
          className="min-h-11 px-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#00ff87] text-[#07080a] text-sm font-bold active:scale-95 transition"
        >
          Ver agenda de amanhã →
        </button>
      )}
      <button
        onClick={goToMovies}
        className="min-h-11 px-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 text-white/85 text-sm font-semibold hover:bg-white/5 active:scale-95 transition"
      >
        <Clapperboard className="w-4 h-4" aria-hidden />
        Filmes e Séries
      </button>
    </div>
  </div>
);
