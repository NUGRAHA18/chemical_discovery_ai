const express = require("express");
const router = express.Router();
const multer = require("multer");
const batchController = require("../controllers/batchController");
const { protect } = require("../middleware/auth");

// Multer configuration for file upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only CSV and Excel files are allowed."));
    }
  },
});

// Routes
router.post(
  "/upload",
  protect,
  upload.single("file"),
  batchController.uploadBatch
);
router.get("/", protect, batchController.getBatches);
router.get("/:id", protect, batchController.getBatchDetails); // ✅ FIXED
router.get("/:id/progress", protect, batchController.streamBatchProgress); // ✅ FIXED
router.get("/:id/export", protect, batchController.exportBatchResults); // ✅ ADDED
router.post("/:id/cancel", protect, batchController.cancelBatch);
router.delete("/:id", protect, batchController.deleteBatch);

module.exports = router;
