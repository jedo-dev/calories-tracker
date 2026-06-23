import { useTheme } from '../theme/useTheme';
import { Card } from './Card';
import { Text } from './Text';

interface EmptyStateProps {
  image?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ image, title, description, action }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
      {image && (
        <img
          src={image}
          alt=""
          loading="lazy"
          style={{
            width: '120px',
            height: '120px',
            objectFit: 'contain',
            marginBottom: theme.spacing.md,
            opacity: 0.8,
          }}
        />
      )}
      <Text muted>{title}</Text>
      {description && (
        <Text variant="small" muted style={{ marginTop: theme.spacing.xs }}>
          {description}
        </Text>
      )}
      {action && (
        <div style={{ marginTop: theme.spacing.md }}>
          {action}
        </div>
      )}
    </Card>
  );
}
