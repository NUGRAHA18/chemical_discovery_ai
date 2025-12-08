import api from "./api";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3000/api";

export const batchService = {
  /**
   * Upload batch file
   */
  uploadBatch: async (file, name = "", description = "") => {
    const formData = new FormData();
    formData.append("file", file);
    if (name) formData.append("name", name);
    if (description) formData.append("description", description);

    const response = await api.post("/batch/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Get all batches
   */
  getBatches: async (page = 1, limit = 10) => {
    const response = await api.get("/batch", {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get batch by ID
   */
  getBatch: async (id) => {
    const response = await api.get(`/batch/${id}`);
    return response.data;
  },

  /**
   * Stream batch progress (SSE)
   */
  streamProgress: (batchId, onProgress, onComplete, onError) => {
    const token = localStorage.getItem("token");

    if (!token) {
      if (onError) onError("No authentication token found");
      return null;
    }

    // Note: EventSource cannot set custom headers, so we pass token in URL
    // Backend needs to accept token via query parameter for SSE endpoints
    const eventSource = new EventSource(
      `${API_BASE_URL}/batch/${batchId}/progress?token=${encodeURIComponent(
        token
      )}`
    );

    eventSource.onmessage = (event) => {
      const data = event.data;

      if (data === "[DONE]") {
        eventSource.close();
        if (onComplete) onComplete();
      } else if (data.startsWith("[ERROR]")) {
        eventSource.close();
        if (onError) onError(data.replace("[ERROR]", "").trim());
      } else {
        try {
          const progress = JSON.parse(data);
          if (onProgress) onProgress(progress);
        } catch (e) {
          console.error("Failed to parse progress data:", e);
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      eventSource.close();
      if (onError) onError("Connection error. Please try again.");
    };

    return eventSource;
  },

  /**
   * Cancel batch
   */
  cancelBatch: async (id) => {
    const response = await api.post(`/batch/${id}/cancel`);
    return response.data;
  },

  /**
   * Delete batch
   */
  deleteBatch: async (id) => {
    const response = await api.delete(`/batch/${id}`);
    return response.data;
  },

  /**
   * Download template CSV files
   */
  downloadTemplate: (type = "ai-prompt") => {
    let content, filename;

    if (type === "structured") {
      content = `category,boiling_point_min,boiling_point_max,viscosity_min,viscosity_max,solubility,thermal_stability_min,additional_properties,notes
surfactant,80,120,10,50,water-soluble,70,biodegradable|non-toxic,Industrial cleaning application
polymer,100,150,,,water-soluble,80,biodegradable|food-safe,Food packaging material
solvent,50,100,5,20,organic-soluble,60,low-toxicity,Laboratory use`;
      filename = "batch-template-structured.csv";
    } else {
      content = `criteria
surfactant with HLB 8-12, thermal stability 80°C, biodegradable
biodegradable polymer for food packaging with barrier properties
low-toxicity solvent for pharmaceutical synthesis`;
      filename = "batch-template-ai-prompt.csv";
    }

    const blob = new Blob([content], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
