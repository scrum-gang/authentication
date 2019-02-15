const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();

const User = require("../../models/User");

const server = require("../../index");

const newUser = {
	"email": "realperson@realemail.com",
	"password": "abc123",
	"type": "Applicant"
};

chai.use(chaiHttp);

describe("Endpoints: functionality", function () {
	beforeEach(function (done) {
		User.deleteMany({}, function (err) {
			done();
		});
	});

	// Test /users GET
	it("should get all users on /users GET", function (done) {
		chai.request(server)
			.get("/users")
			.end(function (err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a("array");
				res.body.length.should.be.equal(0);
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

				// Get all users and verify new one is present
				chai.request(server)
					.get("/users")
					.end(function (err, res) {
						res.body[0]._id.should.equal(userId);
						res.body[0].email.should.equal(newUser.email);
						res.body[0].type.should.equal(newUser.type);
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
					.end(function (err, res) {
						res.should.have.status(200);
						res.should.be.json;
						res.body.should.have.property("password");
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
					.end(function (err, res) {
						const oldPassword = res.body.password;
						const updateUser = {
							"email": "realperson2@realemail.com",
							"password": "def456",
							"type": "Applicant"
						};

						// Update new user
						chai.request(server)
							.put("/users/" + userId)
							.send(updateUser)
							.end(function (err, res) {
								res.should.have.status(200);

								// Verify user was updated
								chai.request(server)
									.get("/users/" + userId)
									.end(function (err, res) {
										res.body._id.should.equal(userId);
										res.body.email.should.equal(updateUser.email);
										res.body.type.should.equal(updateUser.type);
										res.body.password.should.not.equal(oldPassword);
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
								res.body.should.have.property("iat");
								res.body.should.have.property("exp");
								res.body.should.have.property("token");
								done();
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
						// Login user
						chai.request(server)
							.post("/login")
							.send({ "email": newUser.email, "password": newUser.password })
							.end(function (err, res) {
								const { iat, exp, token } = res.body;
								// Delete user
								chai.request(server)
									.del("/users/" + userId)
									.set("Authorization", "Bearer " + token)
									.send()
									.end(function (err, res) {
										res.should.have.status(204);

										chai.request(server)
											.get("/users/" + userId)
											.end(function (err, res) {
												should.not.exist(res.body);
												done();
											});
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
									.send()
									.end(function (err, res) {
										res.should.have.status(200);
										res.body._id.should.equal(userId);
										done();
									});
							});
					});
			});
	});

	after(function (done) {
		User.deleteMany({}, function (err) {
			server.stop();
			done();
		});
	});
});
