import { useLocation } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

const Login = () => {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 max-w-md mx-auto">
            {message}
          </div>
        )}

        <LoginForm />
        
      </div>
    </div>
  );
};

export default Login;