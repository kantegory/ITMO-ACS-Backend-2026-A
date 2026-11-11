import { Router } from 'express';
import validate from 'express-zod-safe'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { 
    UserUpdateSchema,
    UserRoleUpdateSchema,
 } from '../schemas/user.schemas.js';
import { UserController } from '../controllers/user.controller.js';
import { setGlobalOptions } from 'express-zod-safe';

setGlobalOptions({
    missingSchemaBehavior: 'any'
});

const userRouter = Router();

userRouter.get('/users',
    authMiddleware,
    UserController.getUsers,
);

userRouter.get('/users/me',
    authMiddleware,
    UserController.getCurrentUser,
);

userRouter.patch('/users/me',
    authMiddleware,
    validate({
        body: UserUpdateSchema
    }),
    UserController.updateCurrentUser,
);

userRouter.delete('/users/me',
    authMiddleware,
    UserController.deleteCurrentUsers,
);

userRouter.get('/users/:userId',
    authMiddleware,
    UserController.getUser,
);

userRouter.delete('/users/:userId',
    authMiddleware,
    UserController.deleteUser,
);

userRouter.patch('/users/:userId/role',
    authMiddleware,
    validate({
        body: UserRoleUpdateSchema
    }),
    UserController.updateUserRole,
);

export default userRouter;
