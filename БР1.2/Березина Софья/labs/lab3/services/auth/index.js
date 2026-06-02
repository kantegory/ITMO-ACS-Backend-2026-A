const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const { Pool } = require("pg");
const { createHmac, pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } = require("crypto");

const app = express();
app.use(bodyParser.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const jwtSecret = process.env.JWT_SECRET || "dev-secret";
const usersServiceUrl = process.env.USERS_SERVICE_URL || "http://user:3000";

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function signJwt(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", jwtSecret).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const expected = createHmac("sha256", jwtSecret).update(`${parts[0]}.${parts[1]}`).digest("base64url");
  if (Buffer.byteLength(expected) !== Buffer.byteLength(parts[2])) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(parts[2]))) return null;
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function checkPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const candidate = hashPassword(password, salt).split(":")[1];
  return timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

async function waitForDb(retries = 20) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query("select 1");
      return;
    } catch (err) {
      console.log(`Auth DB is not ready (${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("Auth DB is unavailable");
}

async function initDb() {
  await pool.query(`
    create table if not exists auth_accounts (
      id uuid primary key,
      email text unique not null,
      password_hash text not null,
      role text not null default 'user',
      created_at timestamptz not null default now()
    );
  `);
}

app.get("/health", async (_req, res) => {
  await pool.query("select 1");
  res.json({ status: "ok", service: "auth" });
});

app.post("/auth/register", async (req, res) => {
  const { email, password, displayName, role = "user", age = null, heightCm = null } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: "email, password and displayName are required" });
  }

  const id = randomUUID();
  try {
    await pool.query(
      "insert into auth_accounts (id, email, password_hash, role) values ($1, $2, $3, $4)",
      [id, email, hashPassword(password), role],
    );

    const usersResponse = await fetch(`${usersServiceUrl}/internal/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, email, displayName, role, age, heightCm }),
    });
    if (!usersResponse.ok) {
      await pool.query("delete from auth_accounts where id = $1", [id]);
      return res.status(502).json({ code: "USERS_SERVICE_ERROR", message: "User profile was not created" });
    }

    res.status(201).json({ id, email, role });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ code: "EMAIL_ALREADY_EXISTS", message: "Email already exists" });
    }
    throw err;
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: "email and password are required" });
  }

  const result = await pool.query("select * from auth_accounts where email = $1", [email]);
  if (result.rowCount === 0 || !checkPassword(password, result.rows[0].password_hash)) {
    return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Email or password is incorrect" });
  }

  const account = result.rows[0];
  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  const token = signJwt({ sub: account.id, email: account.email, role: account.role, exp });
  res.json({ accessToken: token, tokenType: "Bearer", expiresIn: 3600 });
});

app.post("/auth/validate", (req, res) => {
  const token = req.body.token || (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(400).json({ code: "MISSING_TOKEN", message: "Token not provided" });
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({ code: "INVALID_TOKEN", message: "Token is invalid or expired" });
  }

  res.json({ valid: true, userId: payload.sub, email: payload.email, roles: [payload.role], exp: payload.exp });
});

waitForDb()
  .then(initDb)
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Auth service listening on ${port}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
