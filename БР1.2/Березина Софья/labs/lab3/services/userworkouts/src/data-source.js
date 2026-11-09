require("reflect-metadata");

const { DataSource } = require("typeorm");
const UserWorkout = require("./entities/UserWorkout");

module.exports = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [UserWorkout],
  synchronize: true,
});
