import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../common/Button";
import Loading from "../common/Loading";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // State untuk fitur Show/Hide Password
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setApiError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      await login(formData);
      navigate("/dashboard");
    } catch (error) {
      setApiError(
        error.response?.data?.error || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert dengan Icon */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
              <Mail className="h-5 w-5" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className={`block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.email
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-primary-200/50"
              }`}
              placeholder="researcher@example.com"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 ml-1">{errors.email}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center ml-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              className={`block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.password
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-primary-200/50"
              }`}
              placeholder="••••••••"
            />
            {/* Toggle Show/Hide Password */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 ml-1">{errors.password}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full py-3 rounded-xl font-semibold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all active:scale-[0.98]"
          disabled={loading}
        >
          {loading ? <Loading size="sm" /> : "Sign In"}
        </Button>
      </form>

      {/* Footer Register Link */}
      <div className="pt-2 text-center text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          Don't have an account?{" "}
        </span>
        <Link
          to="/register"
          className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          Create account
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
