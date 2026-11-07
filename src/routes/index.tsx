import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPlan, frameEffects, planLength, type Clip, type Platform, type Segment, type Style } from "@/lib/edit-plan";
import { drawEditedFrame, recordingMimeType } from "@/lib/video-renderer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CutCraft — Editor de vídeo com IA" },
      { name: "description", content: "Envie seus vídeos, escolha estilo, plataforma e duração, e receba uma edição dinâmica pronta." },
      { property: "og:title", content: "CutCraft — Editor de vídeo com IA" },
      { property: "og:description", content: "Edição dinâmica automática: fast-paced, cinematic, vlog e mais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Studio,
});

const STYLES: { id: Style; name: string; desc: string }[] = [
  { id: "fast", name: "Fast-paced", desc: "Cortes rápidos e ritmo alto" },
  { id: "cinematic", name: "Cinematic", desc: "Planos longos, câmera lenta" },
  { id: "vlog", name: "Vlog", desc: "Natural e descontraído" },
  { id: "story", name: "Storytelling", desc: "Começo, meio e fim" },
  { id: "highlight", name: "Highlight", desc: "Momentos de impacto, zooms" },
  { id: "minimal", name: "Minimalista", desc: "Limpo e elegante" },
];
const CATEGORIES = ["Venda", "Tutorial", "Viagem", "Lifestyle", "Evento", "Humor", "Esporte", "Institucional"];
const PLATFORMS: { id: Platform; name: string; ratio: string; aspect: string }[] = [
  { id: "tiktok", name: "TikTok / Reels / Shorts", ratio: "9:16", aspect: "aspect-[9/16]" },
  { id: "youtube", name: "YouTube", ratio: "16:9", aspect: "aspect-video" },
  { id: "feed", name: "Feed Instagram", ratio: "1:1", aspect: "aspect-square" },
];
const DURATIONS = [15, 30, 60, 90];
const STEPS = ["Vídeos", "Estilo", "Intenção", "Plataforma", "Duração", "Áudio", "Resultado"];

function Studio() {
  const [step, setStep] = useState(0);
  const [clips, setClips] = useState<Clip[]>([]);
  const [style, setStyle] = useState<Style>("fast");
  const [intent, setIntent] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [duration, setDuration] = useState(30);
  const [audio, setAudio] = useState<"original" | "music">("original");
  const [music, setMusic] = useState<{ url: string; name: string } | null>(null);
  const [musicStart, setMusicStart] = useState(0);
  const [plan, setPlan] = useState<Segment[]>([]);
  const [seed, setSeed] = useState(1);

  const addFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const isVideo = (f: File) => f.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|mkv|avi|3gp|hevc)$/i.test(f.name);
    const added: Clip[] = Array.from(files).filter(isVideo).map((f) => ({
      id: crypto.randomUUID(), name: f.name, url: URL.createObjectURL(f), duration: 0,
    }));
    if (!added.length) return;
    setClips((c) => [...c, ...added]);
    // Read durations a few at a time so hundreds of files don't freeze the browser
    const queue = [...added];
    const worker = async () => {
      for (let clip = queue.shift(); clip; clip = queue.shift()) {
        const d = await new Promise<number>((res) => {
          const v = document.createElement("video");
          const done = (n: number) => { v.removeAttribute("src"); v.load(); res(n); };
          const t = setTimeout(() => done(10), 8000);
          v.preload = "metadata"; v.muted = true;
          v.onloadedmetadata = () => { clearTimeout(t); done(Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 10); };
          v.onerror = () => { clearTimeout(t); done(10); };
          v.src = clip!.url;
        });
        const id = clip.id;
        setClips((c) => c.map((x) => (x.id === id ? { ...x, duration: d } : x)));
      }
    };
    Array.from({ length: 4 }, worker);
  };

  const generate = (s = seed) => { setPlan(buildPlan(clips.map((c) => (c.duration ? c : { ...c, duration: 10 })), style, duration, s)); setStep(6); };
  const canNext = step !== 0 || clips.length > 0;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-10">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">CutCraft Studio</p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight">Edição dinâmica com IA</h1>
        </div>
        <p className="font-mono text-xs text-muted-foreground">{step + 1}/{STEPS.length}</p>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <button key={s} disabled={i > 0 && !clips.length} onClick={() => (i === 6 ? generate() : setStep(i))}
            className={`rounded-full px-3 py-1 font-mono text-xs ${i === step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"} disabled:opacity-40`}>
            {s}
          </button>
        ))}
      </nav>

      <section className="rounded-2xl border border-border bg-card/60 p-6">
        {step === 0 && (
          <div>
            <h2 className="text-xl font-semibold">Envie seus vídeos</h2>
            <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-14 text-muted-foreground hover:border-primary">
              <span className="text-lg text-foreground">Arraste os vídeos aqui</span>
              <span className="text-sm">ou clique para escolher</span>
              <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </label>
            {clips.length > 0 && (
              <div className="mt-4 flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span>{clips.length} vídeos · {clips.filter((c) => !c.duration).length > 0 ? `lendo ${clips.filter((c) => !c.duration).length}…` : "prontos"}</span>
                <button className="text-destructive" onClick={() => setClips([])}>Remover todos</button>
              </div>
            )}
            <div className="mt-2 grid max-h-[420px] grid-cols-2 gap-2 overflow-auto pr-1 sm:grid-cols-4">
              {clips.map((c, i) => (
                <div key={c.id} className="overflow-hidden rounded-lg border border-border bg-background">
                  {i < 24 && <video src={c.url} preload="metadata" className="aspect-video w-full object-cover" muted />}
                  <div className="flex items-center justify-between gap-2 p-2 text-xs">
                    <span className="truncate">{c.name}</span>
                    <button className="text-destructive" onClick={() => setClips((x) => x.filter((y) => y.id !== c.id))}>✕</button>
                  </div>
                  <p className="px-2 pb-2 font-mono text-xs text-muted-foreground">{c.duration ? `${c.duration.toFixed(1)}s` : "…"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <Grid title="Estilo de edição">
            {STYLES.map((s) => (
              <button key={s.id} onClick={() => setStyle(s.id)} className={`chip ${style === s.id ? "chip-on" : ""}`}>
                <b className="block text-base">{s.name}</b><span className="text-muted-foreground">{s.desc}</span>
              </button>
            ))}
          </Grid>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold">Qual a intenção do vídeo?</h2>
            <textarea value={intent} onChange={(e) => setIntent(e.target.value)} rows={3}
              placeholder="Ex.: mostrar o novo produto e levar as pessoas a comprar"
              className="mt-4 w-full rounded-lg border border-input bg-background p-3 outline-none focus:border-primary" />
            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCats((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))}
                  className={`chip py-2 ${cats.includes(c) ? "chip-on" : ""}`}>{c}</button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <Grid title="Plataforma e enquadramento">
            {PLATFORMS.map((p) => (
              <button key={p.id} onClick={() => setPlatform(p.id)} className={`chip ${platform === p.id ? "chip-on" : ""}`}>
                <b className="block">{p.name}</b><span className="font-mono text-muted-foreground">{p.ratio}</span>
              </button>
            ))}
          </Grid>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-xl font-semibold">Duração final</h2>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {DURATIONS.map((d) => (
                <button key={d} onClick={() => setDuration(d)} className={`chip font-mono ${duration === d ? "chip-on" : ""}`}>{d}s</button>
              ))}
              <input type="number" min={5} max={600} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 5)}
                className="w-24 rounded-lg border border-input bg-background p-3 font-mono" />
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-xl font-semibold">Áudio</h2>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setAudio("original")} className={`chip ${audio === "original" ? "chip-on" : ""}`}>Áudio original</button>
              <button onClick={() => setAudio("music")} className={`chip ${audio === "music" ? "chip-on" : ""}`}>Usar música</button>
            </div>
            {audio === "music" && (
              <div className="mt-4 space-y-3">
                <input type="file" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setMusic({ url: URL.createObjectURL(f), name: f.name }); }} />
                {music && (
                  <label className="block text-sm text-muted-foreground">
                    Começar a música em <span className="font-mono text-foreground">{musicStart}s</span>
                    <input type="range" min={0} max={240} value={musicStart} onChange={(e) => setMusicStart(Number(e.target.value))} className="mt-2 w-full accent-primary" />
                  </label>
                )}
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <Result plan={plan} clips={clips} platform={platform} aspect={PLATFORMS.find((p) => p.id === platform)?.aspect ?? "aspect-[9/16]"} style={style}
            muted={audio === "music"} music={audio === "music" ? music : null} musicStart={musicStart}
            onRedo={() => { const s = seed + 1; setSeed(s); generate(s); }} />
        )}
      </section>

      {step < 6 && (
        <div className="mt-6 flex justify-between">
          <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-lg bg-secondary px-5 py-2 disabled:opacity-40">Voltar</button>
          <button disabled={!canNext} onClick={() => (step === 5 ? generate() : setStep(step + 1))}
            className="rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground disabled:opacity-40">
            {step === 5 ? "Gerar edição" : "Continuar"}
          </button>
        </div>
      )}
    </main>
  );
}

function Grid({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div><h2 className="text-xl font-semibold">{title}</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{children}</div></div>);
}

function Result({ plan, clips, platform, aspect, style, muted, music, musicStart, onRedo }: {
  plan: Segment[]; clips: Clip[]; platform: Platform; aspect: string; muted: boolean;
  style: Style;
  music: { url: string } | null; musicStart: number; onRedo: () => void;
}) {
  const vid = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const aud = useRef<HTMLAudioElement>(null);
  const playbackFinished = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [idx, setIdx] = useState(-1);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [renderError, setRenderError] = useState("");
  const seg = idx >= 0 ? plan[idx] : null;

  useEffect(() => {
    const video = vid.current;
    const currentCanvas = canvas.current;
    if (!video || !currentCanvas) return;
    let frame = 0;
    let finished = false;
    const paint = () => {
      const current = plan[idx];
      if (current && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const clip = clips.find((item) => item.id === current.clipId);
        if (clip) drawEditedFrame(currentCanvas, video, current, style, (video.currentTime - current.start) / current.speed);
      }
      if (idx >= 0 && !finished) {
        if (video.currentTime >= (plan[idx]?.end ?? 0)) {
          finished = true;
          if (idx + 1 >= plan.length) playbackFinished.current = true;
          setIdx((currentIdx) => currentIdx + 1 < plan.length ? currentIdx + 1 : -1);
        }
        frame = requestAnimationFrame(paint);
      }
    };
    if (idx >= 0) {
      const current = plan[idx];
      const clip = current ? clips.find((item) => item.id === current.clipId) : undefined;
      if (!current || !clip) { setIdx(-1); return; }
      const startSegment = () => {
        video.currentTime = current.start;
        video.playbackRate = current.speed;
        void video.play().then(() => { frame = requestAnimationFrame(paint); }).catch(() => {});
      };
      if (video.src !== clip.url) {
        video.src = clip.url;
        video.load();
        video.addEventListener("loadedmetadata", startSegment, { once: true });
      } else if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        startSegment();
      } else {
        video.addEventListener("loadedmetadata", startSegment, { once: true });
      }
      return () => {
        cancelAnimationFrame(frame);
        video.removeEventListener("loadedmetadata", startSegment);
      };
    }
    video.pause();
    const context = currentCanvas.getContext("2d");
    context?.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
    return () => cancelAnimationFrame(frame);
  }, [idx, plan, clips, style]);

  useEffect(() => {
    const a = aud.current; if (!a) return;
    if (idx === 0) { a.currentTime = musicStart; void a.play().catch(() => {}); }
    if (idx === -1) { a.pause(); }
  }, [idx, musicStart]);

  useEffect(() => () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    if (audioContextRef.current) void audioContextRef.current.close();
  }, [downloadUrl]);

  const playPreview = () => {
    setRenderError("");
    playbackFinished.current = false;
    setIdx(-1);
    window.setTimeout(() => setIdx(0), 50);
  };

  const exportVideo = async () => {
    const mimeType = recordingMimeType();
    const currentCanvas = canvas.current;
    const video = vid.current;
    if (!mimeType || !currentCanvas || !video || !plan.length) {
      setRenderError("Este navegador não oferece gravação de vídeo compatível.");
      return;
    }
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl("");
    setRenderError("");
    setProgress(0);
    setExporting(true);

    const canvasStream = currentCanvas.captureStream(30);
    let recorderStream = canvasStream;
    let extraTracks: MediaStreamTrack[] = [];
    try {
      if (music && aud.current) {
        const audioContext = audioContextRef.current ?? new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioSourceRef.current ?? audioContext.createMediaElementSource(aud.current);
        audioSourceRef.current = source;
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);
        recorderStream = new MediaStream([...canvasStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);
        extraTracks = destination.stream.getAudioTracks();
        if (audioContext.state === "suspended") await audioContext.resume();
      } else if (!muted && "captureStream" in video) {
        const sourceStream = (video as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream();
        recorderStream = new MediaStream([...canvasStream.getVideoTracks(), ...sourceStream.getAudioTracks()]);
        extraTracks = sourceStream.getAudioTracks();
      }
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(recorderStream, { mimeType });
      const done = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        recorder.onerror = () => reject(new Error("Não foi possível gravar o vídeo."));
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });
      recorder.start(500);
      if (aud.current && music) { aud.current.currentTime = musicStart; void aud.current.play().catch(() => {}); }
      playbackFinished.current = false;
      setIdx(-1);
      window.setTimeout(() => setIdx(0), 50);
      await new Promise<void>((resolve) => {
        const length = Math.max(0.01, planLength(plan));
        const startAt = performance.now();
        const timer = window.setInterval(() => {
          const elapsed = (performance.now() - startAt) / 1000;
          setProgress(Math.min(99, Math.round((elapsed / length) * 100)));
          if (playbackFinished.current) {
            window.clearInterval(timer);
            resolve();
          }
        }, 100);
      });
      recorder.stop();
      const blob = await done;
      setDownloadUrl(URL.createObjectURL(blob));
      setProgress(100);
      setIdx(-1);
    } catch (error) {
      setRenderError(error instanceof Error ? error.message : "Falha ao exportar o vídeo.");
      setIdx(-1);
    } finally {
      recorderStream.getTracks().forEach((track) => track.stop());
      canvasStream.getTracks().forEach((track) => track.stop());
      extraTracks.forEach((track) => track.stop());
      setExporting(false);
    }
  };

  const activeSegment = seg;
  const segmentClip = activeSegment ? clips.find((clip) => clip.id === activeSegment.clipId) : undefined;
  const effects = activeSegment ? frameEffects(activeSegment, style, 0) : null;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
      <div>
        <div className={`${aspect} overflow-hidden rounded-lg bg-background`}>
          <canvas ref={canvas} width={platform === "youtube" ? 1920 : 1080} height={platform === "youtube" ? 1080 : platform === "feed" ? 1080 : 1920} className="h-full w-full object-contain" aria-label="Prévia do vídeo editado" />
          <video ref={vid} muted={muted} playsInline className="hidden" />
        </div>
        {music && <audio ref={aud} src={music.url} />}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={playPreview} className="flex-1"><Play /> Prévia editada</Button>
          <Button onClick={onRedo} variant="secondary" aria-label="Refazer edição" title="Refazer edição"><RotateCcw /></Button>
          <Button onClick={exportVideo} variant="outline" disabled={exporting || !plan.length}>
            {exporting ? <LoaderCircle className="animate-spin" /> : <Download />}
            {exporting ? `Exportando ${progress}%` : "Baixar vídeo"}
          </Button>
        </div>
        {exporting && <progress className="mt-3 h-2 w-full accent-primary" value={progress} max={100} aria-label="Progresso da exportação" />}
        {downloadUrl && <a className="mt-3 inline-flex items-center gap-2 text-sm text-primary underline" href={downloadUrl} download="cutcraft-editado.webm"><Download /> Baixar vídeo editado (.webm)</a>}
        {renderError && <p role="alert" className="mt-3 text-sm text-destructive">{renderError}</p>}
        <p className="mt-2 text-xs text-muted-foreground">Efeitos ativos: {effects?.filter ?? "aguardando prévia"}{segmentClip ? ` · ${segmentClip.name}` : ""}</p>
      </div>
      <div>
        <h2 className="text-xl font-semibold">Plano de edição</h2>
        <p className="font-mono text-xs text-muted-foreground">{plan.length} cortes · {planLength(plan).toFixed(1)}s · filtros, movimento e transições</p>
        <ol className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-2">
          {plan.map((s, i) => (
            <li key={i} className={`rounded-lg border p-3 text-sm ${i === idx ? "border-primary" : "border-border"}`}>
              <div className="flex justify-between font-mono text-xs text-muted-foreground">
                <span>#{i + 1} {clips.find((c) => c.id === s.clipId)?.name}</span>
                <span>{s.start.toFixed(1)}–{s.end.toFixed(1)}s · {s.speed}x · {s.transition}</span>
              </div>
              <p className="mt-1">{s.reason}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
