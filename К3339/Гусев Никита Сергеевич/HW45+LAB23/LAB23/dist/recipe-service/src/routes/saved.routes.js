"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const saved_controller_1 = require("../controllers/saved.controller");
const router = (0, express_1.Router)();
router.post("/:id/save", saved_controller_1.SavedController.create);
router.delete("/:id/save", saved_controller_1.SavedController.delete);
exports.default = router;
