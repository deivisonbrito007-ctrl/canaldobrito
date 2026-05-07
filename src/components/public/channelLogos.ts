// Registry centralizado de logos. Para adicionar uma nova:
// 1. Salve o PNG/SVG em src/assets/brand-logos/
// 2. Importe abaixo
// 3. Adicione ao LOGO_REGISTRY com label e (opcional) lightChip
import bandLogo from "@/assets/brand-logos/band.png";
import bandsportsLogo from "@/assets/brand-logos/bandsports.png";
import cazetvLogo from "@/assets/brand-logos/cazetv.png";
import daznLogo from "@/assets/brand-logos/dazn.png";
import disneyLogo from "@/assets/brand-logos/disneyplus.png";
import espnLogo from "@/assets/brand-logos/espn.png";
import globoLogo from "@/assets/brand-logos/globo.png";
import globoplayLogo from "@/assets/brand-logos/globoplay.png";
import goatLogo from "@/assets/brand-logos/goat.png";
import maxLogo from "@/assets/brand-logos/max.png";
import netflixLogo from "@/assets/brand-logos/netflix.png";
import paramountLogo from "@/assets/brand-logos/paramountplus.png";
import premiereLogo from "@/assets/brand-logos/premiere.png";
import primeLogo from "@/assets/brand-logos/primevideo.png";
import recordLogo from "@/assets/brand-logos/record.png";
import spaceLogo from "@/assets/brand-logos/space.png";
import sportvLogo from "@/assets/brand-logos/sportv.png";
import tntLogo from "@/assets/brand-logos/tntsports.png";
import youtubeLogo from "@/assets/brand-logos/youtube.png";
import xsportsLogo from "@/assets/brand-logos/xsports.png";
import appletvLogo from "@/assets/brand-logos/appletv.svg";

export type LogoEntry = { src: string; label: string; lightChip?: boolean };

export const LOGO_REGISTRY: Record<string, LogoEntry> = {
  band:       { src: bandLogo,       label: "Band" },
  bandsports: { src: bandsportsLogo, label: "BandSports" },
  cazetv:     { src: cazetvLogo,     label: "Cazé TV" },
  dazn:       { src: daznLogo,       label: "DAZN" },
  disney:     { src: disneyLogo,     label: "Disney+" },
  espn:       { src: espnLogo,       label: "ESPN" },
  globo:      { src: globoLogo,      label: "Globo", lightChip: true },
  globoplay:  { src: globoplayLogo,  label: "Globoplay" },
  goat:       { src: goatLogo,       label: "Canal GOAT" },
  max:        { src: maxLogo,        label: "Max / HBO" },
  netflix:    { src: netflixLogo,    label: "Netflix" },
  paramount:  { src: paramountLogo,  label: "Paramount+" },
  premiere:   { src: premiereLogo,   label: "Premiere" },
  prime:      { src: primeLogo,      label: "Prime Video" },
  record:     { src: recordLogo,     label: "Record" },
  space:      { src: spaceLogo,      label: "Space" },
  sportv:     { src: sportvLogo,     label: "SporTV" },
  tnt:        { src: tntLogo,        label: "TNT Sports" },
  youtube:    { src: youtubeLogo,    label: "YouTube" },
  xsports:    { src: xsportsLogo,    label: "X Sports" },
  apple:      { src: appletvLogo,    label: "Apple TV" },
};

export type LogoKey = keyof typeof LOGO_REGISTRY | "none";

export const LOGO_OPTIONS: Array<{ key: LogoKey; label: string }> = [
  { key: "none", label: "Sem logo (emoji)" },
  ...Object.entries(LOGO_REGISTRY).map(([k, v]) => ({ key: k as LogoKey, label: v.label })),
];

export const normalizeChannelName = (s: string) =>
  s.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s\-_!+]/g, "")
    .trim();
