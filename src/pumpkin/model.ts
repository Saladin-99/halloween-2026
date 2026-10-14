export type UV = [number, number];
export type Tool = 'carve' | 'erase' | 'rotate';
export type Stroke = { tool: 'carve' | 'erase'; radius: number; points: (UV | null)[]; time: number };
export type Pose = { yaw: number; pitch: number; zoom: number };
export type SavedPumpkin = { version: 1; strokes: Stroke[]; checkpoint: string | null; pose: Pose; touched: boolean };
export const defaultPose: Pose = { yaw: 0.16, pitch: -0.06, zoom: 1 };

export function wrappedDelta(from: number, to: number) {
  let delta = to - from;
  if (delta > 0.5) delta -= 1;
  if (delta < -0.5) delta += 1;
  return delta;
}

export function parsePumpkin(raw: string | null): SavedPumpkin | null {
  if (!raw || raw.length > 7_000_000) return null;
  try {
    const data = JSON.parse(raw) as SavedPumpkin;
    if (data.version !== 1 || !Array.isArray(data.strokes) || data.strokes.length > 24 || !data.pose) return null;
    if (![data.pose.yaw, data.pose.pitch, data.pose.zoom].every(Number.isFinite) || Math.abs(data.pose.pitch) > Math.PI / 3 + 0.001 || data.pose.zoom < 0.85 || data.pose.zoom > 1.4) return null;
    if (data.checkpoint !== null && (typeof data.checkpoint !== 'string' || !data.checkpoint.startsWith('data:image/png;base64,'))) return null;
    for (const stroke of data.strokes) {
      if (!['carve', 'erase'].includes(stroke.tool) || !Number.isFinite(stroke.radius) || stroke.radius < 0.001 || stroke.radius > 0.1 || !Array.isArray(stroke.points) || stroke.points.length > 20000) return null;
      if (!stroke.points.every(p => p === null || (Array.isArray(p) && p.length === 2 && p.every(n => Number.isFinite(n) && n >= 0 && n <= 1)))) return null;
    }
    return data;
  } catch { return null; }
}
