import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../theme/useTheme";
import { BurgerMenu } from "../BurgerMenu";
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
  const theme = useTheme();

  const items = [
    { icon: <StarIcon />, label: t("league.title"), path: "/league" },
    { icon: <BellIcon />, label: t("feed.title"), path: "/feed" },
    { icon: <ProfileIcon />, label: t("friends.title"), path: "/friends" },
    { icon: <SettingsIcon />, label: t("profile.title"), path: "/profile" },
  ];

  const leftItems = items.slice(0, 2);
  const rightItems = items.slice(2, 4);

  return (
    <div className={styles.footerWrapper}>
      <nav className={styles.footer} role="navigation" aria-label="Основная навигация">
        {leftItems.map((item) => (
          <button
            key={item.path}
            className={styles.footerItem}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              padding: '4px',
              minWidth: '44px',
              minHeight: '44px',
              justifyContent: 'center',
            }}
          >
            {item.icon}
            <span
              style={{
                color: theme.palette.gray_100,
                opacity: location.pathname === item.path ? 1 : 0.5,
                fontSize: '10px',
              }}
            >
              {item.label}
            </span>
          </button>
        ))}

        <div className={styles.footerItem}>
          <BurgerMenu onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
        </div>

        {rightItems.map((item) => (
          <button
            key={item.path}
            className={styles.footerItem}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              padding: '4px',
              minWidth: '44px',
              minHeight: '44px',
              justifyContent: 'center',
            }}
          >
            {item.icon}
            <span
              style={{
                color: theme.palette.gray_100,
                opacity: location.pathname === item.path ? 1 : 0.5,
                fontSize: '10px',
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>
      <Drawer
        onClick={() => setIsOpen(!isOpen)}
        isOpen={isOpen}
      />
    </div>
  );
};
