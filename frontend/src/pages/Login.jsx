import { useLocation } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import { FlaskConical, Atom, Sparkles, CheckCircle2 } from "lucide-react";

const Login = () => {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <div className="min-h-screen bg-slate-900 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* --- DECORATIVE BACKGROUND ELEMENTS --- */}
      {/* Circle Top Left */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      {/* Circle Bottom Right */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      {/* Floating Icons (Abstract Molecules) */}
      <Atom className="absolute top-1/4 left-10 w-12 h-12 text-white/5 animate-pulse duration-[3000ms]" />
      <Sparkles className="absolute bottom-1/4 right-10 w-8 h-8 text-white/10 animate-pulse duration-[5000ms]" />

      <div className="max-w-md w-full relative z-10">
        {/* --- BRANDING HEADER --- */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white mb-4 shadow-lg shadow-primary-500/30 ring-4 ring-white/10">
            <FlaskConical className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Chemical AI
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Accelerating molecular discovery with Artificial Intelligence
          </p>
        </div>

        {/* --- LOGIN CARD --- */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Header Card */}
          <div className="px-8 pt-8 pb-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Welcome back
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Please sign in to your research dashboard.
            </p>
          </div>

          {/* Alert Message (Jika ada redirect dari Register) */}
          {message && (
            <div className="mx-8 mt-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-lg flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {/* Form Component Container */}
          <div className="p-8">
            <LoginForm />
          </div>
        </div>

        {/* --- FOOTER --- */}
        <p className="text-center text-slate-500 text-xs mt-8">
          &copy; {new Date().getFullYear()} Chemical Discovery AI. Enterprise
          Edition.
        </p>
      </div>
    </div>
  );
};

export default Login;
