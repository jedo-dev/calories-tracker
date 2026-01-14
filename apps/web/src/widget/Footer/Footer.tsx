import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../theme/useTheme";
import { BurgerMenu } from "../BurgerMenu";
import { Drawer } from "../Drawer";
import styles from "./styles.module.css";

//@ts-ignore
import leagueIcon from '../../assets/trophy.png';
//@ts-ignore
import friendsIcon from '../../assets/friend.png';
//@ts-ignore
import profileIcon from '../../assets/profile.png';
//@ts-ignore
import feedIcon from '../../assets/feed.png';
import { t } from "../../i18n";
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
        <div className={styles.footerItem}>
          <img src={leagueIcon} alt="league" width={30} height={30} onClick={() => navigate('/league')} />
          <Link to="/league"
            style={{
              color: `${theme.palette.primaryText}`,
              textDecoration: 'none'
            }}>
            {t('league.title')}
          </Link>

        </div>


        <div className={styles.footerItem}>
          <img src={profileIcon} alt="league" width={30} height={30} onClick={() => navigate('/profile')} />
          <Link to="/profile"
            style={{
              color: `${theme.palette.primaryText}`,
              textDecoration: 'none'
            }}>
            {t('profile.title')}
          </Link>

        </div>

        <div className={styles.footerItem}>
          <BurgerMenu onClick={() => handleClick(!isOpen)} isOpen={isOpen} />
        </div>

        
        <div className={styles.footerItem}>
          <img src={ feedIcon } alt="feed" width={30} height={30} onClick={() => navigate('/feed')} />
          <Link to="/friends"
            style={{
              color: `${theme.palette.primaryText}`,
              textDecoration: 'none'
            }}>
            {t('feed.title')}
          </Link>

        </div>
        <div className={styles.footerItem}>
          <img src={friendsIcon} alt="friends" width={30} height={30} onClick={() => navigate('/friends')} />
          <Link to="/friends"
            style={{
              color: `${theme.palette.primaryText}`,
              textDecoration: 'none'
            }}>
            {t('friends.title')}
          </Link>

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
