"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const data_source_1 = require("./data-source");
const recipe_routes_1 = __importDefault(require("./routes/recipe.routes"));
const like_routes_1 = __importDefault(require("./routes/like.routes"));
const saved_routes_1 = __importDefault(require("./routes/saved.routes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/recipes", recipe_routes_1.default);
app.use("/recipes", like_routes_1.default);
app.use("/recipes", saved_routes_1.default);
app.get("/", (req, res) => {
    res.send("Recipe Service works");
});
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log("Recipe DB connected");
    app.listen(8082, () => {
        console.log("Recipe Service started on port 8082");
    });
})
    .catch((error) => console.log(error));
