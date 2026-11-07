import { frameEffects, type Segment, type Style } from "@/lib/edit-plan";

export function drawEditedFrame(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  segment: Segment,
  style: Style,
  elapsed: number,
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const { width, height } = canvas;
  const { opacity, zoom, filter } = frameEffects(segment, style, elapsed);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#080808";
  context.fillRect(0, 0, width, height);

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
    const scale = Math.max(width / video.videoWidth, height / video.videoHeight) * zoom;
    const drawWidth = video.videoWidth * scale;
    const drawHeight = video.videoHeight * scale;
    context.save();
    context.globalAlpha = opacity;
    context.filter = filter;
    context.drawImage(video, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    context.restore();
  }

  const duration = Math.max(0, (segment.end - segment.start) / segment.speed);
  const fade = Math.max(0, 1 - opacity);
  if (fade > 0) {
    context.fillStyle = `rgba(0, 0, 0, ${fade})`;
    context.fillRect(0, 0, width, height);
  }
  if (style === "cinematic") {
    context.fillStyle = "rgba(0, 0, 0, 0.14)";
    context.fillRect(0, 0, width, height);
    const barHeight = Math.max(10, Math.round(height * 0.035));
    context.fillStyle = "#080808";
    context.fillRect(0, 0, width, barHeight);
    context.fillRect(0, height - barHeight, width, barHeight);
  }

  // Maintain the same timing contract as preview and exported output.
  void duration;
}

export function recordingMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  return ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
    .find((mime) => MediaRecorder.isTypeSupported(mime)) ?? "";
}
