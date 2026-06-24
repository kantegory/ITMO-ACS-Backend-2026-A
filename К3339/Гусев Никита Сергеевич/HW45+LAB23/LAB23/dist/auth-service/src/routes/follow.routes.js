"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const follow_controller_1 = require("../controllers/follow.controller");
const router = (0, express_1.Router)();
router.post("/users/:id/follow", follow_controller_1.FollowController.create);
router.delete("/users/:id/follow", follow_controller_1.FollowController.delete);
exports.default = router;
