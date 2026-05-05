import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Cart from './components/Cart';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner'; 

import Home from './pages/Home';
import Menu from './pages/Menu';
import Reserve from './pages/Reserve';
import Banquet from './pages/Banquet';
import Reviews from './pages/Reviews';
import Contacts from './pages/Contacts';
import Admin from './pages/Admin';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import OrderStatus from './pages/OrderStatus';
import WaiterSimple from './pages/WaiterSimple';
import QrMenu from './pages/QrMenu';

function AppInner() {
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();

  // Определяем маршруты, где не нужна общая оболочка (Navbar/Footer)
  // QR-меню, Админка и Официант имеют свой собственный полный интерфейс
  const isFullPageRoute = 
    location.pathname === '/admin' || 
    location.pathname === '/waiter' || 
    location.pathname === '/qr-menu';

  // Страница статуса заказа скрывает корзину, но оставляет навигацию (если нужно)
  // В данном случае, если isFullPageRoute false, то Navbar будет показан.
  // Если ты хочешь, чтобы на /order тоже не было Navbar, добавь его в isFullPageRoute
  
  const hideShell = isFullPageRoute;
  const isOrderStatus = location.pathname.startsWith('/order/');

  return (
    <>
      {/* Показываем Navbar, если это не полная страница */}
      {!hideShell && <Navbar onCartOpen={() => setCartOpen(true)} />}
      
      {/* Показываем Корзину, если это не полная страница и не статус заказа */}
      {!hideShell && !isOrderStatus && <Cart open={cartOpen} onClose={() => setCartOpen(false)} />}
      
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/menu"        element={<Menu />} />
        <Route path="/reserve"     element={<Reserve />} />
        <Route path="/banquet"     element={<Banquet />} />
        <Route path="/reviews"     element={<Reviews />} />
        <Route path="/contacts"    element={<Contacts />} />
        <Route path="/admin"       element={<Admin />} />
        <Route path="/privacy"     element={<Privacy />} />
        <Route path="/terms"       element={<Terms />} />
        <Route path="/order/:id"   element={<OrderStatus />} />
        <Route path="/waiter"      element={<WaiterSimple />} />
        <Route path="/qr-menu"     element={<QrMenu />} />
      </Routes>

      {/* Показываем Footer, если это не полная страница */}
      {!hideShell && <Footer />}
      
      {/* Баннер куки виден везде поверх контента */}
      <CookieBanner />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}