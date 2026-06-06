"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vacancy_controller_1 = require("../controllers/vacancy.controller");
const serviceToken_1 = require("../middleware/serviceToken");
const router = (0, express_1.Router)();
router.use(serviceToken_1.serviceTokenMiddleware);
router.get("/companies/:id", vacancy_controller_1.InternalController.getCompany);
exports.default = router;
