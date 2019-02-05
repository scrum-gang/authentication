const errors = require("restify-errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rjwt = require("restify-jwt-community");
const User = require("../models/User");
const auth = require("../auth");
const config = require("../config");

module.exports = server => {
  //register User

  server.post("/signup", (req, res, next) => {
    const { email, password } = req.body;

    const user = new User({
      email,
      password
    });

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, async (err, hash) => {
        //hash passw
        user.password = hash;
        try {
          const newUser = await user.save();
          res.send(201);
          next();
        } catch (err) {
          return next(new errors.InternalError(err.message));
        }
      });
    });
  });

  //auth user
  server.post("/login", async (req, res, next) => {
    const { email, password } = req.body;

    try {
      const user = await auth.authenticate(email, password);
      console.log(user);
      const token = jwt.sign(user.toJSON(), config.JWT_SECRET, {
        expiresIn: "15m"
      });

      const { iat, exp } = jwt.decode(token);
      res.send({ iat, exp, token });

      next();
    } catch (err) {
      return next(new errors.UnauthorizedError());
    }
  });

  server.get("/users", async (req, res, next) => {
    try {
      const users = await User.find({});
      res.send(users);
      next();
    } catch (err) {
      return next(new errors.InvalidContentError(err));
    }
  });

  server.get("/users/:id", async (req, res, next) => {
    const payload = jwt.decode(req.header("Authorization").split(" ")[1]);
    console.log(payload);
    try {
      const users = await User.findById(req.params.id);
      res.send(users);
      next();
    } catch (err) {
      return next(
        new errors.ResourceNotFoundError(
          `There is no user with the id ${req.params.id}`
        )
      );
    }
  });

  //update user
  server.put("/users/:id", async (req, res, next) => {
    if (!req.is("application/json")) {
      return next(new errors.InvalidContentError("Expects 'application/json"));
    }

    try {
      const user = await User.findOneAndUpdate(
        { _id: req.params.id },
        req.body
      );
      res.send(200);
      next();
    } catch (err) {
      return next(
        new errors.ResourceNotFoundError(
          `There is no user with the id ${req.params.id}`
        )
      );
    }
  });

  //delete user
  server.del("/users/:id", async (req, res, next) => {
    try {
      const user = await User.findOneAndRemove({ _id: req.params.id });
      res.send(204);
      next();
    } catch (err) {
      return next(
        new errors.ResourceNotFoundError(
          `There is no user with the id ${req.params.id}`
        )
      );
    }
  });
};
