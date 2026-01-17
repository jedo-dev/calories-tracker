import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../theme/useTheme";
import { BurgerMenu } from "../BurgerMenu";
import { Drawer } from "../Drawer";
import styles from "./styles.module.css";

//@ts-ignore
//@ts-ignore
//@ts-ignore
//@ts-ignore
import BellIcon from "../../assets/BellIcon";
import ProfileIcon from "../../assets/ProfileIcon";
import SettingsIcon from "../../assets/SettingsIcon";
import StarIcon from "../../assets/StarIcon";
import { t } from "../../i18n";
function isActive(pathname: string, rule: string): boolean {
  if (pathname === rule) {
    return true;
  }
  return false;
}
export const Footer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const handleClick = (boolean: boolean) => {
    setIsOpen(boolean);
  };

  const theme = useTheme();
  return (
    <div className={styles.footerWrapper}>
      <div className={styles.footer}>
        <div
          className={styles.footerItem}
          onClick={() => {
            navigate("/league");
          }}
        >
          <StarIcon />

          <span
            style={{
              color: `${theme.palette.gray_100}`,
              textDecoration: "none",
              opacity: isActive(location.pathname, "/league") ? 1 : 0.5
            }}
          >
            {t("league.title")}
          </span>
        </div>

        <div
          className={styles.footerItem}
          onClick={() => {
            navigate("/feed");
          }}
        >
          <BellIcon />
          <span
            style={{
              color: `${theme.palette.gray_100}`,
              textDecoration: "none",
              opacity: isActive(location.pathname, "/feed") ? 1 : 0.5
            }}
          >
            {t("feed.title")}
          </span>
        </div>


        <div className={styles.footerItem}>
          <BurgerMenu onClick={() => handleClick(!isOpen)} isOpen={isOpen} />
        </div>

        <div
          className={styles.footerItem}
          onClick={() => {
            navigate("/friends");
          }}
        >
          <ProfileIcon />
          <span
            style={{
              color: `${theme.palette.gray_100}`,
              textDecoration: "none",
              opacity: isActive(location.pathname, "/friends") ? 1 : 0.5
            }}
          >
            {t("friends.title")}
          </span>
        </div>

        <div
          className={styles.footerItem}
          onClick={() => {
            navigate("/profile");
          }}
        >
          <SettingsIcon />
          <span
            style={{
              color: `${theme.palette.gray_100}`,
              textDecoration: "none",
              opacity: isActive(location.pathname, "/profile") ? 1 : 0.5
            }}
          >
            {t("profile.title")}
          </span>
        </div>
      </div>
      <Drawer
        isActive={location.pathname}
        onClick={() => handleClick(!isOpen)}
        isOpen={isOpen}
      />
    </div>
  );
};
