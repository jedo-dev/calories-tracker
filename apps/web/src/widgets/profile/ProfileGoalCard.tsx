import { useTheme } from '../../theme/useTheme';
import { Card } from '../../ui/Card';
import { Text } from '../../ui/Text';
import { t } from '../../i18n';

interface ProfileGoalCardProps {
  currentWeight?: number;
  startWeight?: number;
  targetWeight?: number;
  remainingWeight?: number | null;
}

export function ProfileGoalCard({ currentWeight, startWeight, targetWeight, remainingWeight }: ProfileGoalCardProps) {
  const theme = useTheme();
  const points = [
    { title: t('profile.start'), value: startWeight, align: 'flex-start' as const, active: false },
    { title: t('profile.current'), value: currentWeight, align: 'center' as const, active: true },
    { title: t('profile.target'), value: targetWeight, align: 'flex-end' as const, active: false },
  ];

  return (
    <Card
      style={{
        marginBottom: '12px',
        borderRadius: '22px',
        background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.94), rgba(10, 32, 46, 0.94))',
        border: '1px solid rgba(160, 200, 220, 0.18)',
      }}
    >
      <Text variant="h2" bold style={{ display: 'block', marginBottom: '10px', fontSize: '18px' }}>
        {t('profile.goalTitle')}
      </Text>

      <div style={{ position: 'relative', marginTop: '8px' }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '26px',
            right: '26px',
            top: '11px',
            height: '6px',
            borderRadius: '999px',
            background: 'rgba(196, 205, 216, 0.26)',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', position: 'relative' }}>
          {points.map((item, index) => (
            <div key={item.title} style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: item.align }}>
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  marginBottom: '14px',
                  border: `3px solid ${item.active ? theme.palette.primary : 'rgba(196, 205, 216, 0.85)'}`,
                  background: item.active ? theme.palette.primary : '#0e1c27',
                  boxShadow: item.active ? '0 0 0 5px rgba(83, 212, 107, 0.18)' : 'none',
                  marginLeft: index === 0 ? '4px' : undefined,
                  marginRight: index === 2 ? '4px' : undefined,
                }}
              />
              <Text
                variant="small"
                muted
                style={{
                  display: 'block',
                  fontSize: '13px',
                  textAlign: item.align === 'center' ? 'center' : item.align === 'flex-end' ? 'right' : 'left',
                }}
              >
                {item.title}
              </Text>
              <Text
                bold
                style={{
                  display: 'block',
                  fontSize: '20px',
                  textAlign: item.align === 'center' ? 'center' : item.align === 'flex-end' ? 'right' : 'left',
                }}
              >
                {item.value ?? '—'}
              </Text>
            </div>
          ))}
        </div>
      </div>

 
    </Card>
  );
}
