require("reflect-metadata");

const { DataSource } = require("typeorm");
const User = require("./entities/User");

module.exports = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [User],
  synchronize: true,
});
