import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/auth";
import Button from "../common/Button";
import Loading from "../common/Loading";
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

// --- PERBAIKAN: InputField dipindah ke LUAR RegisterForm ---
const InputField = ({
  label,
  name,
  type,
  value,
  placeholder,
  icon: Icon,
  onChange, // Terima onChange dari props
  disabled, // Terima disabled dari props
  error, // Terima error spesifik dari props (bukan object errors utuh)
  isPassword = false,
  showPassState,
  setShowPassState,
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <input
        type={isPassword ? (showPassState ? "text" : "password") : type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`block w-full pl-10 ${
          isPassword ? "pr-10" : "pr-3"
        } py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
            : "border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-primary-200/50"
        }`}
        placeholder={placeholder}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassState(!showPassState)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
        >
          {showPassState ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
    {error && (
      <p className="text-xs text-red-500 ml-1 animate-pulse">{error}</p>
    )}
  </div>
);

const RegisterForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must include uppercase, lowercase, and number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      navigate("/login", {
        state: { message: "Registration successful! Please login." },
      });
    } catch (error) {
      setApiError(
        error.response?.data?.error || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Full Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
          error={errors.name} // Pass specific error
          placeholder="John Doe"
          icon={User}
        />

        <InputField
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          error={errors.email} // Pass specific error
          placeholder="researcher@example.com"
          icon={Mail}
        />

        <InputField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          error={errors.password} // Pass specific error
          placeholder="Min 8 chars, uppercase & number"
          icon={Lock}
          isPassword={true}
          showPassState={showPassword}
          setShowPassState={setShowPassword}
        />

        <InputField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={loading}
          error={errors.confirmPassword} // Pass specific error
          placeholder="Re-enter your password"
          icon={Lock}
          isPassword={true}
          showPassState={showConfirmPassword}
          setShowPassState={setShowConfirmPassword}
        />

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? <Loading size="sm" /> : "Create Account"}
          </Button>
        </div>
      </form>

      {/* Footer Link */}
      <div className="pt-2 text-center text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
        </span>
        <Link
          to="/login"
          className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          Login here
        </Link>
      </div>
    </div>
  );
};

export default RegisterForm;
