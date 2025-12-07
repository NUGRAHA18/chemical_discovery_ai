import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import ToastNotification from "./components/common/ToastNotification";
import { ComparisonProvider } from "./contexts/ComparisonContext";
import Loading from "./components/common/Loading";
import ChatAssistant from "./pages/ChatAssistant";

// ✅ LAZY LOAD PAGES
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Discovery = lazy(() => import("./pages/Discovery"));
const History = lazy(() => import("./pages/History"));
const Favorites = lazy(() => import("./pages/Favorites"));
const PropertyCalculator = lazy(() => import("./pages/PropertyCalculator"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <DarkModeProvider>
      <ComparisonProvider>
        <AuthProvider>
          <Router>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <ToastNotification />
              <main className="flex-grow">
                {/* ✅ ADD SUSPENSE WRAPPER */}
                <Suspense
                  fallback={
                    <div className="flex justify-center items-center min-h-screen">
                      <Loading size="lg" />
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/chat" element={<ChatAssistant />} />

                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/discover"
                      element={
                        <ProtectedRoute>
                          <Discovery />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/history"
                      element={
                        <ProtectedRoute>
                          <History />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/favorites"
                      element={
                        <ProtectedRoute>
                          <Favorites />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/property-calculator"
                      element={
                        <ProtectedRoute>
                          <PropertyCalculator />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
          </Router>
        </AuthProvider>
      </ComparisonProvider>
    </DarkModeProvider>
  );
}

export default App;
