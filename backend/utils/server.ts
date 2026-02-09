import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { NODE_ENV, PORT, ORIGIN } from "../src/config";
import booksRoute from "../src/routes/books.routes";
import userRoute from "../src/routes/user.routes";
import { errorHandler } from "../src/middleware/error.middleware";

const app = express();
const env = NODE_ENV;
const port = PORT;

const corsOptions = {
  origin: ORIGIN || (env === "development" ? "*" : false),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: env === "development" ? 200 : 100,
  message: {
    error: "Too Many Requests",
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json({ limit: "5mb" }));

app.get('/', (req, res) => {
  res.json({
    status: "ok",
    message: "Readiculous API",
    version: "1.0.0"
  });
});

app.use("/api/book", booksRoute);
app.use("/api/user", userRoute);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`=================================`);
  console.log(`======= ENV: ${env} =======`);
  console.log(`App listening on the port ${port}`);
  console.log(`=================================`);
});