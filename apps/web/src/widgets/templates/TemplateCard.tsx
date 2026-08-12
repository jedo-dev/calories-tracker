import { IconDownload } from '../../ui/navIcons';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { MEAL_TYPE_EMOJI, MealType } from './mealTypes';

export interface TemplateItem {
  productId?: string;
  productName: string;
  grams: number;
  kcal: number;
}

export interface Template {
  _id: string;
  name: string;
  mealType?: MealType;
  items: TemplateItem[];
  totalKcal: number;
}

interface TemplateCardProps {
  template: Template;
  applying: boolean;
  onApply: () => void;
  onDelete: () => void;
}

export function TemplateCard({ template, applying, onApply, onDelete }: TemplateCardProps) {
  const theme = useTheme();
  const mealType = (template.mealType || 'other') as MealType;

  return (
    <div
      style={{
        marginBottom: '10px',
        borderRadius: '22px',
        background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))',
        border: '1px solid rgba(160, 200, 220, 0.18)',
        boxShadow: '0 22px 44px rgba(0, 0, 0, 0.28)',
        padding: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '13px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '19px',
            flexShrink: 0,
          }}
        >
          {MEAL_TYPE_EMOJI[mealType]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text bold style={{ display: 'block', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {template.name}
          </Text>
          <div style={{ display: 'flex', gap: '6px', marginTop: '3px', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '10px',
                background: 'rgba(96,165,250,0.16)',
                color: '#7cb8ff',
                fontWeight: 700,
              }}
            >
              {t(`mealType.${mealType}`)}
            </span>
            <Text variant="small" muted style={{ fontSize: '11px' }}>
              {template.items.length} {t('template.itemsCount')}
            </Text>
          </div>
        </div>
        <span style={{ fontSize: '17px', fontWeight: 800, color: theme.palette.primary, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {Math.round(template.totalKcal)} <span style={{ fontSize: '10px', color: theme.palette.textMuted, fontWeight: 600 }}>ккал</span>
        </span>
      </div>

      <div style={{ marginBottom: '10px' }}>
        {template.items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '6px 0',
              borderBottom: i < template.items.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}
          >
            <Text variant="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.productName}
            </Text>
            <Text variant="small" muted style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              {item.grams}г · {Math.round(item.kcal)} ккал
            </Text>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          disabled={applying}
          onClick={onApply}
          style={{
            flex: 1,
            height: '42px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
            color: '#07210f',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 12px 22px rgba(83, 212, 107, 0.2)',
            opacity: applying ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {applying ? '…' : (<><IconDownload size={15} style={{ verticalAlign: '-3px', marginRight: '5px' }} />{t('template.apply')}</>)}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={t('common.delete')}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            border: '1px solid rgba(255,110,110,0.35)',
            background: 'rgba(255,110,110,0.08)',
            color: '#ff8a8a',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            fontFamily: 'inherit',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
