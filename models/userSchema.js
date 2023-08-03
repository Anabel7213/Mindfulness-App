const mongoose = require("mongoose");
// const validator = require("validator");

//---------user authentication----------//
const userSchema = new mongoose.Schema({
    role: {
      type: String,
      default: "user",
    },
    name: {
      type: String,
      min: 3,
      max: 20,
    },
    email: {
      type: String,
      unique: function () {
        return !this.googleId;
      },
      lowercase: true,
      required: true
    },
    password: {
      type: String,
      minlength: 8,
      required: function () {
        return !this.googleId;
      },
    },
    passwordConfirm: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords do not match!",
      },
    },
    googleId: {
      type: String,
    }
  });
  
  //---hiding passwordConfirm from db---//
  userSchema.pre("save", async function (next) {
    this.passwordConfirm = undefined;
    next();
  });
  
  const User = mongoose.model("User", userSchema);
  
  module.exports = User;