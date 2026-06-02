const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
app.use(bodyParser.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function waitForDb(retries = 20) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query("select 1");
      return;
    } catch (err) {
      console.log(`Users DB is not ready (${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("Users DB is unavailable");
}

async function initDb() {
  await pool.query(`
    create table if not exists users (
      id uuid primary key,
      email text unique not null,
      display_name text not null,
      role text not null default 'user',
      age integer,
      height_cm numeric(6,2),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

function toUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    profile: {
      age: row.age,
      heightCm: row.height_cm === null ? null : Number(row.height_cm),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

app.get("/health", async (_req, res) => {
  await pool.query("select 1");
  res.json({ status: "ok", service: "users" });
});

app.post("/internal/users", async (req, res) => {
  const { id, email, displayName, role = "user", age = null, heightCm = null } = req.body;
  if (!id || !email || !displayName) {
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: "id, email and displayName are required" });
  }

  const result = await pool.query(
    `insert into users (id, email, display_name, role, age, height_cm)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (id) do update set
       email = excluded.email,
       display_name = excluded.display_name,
       role = excluded.role,
       age = excluded.age,
       height_cm = excluded.height_cm,
       updated_at = now()
     returning *`,
    [id, email, displayName, role, age, heightCm],
  );
  res.status(201).json(toUser(result.rows[0]));
});

app.get("/users", async (_req, res) => {
  const result = await pool.query("select * from users order by created_at desc");
  res.json(result.rows.map(toUser));
});

app.get("/users/:id", async (req, res) => {
  const result = await pool.query("select * from users where id = $1", [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ code: "USER_NOT_FOUND", message: "User not found" });
  }
  res.json(toUser(result.rows[0]));
});

app.patch("/users/:id/profile", async (req, res) => {
  const { displayName, age, heightCm } = req.body;
  const result = await pool.query(
    `update users set
       display_name = coalesce($2, display_name),
       age = coalesce($3, age),
       height_cm = coalesce($4, height_cm),
       updated_at = now()
     where id = $1
     returning *`,
    [req.params.id, displayName, age, heightCm],
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ code: "USER_NOT_FOUND", message: "User not found" });
  }
  res.json(toUser(result.rows[0]));
});

waitForDb()
  .then(initDb)
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Users service listening on ${port}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
