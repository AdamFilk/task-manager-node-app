const express = require("express");
const app = express();
const port = process.env.PORT;
const userRouter = require("./routers/users");
const taskRouter = require("./routers/tasks");
require("./db/mongoose");

const Task = require("./models/tasks");
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
  console.log("Server is listening at " + port);
});
