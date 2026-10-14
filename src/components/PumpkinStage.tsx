import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { siteContent as c } from '../config/siteContent';
import { assetUrl } from '../lib/content';
import type { PumpkinEngine, PumpkinStatus } from '../pumpkin/Engine';
import type { Tool } from '../pumpkin/model';
import { Dialog } from './Dialog';
import { Icon } from './Icon';

const PumpkinCanvas = lazy(() => import('./PumpkinCanvas'));

class CanvasBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function PumpkinStage({ active, visited, onEnter }: { active: boolean; visited: boolean; onEnter: () => void }) {
  const [status, setStatus] = useState<PumpkinStatus>({ ready: false, touched: false, canUndo: false, hasCarving: false, storageAvailable: true });
  const [tool, setTool] = useState<Tool>('carve');
  const [radius, setRadius] = useState<number>(c.tuning.brushRadius);
  const [failed, setFailed] = useState(false);
  const [reset, setReset] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveUrl, setSaveUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const engine = useRef<PumpkinEngine | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const revealed = status.touched || failed;
  useEffect(() => { if (active && visited) heading.current?.focus(); }, [active, visited]);
  useEffect(() => () => { if (saveUrl) URL.revokeObjectURL(saveUrl); }, [saveUrl]);
  useEffect(() => { if (!active) { setReset(false); setSaveUrl(null); } }, [active]);
  const save = async () => {
    if (!engine.current) return;
    setSaving(true); setMessage('');
    try {
      const blob = await engine.current.exportPng();
      const file = new File([blob], c.copy.intro.exportFilename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: c.copy.intro.saveDialogTitle }); setMessage(c.copy.intro.carvingSaved); return; }
        catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; }
      }
      const url = URL.createObjectURL(blob); setSaveUrl(url);
      const link = document.createElement('a'); link.href = url; link.download = c.copy.intro.exportFilename; link.click();
      setMessage(c.copy.intro.carvingSaved);
    } catch { setMessage(c.copy.intro.saveError); } finally { setSaving(false); }
  };
  return <section className="pumpkin-stage" hidden={!active} aria-label={c.copy.intro.heading}>
    <div className="stage-backdrop" style={{ backgroundImage: `url(${assetUrl(c.assets.sceneSrc800)})` }} />
    <header className="intro-header">
      <div className="eyebrow"><span className="tiny-star">✦</span>{c.identity.subtitle}<span className="eyebrow-line" />{c.copy.intro.eyebrow}</div>
      <h1 ref={heading} tabIndex={-1}>{c.copy.intro.heading}</h1>
      <p>{c.copy.intro.instruction}</p>
    </header>
    <div className={`pumpkin-viewport ${status.ready ? 'is-ready' : ''}`}>
      <div className="pumpkin-aura" />
      {!failed && <CanvasBoundary onFailure={() => setFailed(true)}><Suspense fallback={null}><PumpkinCanvas active={active} tool={tool} radius={radius} onStatus={setStatus} onFailure={() => setFailed(true)} onEngine={value => { engine.current = value; }} /></Suspense></CanvasBoundary>}
      {(!status.ready || failed) && <div className="pumpkin-placeholder"><img src={assetUrl(c.assets.pumpkinFallback)} alt="" /><p role="status">{failed ? c.copy.intro.fallback : c.copy.intro.loadingPumpkin}</p></div>}
      {status.ready && !status.touched && <span className="touch-hint"><span className="hint-dot" />{c.copy.intro.interactionHint}</span>}
    </div>
    <div className={`carving-tray ${revealed ? 'revealed' : ''}`}>
      <div className="carving-tools" aria-hidden={!revealed} inert={!revealed}>
        <div className="tool-switch">
          {(['carve', 'erase', 'rotate'] as const).map(value => <button key={value} aria-pressed={tool === value} onClick={() => setTool(value)} disabled={failed || !status.ready}><Icon name={value} /><span>{c.copy.intro[value]}</span></button>)}
        </div>
        <div className="tool-actions">
          <button className="icon-button" title={c.copy.intro.undo} aria-label={c.copy.intro.undo} disabled={!status.canUndo || failed} onClick={() => engine.current?.undo()}><Icon name="undo" /></button>
          <button className="icon-button" title={c.copy.intro.reset} aria-label={c.copy.intro.reset} disabled={!status.hasCarving || failed} onClick={() => setReset(true)}><Icon name="reset" /></button>
          <button className="icon-button" title={c.copy.intro.savePumpkin} aria-label={c.copy.intro.savePumpkin} disabled={saving || !status.ready || failed} onClick={() => void save()}><Icon name="save" /></button>
        </div>
        <div className="brush-row"><label htmlFor="brush-size">{c.copy.intro.brushSize}</label><input id="brush-size" type="range" min="0.006" max="0.026" step="0.001" value={radius} onChange={event => setRadius(Number(event.target.value))} disabled={failed} /></div>
        {tool === 'rotate' && <div className="rotation-keys">
          <button aria-label={c.copy.intro.rotateLeft} onClick={() => engine.current?.rotate(-0.3, 0)}>←</button>
          <button aria-label={c.copy.intro.rotateUp} onClick={() => engine.current?.rotate(0, -0.2)}>↑</button>
          <button aria-label={c.copy.intro.rotateDown} onClick={() => engine.current?.rotate(0, 0.2)}>↓</button>
          <button aria-label={c.copy.intro.rotateRight} onClick={() => engine.current?.rotate(0.3, 0)}>→</button>
        </div>}
      </div>
      <button className={`primary-button enter-button ${revealed ? '' : 'unrevealed'}`} aria-hidden={!revealed} inert={!revealed} onClick={onEnter}>{visited ? c.copy.intro.goHome : c.copy.intro.enter}<Icon name="arrow" /></button>
      <div className="skip-slot">{!revealed && <button className="skip-link" onClick={onEnter}>{c.copy.intro.accessibleSkip}</button>}</div>
      <p className="desktop-hint">{c.copy.intro.desktopHint}</p>
      <p className="sr-only" role="status">{message}</p>
      {!status.storageAvailable && <p className="storage-note">{c.copy.intro.storageUnavailable}</p>}
    </div>
    {reset && <Dialog title={c.copy.intro.confirmReset} onClose={() => setReset(false)}><div className="dialog-actions"><button className="subtle-button" onClick={() => setReset(false)}>{c.copy.intro.cancel}</button><button className="primary-button" onClick={() => { engine.current?.reset(); setReset(false); }}>{c.copy.intro.confirmResetAction}</button></div></Dialog>}
    {saveUrl && <Dialog title={c.copy.intro.saveDialogTitle} onClose={() => setSaveUrl(null)}><img className="export-preview" src={saveUrl} alt={c.copy.intro.saveDialogTitle} /><a className="primary-button" href={saveUrl} target="_blank" rel="noopener noreferrer">{c.copy.intro.imageSaveFallback}<Icon name="save" /></a></Dialog>}
  </section>;
}
