import RegisterForm from "../components/auth/RegisterForm";
// Import icon untuk dekorasi dan branding
import { FlaskConical, Atom, Sparkles } from "lucide-react";

const Register = () => {
  return (
    <div className="min-h-screen bg-slate-900 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* --- DECORATIVE BACKGROUND ELEMENTS (Sama dengan Login) --- */}
      {/* Circle Top Left */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      {/* Circle Bottom Right */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      {/* Floating Abstract Icons */}
      <Atom className="absolute top-1/4 left-10 w-12 h-12 text-white/5 animate-pulse duration-[3000ms]" />
      <Sparkles className="absolute bottom-1/3 right-12 w-10 h-10 text-white/10 animate-pulse duration-[4000ms]" />

      <div className="max-w-md w-full relative z-10">
        {/* --- BRANDING HEADER (Konsisten dengan Login) --- */}
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

        {/* --- REGISTER CARD --- */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Header Card Text */}
          <div className="px-8 pt-8 pb-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create your account
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Join the platform to start generating and analyzing compounds.
            </p>
          </div>

          {/* Form Component Container */}
          <div className="p-8">
            <RegisterForm />
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

export default Register;
