import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Phone, 
  LayoutDashboard, 
  MessageSquare, 
  History, 
  User, 
  LogOut, 
  Menu,
  X,
  Moon,
  Sun,
  ChevronRight,
  Settings,
  Shield
} from 'lucide-react';
import useAuthStore from '../store/authStore';

// =============================================================================
// TOPBAR COMPONENT
// =============================================================================
export const TopBar = ({ 
  title = 'Farmer Assistant', 
  showLogo = true, 
  actions = null,
  showSearch = false 
}) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  return (
    <header className="topbar sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {showLogo && (
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-neutral-900 dark:bg-white flex items-center justify-center rounded-sm transition-transform duration-150 group-hover:scale-105">
              <Phone className="w-4 h-4 text-white dark:text-neutral-900" />
            </div>
            <span className="text-lg font-semibold text-neutral-900 dark:text-white">
              {title}
            </span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="btn-icon"
          title="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================
export const Sidebar = ({ className = '' }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/call', icon: Phone, label: 'Voice Call' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin' });
  }

  return (
    <aside className={`sidebar ${isCollapsed ? 'w-16' : 'w-64'} ${className}`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neutral-900 dark:bg-white flex items-center justify-center rounded-sm">
              <Phone className="w-4 h-4 text-white dark:text-neutral-900" />
            </div>
            <span className="font-semibold text-neutral-900 dark:text-white">
              Assistant
            </span>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="btn-icon"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          {!isCollapsed && (
            <span className="sidebar-section-title">Navigation</span>
          )}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User section */}
      <div className="sidebar-footer">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-sm">
            <div className="w-8 h-8 bg-neutral-300 dark:bg-neutral-700 rounded-sm flex items-center justify-center">
              <User className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {user?.email || ''}
              </p>
            </div>
            <button onClick={handleLogout} className="btn-icon p-1" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="btn-icon w-full justify-center" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

// =============================================================================
// APP LAYOUT WITH SIDEBAR
// =============================================================================
export const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-neutral-950/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, visible on desktop */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform lg:transform-none transition-transform duration-250
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden topbar">
          <button onClick={() => setSidebarOpen(true)} className="btn-icon">
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 dark:bg-white flex items-center justify-center rounded-sm">
              <Phone className="w-4 h-4 text-white dark:text-neutral-900" />
            </div>
            <span className="font-semibold text-neutral-900 dark:text-white">
              Assistant
            </span>
          </Link>
          <div className="w-8" />
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

// =============================================================================
// SIMPLE LAYOUT (Auth pages, Landing)
// =============================================================================
export const SimpleLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {children}
    </div>
  );
};

// =============================================================================
// PAGE HEADER
// =============================================================================
export const PageHeader = ({ 
  title, 
  description = null, 
  actions = null,
  backPath = null,
  backLabel = 'Back'
}) => {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      {backPath && (
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          {backLabel}
        </button>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-neutral-500 text-sm">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// CARD COMPONENT
// =============================================================================
export const Card = ({ 
  children, 
  className = '', 
  hover = false,
  padding = true 
}) => {
  return (
    <div className={`
      card 
      ${hover ? 'card-hover cursor-pointer' : ''} 
      ${padding ? 'p-6' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

// =============================================================================
// MODAL COMPONENT
// =============================================================================
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  footer = null,
  size = 'md'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className={`modal ${sizeClasses[size]}`}>
        {title && (
          <div className="modal-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {title}
            </h2>
            <button onClick={onClose} className="btn-icon">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action = null
}) => {
  return (
    <div className="empty-state">
      {Icon && <Icon className="empty-state-icon" />}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// LOADING SKELETON
// =============================================================================
export const Skeleton = ({ className = '', variant = 'text' }) => {
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10',
    card: 'h-32 w-full',
    button: 'h-10 w-24',
  };

  return (
    <div className={`skeleton ${variants[variant]} ${className}`} />
  );
};

// =============================================================================
// CHIP/TAG COMPONENT
// =============================================================================
export const Chip = ({ 
  children, 
  active = false, 
  onClick = null,
  icon: Icon = null 
}) => {
  const Component = onClick ? 'button' : 'span';
  
  return (
    <Component
      onClick={onClick}
      className={`chip ${active ? 'chip-active' : ''} ${onClick ? 'cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700' : ''}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </Component>
  );
};

export default {
  TopBar,
  Sidebar,
  AppLayout,
  SimpleLayout,
  PageHeader,
  Card,
  Modal,
  EmptyState,
  Skeleton,
  Chip,
};
