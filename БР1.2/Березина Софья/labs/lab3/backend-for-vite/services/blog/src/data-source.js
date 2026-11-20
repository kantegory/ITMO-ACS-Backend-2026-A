require("reflect-metadata");

const { DataSource } = require("typeorm");
const BlogPost = require("./entities/BlogPost");

module.exports = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [BlogPost],
  synchronize: true,
});
