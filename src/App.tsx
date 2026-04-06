import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Cart from './components/Cart';
import Footer from './components/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Reserve from './pages/Reserve';
import Banquet from './pages/Banquet';
import Reviews from './pages/Reviews';
import Contacts from './pages/Contacts';
import Admin from './pages/Admin';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import QrMenu from './pages/QrMenu';

function AppInner() {
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();

  // QR menu and admin have their own full-page layout
  const isQrRoute   = location.pathname === '/qr-menu';
  const isAdminRoute = location.pathname === '/admin';
  const hideShell   = isQrRoute || isAdminRoute;

  return (
    <>
      {!hideShell && <Navbar onCartOpen={() => setCartOpen(true)} />}
      {!hideShell && <Cart open={cartOpen} onClose={() => setCartOpen(false)} />}
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/menu"      element={<Menu />} />
        <Route path="/reserve"   element={<Reserve />} />
        <Route path="/banquet"   element={<Banquet />} />
        <Route path="/reviews"   element={<Reviews />} />
        <Route path="/contacts"  element={<Contacts />} />
        <Route path="/admin"     element={<Admin />} />
        <Route path="/privacy"   element={<Privacy />} />
        <Route path="/terms"     element={<Terms />} />
        <Route path="/qr-menu"   element={<QrMenu />} />
      </Routes>
      {!hideShell && <Footer />}
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
