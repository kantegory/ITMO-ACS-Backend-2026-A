import express from "express"
import cors from "cors"

const app = express()
app.use(cors())
app.use(express.json())

const send = async (req: any, res: any, target: string) => {
  const url = target + req.originalUrl
  try {
    const body = req.method !== "GET" ? JSON.stringify(req.body) : undefined
    const r = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {})
      },
      body
    })
    const text = await r.text()
    res.status(r.status)
    try { return res.json(JSON.parse(text)) } catch { return res.send(text) }
  } catch {
    return res.status(502).json({ error: { code: "GATEWAY_ERROR", message: "сервис недоступен", status: 502 } })
  }
}

app.use("/api/v1/auth", (req, res) => send(req, res, "http://auth:8001"))
app.use("/api/v1/users", (req, res) => send(req, res, "http://auth:8001"))
app.use("/api/v1/cuisines", (req, res) => send(req, res, "http://restaurant:8002"))
app.use("/api/v1/dishes", (req, res) => send(req, res, "http://restaurant:8002"))
app.use("/api/v1/photos", (req, res) => send(req, res, "http://restaurant:8002"))
app.use("/api/v1/reservations", (req, res) => send(req, res, "http://booking:8003"))
app.use("/api/v1/restaurants", (req, res) => {
  if (req.path.includes("/reviews")) return send(req, res, "http://booking:8003")
  return send(req, res, "http://restaurant:8002")
})

app.listen(3000, () => console.log("api-gateway: http://localhost:3000"))