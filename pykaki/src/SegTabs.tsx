// 화면 안의 작은 전환 탭 (효과 종류, 갤러리/목록, 셰이더/전환). 맨 위 화면 탭과 같은 fluidkit LiquidTabs 유리 탭 (세션 79)
import type { ReactNode } from 'react';
import { LiquidTabs } from 'fluidkit';
import { useThemeInk } from './Toolbar';

export interface SegItem<T extends string> {
  id: T;
  label: ReactNode;
  title?: string;
}

export function SegTabs<T extends string>({ items, value, onChange, className = '', label }: { items: SegItem<T>[]; value: T; onChange: (v: T) => void; className?: string; label: string }) {
  const ink = useThemeInk();
  return (
    <LiquidTabs
      className={'seg-tabs ' + className}
      items={items.map((t) => ({ id: t.id, label: <span title={t.title}>{t.label}</span> }))}
      value={value}
      onChange={(v) => onChange(v as T)}
      flow="slide"
      material="glass"
      size="sm"
      tint={ink.tint}
      labelColor={ink.muted}
      activeLabelColor="#ffffff"
      reflection
      shadow
      style={{ background: 'color-mix(in srgb, var(--text) 6%, transparent)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
      aria-label={label}
    />
  );
}
