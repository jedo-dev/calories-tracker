import { useTheme } from "../../../theme/useTheme";
import { Button } from "../../../ui/Button";
import { Text } from "../../../ui/Text";

const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

const DAYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateRu(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = DAYS_RU[date.getDay()];
  const monthName = MONTHS_RU[month - 1];
  return `${dayName}, ${day} ${monthName}`;
}

const DayChanger = ({
  date,
  setDate,
  registrationDate,
}: {
  registrationDate: Date | undefined;
  date: string;
  setDate: (date: string) => void;
}) => {
  const theme = useTheme();

  const changeDate = (days: number) => {
    const currentDate = parseDate(date);
    currentDate.setDate(currentDate.getDate() + days);
    setDate(formatDate(currentDate));
  };

  const disablePrev = registrationDate ? parseDate(date) <= new Date(registrationDate) : false;
  const disableNext = parseDate(date) >= parseDate(formatDate(new Date()));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 48px', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
      <Button
        variant="ghost"
        size="sm"
        disabled={disablePrev}
        onClick={() => changeDate(-1)}
        style={{
          width: '48px',
          height: '48px',
          padding: 0,
          fontSize: '28px',
          borderRadius: '16px',
          backgroundColor: 'rgba(255,255,255,0.04)',
        }}
        aria-label="Предыдущий день"
      >
        ‹
      </Button>

      <div style={{ textAlign: 'center' }}>
        <Text variant="body" bold style={{ fontSize: '22px' }}>
          Сегодня, {formatDateRu(date).slice(4)}
        </Text>
      </div>

      <Button
        variant="ghost"
        size="sm"
        disabled={disableNext}
        onClick={() => changeDate(1)}
        style={{
          width: '48px',
          height: '48px',
          padding: 0,
          fontSize: '28px',
          borderRadius: '16px',
          backgroundColor: 'rgba(255,255,255,0.04)',
        }}
        aria-label="Следующий день"
      >
        ›
      </Button>
    </div>
  );
};

export default DayChanger;
