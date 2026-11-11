import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { SubscriptionController } from '../controllers/subscription.controller.js';

const subscriptionRouter = Router();

subscriptionRouter.get('/users/me/subscriptions',
    authMiddleware,
    SubscriptionController.getCurrentUserSubscriptions
);

subscriptionRouter.get('/users/me/subscribers',
    authMiddleware,
    SubscriptionController.getCurrentUserSubscribers
);

subscriptionRouter.get('/users/me/feed',
    authMiddleware,
    SubscriptionController.getFeed
);

subscriptionRouter.get('/users/:userId/subscribe',
    authMiddleware,
    SubscriptionController.isSubscribed
);

subscriptionRouter.post('/users/:userId/subscribe',
    authMiddleware,
    SubscriptionController.subscribe
);

subscriptionRouter.delete('/users/:userId/subscribe',
    authMiddleware,
    SubscriptionController.unsubscribe
);

subscriptionRouter.get('/users/:userId/subscriptions',
    authMiddleware,
    SubscriptionController.getUserSubscriptions
);

subscriptionRouter.get('/users/:userId/subscribers',
    authMiddleware,
    SubscriptionController.getUserSubscribers
);

export default subscriptionRouter;
