import { IconCalendar } from '../../ui/navIcons';
import { Text } from '../../ui/Text';
import { planCardStyle, MealPlan } from './types';

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  applied: { label: 'Применён', bg: 'rgba(83,212,107,0.16)', color: '#6fe08a' },
  draft: { label: 'Черновик', bg: 'rgba(96,165,250,0.16)', color: '#7cb8ff' },
  archived: { label: 'Архив', bg: 'rgba(255,255,255,0.08)', color: '#9db8c6' },
};

interface PlanHistoryListProps {
  history: MealPlan[];
  onOpen: (planId: string) => void;
}

export function PlanHistoryList({ history, onOpen }: PlanHistoryListProps) {
  if (history.length === 0) {
    return (
      <div style={{ ...planCardStyle, textAlign: 'center', padding: '24px' }}>
        <Text muted>Нет сохранённых планов</Text>
      </div>
    );
  }

  return (
    <>
      {history.map((p) => {
        const status = STATUS_META[p.status] || STATUS_META.archived;
        return (
          <div
            key={p._id}
            onClick={() => onOpen(p._id)}
            style={{
              ...planCardStyle,
              marginBottom: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                flexShrink: 0,
              }}
            >
              <IconCalendar size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.title || `План ${p.dateFrom}`}
              </Text>
              <Text variant="small" muted style={{ display: 'block', fontSize: '11px', marginTop: '2px' }}>
                {p.mode === 'day' ? 'На день' : 'На неделю'} · {p.settings.kcalTarget} ккал
              </Text>
            </div>
            <span
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '11px',
                background: status.bg,
                color: status.color,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {status.label}
            </span>
          </div>
        );
      })}
    </>
  );
}
