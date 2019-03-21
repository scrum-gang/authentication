const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();

const User = require("../../src/models/User");
const InvalidToken = require("../../src/models/InvalidToken");

const server = require("../../src/index");

chai.use(chaiHttp);

const newUser = {
	"email": "realperson@realemail.com",
	"password": "abc123",
	"type": "Applicant"
};

const godMode = {
	"email": "god@realemail.com",
	"password": "cdb234",
	"type": "Applicant"
};

var godToken = null;

describe("Endpoints: functionality", function () {
	beforeEach(function (done) {
		User.deleteMany({}, function (err) {
			InvalidToken.deleteMany({}, function (err) {
				chai.request(server)
					.post("/signup")
					.send(godMode)
					.end(function (err, res) {
						User.findOneAndUpdate(
							{ email: godMode.email },
							{ verified: true, type: "Moderator" }
							, function (err, doc, res) {
								chai.request(server)
									.post("/login")
									.send({ "email": godMode.email, "password": godMode.password })
									.end(function (err, res) {
										godToken = res.body.token;
										done();
									});
							});
					});
			});
		});
	});

	// Test /users GET
	it("should get all users on /users GET", function (done) {
		chai.request(server)
			.get("/users")
			.set("Authorization", "Bearer " + godToken)
			.end(function (err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a("array");
				res.body.length.should.be.equal(1);
				done();
			});
	});

	// Test /signup POST
	it("should add a single user on /signup POST", function (done) {
		chai.request(server)
			.post("/signup")
			.send(newUser)
			.end(function (err, res) {
				res.should.have.status(201);
				res.should.be.json;
				res.body.should.have.property("_id");
				res.body._id.should.be.a("string");

				const userId = res.body._id;

				// Get user
				chai.request(server)
					.get("/users/" + userId)
					.set("Authorization", "Bearer " + godToken)
					.end(function (err, res) {
						res.body.should.have.property("created_at");
						res.body.should.have.property("updated_at");
						res.body._id.should.equal(userId);
						res.body.email.should.equal(newUser.email);
						res.body.type.should.equal(newUser.type);
						done();
					});
			});
	});

	it("should NOT add a user if there is another with the same email on /signup POST", function (done) {
		chai.request(server)
			.post("/signup")
			.send(newUser)
			.end(function (err, res) {
				chai.request(server)
					.post("/signup")
					.send(newUser)
					.end(function (err, res) {
						res.should.have.status(400);
						done();
					});
			});
	});

	// Test /users/:id GET
	it("should get a single user by id on /users/:id GET", function (done) {
		// Add new user
		chai.request(server)
			.post("/signup")
			.send(newUser)
			.end(function (err, res) {
				const userId = res.body._id;

				// Get new user using ID
				chai.request(server)
					.get("/users/" + userId)
					.set("Authorization", "Bearer " + godToken)
					.end(function (err, res) {
						res.should.have.status(200);
						res.should.be.json;
						res.body.should.have.property("password");
						res.body.should.have.property("created_at");
						res.body.should.have.property("updated_at");
						res.body._id.should.equal(userId);
						res.body.email.should.equal(newUser.email);
						res.body.type.should.equal(newUser.type);
						res.body.verified.should.equal(false);
						done();
					});
			});
	});

	// Test /users/:id PUT
	it("should update a single user by id on /users/:id PUT", function (done) {
		// Add new user
		chai.request(server)
			.post("/signup")
			.send(newUser)
			.end(function (err, res) {
				const userId = res.body._id;

				// Get current password
				chai.request(server)
					.get("/users/" + userId)
					.set("Authorization", "Bearer " + godToken)
					.end(function (err, res) {
						const oldPassword = res.body.password;
						const oldTimestamp = res.body.updated_at;
						const updateUser = {
							"email": "realperson2@realemail.com",
							"password": "def456",
							"type": "Applicant"
						};

						// Update new user
						chai.request(server)
							.put("/users/" + userId)
							.send(updateUser)
							.set("Authorization", "Bearer " + godToken)
							.end(function (err, res) {
								res.should.have.status(200);

								// Verify user was updated
								chai.request(server)
									.get("/users/" + userId)
									.set("Authorization", "Bearer " + godToken)
									.end(function (err, res) {
										res.body._id.should.equal(userId);
										res.body.email.should.equal(updateUser.email);
										res.body.type.should.equal(updateUser.type);
										res.body.password.should.not.equal(oldPassword);
										res.body.updated_at.should.not.equal(oldTimestamp);
										res.body.verified.should.equal(false);
										done();
									});
							});
					});
			});
	});

	// Test /login POST
	it("should login an existing user on /login POST", function (done) {
		// Add new user
		chai.request(server)
			.post("/signup")
			.send(newUser)
			.end(function (err, res) {
				User.findOneAndUpdate(
					{ email: newUser.email },
					{ verified: true }
					, function (err, doc, res) {
						// Login user
						chai.request(server)
							.post("/login")
							.send({ "email": newUser.email, "password": newUser.password })
							.end(function (err, res) {
								res.should.have.status(200);
								res.should.be.json;
								res.body.should.have.property("user");
								res.body.should.have.property("iat");
								res.body.should.have.property("exp");
								res.body.should.have.property("token");
								done();
							});
					});
			});
	});

	// Test /logout POST
	it("should logout a previously logged in user on /logout POST", function (done) {
		// Add new user
		chai.request(server)
			.post("/signup")
			.send(newUser)
			.end(function (err, res) {
				User.findOneAndUpdate(
					{ email: newUser.email },
					{ verified: true }
					, function (err, doc, res) {
						// Login user
						chai.request(server)
							.post("/login")
							.send({ "email": newUser.email, "password": newUser.password })
							.end(function (err, res) {
								const { iat, exp, token } = res.body;
								chai.request(server)
									.post("/logout")
									.set("Authorization", "Bearer " + token)
									.end(function (err, res) {
										res.should.have.status(200);

										// Check token expired
										chai.request(server)
											.get("/users/self")
											.set("Authorization", "Bearer " + token)
											.end(function (err, res) {
												res.should.have.status(401);
												done();
											});
									});
							});
					});
			});
	});

	// Test /users/:id DEL
	it("should delete the user associated with id on /users/:id DEL", function (done) {
		// Add user
		chai.request(server)
			.post("/signup")
			.send(newUser)
			.end(function (err, res) {
				const userId = res.body._id;

				User.findOneAndUpdate(
					{ email: newUser.email },
					{ verified: true }
					, function (err, doc, res) {
						// Delete user
						chai.request(server)
							.del("/users/" + userId)
							.set("Authorization", "Bearer " + godToken)
							.end(function (err, res) {
								res.should.have.status(204);

								chai.request(server)
									.get("/users/" + userId)
									.set("Authorization", "Bearer " + godToken)
									.end(function (err, res) {
										res.should.have.status(404);
										done();
									});
							});
					});
			});
	});

	// Test /users/self GET
	it("should send the user associated with the given token on /users/self GET", function (done) {
		// Add user
		chai.request(server)
			.post("/signup")
			.send(newUser)
			.end(function (err, res) {
				const userId = res.body._id;

				User.findOneAndUpdate(
					{ email: newUser.email },
					{ verified: true }
					, function (err, doc, res) {
						// Login user
						chai.request(server)
							.post("/login")
							.send({ "email": newUser.email, "password": newUser.password })
							.end(function (err, res) {
								const { iat, exp, token } = res.body;
								// Get self
								chai.request(server)
									.get("/users/self")
									.set("Authorization", "Bearer " + token)
									.end(function (err, res) {
										res.should.have.status(200);
										res.body._id.should.equal(userId);
										done();
									});
							});
					});
			});
	});

	// Test /resend POST
	it("should resend an email if the user is unverified on /resend POST", function (done) {
		// Add user
		chai.request(server)
			.post("/signup")
			.send(newUser)
			.end(function (err, res) {
				chai.request(server)
					.post("/resend")
					.send({"email": newUser.email})
					.end(function (err, res) {
						res.should.have.status(200);
						done();
					});
			});
	});

	it("should NOT resend an email if the user is already verified on /resend POST", function (done) {
		// Add user
		chai.request(server)
			.post("/signup")
			.send(newUser)
			.end(function (err, res) {
				const userId = res.body._id;

				User.findOneAndUpdate(
					{ email: newUser.email },
					{ verified: true }
					, function (err, doc, res) {
						chai.request(server)
							.post("/resend")
							.send({"email": newUser.email})
							.end(function (err, res) {
								res.should.have.status(400);
								done();
							});
					});
			});
	});

	it("should NOT resend an email of the user doesn't exist on /resend POST", function (done) {
		chai.request(server)
			.post("/resend")
			.send({"email": "fakeemail@gmail.com"})
			.end(function (err, res) {
				res.should.have.status(400);
				done();
			});
	});

	after(function (done) {
		User.deleteMany({}, function (err) {
			InvalidToken.deleteMany({}, function (err) {
				done();
			});
		});
	});
});
