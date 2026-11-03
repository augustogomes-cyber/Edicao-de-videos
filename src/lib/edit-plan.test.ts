import { describe, it, expect } from "vitest";
import { buildPlan, planLength } from "./edit-plan";

const clips = [{ id: "a", name: "a", url: "", duration: 20 }, { id: "b", name: "b", url: "", duration: 12 }];

describe("buildPlan", () => {
  it("matches the chosen duration of 30s", () => {
    expect(Math.abs(planLength(buildPlan(clips, "fast", 30)) - 30)).toBeLessThan(0.1);
  });
  it("cinematic uses slow motion", () => {
    expect(buildPlan(clips, "cinematic", 15)[0]!.speed).toBeLessThan(1);
  });
  it("segments stay inside their clip", () => {
    for (const s of buildPlan(clips, "story", 60)) {
      const c = clips.find((x) => x.id === s.clipId)!;
      expect(s.end).toBeLessThanOrEqual(c.duration + 1e-6);
    }
  });
});
