const express = require("express");
const bodyParser = require("body-parser");
const amqp = require("amqplib");
const { Pool } = require("pg");
const { randomUUID } = require("crypto");

const app = express();
app.use(bodyParser.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const rabbitUrl = process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672";

async function waitForDb(retries = 20) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query("select 1");
      return;
    } catch (err) {
      console.log(`Progress DB is not ready (${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("Progress DB is unavailable");
}

async function initDb() {
  await pool.query(`
    create table if not exists progress_records (
      id uuid primary key,
      user_id uuid not null,
      user_workout_id uuid,
      workout_id uuid,
      date date not null default current_date,
      weight_kg numeric(6,2),
      height_cm numeric(6,2),
      muscle_mass_kg numeric(6,2),
      rating integer,
      completed_exercises_count integer,
      source_event_id uuid unique,
      created_at timestamptz not null default now()
    );
  `);
}

function toProgress(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userWorkoutId: row.user_workout_id,
    workoutId: row.workout_id,
    date: row.date,
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    heightCm: row.height_cm === null ? null : Number(row.height_cm),
    muscleMassKg: row.muscle_mass_kg === null ? null : Number(row.muscle_mass_kg),
    rating: row.rating,
    completedExercisesCount: row.completed_exercises_count,
    sourceEventId: row.source_event_id,
    createdAt: row.created_at,
  };
}

async function saveCompletedWorkoutEvent(event) {
  const metrics = event.metrics || {};
  await pool.query(
    `insert into progress_records (
       id, user_id, user_workout_id, workout_id, date, weight_kg, height_cm,
       muscle_mass_kg, rating, completed_exercises_count, source_event_id
     )
     values ($1, $2, $3, $4, current_date, $5, $6, $7, $8, $9, $10)
     on conflict (source_event_id) do nothing`,
    [
      randomUUID(),
      event.userId,
      event.userWorkoutId,
      event.workoutId,
      metrics.weightKg || null,
      metrics.heightCm || null,
      metrics.muscleMassKg || null,
      event.rating || null,
      event.completedExercisesCount || null,
      event.eventId,
    ],
  );
}

async function connectRabbit(retries = 20) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const connection = await amqp.connect(rabbitUrl);
      const channel = await connection.createChannel();
      await channel.assertExchange("fitness.events", "topic", { durable: true });
      const queue = await channel.assertQueue("progress.user_workout_completed", { durable: true });
      await channel.bindQueue(queue.queue, "fitness.events", "user.workout.completed");

      channel.consume(queue.queue, async (msg) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          await saveCompletedWorkoutEvent(event);
          channel.ack(msg);
        } catch (err) {
          console.error("Progress event processing failed:", err.message);
          channel.nack(msg, false, false);
        }
      });
      return;
    } catch (err) {
      console.log(`RabbitMQ is not ready for progress (${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("RabbitMQ is unavailable");
}

app.get("/health", async (_req, res) => {
  await pool.query("select 1");
  res.json({ status: "ok", service: "progress" });
});

app.get("/progress", async (req, res) => {
  const { userId } = req.query;
  const result = userId
    ? await pool.query("select * from progress_records where user_id = $1 order by created_at desc", [userId])
    : await pool.query("select * from progress_records order by created_at desc");
  res.json(result.rows.map(toProgress));
});

app.post("/progress", async (req, res) => {
  const { userId, date, weightKg = null, heightCm = null, muscleMassKg = null } = req.body;
  if (!userId || !date || weightKg === null) {
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: "userId, date and weightKg are required" });
  }

  const result = await pool.query(
    `insert into progress_records (id, user_id, date, weight_kg, height_cm, muscle_mass_kg)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [randomUUID(), userId, date, weightKg, heightCm, muscleMassKg],
  );
  res.status(201).json(toProgress(result.rows[0]));
});

waitForDb()
  .then(initDb)
  .then(connectRabbit)
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Progress service listening on ${port}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
