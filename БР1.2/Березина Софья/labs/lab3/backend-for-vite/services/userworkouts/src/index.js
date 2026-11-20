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
const workoutsServiceUrl =
  process.env.WORKOUTS_SERVICE_URL || "http://workout:3000";
let channel = null;

function toUserWorkout(row) {
  return {
    id: row.id,
    userId: row.userId,
    workoutId: row.workoutId,
    status: row.status,
    scheduledDate: row.scheduledDate,
    completedAt: row.completedAt,
    rating: row.rating,
    resultNotes: row.resultNotes,
    completedExercisesCount: row.completedExercisesCount,
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
        `RabbitMQ is not ready for user-workouts (${attempt}/${retries}): ${err.message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("RabbitMQ is unavailable");
}

async function ensureRemoteExists(url, notFoundCode) {
  const response = await fetch(url);
  if (response.status === 404)
    return { ok: false, status: 404, code: notFoundCode };
  if (!response.ok)
    return { ok: false, status: 502, code: "DEPENDENCY_UNAVAILABLE" };
  return { ok: true };
}

app.get("/health", async (_req, res) => {
  res.json({
    status: "ok",
    service: "user-workouts",
    rabbitmq: Boolean(channel),
  });
});

app.post("/user-workouts/assign", async (req, res) => {
  const { userId, workoutId, scheduledDate = null } = req.body;
  if (!userId || !workoutId) {
    return res.status(400).json({
      code: "INVALID_PAYLOAD",
      message: "userId and workoutId are required",
    });
  }

  const userCheck = await ensureRemoteExists(
    `${usersServiceUrl}/users/${userId}`,
    "USER_NOT_FOUND",
  );
  if (!userCheck.ok)
    return res
      .status(userCheck.status)
      .json({ code: userCheck.code, message: "User check failed" });

  const workoutCheck = await ensureRemoteExists(
    `${workoutsServiceUrl}/workouts/${workoutId}`,
    "WORKOUT_NOT_FOUND",
  );
  if (!workoutCheck.ok)
    return res
      .status(workoutCheck.status)
      .json({ code: workoutCheck.code, message: "Workout check failed" });

  const repository = dataSource.getRepository("UserWorkout");
  const id = randomUUID();
  await repository.insert({ id, userId, workoutId, scheduledDate });
  const saved = await repository.findOneBy({ id });

  if (channel) {
    channel.publish(
      "fitness.events",
      "user.workout.assigned",
      Buffer.from(
        JSON.stringify({
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          userWorkoutId: id,
          userId,
          workoutId,
        }),
      ),
      { persistent: true },
    );
  }

  res.status(201).json(toUserWorkout(saved));
});

app.post("/user-workouts/:id/complete", async (req, res) => {
  const {
    rating = null,
    resultNotes = null,
    completedExercisesCount = null,
    metrics = {},
  } = req.body;
  const repository = dataSource.getRepository("UserWorkout");
  const userWorkout = await repository.findOneBy({ id: req.params.id });

  if (!userWorkout) {
    return res.status(404).json({
      code: "USER_WORKOUT_NOT_FOUND",
      message: "Assigned workout not found",
    });
  }

  userWorkout.status = "completed";
  userWorkout.completedAt = new Date();
  userWorkout.rating = rating;
  userWorkout.resultNotes = resultNotes;
  userWorkout.completedExercisesCount = completedExercisesCount;
  const saved = await repository.save(userWorkout);

  if (channel) {
    channel.publish(
      "fitness.events",
      "user.workout.completed",
      Buffer.from(
        JSON.stringify({
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          userWorkoutId: saved.id,
          userId: saved.userId,
          workoutId: saved.workoutId,
          rating,
          resultNotes,
          completedExercisesCount,
          metrics,
        }),
      ),
      { persistent: true },
    );
  }

  res.json(toUserWorkout(saved));
});

app.get("/user-workouts", async (req, res) => {
  const { userId } = req.query;
  const repository = dataSource.getRepository("UserWorkout");
  const userWorkouts = userId
    ? await repository.find({ where: { userId }, order: { createdAt: "DESC" } })
    : await repository.find({ order: { createdAt: "DESC" } });
  res.json(userWorkouts.map(toUserWorkout));
});

Promise.all([dataSource.initialize(), connectRabbit()])
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () =>
      console.log(`UserWorkouts service listening on ${port}`),
    );
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
