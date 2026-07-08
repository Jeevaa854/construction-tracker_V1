import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, HardHat, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-50 flex items-center justify-between px-6 py-4">
      <Link to="/" className="flex items-center gap-2 font-bold text-lg">
        <HardHat className="text-primary-600" size={26} />
        <span>Construction Tracker</span>
      </Link>

      <div className="hidden items-center gap-6 md:flex">
        {user && (
          <>
            <Link to="/dashboard" className="hover:text-primary-600">Dashboard</Link>
            <Link to="/projects" className="hover:text-primary-600">Projects</Link>
            <Link to="/tasks" className="hover:text-primary-600">Tasks</Link>
            <Link to="/resources" className="hover:text-primary-600">Resources</Link>
            {(user.role === 'admin' || user.role === 'manager') && (
              <Link to="/budgets" className="hover:text-primary-600">Budgets</Link>
            )}
            <Link to="/reports" className="hover:text-primary-600">Reports</Link>
            <Link to="/notifications" className="hover:text-primary-600">Notifications</Link>
            <Link to="/profile" className="hover:text-primary-600">Profile</Link>
            <Link to="/settings" className="hover:text-primary-600">Settings</Link>
          </>
        )}

        <button
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle dark mode"
          className="rounded-full p-2 hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {user ? (
          <button onClick={handleLogout} className="btn-secondary">
            <LogOut size={18} /> Logout
          </button>
        ) : (
          <Link to="/login" className="btn-primary">Login</Link>
        )}
      </div>

      <button className="md:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
        {menuOpen ? <X /> : <Menu />}
      </button>

      {menuOpen && (
        <div className="glass absolute left-0 right-0 top-full flex flex-col gap-4 p-6 md:hidden">
          {user && (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/projects" onClick={() => setMenuOpen(false)}>Projects</Link>
              <Link to="/tasks" onClick={() => setMenuOpen(false)}>Tasks</Link>
              <Link to="/resources" onClick={() => setMenuOpen(false)}>Resources</Link>
              {(user.role === 'admin' || user.role === 'manager') && (
                <Link to="/budgets" onClick={() => setMenuOpen(false)}>Budgets</Link>
              )}
              <Link to="/reports" onClick={() => setMenuOpen(false)}>Reports</Link>
              <Link to="/notifications" onClick={() => setMenuOpen(false)}>Notifications</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link to="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>
              <button onClick={handleLogout} className="btn-secondary w-fit">
                <LogOut size={18} /> Logout
              </button>
            </>
          )}
          {!user && <Link to="/login" className="btn-primary w-fit">Login</Link>}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
