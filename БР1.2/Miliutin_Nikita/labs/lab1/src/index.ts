import { app } from "./app";

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Lab 1 API started on http://localhost:${PORT}`);
});
