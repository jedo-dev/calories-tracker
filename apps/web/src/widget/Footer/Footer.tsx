import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QuickActionsSheet } from "../QuickActionsSheet";
import styles from "./styles.module.css";

import { IconClub, IconGrid, IconHome, IconPlus, IconUser } from "../../ui/navIcons";
import { t } from "../../i18n";

export const Footer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // «Клуб» — один слот на три соц. раздела: активен на любом из них.
  const items = [
    { icon: <IconHome />, label: t("nav.home"), path: "/today", match: ["/today"] },
    { icon: <IconUser />, label: t("nav.profile"), path: "/profile", match: ["/profile"] },
    { icon: <IconClub />, label: t("nav.club"), path: "/league", match: ["/league", "/feed", "/friends"] },
    { icon: <IconGrid />, label: t("nav.menu"), path: "/menu", match: ["/menu"] },
  ];

  const leftItems = items.slice(0, 2);
  const rightItems = items.slice(2, 4);

  // Колонка активного пункта в сетке 5 слотов (центральный «+» занимает 3-ю).
  const activeIndex = items.findIndex((item) =>
    item.match.some((p) => location.pathname.startsWith(p)),
  );
  const activeCol = activeIndex < 0 ? -1 : activeIndex < 2 ? activeIndex : activeIndex + 1;

  // Тап по пункту при открытом листе закрывает лист И выполняет переход —
  // раньше он только закрывал, и нажатие «в никуда» ощущалось как баг.
  const handleNavClick = (path: string) => {
    if (isOpen) setIsOpen(false);
    navigate(path);
  };

  const renderItem = (item: (typeof items)[number]) => {
    const isActive = item.match.some((p) => location.pathname.startsWith(p));
    return (
      <button
        key={item.path}
        className={`${styles.footerItem} ${isActive ? styles.footerItemActive : ""}`}
        onClick={() => handleNavClick(item.path)}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        type="button"
      >
        {item.icon}
        <span className={styles.footerLabel}>{item.label}</span>
      </button>
    );
  };

  return (
    <div className={styles.footerWrapper}>
      <nav className={styles.footer} role="navigation" aria-label="Основная навигация">
        {/* Единая полоска-индикатор: плавно переезжает между разделами */}
        <span
          className={styles.indicator}
          style={{ '--col': activeCol, opacity: activeCol < 0 ? 0 : 1 } as React.CSSProperties}
          aria-hidden="true"
        />
        {leftItems.map(renderItem)}

        <button
          className={`${styles.centerButton} ${isOpen ? styles.centerButtonActive : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Закрыть быстрые действия" : t("nav.add")}
          aria-expanded={isOpen}
          type="button"
        >
          <span className={styles.centerPlus} aria-hidden="true">
            <IconPlus size={28} />
          </span>
        </button>

        {rightItems.map(renderItem)}
      </nav>
      <QuickActionsSheet
        onClick={(open) => setIsOpen(open)}
        isOpen={isOpen}
      />
    </div>
  );
};
