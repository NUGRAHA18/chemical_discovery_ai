import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import { FlaskConical, Atom, Sparkles, CheckCircle2 } from "lucide-react";

const Login = () => {
  const location = useLocation();
  const [message] = useState(location.state?.message || "");

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-primary-500/30">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] opacity-40 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
      <Atom className="absolute top-[15%] left-[10%] w-12 h-12 text-white/5 animate-[bounce_8s_infinite]" />
      <Sparkles className="absolute bottom-[20%] right-[10%] w-8 h-8 text-white/10 animate-pulse duration-[4000ms]" />
      <div className="max-w-[440px] w-full relative z-10">
        <div className="text-center mb-8 space-y-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:scale-105 transition-transform duration-300">
              <FlaskConical className="w-7 h-7 text-white" />
            </div>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              ChemDiscovery
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              AI-Powered Molecular Research Platform
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/10 dark:border-slate-700/50 overflow-hidden">
          {/* Card Header */}
          <div className="px-8 pt-8 pb-2 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Please enter your details to sign in.
            </p>
          </div>

          {message && (
            <div className="mx-8 mt-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <div className="p-8">
            <LoginForm />
          </div>
        </div>

        <p className="text-center text-slate-500 dark:text-slate-600 text-xs mt-8">
          &copy; {new Date().getFullYear()} ChemDiscovery AI. Secure Access.
        </p>
      </div>
    </div>
  );
};

export default Login;
