// import { Router } from "express"
// import { authMiddleware } from "../middlewares/auth.middleware"
// import * as authCtrl from "../controllers/auth.controller"
// import * as userCtrl from "../controllers/user.controller"
// import * as restCtrl from "../controllers/restaurant.controller" 
// import * as cuisineCtrl from "../controllers/cuisine.controller"
// import * as dishCtrl from "../controllers/dish.controller"
// import * as tableCtrl from "../controllers/table.controller"
// import * as resCtrl from "../controllers/reservation.controller"
// import * as reviewCtrl from "../controllers/review.controller"
// import * as photoCtrl from "../controllers/photo.controller"

// const router = Router()

// // auth
// router.post("/auth/register", authCtrl.register)
// router.post("/auth/login", authCtrl.login)
// router.post("/auth/refresh", authCtrl.refresh)

// // users
// router.get("/users/me", authMiddleware, userCtrl.getProfile)
// router.patch("/users/me", authMiddleware, userCtrl.updateProfile)

// // restaurants
// router.get("/restaurants", restCtrl.list)
// router.get("/restaurants/:restaurant_id", restCtrl.details)

// // cuisines
// router.get("/cuisines", cuisineCtrl.list)

// // dishes
// router.get("/restaurants/:restaurant_id/dishes", dishCtrl.list)
// router.post("/restaurants/:restaurant_id/dishes", authMiddleware, dishCtrl.create)
// router.patch("/dishes/:dish_id", authMiddleware, dishCtrl.update)
// router.delete("/dishes/:dish_id", authMiddleware, dishCtrl.remove)

// // tables
// router.get("/restaurants/:restaurant_id/tables", tableCtrl.list)
// router.get("/restaurants/:restaurant_id/tables/available", tableCtrl.available)

// // reservations
// router.get("/reservations", authMiddleware, resCtrl.list)
// router.post("/reservations", authMiddleware, resCtrl.create)
// router.get("/reservations/:reservation_id", authMiddleware, resCtrl.details)
// router.patch("/reservations/:reservation_id/cancel", authMiddleware, resCtrl.cancel)

// // reviews
// router.get("/restaurants/:restaurant_id/reviews", reviewCtrl.list)
// router.post("/restaurants/:restaurant_id/reviews", authMiddleware, reviewCtrl.create)
// router.patch("/reviews/:review_id", authMiddleware, reviewCtrl.update)
// router.delete("/reviews/:review_id", authMiddleware, reviewCtrl.remove)

// // photos
// router.get("/restaurants/:restaurant_id/photos", photoCtrl.list)
// router.post("/restaurants/:restaurant_id/photos", authMiddleware, photoCtrl.create)
// router.delete("/photos/:photo_id", authMiddleware, photoCtrl.remove)

// export default router