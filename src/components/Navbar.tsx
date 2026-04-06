import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Phone } from 'lucide-react';
import { useCart } from '../lib/useCart';

interface NavbarProps {
  onCartOpen: () => void;
}

export default function Navbar({ onCartOpen }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count } = useCart();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const links = [
    { to: '/', label: 'Главная' },
    { to: '/menu', label: 'Меню' },
    { to: '/reserve', label: 'Бронирование' },
    { to: '/banquet', label: 'Банкеты' },
    { to: '/reviews', label: 'Отзывы' },
    { to: '/contacts', label: 'Контакты' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'nav-scrolled' : 'nav-transparent'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="logo-mark">
            <span className="text-2xl">🧂</span>
          </div>
          <div className="leading-tight">
            <div className="font-display text-xl font-bold text-sp-orange">Соль&nbsp;&amp;&nbsp;Перец</div>
            <div className="text-xs text-sp-cream opacity-70 hidden sm:block">Кафе в Сходне</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link ${
                location.pathname === l.to ? 'nav-link-active' : ''
              }`}
            >{l.label}</Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <a href="tel:+79257677778" className="hidden md:flex items-center gap-2 text-sp-cream hover:text-sp-orange transition-colors text-sm font-medium">
            <Phone size={15} />
            +7 (925) 767-77-78
          </a>
          <button
            onClick={onCartOpen}
            className="cart-btn relative"
            aria-label="Корзина"
          >
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="cart-badge">{count}</span>
            )}
          </button>
          <button
            className="lg:hidden text-sp-cream p-2"
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden mobile-menu">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className="mobile-nav-link"
            >{l.label}</Link>
          ))}
          <a href="tel:+79257677778" className="mobile-nav-link flex items-center gap-2">
            <Phone size={16} /> +7 (925) 767-77-78
          </a>
        </div>
      )}
    </nav>
  );
}
