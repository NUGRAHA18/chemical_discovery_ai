import { useState, useEffect } from "react";
import { Sparkles, Send, Quote, Eraser } from "lucide-react";

const AIPromptForm = ({ onSubmit, loading, initialValue, onChange }) => {
  const [prompt, setPrompt] = useState(initialValue || "");

  useEffect(() => {
    setPrompt(initialValue || "");
  }, [initialValue]);

  const handleChange = (e) => {
    const value = e.target.value;
    setPrompt(value);
    if (onChange) {
      onChange(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  const handleClear = () => {
    setPrompt("");
    if (onChange) onChange("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-500" />
          Describe Your Target Compound
        </label>

        <div className="relative group">
          <div className="absolute top-3 left-3 pointer-events-none">
            <Quote className="w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors opacity-50" />
          </div>
          <textarea
            value={prompt}
            onChange={handleChange}
            placeholder="Example: I need a biodegradable surfactant for oil recovery that is stable above 80°C and has low toxicity..."
            rows={6}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all shadow-sm text-sm leading-relaxed"
            required
          />

          {/* Character Count / Helper */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded backdrop-blur-sm">
            {prompt.length} chars
          </div>
        </div>

        <div className="mt-2 flex justify-between items-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Be specific about properties, application, and constraints.
          </p>
          {prompt && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <Eraser className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="btn-primary w-full flex justify-center items-center py-3.5 text-base font-bold tracking-wide shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Analyzing Request...</span>
          </div>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Generate with AI
          </>
        )}
      </button>
    </form>
  );
};

export default AIPromptForm;
