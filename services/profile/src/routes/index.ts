import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

const me = Router();
me.use(authMiddleware);
me.use(requireRole("candidate"));

me.put("/profile", ProfileController.upsertProfile);
me.get("/resumes", ProfileController.listResumes);
me.post("/resumes", ProfileController.createResume);
me.get("/resumes/:id", ProfileController.getResume);
me.put("/resumes/:id", ProfileController.updateResume);
me.delete("/resumes/:id", ProfileController.deleteResume);
me.put("/resumes/:id/summary", ProfileController.upsertSummary);
me.delete("/resumes/:id/summary", ProfileController.deleteSummary);
me.get("/resumes/:id/skills", ProfileController.listSkills);
me.put("/resumes/:id/skills", ProfileController.setSkills);

router.use("/me", me);

export default router;
