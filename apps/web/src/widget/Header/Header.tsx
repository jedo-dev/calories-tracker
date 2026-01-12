import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { t } from '../../i18n';
import { BurgerMenu } from '../BurgerMenu';
import { Drawer } from '../Drawer';

function getPageTitle(pathname: string): string {
  if (pathname === '/today') {
    return t('today.title');
  }
  if (pathname === '/products') {
    return t('products.title');
  }
  if (pathname === '/entry/new') {
    return t('entry.add');
  }
  if (pathname.startsWith('/entry/')) {
    return t('entry.edit');
  }
  if (pathname === '/league') {
    return t('league.title');
  }
  if (pathname === '/friends') {
    return t('friends.title');
  }
  if (pathname === '/feed') {
    return t('feed.title');
  }
  if (pathname === '/' || pathname === '/entry') {
    return t('app.name');
  }
  return t('app.name');
}

export function Header() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const handleClick = (boolean: boolean) => {
    setIsOpen(boolean);
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <BurgerMenu onClick={() => handleClick(!isOpen)} isOpen={isOpen} />

      <h1 style={{ color: 'black', fontSize: '20px', fontWeight: 'bold' }}>{pageTitle}</h1>
      <Drawer isActive={location.pathname} onClick={() => handleClick(!isOpen)} isOpen={isOpen} />
    </div>
  );
}
