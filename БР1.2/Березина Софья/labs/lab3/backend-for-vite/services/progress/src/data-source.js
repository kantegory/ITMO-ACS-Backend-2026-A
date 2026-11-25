require("reflect-metadata");

const { DataSource } = require("typeorm");
const ProgressRecord = require("./entities/ProgressRecord");

module.exports = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [ProgressRecord],
  synchronize: true,
});
