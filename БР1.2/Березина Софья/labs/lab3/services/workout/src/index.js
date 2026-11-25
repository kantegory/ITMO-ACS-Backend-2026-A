require("reflect-metadata");

const express = require("express");
const bodyParser = require("body-parser");
const { randomUUID } = require("crypto");
const dataSource = require("./data-source");

const app = express();
app.use(bodyParser.json());

function toWorkout(row, exercises = []) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    difficultyLevel: row.difficultyLevel,
    description: row.description,
    durationMin: row.durationMin,
    createdBy: row.createdBy,
    isPublished: row.isPublished,
    createdAt: row.createdAt,
    exercises,
  };
}

async function getWorkout(id) {
  const workoutRepository = dataSource.getRepository("Workout");
  const exerciseRepository = dataSource.getRepository("Exercise");
  const workout = await workoutRepository.findOneBy({ id });
  if (!workout) return null;
  const exercises = await exerciseRepository.find({
    where: { workoutId: id },
    order: { title: "ASC" },
  });
  return toWorkout(
    workout,
    exercises.map((exercise) => ({
      id: exercise.id,
      title: exercise.title,
      targetMuscleGroup: exercise.targetMuscleGroup,
      equipment: exercise.equipment,
      sets: exercise.sets,
      reps: exercise.reps,
    })),
  );
}

app.get("/health", async (_req, res) => {
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
    return res.status(400).json({
      code: "INVALID_PAYLOAD",
      message: "title, type, difficultyLevel and durationMin are required",
    });
  }

  const workoutRepository = dataSource.getRepository("Workout");
  const exerciseRepository = dataSource.getRepository("Exercise");
  const id = randomUUID();

  await workoutRepository.insert({
    id,
    title,
    type,
    difficultyLevel,
    description,
    durationMin,
    createdBy,
  });

  for (const exercise of exercises) {
    await exerciseRepository.insert({
      id: randomUUID(),
      workoutId: id,
      title: exercise.title,
      targetMuscleGroup: exercise.targetMuscleGroup || null,
      equipment: exercise.equipment || null,
      sets: exercise.sets || null,
      reps: exercise.reps || null,
    });
  }

  res.status(201).json(await getWorkout(id));
});

app.get("/workouts", async (_req, res) => {
  const workoutRepository = dataSource.getRepository("Workout");
  const workouts = await workoutRepository.find({
    order: { createdAt: "DESC" },
  });
  const result = await Promise.all(
    workouts.map(async (workout) => getWorkout(workout.id)),
  );
  res.json(result.filter(Boolean));
});

app.get("/workouts/:id", async (req, res) => {
  const workout = await getWorkout(req.params.id);
  if (!workout) {
    return res
      .status(404)
      .json({ code: "WORKOUT_NOT_FOUND", message: "Workout not found" });
  }
  res.json(workout);
});

dataSource
  .initialize()
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () =>
      console.log(`Workouts service listening on ${port}`),
    );
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
