import "reflect-metadata";
import express from "express";
import cors from "cors";
import { useExpressServer } from "routing-controllers";
import SETTINGS from "./config/settings";
import dataSource from "./config/data-source";

import { AuthController } from "./controllers/auth.controller";
import { UserController } from "./controllers/user.controller";
import { InternalUserController } from "./controllers/internal.controller";
import { AdminController } from "./controllers/admin.controller";

class App {
    private expressApp: express.Express;

    constructor() {
        this.expressApp = express();
        this.configureApp();
    }

    private configureApp() {
        this.expressApp.use(cors());

        useExpressServer(this.expressApp, {
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: [AuthController, UserController, AdminController],
            validation: {
                whitelist: true,
                forbidNonWhitelisted: true,
            },
            classTransformer: true,
            defaultErrorHandler: true,
        });

        useExpressServer(this.expressApp, {
            routePrefix: "",
            controllers: [InternalUserController],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: true,
        });
    }

    public async start() {
        try {
            await dataSource.initialize();
            console.log("Identity Database connected!");

            this.expressApp.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
                console.log(
                    `Identity Service is running on http://${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`,
                );
            });
        } catch (err) {
            console.error("Database connection error:", err);
        }
    }
}

const appInstance = new App();
appInstance.start();
