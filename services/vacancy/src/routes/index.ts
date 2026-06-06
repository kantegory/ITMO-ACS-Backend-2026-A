import { Router } from "express";
import { VacancyController } from "../controllers/vacancy.controller";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

router.get("/vacancies", VacancyController.listPublic);
router.get("/vacancies/:id", VacancyController.getPublic);

const employer = Router();
employer.use(authMiddleware);
employer.use(requireRole("employer"));
employer.put("/company", VacancyController.upsertCompany);
employer.get("/vacancies", VacancyController.employerList);
employer.post("/vacancies", VacancyController.create);
employer.put("/vacancies/:id", VacancyController.update);

router.use("/employer", employer);

export default router;
