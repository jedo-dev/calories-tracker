// SVG-арт для блоков AI-распознавания (лис, тарелка, иконки) — из мокапа.
// Пути встраиваются фрагментами (без <symbol>/<use>), чтобы не ловить
// конфликты глобальных id между компонентами на одной странице.

export const AI_COLORS = {
  ai: '#8B7BF7',
  aiDark: '#6C5AE0',
  aiLight: '#A99BFF',
  aiText: '#C9C0FF',
  orange: '#F58A3C',
  cream: '#FDECDC',
  green: '#4CB558',
  greenLight: '#7BD98A',
};

// Голова лиса, viewBox 0 0 200 200
export function FoxPaths() {
  return (
    <>
      <path d="M52,92 L47,20 Q47,12 55,17 L100,50 Z" fill="#F58A3C" />
      <path d="M62,82 L58,34 Q58,29 63,32 L92,54 Z" fill="#FFD6B8" />
      <path d="M148,92 L153,20 Q153,12 145,17 L100,50 Z" fill="#F58A3C" />
      <path d="M138,82 L142,34 Q142,29 137,32 L108,54 Z" fill="#FFD6B8" />
      <path
        d="M100,44 C138,44 162,72 162,104 C162,113 168,125 176,135 C179,138 177,141 173,140 C160,137 150,139 144,143 C133,153 118,161 100,161 C82,161 67,153 56,143 C50,139 40,137 27,140 C23,141 21,138 24,135 C32,125 38,113 38,104 C38,72 62,44 100,44 Z"
        fill="#F58A3C"
      />
      <path d="M52,124 C42,127 33,133 27,139 C39,136 49,138 56,142 Z" fill="#FDECDC" />
      <path d="M148,124 C158,127 167,133 173,139 C161,136 151,138 144,142 Z" fill="#FDECDC" />
      <path
        d="M100,102 C123,99 143,111 143,128 C143,147 124,160 100,160 C76,160 57,147 57,128 C57,111 77,99 100,102 Z"
        fill="#FDECDC"
      />
      <path d="M68,79 C74,75 83,75 88,79" stroke="#C25E1C" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M132,79 C126,75 117,75 112,79" stroke="#C25E1C" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="79" cy="97" rx="7.6" ry="9.2" fill="#43281A" />
      <ellipse cx="121" cy="97" rx="7.6" ry="9.2" fill="#43281A" />
      <circle cx="81.8" cy="93.4" r="2.7" fill="#fff" />
      <circle cx="123.8" cy="93.4" r="2.7" fill="#fff" />
      <path
        d="M100,116 C105,116 110,119 110,124 C110,130 105,134 100,134 C95,134 90,130 90,124 C90,119 95,116 100,116 Z"
        fill="#43281A"
      />
      <path d="M100,134 C100,142 109,146 117,139" stroke="#43281A" strokeWidth="3.6" fill="none" strokeLinecap="round" />
    </>
  );
}

// Тарелка с едой, viewBox 0 0 100 100
export function PlatePaths() {
  return (
    <>
      <ellipse cx="50" cy="54" rx="40" ry="34" fill="#FDECDC" />
      <ellipse cx="50" cy="52" rx="31" ry="26" fill="#F3DCC7" />
      <circle cx="42" cy="46" r="11" fill="#F58A3C" />
      <path d="M55,58 a13,9 0 0 1 22,-2 a13,9 0 0 1 -22,2 Z" fill="#4CB558" />
      <circle cx="60" cy="42" r="6.5" fill="#FF6B5C" />
      <circle cx="70" cy="48" r="4.5" fill="#FFD166" />
    </>
  );
}

// Компактный арт для карточки профиля (вариант B): лис + телефон-сканер
export function FoxCardArt() {
  return (
    <svg viewBox="0 0 130 100" width="118" height="90" style={{ position: 'absolute', top: '-12px', right: '-8px' }}>
      <svg x="52" y="6" width="86" height="86" viewBox="0 0 200 200">
        <FoxPaths />
      </svg>
      <g transform="translate(2,40) rotate(-8)">
        <rect x="0" y="0" width="62" height="46" rx="11" fill="#0E2033" stroke="#8B7BF7" strokeWidth="3" />
        <svg x="10" y="5" width="42" height="36" viewBox="0 0 100 100">
          <PlatePaths />
        </svg>
        <g stroke="#7BD98A" strokeWidth="2.6" fill="none" strokeLinecap="round">
          <path d="M11,14 v-5 h5" />
          <path d="M51,14 v-5 h-5" />
          <path d="M11,33 v5 h5" />
          <path d="M51,33 v5 h-5" />
        </g>
      </g>
      <g fill="#A99BFF">
        <path d="M118,10 l2.6,6.4 6.4,2.6 -6.4,2.6 -2.6,6.4 -2.6,-6.4 -6.4,-2.6 6.4,-2.6 Z" />
        <path d="M44,8 l1.8,4.4 4.4,1.8 -4.4,1.8 -1.8,4.4 -1.8,-4.4 -4.4,-1.8 4.4,-1.8 Z" opacity=".7" />
      </g>
    </svg>
  );
}

// Большая сцена для страницы AI: лис фотографирует тарелку
export function FoxHeroScene() {
  return (
    <svg viewBox="0 0 300 150" width="100%" height="150">
      <g fill="#A99BFF" opacity=".55">
        <path d="M40,30 l2.4,6 6,2.4 -6,2.4 -2.4,6 -2.4,-6 -6,-2.4 6,-2.4 Z" />
        <path d="M262,52 l3,7.4 7.4,3 -7.4,3 -3,7.4 -3,-7.4 -7.4,-3 7.4,-3 Z" />
        <path d="M246,20 l1.8,4.4 4.4,1.8 -4.4,1.8 -1.8,4.4 -1.8,-4.4 -4.4,-1.8 4.4,-1.8 Z" />
      </g>
      <svg x="58" y="16" width="118" height="118" viewBox="0 0 200 200">
        <FoxPaths />
      </svg>
      <g transform="translate(150,52) rotate(-7)">
        <rect x="0" y="0" width="104" height="78" rx="16" fill="#0E2033" stroke="#8B7BF7" strokeWidth="3" />
        <rect x="8" y="8" width="88" height="62" rx="10" fill="#16324A" />
        <svg x="22" y="12" width="60" height="54" viewBox="0 0 100 100">
          <PlatePaths />
        </svg>
        <g stroke="#7BD98A" strokeWidth="3.4" fill="none" strokeLinecap="round">
          <path d="M18,22 v-6 h6" />
          <path d="M86,22 v-6 h-6" />
          <path d="M18,56 v6 h6" />
          <path d="M86,56 v6 h-6" />
        </g>
        <rect x="14" y="36" width="76" height="3" rx="1.5" fill="#7BD98A" opacity=".85" />
      </g>
    </svg>
  );
}

// Просто лис (для тизера «скоро»)
export function FoxIcon({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <FoxPaths />
    </svg>
  );
}

// Белая камера для основной кнопки
export function CameraIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <rect x="4" y="16" width="56" height="40" rx="10" fill="#fff" opacity=".95" />
      <circle cx="32" cy="36" r="12" fill="#6C5AE0" />
      <circle cx="32" cy="36" r="6" fill="#fff" opacity=".6" />
      <rect x="22" y="8" width="20" height="10" rx="4" fill="#fff" opacity=".95" />
    </svg>
  );
}

// Искры в заголовке страницы
export function SparkIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path d="M32,6 l5,14 14,5 -14,5 -5,14 -5,-14 -14,-5 14,-5 Z" fill="#A99BFF" />
      <path d="M52,34 l2.6,6.4 6.4,2.6 -6.4,2.6 -2.6,6.4 -2.6,-6.4 -6.4,-2.6 6.4,-2.6 Z" fill="#F58A3C" />
    </svg>
  );
}

// Иконки шагов «Как это работает»
export function StepCameraIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 64 64">
      <rect x="4" y="18" width="56" height="38" rx="10" fill="#FDECDC" />
      <circle cx="32" cy="37" r="13" fill="#8B7BF7" />
      <circle cx="32" cy="37" r="6.5" fill="#FDECDC" opacity=".8" />
      <rect x="22" y="9" width="20" height="11" rx="4.5" fill="#FDECDC" />
      <circle cx="52" cy="27" r="3" fill="#4CB558" />
    </svg>
  );
}

export function StepScanIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 64 64">
      <svg x="4" y="6" width="56" height="50" viewBox="0 0 100 100">
        <PlatePaths />
      </svg>
      <g stroke="#8B7BF7" strokeWidth="4" fill="none" strokeLinecap="round">
        <path d="M8,16 v-6 h6" />
        <path d="M56,16 v-6 h-6" />
        <path d="M8,50 v6 h6" />
        <path d="M56,50 v6 h-6" />
      </g>
    </svg>
  );
}

export function StepDiaryIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 64 64">
      <rect x="10" y="7" width="35" height="50" rx="7" fill="#FDECDC" />
      <rect x="17" y="17" width="21" height="3.6" rx="1.8" fill="#0D2231" opacity=".28" />
      <rect x="17" y="26" width="21" height="3.6" rx="1.8" fill="#0D2231" opacity=".28" />
      <path d="M28,42 l6,6 12,-13" stroke="#4CB558" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Иконки правил
export function RuleCalendarIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 64 64">
      <rect x="6" y="12" width="52" height="46" rx="9" fill="#FDECDC" />
      <path d="M6,21 a9,9 0 0 1 9,-9 h34 a9,9 0 0 1 9,9 v4 H6 Z" fill="#F58A3C" />
      <rect x="16" y="4" width="6" height="14" rx="3" fill="#E0742A" />
      <rect x="42" y="4" width="6" height="14" rx="3" fill="#E0742A" />
      <path d="M22,42 l7,7 14,-15" stroke="#4CB558" strokeWidth="6.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RuleFlameIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 64 64">
      <path d="M34,2 c2,10 -4,13 -9,18 -6,6 -11,12 -11,21 a18,18 0 0 0 36,0 C50,29 40,22 38,14 Z" fill="#F58A3C" />
      <path d="M33,26 c1,6 -3,8 -5,11 -3,4 -4,6 -4,9 a9,9 0 0 0 18,0 c0,-7 -6,-12 -9,-20 Z" fill="#FFD166" />
    </svg>
  );
}

// Билет промокода
export function TicketIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path
        d="M8,16 h48 a6,6 0 0 1 6,6 v6 a6,6 0 0 0 0,12 v6 a6,6 0 0 1 -6,6 H8 a6,6 0 0 1 -6,-6 v-6 a6,6 0 0 0 0,-12 v-6 a6,6 0 0 1 6,-6 Z"
        fill="#F58A3C"
      />
      <path d="M24,24 v16 M40,24 v16" stroke="#FDECDC" strokeWidth="4" strokeLinecap="round" strokeDasharray="3 6" />
    </svg>
  );
}

// Полоска из сегментов (заполненные — фиолетовый градиент со свечением)
export function SegmentBar({ total, filled }: { total: number; filled: number }) {
  return (
    <div style={{ display: 'flex', gap: '5px', marginTop: '14px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <i
          key={i}
          style={{
            flex: 1,
            height: '8px',
            borderRadius: '4px',
            background:
              i < filled
                ? 'linear-gradient(90deg, #8B7BF7, #A99BFF)'
                : 'rgba(253,236,220,.12)',
            boxShadow: i < filled ? '0 0 10px rgba(139,123,247,.5)' : 'none',
            transition: 'background 300ms ease',
          }}
        />
      ))}
    </div>
  );
}

// Фон hero-карточки из мокапа
export const heroCardStyle: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  background:
    'radial-gradient(120% 130% at 88% -10%, rgba(139,123,247,.38) 0%, rgba(139,123,247,0) 55%), linear-gradient(160deg,#16324A 0%, #112639 100%)',
  border: '1px solid rgba(139,123,247,.32)',
  borderRadius: '26px',
  padding: '18px',
};

// «1 сентября» — дата ближайшего сброса лимита
export function nextResetLabel(): string {
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const now = new Date();
  return `1 ${months[(now.getMonth() + 1) % 12]}`;
}
