import { useTheme } from "../../../theme/useTheme";
import { Button } from "../../../ui/Button";

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

const DAYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function formatDateRu(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = DAYS_RU[date.getDay()];
  const monthName = MONTHS_RU[month - 1];
  return `${dayName}, ${day} ${monthName}`;
}

const DayChanger = ({ date, setDate, registrationDate }: { registrationDate: Date | undefined, date: string, setDate: (date: string) => void }) => {

  const theme = useTheme()

  const changeDate = (days: number) => {
    const currentDate = parseDate(date);
    currentDate.setDate(currentDate.getDate() + days);
    setDate(formatDate(currentDate));
  };
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
  const isNeedTodisableBtn = (prev: Date, next: Date) => {
    return prev > next
  }
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg, flexWrap: 'wrap', gap: theme.spacing.md }}>

    <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center', justifyContent: 'space-between', width: "100%" }}>
      <Button variant="ghost" size='sm' disabled={isNeedTodisableBtn(new Date(registrationDate || ""), new Date(date),)} onClick={() => changeDate(-1)} style={{ width: 'auto', minWidth: '44px', minHeight: '44px' }} aria-label="Предыдущий день">
        ←
      </Button>

      {formatDateRu(date)}
      <Button variant="ghost" size="sm" disabled={isNeedTodisableBtn(new Date(date), new Date)} onClick={() => changeDate(1)} style={{ width: 'auto', minWidth: '44px', minHeight: '44px' }} aria-label="Следующий день">
        →
      </Button>
    </div>
  </div>
}
export default DayChanger;