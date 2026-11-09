require("reflect-metadata");

const { DataSource } = require("typeorm");
const AuthAccount = require("./entities/AuthAccount");

module.exports = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [AuthAccount],
  synchronize: true,
});
