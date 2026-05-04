import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Cart from './components/Cart';
import Footer from './components/Footer';
// Импортируем новый компонент баннера
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
import Waiter from './pages/Waiter';

function AppInner() {
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();

  // These routes have their own full-page layout
  const noShellRoutes = ['/admin', '/waiter'];
  const hideShell = noShellRoutes.some(r => location.pathname.startsWith(r));
  // Order status page also hides cart but keeps navbar
  const isOrderStatus = location.pathname.startsWith('/order/');

  return (
    <>
      {!hideShell && <Navbar onCartOpen={() => setCartOpen(true)} />}
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
        <Route path="/waiter"      element={<Waiter />} />
      </Routes>

      {!hideShell && <Footer />}
      
      {/* Баннер куки отображается всегда, независимо от роута, так как он фиксирован внизу экрана */}
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