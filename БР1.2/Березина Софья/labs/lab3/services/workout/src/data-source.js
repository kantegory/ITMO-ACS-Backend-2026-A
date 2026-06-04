require("reflect-metadata");

const { DataSource } = require("typeorm");
const Workout = require("./entities/Workout");
const Exercise = require("./entities/Exercise");

module.exports = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [Workout, Exercise],
  synchronize: true,
});
