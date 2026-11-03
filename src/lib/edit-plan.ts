export type Style = "fast" | "cinematic" | "vlog" | "story" | "highlight" | "minimal";
export type Platform = "tiktok" | "youtube" | "feed";

export interface Clip { id: string; name: string; url: string; duration: number }
export interface Segment {
  clipId: string; start: number; end: number; speed: number;
  transition: "cut" | "fade" | "zoom"; zoom: number; reason: string;
}

const STYLE: Record<Style, { seg: [number, number]; speed: number; transition: Segment["transition"]; zoom: number; label: string }> = {
  fast: { seg: [0.8, 1.8], speed: 1.15, transition: "cut", zoom: 1.08, label: "corte rápido no ritmo" },
  cinematic: { seg: [3.5, 6], speed: 0.85, transition: "fade", zoom: 1.03, label: "plano longo em câmera lenta" },
  vlog: { seg: [2, 4], speed: 1, transition: "cut", zoom: 1, label: "momento natural" },
  story: { seg: [3, 5], speed: 1, transition: "fade", zoom: 1, label: "trecho narrativo" },
  highlight: { seg: [1.2, 2.5], speed: 1.1, transition: "zoom", zoom: 1.12, label: "destaque de impacto" },
  minimal: { seg: [3, 4.5], speed: 1, transition: "fade", zoom: 1, label: "plano limpo" },
};

/** Builds an edit plan whose total output length matches `target` seconds. */
export function buildPlan(clips: Clip[], style: Style, target: number, seed = 1): Segment[] {
  const usable = clips.filter((c) => c.duration > 0.5);
  if (!usable.length || target <= 0) return [];
  const cfg = STYLE[style];
  let rnd = seed;
  const rand = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
  const out: Segment[] = [];
  let total = 0;
  let i = 0;
  while (total < target - 0.05 && i < 500) {
    const clip = usable[i % usable.length];
    const want = Math.min(cfg.seg[0] + rand() * (cfg.seg[1] - cfg.seg[0]), (target - total) * cfg.speed);
    const len = Math.min(want, clip.duration);
    const start = Math.max(0, rand() * (clip.duration - len));
    out.push({ clipId: clip.id, start, end: start + len, speed: cfg.speed, transition: i === 0 ? "cut" : cfg.transition, zoom: cfg.zoom, reason: cfg.label });
    total += len / cfg.speed;
    i++;
  }
  return out;
}

export const planLength = (p: Segment[]) => p.reduce((s, x) => s + (x.end - x.start) / x.speed, 0);
