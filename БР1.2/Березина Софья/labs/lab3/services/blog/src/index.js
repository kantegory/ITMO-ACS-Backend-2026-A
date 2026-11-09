require("reflect-metadata");

const express = require("express");
const bodyParser = require("body-parser");
const amqp = require("amqplib");
const fetch = require("node-fetch");
const { randomUUID } = require("crypto");
const dataSource = require("./data-source");

const app = express();
app.use(bodyParser.json());

const rabbitUrl =
  process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672";
const usersServiceUrl = process.env.USERS_SERVICE_URL || "http://user:3000";
let channel = null;

function toPost(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    featuredImage: row.featuredImage,
    authorId: row.authorId,
    createdAt: row.createdAt,
  };
}

async function connectRabbit(retries = 20) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const connection = await amqp.connect(rabbitUrl);
      channel = await connection.createChannel();
      await channel.assertExchange("fitness.events", "topic", {
        durable: true,
      });
      return;
    } catch (err) {
      console.log(
        `RabbitMQ is not ready for blog (${attempt}/${retries}): ${err.message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("RabbitMQ is unavailable");
}

app.get("/health", async (_req, res) => {
  res.json({ status: "ok", service: "blog", rabbitmq: Boolean(channel) });
});

app.post("/blog/posts", async (req, res) => {
  const { authorId, title, content, category, featuredImage = null } = req.body;
  if (!authorId || !title || !content || !category) {
    return res.status(400).json({
      code: "INVALID_PAYLOAD",
      message: "authorId, title, content and category are required",
    });
  }

  const authorResponse = await fetch(`${usersServiceUrl}/users/${authorId}`);
  if (authorResponse.status === 404) {
    return res
      .status(404)
      .json({ code: "AUTHOR_NOT_FOUND", message: "Author not found" });
  }
  if (!authorResponse.ok) {
    return res.status(502).json({
      code: "USERS_SERVICE_ERROR",
      message: "Users service is unavailable",
    });
  }

  const repository = dataSource.getRepository("BlogPost");
  const id = randomUUID();
  await repository.insert({
    id,
    title,
    content,
    category,
    featuredImage,
    authorId,
  });
  const saved = await repository.findOneBy({ id });

  if (channel) {
    channel.publish(
      "fitness.events",
      "blog.post.published",
      Buffer.from(
        JSON.stringify({
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          postId: id,
          authorId,
        }),
      ),
      { persistent: true },
    );
  }

  res.status(201).json(toPost(saved));
});

app.get("/blog/posts", async (_req, res) => {
  const repository = dataSource.getRepository("BlogPost");
  const posts = await repository.find({ order: { createdAt: "DESC" } });
  res.json(posts.map(toPost));
});

app.get("/blog/posts/:id", async (req, res) => {
  const repository = dataSource.getRepository("BlogPost");
  const post = await repository.findOneBy({ id: req.params.id });
  if (!post) {
    return res
      .status(404)
      .json({ code: "POST_NOT_FOUND", message: "Post not found" });
  }
  res.json(toPost(post));
});

Promise.all([dataSource.initialize(), connectRabbit()])
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Blog service listening on ${port}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
