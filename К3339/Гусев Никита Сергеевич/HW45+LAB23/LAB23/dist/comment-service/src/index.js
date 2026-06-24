"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const data_source_1 = require("./data-source");
const comment_routes_1 = __importDefault(require("./routes/comment.routes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/comments", comment_routes_1.default);
app.get("/", (req, res) => {
    res.send("Comment Service works");
});
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log("Comment DB connected");
    app.listen(8083, () => {
        console.log("Comment Service started on port 8083");
    });
})
    .catch((error) => console.log(error));
