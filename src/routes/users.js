const errors = require("restify-errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rjwt = require("restify-jwt-community");
const User = require("../models/User");
const InvalidToken = require("../models/InvalidToken");
const auth = require("../auth");
const config = require("../config");
const mailgun = (config.ENV != "test" && config.ENV != "staging") ? require("mailgun-js")({apiKey: config.MAILGUN_API_KEY, domain: config.MAILGUN_DOMAIN}) : null;

module.exports = server => {

	function validateEmail(email) {
		var re = /\S+@\S+\.\S+/;
		return re.test(email);
	}

	var isRevokedCallback = async function (req, payload, done) {
		if (payload == null) {
			return done(new errors.UnauthorizedError("Invalid token"), false);
		}
		var iat = payload.iss;
		var tokenId = payload.jti;

		if (
			await InvalidToken.findOne({ iat: payload.iat, email: payload.email })
		) {
			return done(
				new errors.UnauthorizedError("Token expired. Please log back in."),
				true
			);
		} else {
			return done(null, false);
		}
	};

	function moderator(req) {
		const bearer = req.header("Authorization");
		const token = bearer.split(" ")[1];
		const payload = jwt.decode(token);

		if (payload.type.toLowerCase() == "moderator" || req.header("secret") == config.MOD_SECRET) {
			config.ENV == "development" && console.log("You're a mod!");
			return true;
		} else {
			config.ENV == "development" && console.log("Not a mod you hackerman");
			return false;
		}
	}

	server.get("/", async (req, res, next) => {
		var body = "<html><head><meta charset='UTF-8'></head><body>👮 Welcome to the Jobhub Authentication Microservice! 👮</body></html>";
		res.writeHead(200, {
			"Content-Length": Buffer.byteLength(body),
			"Content-Type": "text/html"
		});
		res.write(body);
		res.end();
	});

	server.post("/signup", async (req, res, next) => {
		if (typeof req.body === "undefined") {
			return next(
				new errors.MissingParameterError(
					"Email, password and type are required."
				)
			);
		}
		const { email, password, type } = req.body;

		if (password === "") {
			return next(
				new errors.MissingParameterError("Password cannot be empty.")
			);
		}
		if (password.length < 6) {
			return next(
				new errors.InvalidCredentialsError(
					"Password must be at least 6 characters."
				)
			);
		}
		if (password.length > 200) {
			return next(
				new errors.InvalidCredentialsError(
					"Password must be at most 200 characters."
				)
			);
		}
		const lctype = type.toLowerCase();
		if (
			lctype.localeCompare("applicant") != 0 &&
			lctype.localeCompare("recruiter") != 0
		) {
			return next(
				new errors.InvalidCredentialsError(
					"Type must be Applicant or Recruiter."
				)
			);
		}

		if (!validateEmail(email)) {
			return next(
				new errors.InvalidCredentialsError("Please enter a valid email")
			);
		}

		const user1 = await User.findOne({ email });
		if (!(user1 === null)) {
			return next(
				new errors.BadRequestError("Cannot sign up twice with the same email.")
			);
		}

		const user = new User({
			email,
			password,
			type,
			verified: false
		});

		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user.password, salt, async (err, hash) => {
				// hash passw
				user.password = hash;
				try {
					const newUser = await user.save();
					const host = req.header("Host");
					sendEmail(host, user);
					res.send(201, { _id: newUser.id });
					next();
				} catch (err) {
					return next(new errors.InternalError(err.message));
				}
			});
		});
	});

	function sendEmail(host, user) {
		const token = jwt.sign({ email: user.email }, config.JWT_SECRET, {
			expiresIn: "15m"
		});

		if (config.ENV != "test" && config.ENV != "staging") {

			const parts = token.split(".");

			const link =
				"http://" +
				host +
				"/verify/" +
				parts[0] +
				"/" +
				parts[1] +
				"/" +
				parts[2];

			var mailOptions = {
				from: "JobHub Authentication",
				to: user.email,
				subject: "JobHub Account Verification",
				html:
					"Hello New JobHub User!<br> Please click on the link below to verify your email.<br><a href=" +
					link +
					">Click here to verify</a>" +
					"<br> Thanks for using JobHub!"
			};

			mailgun.messages().send(mailOptions, function(error, body) {
				console.log(body);
			});
		}
	}

	server.post(
		"/resend",
		async (req, res, next) => {
			const { email } = req.body;
			const user = await User.findOne({ email });

			if (user === null) {
				return next(new errors.BadRequestError("No user with given email"));
			} else {
				if (user.verified) {
					return next(new errors.BadRequestError("User is already verified."));
				}
				const host = req.header("Host");
				sendEmail(host, user);
				res.send(200);
			}
		}
	);

	// auth user
	server.post(
		"/login",
		async (req, res, next) => {
			const { email, password } = req.body;

			try {
				const user = await auth.authenticate(email, password);
				const token = jwt.sign(
					{ id: user.id, email: user.email, type: user.type },
					config.JWT_SECRET,
					{
						expiresIn: "15m"
					}
				);

				const { iat, exp } = jwt.decode(token);
				const payload = Object.assign({}, { user }, { iat, exp, token });
				res.send(payload);

				next();
			} catch (err) {
				return next(new errors.UnauthorizedError(err));
			}
		}
	);

	server.get(
		"/users",
		rjwt({ secret: config.JWT_SECRET, isRevoked: isRevokedCallback }),
		async (req, res, next) => {
			try {
				if (moderator(req)) {
					const users = await User.find({});
					res.send(users);
					next();
				} else {
					return next(new errors.UnauthorizedError("Only moderators may see other users"));
				}
			} catch (err) {
				return next(new errors.InvalidContentError(err));
			}
		});

	server.get(
		"/users/:id",
		rjwt({ secret: config.JWT_SECRET, isRevoked: isRevokedCallback }),
		async (req, res, next) => {
			try {
				if (moderator(req)) {
					const users = await User.findById(req.params.id);
					if (users == null) {
						return next(new errors.ResourceNotFoundError(`There is no user with the id ${req.params.id}`));
					}
					res.send(users);
					next();
				} else {
					return next(new errors.UnauthorizedError("Only moderators may see other users"));
				}
			} catch (err) {
				return next(
					new errors.ResourceNotFoundError(
						`There is no user with the id ${req.params.id}`
					)
				);
			}
		});

	// update user
	server.put(
		"/users/:id",
		rjwt({ secret: config.JWT_SECRET, isRevoked: isRevokedCallback }),
		async (req, res, next) => {
			if (!req.is("application/json")) {
				return next(new errors.InvalidContentError("Expects 'application/json"));
			}
			if (!moderator(req)) {
				return next(new errors.UnauthorizedError("Only moderators may update other users"));
			}
			if (typeof req.body.verified !== "undefined") {
				return next(
					new errors.UnauthorizedError("Cannot modify verified field.")
				);
			}
			const lctype = req.body.type.toLowerCase();
			if (
				lctype.localeCompare("applicant") != 0 &&
				lctype.localeCompare("recruiter") != 0 &&
				lctype.localeCompare("moderator") != 0
			) {
				return next(
					new errors.InvalidCredentialsError(
						"Type must be Applicant, Recruiter or Moderator."
					)
				);
			}

			const updatedUser = req.body;
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(updatedUser.password, salt, async (err, hash) => {
					updatedUser.password = hash;
					try {
						const user = await User.findOneAndUpdate(
							{ _id: req.params.id },
							updatedUser
						);

						if (user == null) {
							return next(new errors.ResourceNotFoundError(`There is no user with the id ${req.params.id}`));
						}
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
			});
		});

	// delete user
	server.del(
		"/users/:id",
		rjwt({ secret: config.JWT_SECRET, isRevoked: isRevokedCallback }),
		async (req, res, next) => {
			try {
				if (moderator(req)) {
					const user = await User.findOneAndRemove({ _id: req.params.id });
					if (user == null) {
						return next(new errors.ResourceNotFoundError(`There is no user with the id ${req.params.id}`));
					}
					res.send(204);
					next();
				} else {
					return next(new errors.UnauthorizedError("Only moderators may delete other users"));
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

	server.get(
		"/users/self",
		rjwt({ secret: config.JWT_SECRET, isRevoked: isRevokedCallback }),
		async (req, res, next) => {
			try {
				const bearer = req.header("Authorization");
				const token = bearer.split(" ")[1];
				const payload = jwt.decode(token);

				const user = await User.findById(payload.id);
				if (user == null) {
					return next(new errors.ResourceNotFoundError("User does not exist"));
				}
				res.send(user);
				next();
			} catch (err) {
				return next(new errors.ResourceNotFoundError(err));
			}
		}
	);

	server.put(
		"/users/self",
		rjwt({ secret: config.JWT_SECRET, isRevoked: isRevokedCallback }),
		async (req, res, next) => {
			if (!req.is("application/json")) {
				return next(new errors.InvalidContentError("Expects 'application/json"));
			}
			if (typeof req.body.verified !== "undefined") {
				return next(
					new errors.UnauthorizedError("Cannot modify verified field.")
				);
			}
			const lctype = req.body.type.toLowerCase();
			if (
				lctype.localeCompare("applicant") != 0 &&
				lctype.localeCompare("recruiter") != 0
			) {
				return next(
					new errors.InvalidCredentialsError(
						"Type must be Applicant or Recruiter."
					)
				);
			}
			const bearer = req.header("Authorization");
			const token = bearer.split(" ")[1];
			const payload = jwt.decode(token);

			const updatedUser = req.body;
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(updatedUser.password, salt, async (err, hash) => {
					updatedUser.password = hash;
					try {
						const user = await User.findOneAndUpdate(
							{ _id: payload.id },
							updatedUser
						);

						if (user == null) {
							return next(new errors.ResourceNotFoundError(`There is no user with the id ${payload.id}`));
						}
						res.send(200);
						next();
					} catch (err) {
						return next(
							new errors.ResourceNotFoundError(
								`There is no user with the id ${payload.id}`
							)
						);
					}
				});
			});
		}
	);

	server.del(
		"/users/self",
		rjwt({ secret: config.JWT_SECRET, isRevoked: isRevokedCallback }),
		async(req, res, next) => {
			const bearer = req.header("Authorization");
			const token = bearer.split(" ")[1];
			const payload = jwt.decode(token);

			await User.findOneAndRemove({ _id: payload.id });
			res.send(204);
			next();
		}
	);

	server.get(
		"/verify/:header/:payload/:signature",
		async (req, res, next) => {
			try {
				const token =
					req.params.header +
					"." +
					req.params.payload +
					"." +
					req.params.signature;
				const { email, iat, exp } = jwt.decode(token);

				await User.findOneAndUpdate(
					{ email: email },
					{ verified: true }
				);

				res.send({ iat, exp, token }, 200);
				next();
			} catch (err) {
				return next(new errors.UnauthorizedError("Invalid token."));
			}
		}
	);

	server.post(
		"/logout",
		rjwt({ secret: config.JWT_SECRET, isRevoked: isRevokedCallback }),
		async (req, res, next) => {
			try {
				const token = req.header("Authorization").split(" ")[1];
				const { email, iat, exp } = jwt.decode(token);
				const invalidToken = new InvalidToken({
					email: email,
					iat: iat,
					exp: exp
				});
				await invalidToken.save();
				res.send(200);
				next();
			} catch (err) {
				return next(new errors.UnauthorizedError("Invalid token."));
			}
		}
	);
};
