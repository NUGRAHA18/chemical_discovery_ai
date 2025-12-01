import { useState } from 'react';

const AIPromptForm = ({ onSubmit, loading }) => {
  const [criteria, setCriteria] = useState('');
  const [error, setError] = useState('');

  const examples = [
    'Surfactant for oil recovery with HLB 8-12, thermal stability 80°C, biodegradable',
    'Biodegradable polymer for food packaging with good barrier properties',
    'Green solvent for natural compound extraction with high solubility, low toxicity',
    'Catalyst for hydrogenation reactions with high selectivity and stability'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!criteria.trim()) {
      setError('Please enter your criteria');
      return;
    }

    if (criteria.trim().length < 10) {
      setError('Please provide more detailed criteria (at least 10 characters)');
      return;
    }

    onSubmit(criteria.trim());
  };

  const handleExampleClick = (example) => {
    setCriteria(example);
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe your chemical requirements
        </label>
        <textarea
          value={criteria}
          onChange={(e) => {
            setCriteria(e.target.value);
            setError('');
          }}
          placeholder="Example: Surfactant for enhanced oil recovery with HLB 8-12, thermal stability above 80°C, and biodegradable properties..."
          rows="6"
          disabled={loading}
          className="input-field resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Be as specific as possible about properties, applications, and constraints
        </p>
      </div>

      {/* Examples */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Quick Examples:</p>
        <div className="space-y-2">
          {examples.map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={loading}
              className="w-full text-left text-sm p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Compounds'}
      </button>
    </form>
  );
};

export default AIPromptForm;