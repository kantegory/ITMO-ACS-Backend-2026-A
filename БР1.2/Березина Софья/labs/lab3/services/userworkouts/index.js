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
const workoutsServiceUrl = process.env.WORKOUTS_SERVICE_URL || "http://workout:3000";
let channel = null;

async function waitForDb(retries = 20) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query("select 1");
      return;
    } catch (err) {
      console.log(`UserWorkouts DB is not ready (${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("UserWorkouts DB is unavailable");
}

async function initDb() {
  await pool.query(`
    create table if not exists user_workouts (
      id uuid primary key,
      user_id uuid not null,
      workout_id uuid not null,
      status text not null default 'scheduled',
      scheduled_date date,
      completed_at timestamptz,
      rating integer,
      result_notes text,
      completed_exercises_count integer,
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
      console.log(`RabbitMQ is not ready for user-workouts (${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("RabbitMQ is unavailable");
}

function toUserWorkout(row) {
  return {
    id: row.id,
    userId: row.user_id,
    workoutId: row.workout_id,
    status: row.status,
    scheduledDate: row.scheduled_date,
    completedAt: row.completed_at,
    rating: row.rating,
    resultNotes: row.result_notes,
    completedExercisesCount: row.completed_exercises_count,
    createdAt: row.created_at,
  };
}

async function ensureRemoteExists(url, notFoundCode) {
  const response = await fetch(url);
  if (response.status === 404) return { ok: false, status: 404, code: notFoundCode };
  if (!response.ok) return { ok: false, status: 502, code: "DEPENDENCY_UNAVAILABLE" };
  return { ok: true };
}

app.get("/health", async (_req, res) => {
  await pool.query("select 1");
  res.json({ status: "ok", service: "user-workouts", rabbitmq: Boolean(channel) });
});

app.post("/user-workouts/assign", async (req, res) => {
  const { userId, workoutId, scheduledDate = null } = req.body;
  if (!userId || !workoutId) {
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: "userId and workoutId are required" });
  }

  const userCheck = await ensureRemoteExists(`${usersServiceUrl}/users/${userId}`, "USER_NOT_FOUND");
  if (!userCheck.ok) return res.status(userCheck.status).json({ code: userCheck.code, message: "User check failed" });

  const workoutCheck = await ensureRemoteExists(`${workoutsServiceUrl}/workouts/${workoutId}`, "WORKOUT_NOT_FOUND");
  if (!workoutCheck.ok) return res.status(workoutCheck.status).json({ code: workoutCheck.code, message: "Workout check failed" });

  const id = randomUUID();
  const result = await pool.query(
    `insert into user_workouts (id, user_id, workout_id, scheduled_date)
     values ($1, $2, $3, $4)
     returning *`,
    [id, userId, workoutId, scheduledDate],
  );

  channel.publish(
    "fitness.events",
    "user.workout.assigned",
    Buffer.from(JSON.stringify({ eventId: randomUUID(), occurredAt: new Date().toISOString(), userWorkoutId: id, userId, workoutId })),
    { persistent: true },
  );

  res.status(201).json(toUserWorkout(result.rows[0]));
});

app.post("/user-workouts/:id/complete", async (req, res) => {
  const { rating = null, resultNotes = null, completedExercisesCount = null, metrics = {} } = req.body;
  const result = await pool.query(
    `update user_workouts set
       status = 'completed',
       completed_at = now(),
       rating = $2,
       result_notes = $3,
       completed_exercises_count = $4
     where id = $1
     returning *`,
    [req.params.id, rating, resultNotes, completedExercisesCount],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ code: "USER_WORKOUT_NOT_FOUND", message: "Assigned workout not found" });
  }

  const userWorkout = toUserWorkout(result.rows[0]);
  channel.publish(
    "fitness.events",
    "user.workout.completed",
    Buffer.from(JSON.stringify({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      userWorkoutId: userWorkout.id,
      userId: userWorkout.userId,
      workoutId: userWorkout.workoutId,
      rating,
      resultNotes,
      completedExercisesCount,
      metrics,
    })),
    { persistent: true },
  );

  res.json(userWorkout);
});

app.get("/user-workouts", async (req, res) => {
  const { userId } = req.query;
  const result = userId
    ? await pool.query("select * from user_workouts where user_id = $1 order by created_at desc", [userId])
    : await pool.query("select * from user_workouts order by created_at desc");
  res.json(result.rows.map(toUserWorkout));
});

Promise.all([waitForDb(), connectRabbit()])
  .then(initDb)
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`UserWorkouts service listening on ${port}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
