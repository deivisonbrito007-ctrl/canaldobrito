export function formatCountdown(publishAt: string): string {
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
