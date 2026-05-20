import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { ProfileController } from "../controllers/profile.controller";
import { VacancyController } from "../controllers/vacancy.controller";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

const auth = Router();
auth.post("/register", AuthController.register);
auth.post("/login", AuthController.login);
auth.post("/refresh", AuthController.refresh);
auth.post("/logout", AuthController.logout);
router.use("/auth", auth);

router.get("/vacancies", VacancyController.listPublic);
router.get("/vacancies/:id", VacancyController.getPublic);

const protectedRoutes = Router();
protectedRoutes.use(authMiddleware);
protectedRoutes.get("/me", ProfileController.me);

const candidate = Router();
candidate.use(requireRole("candidate"));
candidate.put("/profile", ProfileController.upsertProfile);
candidate.get("/resumes", ProfileController.listResumes);
candidate.post("/resumes", ProfileController.createResume);
candidate.put("/resumes/:id", ProfileController.updateResume);
candidate.delete("/resumes/:id", ProfileController.deleteResume);
protectedRoutes.use("/me", candidate);

const employer = Router();
employer.use(requireRole("employer"));
employer.put("/company", VacancyController.upsertCompany);
employer.get("/vacancies", VacancyController.employerList);
employer.post("/vacancies", VacancyController.create);
employer.put("/vacancies/:id", VacancyController.update);
protectedRoutes.use("/employer", employer);

router.use(protectedRoutes);

export default router;
