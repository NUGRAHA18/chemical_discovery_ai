const STORAGE_KEY = "custom_discovery_templates";

export const customTemplateService = {
  // Get all custom templates
  getAll: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading custom templates:", error);
      return [];
    }
  },

  // Save a new template
  save: (template) => {
    try {
      const templates = customTemplateService.getAll();
      templates.push(template);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
      return true;
    } catch (error) {
      console.error("Error saving template:", error);
      return false;
    }
  },

  // Delete a template by ID
  delete: (id) => {
    try {
      const templates = customTemplateService.getAll();
      const filtered = templates.filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error("Error deleting template:", error);
      return false;
    }
  },

  // Get template by ID
  getById: (id) => {
    const templates = customTemplateService.getAll();
    return templates.find((t) => t.id === id);
  },

  // Update a template
  update: (id, updatedData) => {
    try {
      const templates = customTemplateService.getAll();
      const index = templates.findIndex((t) => t.id === id);
      if (index !== -1) {
        templates[index] = { ...templates[index], ...updatedData };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating template:", error);
      return false;
    }
  },

  // Clear all custom templates
  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing templates:", error);
      return false;
    }
  },
};
