import { useEffect, useRef, type ReactNode } from 'react';
import { siteContent } from '../config/siteContent';
import { Icon } from './Icon';

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    node.showModal();
    return () => { node.close(); previous?.focus(); };
  }, []);
  return <dialog className="dialog" ref={dialog} aria-label={title} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <button className="icon-button dialog-close" onClick={onClose} aria-label={siteContent.copy.general.close}><Icon name="close" /></button>
    <h2>{title}</h2>{children}
  </dialog>;
}
