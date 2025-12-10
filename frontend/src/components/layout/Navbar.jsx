import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import DarkModeToggle from "../common/DarkModeToggle";
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
  Upload,
  ChevronDown,
  Layers,
  Archive,
  User,
  Settings,
} from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // State untuk dropdown desktop
  const [toolsOpen, setToolsOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ✅ State untuk profile photo dengan real-time update
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto);

  const location = useLocation();

  // Reset semua menu saat navigasi berpindah
  useEffect(() => {
    setToolsOpen(false);
    setLibraryOpen(false);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location]);

  // ✅ Listen untuk profile photo updates
  useEffect(() => {
    const handleProfilePhotoUpdate = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setProfilePhoto(updatedUser.profilePhoto);
    };

    window.addEventListener("profilePhotoUpdated", handleProfilePhotoUpdate);

    return () => {
      window.removeEventListener(
        "profilePhotoUpdated",
        handleProfilePhotoUpdate
      );
    };
  }, []);

  // ✅ Update profilePhoto when user changes
  useEffect(() => {
    setProfilePhoto(user?.profilePhoto);
  }, [user]);

  const isActive = (path) => location.pathname === path;

  // Style untuk link menu utama (Top Level)
  const linkClass = (path) =>
    `flex items-center space-x-2 text-sm font-medium transition-all duration-200 px-3 py-2 rounded-md ${
      isActive(path)
        ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10"
        : "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
    }`;

  // Style untuk item di dalam Dropdown
  const dropdownItemClass = (path) =>
    `flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-gray-700 w-full text-left transition-colors ${
      isActive(path)
        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-semibold"
        : ""
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* --- LOGO SECTION --- */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <FlaskConical className="w-5 h-5 text-white" />
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

                {/* Dropdown: Tools */}
                <div className="relative group">
                  <button
                    onClick={() => setToolsOpen(!toolsOpen)}
                    onBlur={() => setTimeout(() => setToolsOpen(false), 200)}
                    className="flex items-center space-x-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 outline-none"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Tools</span>
                    <ChevronDown
                      className={`w-3 h-3 ml-1 transition-transform ${
                        toolsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu Content */}
                  <div
                    className={`absolute top-full left-0 mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-200 origin-top-left ${
                      toolsOpen
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="py-1">
                      <Link to="/chat" className={dropdownItemClass("/chat")}>
                        <MessageSquare className="w-4 h-4 mr-3 text-purple-500" />
                        AI Chat
                      </Link>
                      <Link
                        to="/property-calculator"
                        className={dropdownItemClass("/property-calculator")}
                      >
                        <Calculator className="w-4 h-4 mr-3 text-emerald-500" />
                        Calculator
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Dropdown: Library */}
                <div className="relative group">
                  <button
                    onClick={() => setLibraryOpen(!libraryOpen)}
                    onBlur={() => setTimeout(() => setLibraryOpen(false), 200)}
                    className="flex items-center space-x-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 outline-none"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Library</span>
                    <ChevronDown
                      className={`w-3 h-3 ml-1 transition-transform ${
                        libraryOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-200 origin-top-left ${
                      libraryOpen
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="py-1">
                      <Link
                        to="/history"
                        className={dropdownItemClass("/history")}
                      >
                        <History className="w-4 h-4 mr-3 text-orange-500" />
                        History
                      </Link>
                      <Link
                        to="/favorites"
                        className={dropdownItemClass("/favorites")}
                      >
                        <Star className="w-4 h-4 mr-3 text-yellow-500" />
                        Favorites
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* --- RIGHT SIDE ACTIONS --- */}
          <div className="hidden lg:flex items-center space-x-4">
            <DarkModeToggle />
            {isAuthenticated ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-gray-200 dark:border-slate-700">
                {/* ✅ FIXED: DROPDOWN USER PROFILE WITH PHOTO */}
                <div className="relative group">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
                    className="flex items-center space-x-3 text-left outline-none p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                  >
                    <div className="flex flex-col text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                        {user?.name || "Scientist"}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
                        {user?.company || "Researcher"}
                      </span>
                    </div>

                    {/* ✅ FIXED: Profile Photo Display */}
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt={user?.name}
                        className="w-9 h-9 rounded-full object-cover border-2 border-primary-200 dark:border-primary-700 hover:border-primary-400 transition-all"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}

                    {/* ✅ Gradient Fallback (always rendered, hidden if photo exists) */}
                    <div
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm hover:from-primary-500 hover:to-primary-700 transition-all"
                      style={{ display: profilePhoto ? "none" : "flex" }}
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <ChevronDown
                      className={`w-3 h-3 text-gray-400 transition-transform ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Content User */}
                  <div
                    className={`absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-200 origin-top-right z-50 ${
                      userMenuOpen
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {user?.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className={dropdownItemClass("/profile")}
                      >
                        <Settings className="w-4 h-4 mr-3 text-slate-500" />
                        My Profile
                      </Link>

                      <button
                        onClick={logout}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* --- MOBILE TOGGLE --- */}
          <div className="flex items-center space-x-4 lg:hidden">
            <DarkModeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
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
        <div className="lg:hidden border-t border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl absolute w-full left-0 shadow-xl max-h-[85vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            <Link
              to="/"
              className="mobile-link flex items-center py-3 px-2 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
            >
              <Home className="w-5 h-5 mr-3 opacity-70" /> Home
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className="mobile-link flex items-center py-3 px-2 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                >
                  <LayoutDashboard className="w-5 h-5 mr-3 opacity-70" />{" "}
                  Dashboard
                </Link>
                <Link
                  to="/discover"
                  className="mobile-link flex items-center py-3 px-2 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                >
                  <FlaskConical className="w-5 h-5 mr-3 opacity-70" /> Discover
                </Link>

                <div className="pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider pl-2">
                  Tools
                </div>
                <Link
                  to="/batch"
                  className="mobile-link flex items-center py-2.5 px-4 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg ml-2 border-l-2 border-transparent hover:border-blue-500"
                >
                  <Upload className="w-4 h-4 mr-3 text-blue-500" /> Batch
                  Discovery
                </Link>
                <Link
                  to="/chat"
                  className="mobile-link flex items-center py-2.5 px-4 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg ml-2 border-l-2 border-transparent hover:border-purple-500"
                >
                  <MessageSquare className="w-4 h-4 mr-3 text-purple-500" /> AI
                  Chat
                </Link>
                <Link
                  to="/property-calculator"
                  className="mobile-link flex items-center py-2.5 px-4 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg ml-2 border-l-2 border-transparent hover:border-emerald-500"
                >
                  <Calculator className="w-4 h-4 mr-3 text-emerald-500" />{" "}
                  Calculator
                </Link>

                <div className="pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider pl-2">
                  Library
                </div>
                <Link
                  to="/history"
                  className="mobile-link flex items-center py-2.5 px-4 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg ml-2 border-l-2 border-transparent hover:border-orange-500"
                >
                  <History className="w-4 h-4 mr-3 text-orange-500" /> History
                </Link>
                <Link
                  to="/favorites"
                  className="mobile-link flex items-center py-2.5 px-4 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg ml-2 border-l-2 border-transparent hover:border-yellow-500"
                >
                  <Star className="w-4 h-4 mr-3 text-yellow-500" /> Favorites
                </Link>

                {/* ✅ FIXED: MOBILE USER SECTION WITH PHOTO */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-4 pt-4">
                  <div className="flex items-center px-2 mb-4">
                    {/* ✅ Profile Photo in Mobile */}
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt={user?.name}
                        className="w-10 h-10 rounded-full object-cover mr-3 border-2 border-primary-200 dark:border-primary-700"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}

                    {/* ✅ Gradient Fallback Mobile */}
                    <div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mr-3 text-white font-bold"
                      style={{ display: profilePhoto ? "none" : "flex" }}
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {user?.name}
                      </p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="mobile-link w-full text-left flex items-center py-3 px-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors mb-1"
                  >
                    <Settings className="w-5 h-5 mr-3 opacity-70" /> Edit
                    Profile
                  </Link>

                  <button
                    onClick={logout}
                    className="mobile-link w-full text-left flex items-center py-3 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-3" /> Sign Out
                  </button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="pt-4 space-y-3 border-t border-gray-200 dark:border-slate-800 mt-2">
                <Link
                  to="/login"
                  className="block w-full px-4 py-3 text-center rounded-lg border border-gray-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block w-full px-4 py-3 text-center rounded-lg btn-primary font-medium text-white shadow-md"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
