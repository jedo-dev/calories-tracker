import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
//@ts-ignore
import logo from '../assets/logo.png';
import { t } from '../i18n';
//@ts-ignore
import todayIcon from '../assets/home.png';
//@ts-ignore
import productsIcon from '../assets/products.png';
export function Drawer({ onClick, isOpen = false }: { onClick: (boolean: boolean) => void, isOpen: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
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
            top: 0,
            left: 0,
            width: '80%',
            height: '100%',
            backgroundColor: 'rgb(0, 0, 0)',
            transform: isAnimating ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start', margin: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', }}>
              <img src={logo} alt="logo" width={100} height={100} />
              <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{t('app.name')}</h1>
            </div>
            <div style={{ width: '100%', height: '1px', backgroundColor: 'white', margin: '10px 0' }}></div>
            <ul style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start', gap: 10 }}>
              <li style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', gap: 10 }}>
                <img src={todayIcon} alt="today" width={20} height={20} />
                <Link style={{ color: 'white', textDecoration: 'none' }} to="/today">{t('today.title')}</Link>
              </li>
              <li style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', gap: 10 }}>
                <img src={productsIcon} alt="products" width={20} height={20} />
                <Link style={{ color: 'white', textDecoration: 'none' }} to="/products">{t('products.title')}</Link>
              </li>
            </ul>
            <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginTop: '20px' }}>

              version: {__APP_VERSION__}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
