require("reflect-metadata");

const express = require("express");
const bodyParser = require("body-parser");
const amqp = require("amqplib");
const { randomUUID } = require("crypto");
const dataSource = require("./data-source");

const app = express();
app.use(bodyParser.json());

const rabbitUrl =
  process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672";

function toProgress(row) {
  return {
    id: row.id,
    userId: row.userId,
    userWorkoutId: row.userWorkoutId,
    workoutId: row.workoutId,
    date: row.date,
    weightKg: row.weightKg === null ? null : Number(row.weightKg),
    heightCm: row.heightCm === null ? null : Number(row.heightCm),
    muscleMassKg: row.muscleMassKg === null ? null : Number(row.muscleMassKg),
    rating: row.rating,
    completedExercisesCount: row.completedExercisesCount,
    sourceEventId: row.sourceEventId,
    createdAt: row.createdAt,
  };
}

async function initRabbit(retries = 20) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const connection = await amqp.connect(rabbitUrl);
      const channel = await connection.createChannel();
      await channel.assertExchange("fitness.events", "topic", {
        durable: true,
      });
      const queue = await channel.assertQueue(
        "progress.user_workout_completed",
        { durable: true },
      );
      await channel.bindQueue(
        queue.queue,
        "fitness.events",
        "user.workout.completed",
      );

      channel.consume(queue.queue, async (msg) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          const metrics = event.metrics || {};
          const repository = dataSource.getRepository("ProgressRecord");
          await repository.upsert(
            {
              id: randomUUID(),
              userId: event.userId,
              userWorkoutId: event.userWorkoutId,
              workoutId: event.workoutId,
              weightKg: metrics.weightKg || null,
              heightCm: metrics.heightCm || null,
              muscleMassKg: metrics.muscleMassKg || null,
              rating: event.rating || null,
              completedExercisesCount: event.completedExercisesCount || null,
              sourceEventId: event.eventId,
            },
            ["sourceEventId"],
          );
          channel.ack(msg);
        } catch (err) {
          console.error("Progress event processing failed:", err.message);
          channel.nack(msg, false, false);
        }
      });
      return;
    } catch (err) {
      console.log(
        `RabbitMQ is not ready for progress (${attempt}/${retries}): ${err.message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("RabbitMQ is unavailable");
}

app.get("/health", async (_req, res) => {
  res.json({ status: "ok", service: "progress" });
});

app.get("/progress", async (req, res) => {
  const { userId } = req.query;
  const repository = dataSource.getRepository("ProgressRecord");
  const records = userId
    ? await repository.find({ where: { userId }, order: { createdAt: "DESC" } })
    : await repository.find({ order: { createdAt: "DESC" } });
  res.json(records.map(toProgress));
});

app.post("/progress", async (req, res) => {
  const {
    userId,
    date,
    weightKg = null,
    heightCm = null,
    muscleMassKg = null,
  } = req.body;
  if (!userId || !date || weightKg === null) {
    return res.status(400).json({
      code: "INVALID_PAYLOAD",
      message: "userId, date and weightKg are required",
    });
  }

  const repository = dataSource.getRepository("ProgressRecord");
  const saved = await repository.save({
    id: randomUUID(),
    userId,
    date,
    weightKg,
    heightCm,
    muscleMassKg,
  });
  res.status(201).json(toProgress(saved));
});

Promise.all([dataSource.initialize(), initRabbit()])
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () =>
      console.log(`Progress service listening on ${port}`),
    );
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
