const errors = require("restify-errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rjwt = require("restify-jwt-community");
const User = require("../models/User");
const auth = require("../auth");
const config = require("../config");
const nodemailer = require("nodemailer");

module.exports = server => {
  //register User

  server.post("/signup", (req, res, next) => {
    const { email, password, type } = req.body;

    const user = new User({
      email,
      password,
      type
    });

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, async (err, hash) => {
        //hash passw
        user.password = hash;
        try {
          const newUser = await user.save();
          const host = req.header("Host");
          sendEmail(host, user);
          res.send(201);
          next();
        } catch (err) {
          return next(new errors.InternalError(err.message));
        }
      });
    });
  });

  function sendEmail(host, user) {
    const token = jwt.sign({ email: user.email }, config.JWT_SECRET, {
      expiresIn: "30m"
    });

    var transporter = nodemailer.createTransport({
      service: "gmail.com",
      auth: {
        user: "bogdan.dumitru127@gmail.com",
        pass: "axsbbuevrsjvtcof"
      }
    });

    const parts = token.split(".");

    link =
      "http://" +
      host +
      "/verify/" +
      parts[0] +
      "/" +
      parts[1] +
      "/" +
      parts[2];

    var mailOptions = {
      from: "jakey",
      to: user.email,
      subject: "AUTHBOIICLIQUE MAKE A HOST SHAKE",
      html:
        "Hello,<br> Please Click on the link to verify your email.<br><a href=" +
        link +
        ">Click here to verify</a>"
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }

  //auth user
  server.post("/login", async (req, res, next) => {
    const { email, password } = req.body;

    try {
      const user = await auth.authenticate(email, password);
      console.log(user);
      const token = jwt.sign(
        { id: user.id, email: user.email, type: user.type },
        config.JWT_SECRET,
        {
          expiresIn: "15m"
        }
      );

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

  function owner(req) {
    const bearer = req.header("Authorization");
    const token = bearer.split(" ")[1];
    const payload = jwt.decode(token);

    if (payload.id == req.params.id) {
      console.log("Its you!");
      return true;
    } else {
      console.log("Its not you!");
      return false;
    }
  }

  //delete user
  server.del(
    "/users/:id",
    rjwt({ secret: config.JWT_SECRET }),
    async (req, res, next) => {
      try {
        if (owner(req)) {
          const user = await User.findOneAndRemove({ _id: req.params.id });
          res.send(204);
          next();
        } else {
          return next(new errors.ResourceNotFoundError("Thats not you, silly"));
        }
      } catch (err) {
        return next(
          new errors.ResourceNotFoundError(
            `There is no user with the id ${req.params.id}`
          )
        );
      }
    }
  );

  server.get("/verify/:header/:payload/:signature", (req, res, next) => {
    try {
      const token =
        req.params.header +
        "." +
        req.params.payload +
        "." +
        req.params.signature;

      const { iat, exp } = jwt.decode(token);
      res.send({ iat, exp, token }, 200);
      next();
    } catch (err) {
      return next(new errors.UnauthorizedError("Invalid token."));
    }
  });
};
