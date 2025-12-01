import RegisterForm from '../components/auth/RegisterForm';

const Register = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;