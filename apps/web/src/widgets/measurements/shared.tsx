import chestImage from '../../assets/measurements/body_chest.jpg';
import hipsImage from '../../assets/measurements/body_hips.jpg';
import waistImage from '../../assets/measurements/body_waist.jpg';
import { formatDateHuman } from '../../i18n';
import { glassCardStyle } from '../../theme/styles';

export interface Measurement {
  _id: string;
  date: string;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  bicepCm?: number;
  thighCm?: number;
}

export type MeasurementKey = 'waistCm' | 'hipsCm' | 'chestCm' | 'bicepCm' | 'thighCm';

export const measurementCardStyle: React.CSSProperties = { ...glassCardStyle, marginBottom: '12px' };

export const formatDateRu = (dateStr: string) => formatDateHuman(dateStr, true);

function BodySvg({ kind }: { kind: 'bicep' | 'thigh' }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: '0 0 34 34',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (kind === 'bicep') {
    return (
      <svg {...common}>
        <path d="M12 6c0 2.8-1.2 4.7-2.4 6.6-1.3 2.2-2.1 4.8-2.1 8.1 0 4.2 2.1 6.8 7.5 6.8 5 0 8.9-2.1 11-5.2" />
        <path d="M17.2 12c1.2-.7 2.7-1 4.4-.7 2.2.4 3.6 1.7 3.4 3.6-.2 1.7-1.6 2.8-3.2 3.7" />
        <path d="M13 20c1.4-1.3 2.9-2 4.7-2 2.4 0 4.5 1.1 6.3 3" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M16 7c-1.4 2.8-2.9 5.4-4.6 7.9-1.6 2.3-2.7 5.1-2.7 8.1 0 2.3.8 4.1 2.2 4.9" />
      <path d="M18 7c1.4 2.8 2.9 5.4 4.6 7.9 1.6 2.3 2.7 5.1 2.7 8.1 0 2.3-.8 4.1-2.2 4.9" />
      <path d="M12 18c1.2-1.3 2.7-2 5-2s3.8.7 5 2" />
      <path d="M11.5 26c1.3-1 2.9-1.5 5.5-1.5s4.2.5 5.5 1.5" />
    </svg>
  );
}

export const MEASUREMENT_ROWS: { key: MeasurementKey; label: string; unit: string; icon: React.ReactNode }[] = [
  {
    key: 'waistCm',
    label: 'Талия',
    unit: 'см',
    icon: <img src={waistImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />,
  },
  {
    key: 'hipsCm',
    label: 'Бёдра',
    unit: 'см',
    icon: <img src={hipsImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />,
  },
  {
    key: 'chestCm',
    label: 'Грудь',
    unit: 'см',
    icon: <img src={chestImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />,
  },
  { key: 'bicepCm', label: 'Бицепс', unit: 'см', icon: <BodySvg kind="bicep" /> },
  { key: 'thighCm', label: 'Бедро', unit: 'см', icon: <BodySvg kind="thigh" /> },
];
