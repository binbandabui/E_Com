const express = require("express");
const app = express();
const cors = require("cors");

require("dotenv").config();
// Connect string
const api = process.env.API_URL;
const atlas = process.env.CONNECTION_STRING;
const morgan = require("morgan");
const mongoose = require("mongoose");
const productRouter = require("./routers/products");
const userRouter = require("./routers/user");
const categoryRouter = require("./routers/category");
const orderRouter = require("./routers/order");
const authJwt = require("./helper/jwt");
const errorHandler = require("./helper/error-handler");
require("dotenv").config();
// Middleware
app.use(cors());
app.options("*", cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use(errorHandler);
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
//Router
app.use(`${api}/products`, productRouter);
app.use(`${api}/users`, userRouter);
app.use(`${api}/category`, categoryRouter);
app.use(`${api}/orders`, orderRouter);
mongoose
  .connect(atlas, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "E-Shop",
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas", err);
  });

app.listen(3000, () => {
  console.log(api);
  console.log("Server is running on port http://localhost:3000");
});
