const errors = require("restify-errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rjwt = require("restify-jwt-community");
const User = require("../models/User");
const InvalidToken = require("../models/InvalidToken");
const auth = require("../auth");
const config = require("../config");
const nodemailer = require("nodemailer");
var loginAttemptCtr=0;
var loginAttempts = new Object();
var requestCtr = new Object();
var ipDictLogAtt = new Object();
var ipDictReqAtt = new Object();
var timer;

module.exports = server => {
	// register User
	function validateEmail(email) {
		var re = /\S+@\S+\.\S+/;
		return re.test(email);
	}

	function newRequest(ip){
		if (requestCtr[ip]==undefined){
			requestCtr[ip]=1;
		} else { requestCtr[ip]= requestCtr[ip]+1;}
		timer = setTimeout(function(){requestCtr[ip]=requestCtr[ip]-1;}, 60000);

		if (ipDictReqAtt[ip]==1){
			throw "Too many requests, ip timed out.";
		}
		else if(requestCtr[ip]>=20){
			ipDictReqAtt[ip]=1;
			timer = setTimeout(function(){ipDictReqAtt[ip]=0;}, 300000);
		}
	}

	server.post("/signup", async (req, res, next) => {

		ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		try{
			newRequest(ip);
		} catch (err) {
			return next(new errors.UnauthorizedError(err));
		}

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

		loginAttempts[email]=0;

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
			expiresIn: "30m"
		});

		var transporter = nodemailer.createTransport({
			service: "gmail.com",
			auth: {
				user: "authboiis@gmail.com",
				pass: "Boi1s42069"
			}
		});

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
			from: "Authboiis",
			to: user.email,
			subject: "JobHub Account Verification",
			html:
				"Hello New JobHub User!<br> Please click on the link below to verify your email.<br><a href=" +
				link +
				">Click here to verify</a>" +
				"<br> Thanks for using JobHub!"
		};

		transporter.sendMail(mailOptions, function(error, info) {
			if (error) {
				console.log(error);
			} else {
				console.log("Email sent: " + info.response);
			}
		});
	}

	server.post("/resend", async (req, res, next) => {

		ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		try{
			newRequest(ip);
		} catch (err) {
			return next(new errors.UnauthorizedError(err));
		}

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
	});

	// auth user
	server.post("/login", async (req, res, next) => {
		const { email, password } = req.body;

		ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		try{
			newRequest(ip);
		} catch (err) {
			return next(new errors.UnauthorizedError(err));
		}

		try {
			ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
			if (ipDictLogAtt[ip]==1){
				throw "Too many login attempts, please try again later.";
			}
			else if(loginAttempts[email]>=10){
				ipDictLogAtt[ip]=1;
				timer = setTimeout(function(){ipDictLogAtt[ip]=0;}, 300000);
			}
			const user = await auth.authenticate(email, password);
			const token = jwt.sign(
				{ id: user.id, email: user.email, type: user.type },
				config.JWT_SECRET,
				{
					expiresIn: "30m"
				}
			);

			const { iat, exp } = jwt.decode(token);
			const payload = Object.assign({}, { user }, { iat, exp, token });
			res.send(payload);

			next();
		} catch (err) {
			loginAttempts[email]=loginAttempts[email]+1;
			timer = setTimeout(function(){loginAttempts[email]=loginAttempts[email]-1;}, 300000);
			return next(new errors.UnauthorizedError(err));
			
		}
	});

	server.get("/users", async (req, res, next) => {

		ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		try{
			newRequest(ip);
		} catch (err) {
			return next(new errors.UnauthorizedError(err));
		}

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

	// update user
	server.put("/users/:id", async (req, res, next) => {

		ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		try{
			newRequest(ip);
		} catch (err) {
			return next(new errors.UnauthorizedError(err));
		}

		if (!req.is("application/json")) {
			return next(new errors.InvalidContentError("Expects 'application/json"));
		}

		if (typeof req.body.verified !== "undefined") {
			return next(
				new errors.UnauthorizedError("Cannot modify verified field.")
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

	var isRevokedCallback = async function(req, payload, done) {
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

	function owner(req) {
		const bearer = req.header("Authorization");
		const token = bearer.split(" ")[1];
		const payload = jwt.decode(token);

		if (payload.id == req.params.id) {
			config.ENV == "development" && console.log("Its you!");
			return true;
		} else {
			config.ENV == "development" && console.log("Its not you!");
			return false;
		}
	}

	// delete user
	server.del(
		"/users/:id",
		rjwt({ secret: config.JWT_SECRET, isRevoked: isRevokedCallback }),
		async (req, res, next) => {

		ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		try{
			newRequest(ip);
		} catch (err) {
			return next(new errors.UnauthorizedError(err));
		}

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

	server.get(
		"/users/self",
		rjwt({ secret: config.JWT_SECRET, isRevoked: isRevokedCallback }),
		async (req, res, next) => {

		ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		try{
			newRequest(ip);
		} catch (err) {
			return next(new errors.UnauthorizedError(err));
		}

			try {
				const bearer = req.header("Authorization");
				const token = bearer.split(" ")[1];
				const payload = jwt.decode(token);

				const user = await User.findById(payload.id);
				res.send(user);
				next();
			} catch (err) {
				return next(new errors.ResourceNotFoundError(err));
			}
		}
	);

	server.get("/verify/:header/:payload/:signature", async (req, res, next) => {

		ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		try{
			newRequest(ip);
		} catch (err) {
			return next(new errors.UnauthorizedError(err));
		}

		try {
			const token =
				req.params.header +
				"." +
				req.params.payload +
				"." +
				req.params.signature;
			const { email, iat, exp } = jwt.decode(token);

			const user = await User.findOneAndUpdate(
				{ email: email },
				{ verified: true }
			);

			res.send({ iat, exp, token }, 200);
			next();
		} catch (err) {
			return next(new errors.UnauthorizedError("Invalid token."));
		}
	});

	server.post(
		"/logout",
		rjwt({ secret: config.JWT_SECRET, isRevoked: isRevokedCallback }),
		async (req, res, next) => {

		ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		try{
			newRequest(ip);
		} catch (err) {
			return next(new errors.UnauthorizedError(err));
		}

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
