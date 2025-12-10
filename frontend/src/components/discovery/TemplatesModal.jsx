import { useState, useEffect } from "react";
import {
  discoveryTemplates,
  getCategories,
} from "../../data/templates/discoveryTemplates";
import TemplateCard from "./TemplateCard";
import AddTemplateModal from "./AddTemplateModal";
import { customTemplateService } from "../../services/customTemplates";
import { Plus, Filter, Sparkles, ClipboardList, X } from "lucide-react";
import ConfirmDialog from "../common/ConfirmDialog";

const TemplatesModal = ({ isOpen, onClose, onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedInputMode, setSelectedInputMode] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    templateId: null,
    templateName: "",
  });

  const categories = ["All", ...getCategories()];
  const inputModes = ["All", "Structured Form", "AI Prompt"];

  useEffect(() => {
    if (isOpen) {
      loadCustomTemplates();
    }
  }, [isOpen]);

  const loadCustomTemplates = () => {
    const custom = customTemplateService.getAll();
    setCustomTemplates(custom);
  };

  if (!isOpen) return null;

  // Combine default + custom templates
  const allTemplates = [...discoveryTemplates, ...customTemplates];

  // Filter by category
  let filteredTemplates =
    selectedCategory === "All"
      ? allTemplates
      : allTemplates.filter((t) => t.category === selectedCategory);

  // Filter by inputMode
  if (selectedInputMode !== "All") {
    const modeFilter =
      selectedInputMode === "Structured Form" ? "structured" : "ai-prompt";
    filteredTemplates = filteredTemplates.filter(
      (t) => t.inputMode === modeFilter
    );
  }

  const handleSelectTemplate = (template) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleAddTemplate = (templateData) => {
    customTemplateService.save(templateData);
    loadCustomTemplates();
    setShowAddModal(false);
  };

  const handleDeleteTemplate = (template) => {
    setDeleteConfirm({
      isOpen: true,
      templateId: template.id,
      templateName: template.name,
    });
  };
  const confirmDelete = () => {
    customTemplateService.delete(deleteConfirm.templateId);
    loadCustomTemplates();
    setDeleteConfirm({ isOpen: false, templateId: null, templateName: "" });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8 shadow-2xl">
          {/* Header */}

          {/* Header */}
          <div className="relative bg-primary-600 dark:bg-primary-700 px-8 py-6 border-b-2 border-primary-700 dark:border-primary-900">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary-700 dark:bg-primary-800 rounded-lg shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    Discovery Templates
                  </h2>
                </div>
                <p className="text-primary-50 dark:text-primary-100 text-sm font-medium ml-14">
                  Quick start with pre-configured criteria or create your own
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-primary-700 dark:hover:bg-primary-800 rounded-lg transition-colors group flex-shrink-0 ml-4"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>
          {/* Filters Bar */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Input Mode Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Input Type
                </label>
                <div className="flex gap-2">
                  {inputModes.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedInputMode(mode)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedInputMode === mode
                          ? "bg-purple-600 text-white shadow-md"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {mode === "Structured Form" ? (
                        <ClipboardList className="w-4 h-4" />
                      ) : mode === "AI Prompt" ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <Filter className="w-4 h-4" />
                      )}
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Templates Grid */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Add Custom Template Card */}
              <div
                onClick={() => setShowAddModal(true)}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all flex flex-col items-center justify-center min-h-[200px] group"
              >
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Add Custom Template
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Create your own template with custom parameters
                </p>
              </div>

              {/* Template Cards */}
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelectTemplate}
                  onDelete={
                    template.custom
                      ? () => handleDeleteTemplate(template.id)
                      : null
                  }
                />
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <Filter className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No templates found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your filters or create a custom template
                </p>
              </div>
            )}
          </div>
          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center flex-shrink-0">
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {filteredTemplates.length} template
                {filteredTemplates.length !== 1 ? "s" : ""} available
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {customTemplates.length} custom • {discoveryTemplates.length}{" "}
                default
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Add Template Modal */}
      <AddTemplateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddTemplate}
      />
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({
            isOpen: false,
            templateId: null,
            templateName: "",
          })
        }
        onConfirm={confirmDelete}
        title="Delete Custom Template?"
        message={`Are you sure you want to delete "${deleteConfirm.templateName}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default TemplatesModal;
