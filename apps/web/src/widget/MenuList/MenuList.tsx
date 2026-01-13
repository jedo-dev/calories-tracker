


import { Link } from 'react-router-dom';
import { useTheme } from '../../theme/useTheme';
import styles from './styles.module.css';
const MenuList = ({ items, isActive }: { items: { title: string, icon: string, link: string }[], isActive: string }) => {
  const theme = useTheme();
  return (
    <ul className={styles.menuList}>
      {items.map((item) => (
        <li key={item.title} className={styles.menuItem}>
          <img src={item.icon} alt={item.title} width={20} height={20} />
          <Link to={item.link}
            style={{
              color: `${isActive === item.link ? theme.palette.secondaryText : theme.palette.primaryText}`,
              textDecoration: 'none'
            }}>
            {item.title}
          </Link>


        </li>
      ))}
    </ul>
  );
};

export default MenuList;