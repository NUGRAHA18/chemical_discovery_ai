const express = require("express");
const router = express.Router();
const discoveryController = require("../controllers/discoveryController");
const { protect } = require("../middleware/auth");
const { discoveryValidation } = require("../middleware/validators");

router.post(
  "/",
  protect,
  discoveryValidation,
  discoveryController.createDiscovery
);
router.get("/:id", protect, discoveryController.getDiscovery);
router.delete("/:id", protect, discoveryController.deleteDiscovery);

module.exports = router;
