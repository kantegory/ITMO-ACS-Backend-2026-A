const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const { randomUUID } = require("crypto");

const app = express();
app.use(bodyParser.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function waitForDb(retries = 20) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query("select 1");
      return;
    } catch (err) {
      console.log(`Workouts DB is not ready (${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("Workouts DB is unavailable");
}

async function initDb() {
  await pool.query(`
    create table if not exists workouts (
      id uuid primary key,
      title text not null,
      type text not null,
      difficulty_level text not null,
      description text,
      duration_min integer not null,
      created_by uuid,
      is_published boolean not null default true,
      created_at timestamptz not null default now()
    );

    create table if not exists exercises (
      id uuid primary key,
      workout_id uuid not null references workouts(id) on delete cascade,
      title text not null,
      target_muscle_group text,
      equipment text,
      sets integer,
      reps integer
    );
  `);
}

function toWorkout(row, exercises = []) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    difficultyLevel: row.difficulty_level,
    description: row.description,
    durationMin: row.duration_min,
    createdBy: row.created_by,
    isPublished: row.is_published,
    createdAt: row.created_at,
    exercises,
  };
}

async function getWorkout(id) {
  const workoutResult = await pool.query("select * from workouts where id = $1", [id]);
  if (workoutResult.rowCount === 0) return null;

  const exercisesResult = await pool.query(
    "select id, title, target_muscle_group as \"targetMuscleGroup\", equipment, sets, reps from exercises where workout_id = $1 order by title",
    [id],
  );
  return toWorkout(workoutResult.rows[0], exercisesResult.rows);
}

app.get("/health", async (_req, res) => {
  await pool.query("select 1");
  res.json({ status: "ok", service: "workouts" });
});

app.post("/workouts", async (req, res) => {
  const {
    title,
    type,
    difficultyLevel,
    description = null,
    durationMin,
    createdBy = null,
    exercises = [],
  } = req.body;

  if (!title || !type || !difficultyLevel || !durationMin) {
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: "title, type, difficultyLevel and durationMin are required" });
  }

  const id = randomUUID();
  await pool.query(
    `insert into workouts (id, title, type, difficulty_level, description, duration_min, created_by)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [id, title, type, difficultyLevel, description, durationMin, createdBy],
  );

  for (const exercise of exercises) {
    await pool.query(
      `insert into exercises (id, workout_id, title, target_muscle_group, equipment, sets, reps)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        randomUUID(),
        id,
        exercise.title,
        exercise.targetMuscleGroup || null,
        exercise.equipment || null,
        exercise.sets || null,
        exercise.reps || null,
      ],
    );
  }

  res.status(201).json(await getWorkout(id));
});

app.get("/workouts", async (_req, res) => {
  const result = await pool.query("select * from workouts order by created_at desc");
  res.json(result.rows.map((row) => toWorkout(row)));
});

app.get("/workouts/:id", async (req, res) => {
  const workout = await getWorkout(req.params.id);
  if (!workout) {
    return res.status(404).json({ code: "WORKOUT_NOT_FOUND", message: "Workout not found" });
  }
  res.json(workout);
});

waitForDb()
  .then(initDb)
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Workouts service listening on ${port}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
