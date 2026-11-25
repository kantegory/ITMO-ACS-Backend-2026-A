require("reflect-metadata");

const express = require("express");
const bodyParser = require("body-parser");
const dataSource = require("./data-source");

const app = express();
app.use(bodyParser.json());

function toUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    profile: {
      age: row.age,
      heightCm: row.heightCm === null ? null : Number(row.heightCm),
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

app.get("/health", async (_req, res) => {
  res.json({ status: "ok", service: "users" });
});

app.post("/internal/users", async (req, res) => {
  const {
    id,
    email,
    displayName,
    role = "user",
    age = null,
    heightCm = null,
  } = req.body;
  if (!id || !email || !displayName) {
    return res.status(400).json({
      code: "INVALID_PAYLOAD",
      message: "id, email and displayName are required",
    });
  }

  const repository = dataSource.getRepository("User");
  await repository.upsert({ id, email, displayName, role, age, heightCm }, [
    "id",
  ]);
  const savedUser = await repository.findOneBy({ id });
  res.status(201).json(toUser(savedUser));
});

app.get("/users", async (_req, res) => {
  const repository = dataSource.getRepository("User");
  const users = await repository.find({ order: { createdAt: "DESC" } });
  res.json(users.map(toUser));
});

app.get("/users/:id", async (req, res) => {
  const repository = dataSource.getRepository("User");
  const user = await repository.findOneBy({ id: req.params.id });
  if (!user) {
    return res
      .status(404)
      .json({ code: "USER_NOT_FOUND", message: "User not found" });
  }
  res.json(toUser(user));
});

app.patch("/users/:id/profile", async (req, res) => {
  const { displayName, age, heightCm } = req.body;
  const repository = dataSource.getRepository("User");
  const user = await repository.findOneBy({ id: req.params.id });
  if (!user) {
    return res
      .status(404)
      .json({ code: "USER_NOT_FOUND", message: "User not found" });
  }

  const mergedUser = repository.merge(user, {
    displayName: displayName ?? user.displayName,
    age: age ?? user.age,
    heightCm: heightCm ?? user.heightCm,
  });

  const result = await repository.save(mergedUser);
  res.json(toUser(result));
});

dataSource
  .initialize()
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Users service listening on ${port}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
