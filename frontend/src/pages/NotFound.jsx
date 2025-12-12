import { Link } from "react-router-dom";
import { Home, Search, FlaskConical, FileQuestion, Atom } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4 relative overflow-hidden font-sans">
      <Atom className="absolute -top-20 -right-20 w-96 h-96 text-gray-200 dark:text-gray-800/50 opacity-50 animate-[spin_60s_linear_infinite] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="text-center relative z-10 max-w-lg">
        <div className="mx-auto w-32 h-32 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-8 shadow-lg border border-gray-100 dark:border-gray-700 relative">
          <FlaskConical className="w-16 h-16 text-gray-300 dark:text-gray-600" />

          <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
              <FileQuestion className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
          </div>
        </div>

        <h1 className="text-8xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">
          Compound Not Found
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
          The molecular structure you are looking for seems to be unstable,
          deleted, or never existed in our database.
        </p>

        {/* --- ACTION BUTTONS --- */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm hover:shadow-md"
          >
            <Home className="w-5 h-5 mr-2" />
            Return to Lab
          </Link>

          <Link
            to="/discover"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md"
          >
            <Search className="w-5 h-5 mr-2" />
            Start New Experiment
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
