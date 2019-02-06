const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  verified: {
    type: Boolean,
    required: true
  },
  git: {
    type: String,
    required: false
  },
  linkedin: {
    type: String,
    required: false
  }
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
