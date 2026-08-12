import type { CSSProperties } from 'react';

/**
 * Нейтральный набор stroke-иконок для навигации (футер, лист быстрых
 * действий, экран «Ещё»). В отличие от многоцветного набора ui/Icon.tsx,
 * эти иконки одноцветные и красятся через currentColor — чтобы футер мог
 * подсвечивать активный пункт акцентом, а списки — тонировать кружки.
 */

interface NavIconProps {
  size?: number;
  style?: CSSProperties;
}

function makeIcon(paths: React.ReactNode) {
  return function NavIcon({ size = 24, style }: NavIconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={style}
      >
        {paths}
      </svg>
    );
  };
}

export const IconHome = makeIcon(
  <>
    <path d="M4 10.5 12 4l8 6.5" />
    <path d="M6 9.5V20h12V9.5" />
    <path d="M10 20v-5h4v5" />
  </>,
);

export const IconStats = makeIcon(
  <>
    <path d="M5 20V12" />
    <path d="M10.5 20V6" />
    <path d="M16 20v-4" />
    <path d="M21 20V9" />
  </>,
);

export const IconClub = makeIcon(
  <>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19.5c.6-3.1 2.8-4.8 5.5-4.8s4.9 1.7 5.5 4.8" />
    <circle cx="17" cy="9.5" r="2.5" />
    <path d="M16.4 14.6c2.3.2 3.8 1.7 4.3 4" />
  </>,
);

export const IconUser = makeIcon(
  <>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20c.7-3.6 3.3-5.6 7-5.6s6.3 2 7 5.6" />
  </>,
);

export const IconPlus = makeIcon(
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>,
);

export const IconChevronRight = makeIcon(<path d="m9.5 6 6 6-6 6" />);

/** «Все разделы» — сетка 2×2 для пункта «Меню» в нижней панели. */
export const IconGrid = makeIcon(
  <>
    <rect x="4" y="4" width="7" height="7" rx="2" />
    <rect x="13" y="4" width="7" height="7" rx="2" />
    <rect x="4" y="13" width="7" height="7" rx="2" />
    <rect x="13" y="13" width="7" height="7" rx="2" />
  </>,
);

export const IconBarcode = makeIcon(
  <>
    <path d="M4 7V4.5h3M20 7V4.5h-3M4 17v2.5h3M20 17v2.5h-3" />
    <path d="M7.5 8.5v7M10.5 8.5v7M13.5 8.5v7M16.5 8.5v7" />
  </>,
);

export const IconCamera = makeIcon(
  <>
    <path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3V19H4z" />
    <circle cx="12" cy="13.5" r="3.2" />
  </>,
);

export const IconDumbbell = makeIcon(
  <>
    <path d="M8 12h8" />
    <path d="M5.5 8.5v7M18.5 8.5v7" />
    <path d="M2.8 10v4M21.2 10v4" />
  </>,
);

export const IconDrop = makeIcon(
  <path d="M12 3.5c3.4 4.1 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.1-5.9 5.5-10Z" />,
);

export const IconScale = makeIcon(
  <>
    <path d="M4 12h16" />
    <path d="M4 7h16" />
    <path d="M4 17h10" />
  </>,
);

export const IconRuler = makeIcon(
  <>
    <rect x="3" y="9" width="18" height="6" rx="1.5" />
    <path d="M7.5 9v3M12 9v3M16.5 9v3" />
  </>,
);

export const IconDish = makeIcon(
  <>
    <path d="M3.5 15a8.5 8.5 0 0 1 17 0z" />
    <path d="M3 18.5h18" />
    <path d="M12 6.5V5" />
  </>,
);

export const IconCalendar = makeIcon(
  <>
    <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
    <path d="M4 10.5h16" />
    <path d="M8.5 3.5v4M15.5 3.5v4" />
  </>,
);

export const IconTemplate = makeIcon(
  <>
    <rect x="4" y="4" width="16" height="16" rx="2.5" />
    <path d="M4 9.5h16" />
    <path d="M9.5 9.5V20" />
  </>,
);

export const IconSearch = makeIcon(
  <>
    <circle cx="11" cy="11" r="6" />
    <path d="m15.5 15.5 4.5 4.5" />
  </>,
);

export const IconSparkles = makeIcon(
  <>
    <path d="M12 4.5 13.6 9l4.4 1.6L13.6 12 12 16.5 10.4 12 6 10.6 10.4 9z" />
    <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
  </>,
);

export const IconBell = makeIcon(
  <>
    <path d="M12 4a5.5 5.5 0 0 1 5.5 5.5c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5A5.5 5.5 0 0 1 12 4Z" />
    <path d="M10 18.5a2 2 0 0 0 4 0" />
  </>,
);

export const IconTrophy = makeIcon(
  <>
    <path d="M8 4.5h8v5a4 4 0 0 1-8 0z" />
    <path d="M8 6H4.5c0 3 1.5 4.5 3.5 4.5M16 6h3.5c0 3-1.5 4.5-3.5 4.5" />
    <path d="M12 13.5v3M8.5 19.5h7M12 16.5v3" />
  </>,
);

export const IconSettings = makeIcon(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
  </>,
);

export const IconLogout = makeIcon(
  <>
    <path d="M14 4.5H6.5v15H14" />
    <path d="M10.5 12h10M17.5 8.5 21 12l-3.5 3.5" />
  </>,
);

export const IconRefresh = makeIcon(
  <>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.5 3.5v3.5H16" />
  </>,
);

export const IconSave = makeIcon(
  <>
    <path d="M5 4h11l3 3v13H5z" />
    <path d="M8 4v4.5h7V4" />
    <rect x="8" y="13" width="8" height="7" />
  </>,
);

export const IconDownload = makeIcon(
  <>
    <path d="M12 4v9.5" />
    <path d="M8.5 10.5 12 14l3.5-3.5" />
    <path d="M4.5 15.5v4h15v-4" />
  </>,
);

export const IconHistory = makeIcon(
  <>
    <path d="M5.2 7.5A8 8 0 1 1 4 12" />
    <path d="M4 4v3.5h3.5" />
    <path d="M12 8v4.5l3 1.8" />
  </>,
);

export const IconClock = makeIcon(
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7.5V12l3 2" />
  </>,
);

export const IconBook = makeIcon(
  <>
    <path d="M12 6.5C10.5 5 8.5 4.5 5 4.5v13c3.5 0 5.5.5 7 2 1.5-1.5 3.5-2 7-2v-13c-3.5 0-5.5.5-7 2Z" />
    <path d="M12 6.5v13" />
  </>,
);

export const IconBulb = makeIcon(
  <>
    <path d="M12 3.5a6 6 0 0 1 3.5 10.9c-.7.5-1 1.3-1 2.1h-5c0-.8-.3-1.6-1-2.1A6 6 0 0 1 12 3.5Z" />
    <path d="M10 19.5h4" />
  </>,
);

export const IconShare = makeIcon(
  <>
    <path d="M12 14.5V4" />
    <path d="M8.5 7 12 3.5 15.5 7" />
    <path d="M5.5 11.5v8.5h13v-8.5" />
  </>,
);
