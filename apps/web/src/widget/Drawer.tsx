import { useEffect, useState } from 'react';
//@ts-ignore
import logo from '../assets/logo.png';
import { t } from '../i18n';
//@ts-ignore
import todayIcon from '../assets/home.png';
//@ts-ignore
import productsIcon from '../assets/products.png';
//@ts-ignore
import leagueIcon from '../assets/trophy.png';
//@ts-ignore
import friendsIcon from '../assets/friend.png';
//@ts-ignore
import feedIcon from '../assets/feed.png';
import { useTheme } from '../theme/useTheme';
import MenuList from './MenuList/MenuList';
export function Drawer({ onClick, isOpen = false, isActive = '' }: { onClick: (boolean: boolean) => void, isOpen: boolean, isActive: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const theme = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) {
    return null;
  }

  const items = [
    { title: t('today.title'), icon: todayIcon, link: '/today' },
    { title: t('products.title'), icon: productsIcon, link: '/products' },
    { title: t('league.title'), icon: leagueIcon, link: '/league' },
    { title: t('friends.title'), icon: friendsIcon, link: '/friends' },
    { title: t('feed.title'), icon: feedIcon, link: '/feed' },
  ];
  return (
    <>
      <div
        onClick={() => onClick(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          backgroundColor: 'rgba(15, 12, 12, 0.6)',
          opacity: isAnimating ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',

            left: 0,
            width: '100%',
            height: '80%',
            bottom: 0,
            backgroundColor: 'rgb(0, 0, 0)',
            transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start', margin: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', }}>
              <img src={logo} alt="logo" width={100} height={100} />
              <h1 style={{ color: `white`, fontSize: '20px', fontWeight: 'bold' }}>{t('app.name')}</h1>
            </div>
            <div style={{ width: '100%', height: '1px', backgroundColor: 'white', margin: '10px 0' }}></div>

            <MenuList items={items} isActive={isActive} />
            <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginTop: '20px' }}>

              version: {__APP_VERSION__}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
