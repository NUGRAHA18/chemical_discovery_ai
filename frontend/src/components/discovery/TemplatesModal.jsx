import { useState } from "react";
import {
  discoveryTemplates,
  getCategories,
} from "../../data/templates/discoveryTemplates";
import TemplateCard from "./TemplateCard";

const TemplatesModal = ({ isOpen, onClose, onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", ...getCategories()];

  if (!isOpen) return null;

  const filteredTemplates =
    selectedCategory === "All"
      ? discoveryTemplates
      : discoveryTemplates.filter((t) => t.category === selectedCategory);

  const handleSelectTemplate = (template) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Discovery Templates
            </h2>
            <p className="text-primary-100 text-sm mt-1">
              Quick start with pre-configured criteria
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Category Filter */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleSelectTemplate}
              />
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No templates found for this category
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredTemplates.length} template
            {filteredTemplates.length !== 1 ? "s" : ""} available
          </p>
          <button onClick={onClose} className="btn-outline">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatesModal;
