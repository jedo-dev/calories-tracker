import type { ReactNode } from 'react';
import { IconButton } from './IconButton';
import { BackIcon } from './icons';
import { Text } from './Text';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';

interface PageHeaderProps {
  title: string;
  /** Если задан — слева появляется единая кнопка «назад». */
  onBack?: () => void;
  /** Опциональное действие справа (кнопка, счётчик и т.п.). */
  right?: ReactNode;
  /** Строка под заголовком (счётчик, дата). */
  subtitle?: string;
  style?: React.CSSProperties;
}

/**
 * Единая шапка экрана: title слева, опциональный back, опциональное действие
 * справа. Заменяет восемь разных способов оформить заголовок страницы.
 */
export function PageHeader({ title, onBack, right, subtitle, style }: PageHeaderProps) {
  const theme = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px',
        ...style,
      }}
    >
      {onBack && (
        <IconButton label={t('common.back')} onClick={onBack}>
          <BackIcon />
        </IconButton>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text
          variant="h2"
          bold
          style={{
            display: 'block',
            fontSize: '20px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            variant="small"
            style={{ display: 'block', color: theme.palette.textMuted, marginTop: '2px' }}
          >
            {subtitle}
          </Text>
        )}
      </div>
      {right}
    </div>
  );
}
