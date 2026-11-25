"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BlogController_1 = require("../controller/BlogController");
const router = (0, express_1.Router)();
router.get("/posts", BlogController_1.BlogController.getPosts);
router.get("/posts/:id", BlogController_1.BlogController.getPostById);
exports.default = router;
