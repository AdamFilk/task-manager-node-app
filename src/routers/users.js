const express = require("express");
const User = require("../models/users");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload a jpg or jpeg file"));
    }
    cb(undefined, true);
  },
});
const router = new express.Router();
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    res.status(201).send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.profile = undefined;
  await req.user.save();
  res.send();
});
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.profile) {
      throw new Error("No user found");
    }
    res.set("Content-Type", "image/png");
    res.send();
  } catch (e) {
    res.status(404).send();
  }
});
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    req.user.profile = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    await req.user.save();
    res.send();
  },
  (err, req, res, next) => res.status(400).send({ error: err.message })
);
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});
router.get("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});
router.patch("/users/me", auth, async (req, res) => {
  const _id = req.user._id;
  const updates = Object.keys(req.body);
  const allowedUpdateds = ["name", "email", "password", "age"];
  const isValidUpdates = updates.every((update) =>
    allowedUpdateds.includes(update)
  );
  if (!isValidUpdates) {
    return res.status(400).send({ error: "Invalid Update Keys" });
  }
  try {
    const user = await User.findById(_id);
    updates.forEach((update) => {
      user[update] = req.body[update];
    });
    user.save();

    // const user = await User.findByIdAndUpdate(_id, req.body, {
    //   new: true,
    //   runValidators: true,
    // });
    if (!user) {
      return res.status(404).send({ error: "sorry user not found" });
    }
    res.status(200).send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.delete("/users/me", async (req, res) => {
  try {
    req.user.remove();
    res.status(200).send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentails(
      req.body.email,
      req.body.password
    );
    const token = await user.generateToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/signup", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
