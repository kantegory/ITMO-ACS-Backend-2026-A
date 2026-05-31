"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comment_controller_1 = require("../controllers/comment.controller");
const router = (0, express_1.Router)();
router.post("/:id", comment_controller_1.CommentController.create);
router.get("/:id", comment_controller_1.CommentController.getByRecipe);
exports.default = router;
