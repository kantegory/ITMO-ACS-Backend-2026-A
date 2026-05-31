"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const like_controller_1 = require("../controllers/like.controller");
const router = (0, express_1.Router)();
router.post("/:id/like", like_controller_1.LikeController.create);
router.delete("/:id/like", like_controller_1.LikeController.delete);
exports.default = router;
