"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const data_source_1 = require("./data-source");
const app_1 = require("./app");
const env_1 = require("./config/env");
async function main() {
    await data_source_1.AppDataSource.initialize();
    console.log("Vacancy database connected");
    await data_source_1.AppDataSource.runMigrations();
    console.log("Vacancy migrations applied");
    const app = (0, app_1.createApp)();
    app.listen(env_1.env.port, () => {
        console.log(`Vacancy service listening on http://localhost:${env_1.env.port}`);
    });
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
