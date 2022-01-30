const express = require("express");
const Task = require("../models/tasks");
const auth = require("../middleware/auth");
const router = new express.Router();
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }
  if (req.query.sortBy) {
    const sortBy = req.query.sortBy.split(":");
    sort[sortBy[0]] = sortBy[1] === "asc" ? 1 : -1;
  }
  try {
    await req.user.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({ _id: _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.patch("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdateds = ["description", "completed"];
  const isValidUpdates = updates.every((update) =>
    allowedUpdateds.includes(update)
  );
  if (!isValidUpdates) {
    return res.status(400).send({ error: "Invalid Update Keys" });
  }
  try {
    const task = await Task.findOne({ _id: _id, owner: req.user._id });

    // const task = await Task.findByIdAndUpdate(_id, req.body, {
    //   new: true,
    //   runValidators: true,
    // });
    if (!task) {
      return res.status(404).send({ error: "sorry task not found" });
    }
    updates.forEach((update) => {
      task[update] = req.body[update];
    });
    task.save();
    res.status(200).send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});
module.exports = router;
