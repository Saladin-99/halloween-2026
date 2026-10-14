import { useEffect, useRef } from 'react';
import { PumpkinEngine, type PumpkinStatus } from '../pumpkin/Engine';
import type { Tool } from '../pumpkin/model';

export default function PumpkinCanvas({ active, tool, radius, onStatus, onFailure, onEngine }: {
  active: boolean; tool: Tool; radius: number;
  onStatus: (status: PumpkinStatus) => void;
  onFailure: () => void;
  onEngine: (engine: PumpkinEngine | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const engine = useRef<PumpkinEngine | null>(null);
  const callbacks = useRef({ onStatus, onFailure, onEngine });
  callbacks.current = { onStatus, onFailure, onEngine };
  useEffect(() => {
    try {
      engine.current = new PumpkinEngine(container.current!, status => callbacks.current.onStatus(status), () => callbacks.current.onFailure());
      callbacks.current.onEngine(engine.current);
    } catch { callbacks.current.onFailure(); }
    return () => { engine.current?.dispose(); engine.current = null; callbacks.current.onEngine(null); };
  }, []);
  useEffect(() => { engine.current?.setActive(active); }, [active]);
  useEffect(() => { if (engine.current) { engine.current.tool = tool; engine.current.radius = radius; } }, [tool, radius]);
  return <div className={`pumpkin-canvas tool-${tool}`} ref={container} />;
}
