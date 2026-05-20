import { Router } from "express";
import { BlogController } from "../controllers/BlogController";
import { authenticate, authorize } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { UserRole } from "../entities/User";

const router = Router();

router.get("/categories", asyncHandler(BlogController.listCategories));
router.post(
  "/categories",
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(BlogController.createCategory),
);

router.get("/", asyncHandler(BlogController.list));
router.get("/:id", asyncHandler(BlogController.getOne));
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.TRAINER),
  asyncHandler(BlogController.create),
);
router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.TRAINER),
  asyncHandler(BlogController.update),
);
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.TRAINER),
  asyncHandler(BlogController.remove),
);

router.get("/:id/comments", asyncHandler(BlogController.listComments));
router.post(
  "/:id/comments",
  authenticate,
  asyncHandler(BlogController.addComment),
);
router.delete(
  "/comments/:commentId",
  authenticate,
  asyncHandler(BlogController.deleteComment),
);

export default router;
