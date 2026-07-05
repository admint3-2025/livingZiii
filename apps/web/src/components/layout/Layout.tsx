import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/ZIIILiving3.png';
import '@/styles/layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/dashboard" className="brand" aria-label="ZIII Living">
          <img className="brandLogo" src={logo} alt="ZIII Living" />
        </NavLink>

        <nav className="nav">
          <div className="navSection">
            <div className="navSectionTitle">General</div>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `navLink ${isActive ? 'navLinkActive' : ''}`}
            >
              <span className="navIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="navIconSvg" fill="none">
                  <path
                    d="M3 10.5 12 3l9 7.5V21a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 21V10.5Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M9.5 22v-7A1.5 1.5 0 0 1 11 13.5h2A1.5 1.5 0 0 1 14.5 15v7"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Dashboard
            </NavLink>
          </div>

          <div className="navSection">
            <div className="navSectionTitle">Administración</div>
            <NavLink
              to="/organizations"
              className={({ isActive }) => `navLink ${isActive ? 'navLinkActive' : ''}`}
            >
              <span className="navIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="navIconSvg" fill="none">
                  <path
                    d="M7 21V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 21h14"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 11h4M10 14.5h4M10 18h4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Organizaciones
            </NavLink>
            <NavLink
              to="/properties"
              className={({ isActive }) => `navLink ${isActive ? 'navLinkActive' : ''}`}
            >
              <span className="navIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="navIconSvg" fill="none">
                  <path
                    d="M4 10.5 12 4l8 6.5V21a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10.5Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M9 22v-6.5A1.5 1.5 0 0 1 10.5 14h3A1.5 1.5 0 0 1 15 15.5V22"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Propiedades
            </NavLink>
            <NavLink
              to="/units"
              className={({ isActive }) => `navLink ${isActive ? 'navLinkActive' : ''}`}
            >
              <span className="navIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="navIconSvg" fill="none">
                  <path
                    d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M4 10.5h16M10.5 4v16"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Unidades
            </NavLink>
          </div>

          <div className="navSection">
            <div className="navSectionTitle">Finanzas</div>
            <NavLink
              to="/quotas"
              className={({ isActive }) => `navLink ${isActive ? 'navLinkActive' : ''}`}
            >
              <span className="navIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="navIconSvg" fill="none">
                  <path
                    d="M12 3v18"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16.5 7.2c0-2-2-3.2-4.5-3.2S7.5 5.1 7.5 7.2c0 4.3 9 2.1 9 6.4 0 2.1-2 3.2-4.5 3.2S7.5 15.7 7.5 13.6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Cuotas
            </NavLink>
            <NavLink
              to="/payments"
              className={({ isActive }) => `navLink ${isActive ? 'navLinkActive' : ''}`}
            >
              <span className="navIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="navIconSvg" fill="none">
                  <path
                    d="M3.8 7.2A2.7 2.7 0 0 1 6.5 4.5h11A2.7 2.7 0 0 1 20.2 7.2v9.6a2.7 2.7 0 0 1-2.7 2.7h-11a2.7 2.7 0 0 1-2.7-2.7V7.2Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M3.8 9.2h16.4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 15.8h4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Pagos
            </NavLink>
          </div>

          <div className="navSection">
            <div className="navSectionTitle">Accesos</div>
            <NavLink
              to="/access-control"
              className={({ isActive }) => `navLink ${isActive ? 'navLinkActive' : ''}`}
            >
              <span className="navIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="navIconSvg" fill="none">
                  <path
                    d="M9.5 11a2.5 2.5 0 1 1 5 0v2.3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7.3 13.3h9.4c.9 0 1.6.7 1.6 1.6v4.6c0 .9-.7 1.6-1.6 1.6H7.3c-.9 0-1.6-.7-1.6-1.6v-4.6c0-.9.7-1.6 1.6-1.6Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Control de Acceso
            </NavLink>
          </div>
        </nav>
      </aside>

      <div className="content">
        <header className="topbar">
          <div className="topbarInner">
            <div className="topbarLeft">
              <div className="topbarTitle">ZIII Living</div>
              <div className="topbarSubtitle">Portal administrativo</div>
            </div>

            <div className="topbarRight">
              {user ? (
                <>
                  <div className="userPill" title={user.email}>
                    <div className="userAvatar" aria-hidden="true">
                      {(user.firstName?.[0] || 'U').toUpperCase()}
                      {(user.lastName?.[0] || '').toUpperCase()}
                    </div>
                    <div className="userMeta">
                      <div className="userName">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="userRole">{user.role}</div>
                    </div>
                  </div>

                  <button className="btn btnGhost" onClick={handleLogout}>
                    Salir
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <main className="main">{children}</main>
      </div>
    </div>
  );
};
