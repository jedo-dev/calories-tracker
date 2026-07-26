import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Drawer } from "../Drawer";
import styles from "./styles.module.css";

import BellIcon from "../../assets/BellIcon";
import ProfileIcon from "../../assets/ProfileIcon";
import SettingsIcon from "../../assets/SettingsIcon";
import StarIcon from "../../assets/StarIcon";
import { t } from "../../i18n";

export const Footer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { icon: <StarIcon />, label: t("league.title"), path: "/league" },
    { icon: <BellIcon />, label: t("feed.title"), path: "/feed" },
    { icon: <ProfileIcon />, label: t("friends.title"), path: "/friends" },
    { icon: <SettingsIcon />, label: t("profile.title"), path: "/profile" },
  ];

  const leftItems = items.slice(0, 2);
  const rightItems = items.slice(2, 4);

  // While the drawer is open, a tap on the nav bar acts like a tap on the
  // backdrop: it only dismisses the menu.
  const handleNavClick = (path: string) => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    navigate(path);
  };

  return (
    <div className={styles.footerWrapper}>
      <nav className={styles.footer} role="navigation" aria-label="Основная навигация">
        {leftItems.map((item) => (
          <button
            key={item.path}
            className={`${styles.footerItem} ${location.pathname === item.path ? styles.footerItemActive : ""}`}
            onClick={() => handleNavClick(item.path)}
            aria-label={item.label}
            type="button"
          >
            {item.icon}
            <span className={styles.footerLabel}>{item.label}</span>
          </button>
        ))}

        <button
          className={`${styles.centerButton} ${isOpen ? styles.centerButtonActive : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
          type="button"
        >
          <span className={styles.centerLines} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        {rightItems.map((item) => (
          <button
            key={item.path}
            className={`${styles.footerItem} ${location.pathname === item.path ? styles.footerItemActive : ""}`}
            onClick={() => handleNavClick(item.path)}
            aria-label={item.label}
            type="button"
          >
            {item.icon}
            <span className={styles.footerLabel}>{item.label}</span>
          </button>
        ))}
      </nav>
      <Drawer
        onClick={(open) => setIsOpen(open)}
        isOpen={isOpen}
      />
    </div>
  );
};
