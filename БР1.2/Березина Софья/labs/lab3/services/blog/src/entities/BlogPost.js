const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "BlogPost",
  tableName: "blog_posts",
  columns: {
    id: { type: String, primary: true },
    title: { type: String },
    content: { type: String },
    category: { type: String },
    featuredImage: { name: "featured_image", type: String, nullable: true },
    authorId: { name: "author_id", type: String },
    createdAt: { name: "created_at", type: "timestamptz", createDate: true },
  },
});
