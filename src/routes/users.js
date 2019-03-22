const errors = require("restify-errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rjwt = require("restify-jwt-community");
const User = require("../models/User");
const InvalidToken = require("../models/InvalidToken");
const auth = require("../auth");
const config = require("../config");
const mail = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2 (
	config.CLIENT_ID,
	config.CLIENT_SECRET,
	"https://developers.google.com/oauthplayground"
);
oauth2Client.setCredentials({
	refresh_token: config.REFRESH_TOKEN
});

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
		const rootDir = path.resolve(__dirname, "..");
		const indexPath = path.join(rootDir, "index.html");

		fs.readFile(indexPath, function (err, file) {
			res.writeHead(200, {
				"Content-Length": Buffer.byteLength(file),
				"Content-Type": "text/html"
			});
			res.write(file);
			res.end();
		});
	});

	server.get("/favicon.ico", async (req, res, next) => {
		const rootDir = path.resolve(__dirname, "..", "..");
		const favPath = path.join(rootDir, "favicon.ico");
		const stats = await fs.statSync(favPath);

		fs.readFile(favPath, function (err, file) {
			if (err) {
				res.send(500);
				next();
			}
			res.writeHead(200, {
				"Content-Length": stats.size,
				"Content-Type": "image/ico"
			});
			res.write(file);
			res.end();
		});
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

	function sendEmail (host, user) {
		const token = jwt.sign({ id: user.id, email: user.email, type: user.type }, config.JWT_SECRET, {
			expiresIn: "15m"
		});

		if (config.ENV != "test" && config.ENV != "staging-test") {

			var transporter = mail.createTransport({
				service: "gmail",
				auth: {
					type: "OAuth2",
					user: "authboiis@gmail.com",
					clientId: config.CLIENT_ID,
					clientSecret: config.CLIENT_SECRET,
					refreshToken: config.REFRESH_TOKEN
				}
			});

			const parts = token.split(".");

			const link =
				"http://" +
				host +
				"/verify?header=" +
				parts[0] +
				"&payload=" +
				parts[1] +
				"&signature=" +
				parts[2];

			const mailOptions = {
				from: "authboiis@gmail.com",
				to: user.email,
				subject: "JobHub Account Verification",
				html:
					"Hello New JobHub User!<br> Please click on the link below to verify your email.<br><a href=" +
					link +
					">Click here to verify</a>" +
					"<br> Thanks for using JobHub!"
			};

			transporter.sendMail(mailOptions, function (err, info) {
				if (err)
					console.log(err);
				else
					console.log(info);
				transporter.close();
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
				next();
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
		"/verify",
		async (req, res, next) => {
			try {
				const token =
					req.query.header +
					"." +
					req.query.payload +
					"." +
					req.query.signature;
				const { email, iat, exp } = jwt.decode(token);

				await User.findOneAndUpdate(
					{ email: email },
					{ verified: true }
				);

				// res.send({ iat, exp, token }, 200);
				res.redirect(config.FRONTEND_URL + "/login", next);
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
