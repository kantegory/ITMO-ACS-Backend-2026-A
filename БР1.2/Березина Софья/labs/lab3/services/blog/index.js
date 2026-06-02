const express = require("express");
const bodyParser = require("body-parser");
const amqp = require("amqplib");
const fetch = require("node-fetch");
const { Pool } = require("pg");
const { randomUUID } = require("crypto");

const app = express();
app.use(bodyParser.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const rabbitUrl = process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672";
const usersServiceUrl = process.env.USERS_SERVICE_URL || "http://user:3000";
let channel = null;

async function waitForDb(retries = 20) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query("select 1");
      return;
    } catch (err) {
      console.log(`Blog DB is not ready (${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("Blog DB is unavailable");
}

async function initDb() {
  await pool.query(`
    create table if not exists blog_posts (
      id uuid primary key,
      title text not null,
      content text not null,
      category text not null,
      featured_image text,
      author_id uuid not null,
      created_at timestamptz not null default now()
    );
  `);
}

async function connectRabbit(retries = 20) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const connection = await amqp.connect(rabbitUrl);
      channel = await connection.createChannel();
      await channel.assertExchange("fitness.events", "topic", { durable: true });
      return;
    } catch (err) {
      console.log(`RabbitMQ is not ready for blog (${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("RabbitMQ is unavailable");
}

function toPost(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    featuredImage: row.featured_image,
    authorId: row.author_id,
    createdAt: row.created_at,
  };
}

app.get("/health", async (_req, res) => {
  await pool.query("select 1");
  res.json({ status: "ok", service: "blog", rabbitmq: Boolean(channel) });
});

app.post("/blog/posts", async (req, res) => {
  const { authorId, title, content, category, featuredImage = null } = req.body;
  if (!authorId || !title || !content || !category) {
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: "authorId, title, content and category are required" });
  }

  const authorResponse = await fetch(`${usersServiceUrl}/users/${authorId}`);
  if (authorResponse.status === 404) {
    return res.status(404).json({ code: "AUTHOR_NOT_FOUND", message: "Author not found" });
  }
  if (!authorResponse.ok) {
    return res.status(502).json({ code: "USERS_SERVICE_ERROR", message: "Users service is unavailable" });
  }

  const id = randomUUID();
  const result = await pool.query(
    `insert into blog_posts (id, title, content, category, featured_image, author_id)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [id, title, content, category, featuredImage, authorId],
  );
  const post = toPost(result.rows[0]);

  channel.publish(
    "fitness.events",
    "blog.post.published",
    Buffer.from(JSON.stringify({ eventId: randomUUID(), occurredAt: new Date().toISOString(), postId: post.id, authorId })),
    { persistent: true },
  );

  res.status(201).json(post);
});

app.get("/blog/posts", async (_req, res) => {
  const result = await pool.query("select * from blog_posts order by created_at desc");
  res.json(result.rows.map(toPost));
});

app.get("/blog/posts/:id", async (req, res) => {
  const result = await pool.query("select * from blog_posts where id = $1", [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ code: "POST_NOT_FOUND", message: "Post not found" });
  }
  res.json(toPost(result.rows[0]));
});

Promise.all([waitForDb(), connectRabbit()])
  .then(initDb)
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Blog service listening on ${port}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
