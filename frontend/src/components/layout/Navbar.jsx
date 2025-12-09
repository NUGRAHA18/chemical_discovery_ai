import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import DarkModeToggle from "../common/DarkModeToggle";
import { Upload } from "lucide-react"; // Add to existing import

// Import Icons
import {
  Home,
  LayoutDashboard,
  FlaskConical,
  Calculator,
  MessageSquare,
  History,
  Star,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Helper untuk mengecek active link agar diberi warna berbeda
  const isActive = (path) => location.pathname === path;

  // Style umum untuk link desktop
  const linkClass = (path) =>
    `flex items-center space-x-2 text-sm font-medium transition-all duration-200 px-3 py-2 rounded-md ${
      isActive(path)
        ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10"
        : "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* --- LOGO SECTION --- */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
              {/* Logo SVG (Atom/Chemistry generic - Custom Icon Retained) */}
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight">
              ChemDiscovery
            </span>
          </Link>

          {/* --- DESKTOP NAVIGATION --- */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link to="/" className={linkClass("/")}>
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/dashboard" className={linkClass("/dashboard")}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link to="/discover" className={linkClass("/discover")}>
                  <FlaskConical className="w-4 h-4" />
                  <span>Discover</span>
                </Link>

                <Link
                  to="/property-calculator"
                  className={linkClass("/property-calculator")}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Calc</span>
                </Link>
                <Link to="/chat" className={linkClass("/chat")}>
                  <MessageSquare className="w-4 h-4" />
                  <span>AI Chat</span>
                </Link>

                <Link to="/history" className={linkClass("/history")}>
                  <History className="w-4 h-4" />
                  <span>History</span>
                </Link>

                <Link to="/favorites" className={linkClass("/favorites")}>
                  <Star className="w-4 h-4" />
                  <span>Favorites</span>
                </Link>
                <Link
                  to="/batch"
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Batch Discovery
                </Link>
              </>
            )}
          </div>

          {/* --- RIGHT SIDE ACTIONS (Desktop) --- */}
          <div className="hidden lg:flex items-center space-x-4">
            <DarkModeToggle />

            {isAuthenticated ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-gray-200 dark:border-slate-700">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                    {user?.name || "Scientist"}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
                    Researcher
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* --- MOBILE MENU BUTTON --- */}
          <div className="flex items-center space-x-4 lg:hidden">
            <DarkModeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE MENU --- */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl absolute w-full left-0 shadow-xl">
          <div className="px-4 py-4 space-y-1">
            {[
              { path: "/", label: "Home", icon: <Home className="w-5 h-5" /> },
              ...(isAuthenticated
                ? [
                    {
                      path: "/dashboard",
                      label: "Dashboard",
                      icon: <LayoutDashboard className="w-5 h-5" />,
                    },
                    {
                      path: "/discover",
                      label: "Discover",
                      icon: <FlaskConical className="w-5 h-5" />,
                    },
                    {
                      path: "/property-calculator",
                      label: "Calculator",
                      icon: <Calculator className="w-5 h-5" />,
                    },
                    {
                      path: "/chat",
                      label: "AI Chat",
                      icon: <MessageSquare className="w-5 h-5" />,
                    },
                    {
                      path: "/history",
                      label: "History",
                      icon: <History className="w-5 h-5" />,
                    },
                    {
                      path: "/favorites",
                      label: "Favorites",
                      icon: <Star className="w-5 h-5" />,
                    },
                  ]
                : []),
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                    : "text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="opacity-70">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            {!isAuthenticated && (
              <div className="pt-4 mt-2 space-y-3 border-t border-gray-100 dark:border-slate-800">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full px-4 py-3 text-center rounded-lg border border-gray-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full px-4 py-3 text-center rounded-lg btn-primary font-medium shadow-md"
                >
                  Get Started
                </Link>
              </div>
            )}

            {isAuthenticated && (
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center px-3 mb-4 space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-slate-500 truncate max-w-[150px]">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
