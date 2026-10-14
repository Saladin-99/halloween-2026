import type { Pose, Tool, UV } from './model';

type Point = { x: number; y: number };
export type GestureCallbacks = {
  hit: (x: number, y: number) => UV | null;
  begin: (uv: UV) => void;
  sample: (uv: UV | null) => void;
  commit: () => void;
  pose: (yaw: number, pitch: number, zoom: number) => void;
  persist: () => void;
  getTool: () => Tool;
  getPose: () => Pose;
};

/** DOM pointer capture deliberately lives outside Three's mesh event system. */
export class PumpkinGestures {
  readonly pointers = new Map<number, Point>();
  state: 'idle' | 'drawing' | 'rotating' | 'wait-release' = 'idle';
  private last: Point | null = null;
  private distance = 0;
  private drawingId: number | null = null;
  private abort = new AbortController();

  constructor(private element: HTMLElement, private callbacks: GestureCallbacks) {
    const options = { signal: this.abort.signal };
    element.addEventListener('pointerdown', this.down, options);
    element.addEventListener('pointermove', this.move, options);
    element.addEventListener('pointerup', this.up, options);
    element.addEventListener('pointercancel', this.up, options);
    element.addEventListener('lostpointercapture', this.up, options);
    window.addEventListener('blur', this.cancel, options);
  }
  dispose() { this.cancel(); this.abort.abort(); }
  cancel = () => {
    if (this.state === 'drawing') this.callbacks.commit();
    this.pointers.clear(); this.state = 'idle'; this.last = null; this.drawingId = null;
    this.callbacks.persist();
  };
  private metrics() {
    const [a, b] = [...this.pointers.values()];
    return b ? { center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, distance: Math.hypot(a.x - b.x, a.y - b.y) } : { center: a, distance: 0 };
  }
  private down = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.element.setPointerCapture(event.pointerId);
    if (this.pointers.size > 1) {
      if (this.state === 'drawing') this.callbacks.commit();
      this.state = 'rotating'; this.drawingId = null;
      const metrics = this.metrics(); this.last = metrics.center; this.distance = metrics.distance;
      return;
    }
    if (this.state === 'wait-release') return;
    this.last = { x: event.clientX, y: event.clientY };
    if (event.altKey || this.callbacks.getTool() === 'rotate') { this.state = 'rotating'; return; }
    const uv = this.callbacks.hit(event.clientX, event.clientY);
    if (!uv) return;
    this.state = 'drawing'; this.drawingId = event.pointerId; this.callbacks.begin(uv);
  };
  private move = (event: PointerEvent) => {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.state === 'rotating') {
      const { center, distance } = this.metrics();
      if (this.last && center) {
        const pose = this.callbacks.getPose();
        this.callbacks.pose(pose.yaw + (center.x - this.last.x) * 0.009, pose.pitch + (center.y - this.last.y) * 0.009, this.distance && distance ? pose.zoom * distance / this.distance : pose.zoom);
      }
      this.last = center; this.distance = distance;
    } else if (this.state === 'drawing' && this.drawingId === event.pointerId) {
      this.callbacks.sample(this.callbacks.hit(event.clientX, event.clientY));
    }
  };
  private up = (event: PointerEvent) => {
    if (!this.pointers.has(event.pointerId)) return;
    if (this.state === 'drawing') this.callbacks.commit();
    this.pointers.delete(event.pointerId);
    this.state = this.pointers.size ? 'wait-release' : 'idle';
    this.last = null; this.drawingId = null; this.callbacks.persist();
  };
}
