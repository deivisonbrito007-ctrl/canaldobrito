import { motion } from "framer-motion";

export const LiveBadge = () => (
  <motion.div
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    className="inline-flex items-center gap-1.5 rounded-full bg-live/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-live glow-live"
  >
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
    </span>
    Ao Vivo
  </motion.div>
);
