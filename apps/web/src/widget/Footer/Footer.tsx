import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../theme/useTheme";
import { BurgerMenu } from "../BurgerMenu";
import { Drawer } from "../Drawer";
import styles from "./styles.module.css";

//@ts-ignore
import BellIcon from "../../assets/BellIcon";
import ProfileIcon from "../../assets/ProfileIcon";
import SettingsIcon from "../../assets/SettingsIcon";
import StarIcon from "../../assets/StarIcon";
import { t } from "../../i18n";

function isActive(pathname: string, rule: string): boolean {
  return pathname === rule;
}

export const Footer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const handleClick = (boolean: boolean) => {
    setIsOpen(boolean);
  };

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
      <div className={styles.footer}>
        {leftItems.map((item) => (
          <div
            key={item.path}
            className={styles.footerItem}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span
              style={{
                color: theme.palette.gray_100,
                textDecoration: "none",
                opacity: isActive(location.pathname, item.path) ? 1 : 0.5,
              }}
            >
              {item.label}
            </span>
          </div>
        ))}

        <div className={styles.footerItem}>
          <BurgerMenu onClick={() => handleClick(!isOpen)} isOpen={isOpen} />
        </div>

        {rightItems.map((item) => (
          <div
            key={item.path}
            className={styles.footerItem}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span
              style={{
                color: theme.palette.gray_100,
                textDecoration: "none",
                opacity: isActive(location.pathname, item.path) ? 1 : 0.5,
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <Drawer
        onClick={() => handleClick(!isOpen)}
        isOpen={isOpen}
      />
    </div>
  );
};
