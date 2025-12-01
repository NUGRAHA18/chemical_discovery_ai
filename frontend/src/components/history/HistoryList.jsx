import { useState } from 'react';

const HistoryList = ({ discoveries, onViewDetail, onDelete, loading }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDeleteClick = (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = (id) => {
    onDelete(id);
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="card">
        <p className="text-center text-gray-500">Loading discoveries...</p>
      </div>
    );
  }

  if (!discoveries || discoveries.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-gray-500 mb-4">No discoveries yet</p>
        <a href="/discover" className="btn-primary inline-block">
          Start Discovering
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {discoveries.map((discovery) => (
        <div key={discovery._id} className="card hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  discovery.inputMode === 'structured'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-secondary-100 text-secondary-700'
                }`}>
                  {discovery.inputMode === 'structured' ? '📋 Structured' : '💬 AI Prompt'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(discovery.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">
                {discovery.criteria.substring(0, 80)}
                {discovery.criteria.length > 80 ? '...' : ''}
              </h3>

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>🧪 {discovery.compounds?.length || 0} compounds</span>
                {discovery.metadata?.overall_confidence && (
                  <span>
                    ✓ {(discovery.metadata.overall_confidence * 100).toFixed(0)}% confidence
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => onViewDetail(discovery)}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                View Details
              </button>
              {deleteConfirm === discovery._id ? (
                <div className="flex space-x-1">
                  <button
                    onClick={() => confirmDelete(discovery._id)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="text-gray-600 hover:text-gray-700 font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleDeleteClick(discovery._id)}
                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;