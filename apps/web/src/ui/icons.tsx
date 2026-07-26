interface IconProps {
  size?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const DiaryPlusIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

export const PublishIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 15V4M7 9l5-5 5 5" />
    <path d="M4 20h16" />
  </svg>
);

export const UnpublishIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 4v11M7 10l5 5 5-5" />
    <path d="M4 20h16" />
  </svg>
);

export const DuplicateIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const ArchiveIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4" />
  </svg>
);

export const UnarchiveIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M12 17v-5M9.5 14.5L12 12l2.5 2.5" />
  </svg>
);

export const ForkIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 15V9" />
    <circle cx="12" cy="18" r="2.4" />
    <circle cx="6" cy="6" r="2.4" />
    <circle cx="18" cy="6" r="2.4" />
    <path d="M6 8.4c0 3 2.5 3.6 6 3.6s6-.6 6-3.6" />
  </svg>
);

export const EditIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

export const BackIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
