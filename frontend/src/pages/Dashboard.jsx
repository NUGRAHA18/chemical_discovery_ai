import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Researcher'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Your chemical discovery dashboard
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Discoveries</h3>
            <p className="text-4xl font-bold text-primary-600">0</p>
            <p className="text-sm text-gray-500 mt-2">Compounds generated</p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Favorites</h3>
            <p className="text-4xl font-bold text-secondary-600">0</p>
            <p className="text-sm text-gray-500 mt-2">Saved compounds</p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Confidence</h3>
            <p className="text-4xl font-bold text-accent-600">0%</p>
            <p className="text-sm text-gray-500 mt-2">Validation score</p>
          </div>

        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a 
              href="/discover" 
              className="p-4 border-2 border-primary-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-all"
            >
              <h3 className="font-semibold text-primary-700 mb-1">🔬 Start Discovery</h3>
              <p className="text-sm text-gray-600">Generate new chemical compounds</p>
            </a>
            <a 
              href="/history" 
              className="p-4 border-2 border-secondary-200 rounded-lg hover:border-secondary-400 hover:bg-secondary-50 transition-all"
            >
              <h3 className="font-semibold text-secondary-700 mb-1">📚 View History</h3>
              <p className="text-sm text-gray-600">Browse past discoveries</p>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;