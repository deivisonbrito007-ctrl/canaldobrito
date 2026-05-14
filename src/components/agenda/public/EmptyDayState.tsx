interface Props {
  onSeeTomorrow?: () => void;
}

export const EmptyDayState = ({ onSeeTomorrow }: Props) => (
  <div className="text-center py-16">
    <div className="text-6xl mb-3" aria-hidden>📅</div>
    <p className="text-white/70 font-medium">Sem jogos para esta data.</p>
    {onSeeTomorrow && (
      <button
        onClick={onSeeTomorrow}
        className="mt-4 inline-flex items-center gap-1.5 text-[#00ff87] text-sm font-semibold underline-offset-4 hover:underline"
      >
        Ver agenda de amanhã →
      </button>
    )}
  </div>
);
