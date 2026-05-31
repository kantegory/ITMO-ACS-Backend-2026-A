"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const data_source_1 = require("./data-source");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const follow_routes_1 = __importDefault(require("./routes/follow.routes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/auth", auth_routes_1.default);
app.use("/", follow_routes_1.default);
app.get("/", (req, res) => {
    res.send("Auth Service works");
});
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log("Auth DB connected");
    app.listen(8081, () => {
        console.log("Auth Service started on port 8081");
    });
})
    .catch((error) => console.log(error));
