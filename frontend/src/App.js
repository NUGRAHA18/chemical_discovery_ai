import { lazy, Suspense } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import ToastNotification from "./components/common/ToastNotification";
import { ComparisonProvider } from "./contexts/ComparisonContext";
import Loading from "./components/common/Loading";
import ChatAssistant from "./pages/ChatAssistant";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Profile from "./pages/Profile";
import PropertyCalculatorPage from "./pages/PropertyCalculatorPage";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Discovery = lazy(() => import("./pages/Discovery"));
const History = lazy(() => import("./pages/History"));
const Favorites = lazy(() => import("./pages/Favorites"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <ComparisonProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <ToastNotification />
              <main className="flex-grow">
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

                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
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
                      path="/chat"
                      element={
                        <ProtectedRoute>
                          <ChatAssistant />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/property-calculator"
                      element={
                        <ProtectedRoute>
                          <PropertyCalculatorPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </ComparisonProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}

export default App;
