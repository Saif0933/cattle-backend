import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { errorHandler } from "./middlewares/error.middleware";
import router from "./routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Bun backend running with Industry Standard Architecture 🚀",
  });
});

// API Routes
app.use("/api/v1", router);

// Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});