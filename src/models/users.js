const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Task = require("../models/tasks");
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      require: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("The field has to be email.");
        }
      },
    },
    password: {
      type: String,
      require: true,
      trim: true,
      validate(value) {
        if (value.length < 6) {
          throw new Error("Password must have 6 character");
        }
        if (value.includes("password")) {
          throw new Error("Passowrd cannot inclue word password");
        }
      },
    },
    age: {
      type: Number,
      require: true,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    profile: {
      type: Buffer,
    },
  },
  { timestamps: true }
);
userSchema.set("toJSON", { virtuals: true });
userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});
userSchema.methods.toJSON = function () {
  const user = this;
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.tokens;
  return userObj;
};
userSchema.methods.generateToken = async function () {
  const user = this;
  const token = await jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET
  );
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};
userSchema.statics.findByCredentails = async function (email, password) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Unable to Login");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to Login");
  }
  return user;
};

//hashing password
userSchema.pre("save", async function (next) {
  let user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});
userSchema.pre("remove", async function (next) {
  let user = this;

  Task.deleteMany({ owner: user._id });

  next();
});
const User = mongoose.model("User", userSchema);

module.exports = User;
