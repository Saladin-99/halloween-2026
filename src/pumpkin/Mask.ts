import { siteContent } from '../config/siteContent';
import { wrappedDelta, type Stroke, type UV } from './model';

export class CarvingMask {
  readonly canvas = document.createElement('canvas');
  private readonly checkpoint = document.createElement('canvas');
  private readonly context: CanvasRenderingContext2D;
  private readonly checkpointContext: CanvasRenderingContext2D;
  strokes: Stroke[] = [];
  current: Stroke | null = null;
  hasCheckpoint = false;
  dirty = true;

  constructor() {
    this.canvas.width = this.canvas.height = this.checkpoint.width = this.checkpoint.height = siteContent.tuning.carvingMaskResolution;
    this.context = this.canvas.getContext('2d')!;
    this.checkpointContext = this.checkpoint.getContext('2d')!;
  }

  async restore(strokes: Stroke[], checkpoint: string | null) {
    this.strokes = strokes;
    if (checkpoint) {
      const image = new Image(); image.src = checkpoint;
      await image.decode();
      this.checkpointContext.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
      this.hasCheckpoint = true;
    }
    this.replay();
  }

  begin(tool: Stroke['tool'], radius: number) {
    this.current = { tool, radius, points: [], time: Date.now() };
  }

  sample(point: UV | null) {
    if (!this.current) return;
    const previous = this.current.points.at(-1) ?? null;
    if (!point) {
      if (previous) this.current.points.push(null);
      return;
    }
    if (previous && Math.hypot(wrappedDelta(previous[0], point[0]), point[1] - previous[1]) < this.current.radius / 8) return;
    if (this.current.points.length >= 12000) {
      const { tool, radius } = this.current;
      this.commit(); this.begin(tool, radius);
      if (previous) this.current!.points.push(previous);
    }
    this.paint(this.context, this.current!, previous, point);
    this.current!.points.push(point);
    this.dirty = true;
  }

  commit() {
    if (!this.current) return;
    if (this.current.points.some(Boolean)) this.strokes.push(this.current);
    this.current = null;
    while (this.strokes.length > siteContent.tuning.maxUndoHistory) {
      const oldest = this.strokes.shift()!;
      this.paintStroke(this.checkpointContext, oldest);
      this.hasCheckpoint = true;
    }
  }

  undo() { this.commit(); this.strokes.pop(); this.replay(); }
  reset() {
    this.current = null; this.strokes = []; this.hasCheckpoint = false;
    this.checkpointContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.replay();
  }
  checkpointData() { return this.hasCheckpoint ? this.checkpoint.toDataURL('image/png') : null; }

  private replay() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.checkpoint, 0, 0);
    this.strokes.forEach(stroke => this.paintStroke(this.context, stroke));
    this.dirty = true;
  }
  private paintStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    let last: UV | null = null;
    for (const point of stroke.points) {
      if (point) this.paint(ctx, stroke, last, point);
      last = point;
    }
  }
  private paint(ctx: CanvasRenderingContext2D, stroke: Stroke, previous: UV | null, point: UV) {
    const size = this.canvas.width;
    const dx = previous ? wrappedDelta(previous[0], point[0]) : 0;
    const dy = previous ? point[1] - previous[1] : 0;
    const count = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (stroke.radius / 4)));
    ctx.globalCompositeOperation = stroke.tool === 'carve' ? 'source-over' : 'destination-out';
    ctx.fillStyle = '#fff';
    for (let i = 1; i <= count; i++) {
      const u = ((previous ? previous[0] : point[0]) + dx * i / count + 1) % 1;
      const v = (previous ? previous[1] : point[1]) + dy * i / count;
      for (const wrap of [-1, 0, 1]) {
        ctx.beginPath(); ctx.ellipse((u + wrap) * size, (1 - v) * size, stroke.radius * size * 0.6, stroke.radius * size * 1.4, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}
