import { describe, it } from "vitest";
import { parseScheduleText, preprocessInlineFormatC } from "@/components/admin/ProgramacaoTexto";
const T = `Camp. Mundial Sub-20 — Dia 4

🏃 Atletismo / ⏰ 13h00

📺 SporTV 3

Camp. Brasileiro — Finais

🤸 Ginástica Artística / ⏰ 14h30

📺 SporTV 2, GETV`;
describe("dbg", () => { it("x", () => {
  console.log("PRE:\n" + preprocessInlineFormatC(T));
  console.log(JSON.stringify(parseScheduleText(T, "2026-08-08"), null, 1));
}); });
