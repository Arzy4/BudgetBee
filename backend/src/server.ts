import "dotenv/config";
import app from "./app.js";
import type {} from "./types/express.js";

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`BudgetBee API running on http://localhost:${PORT}`);
});
