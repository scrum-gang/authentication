// process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();

const mongoose = require("mongoose");
var User = require("../models/User");

const server = require("../index");
// console.log("server: ", server);

chai.use(chaiHttp);
describe("endpoints", function() {
    before(function(done) {
        User.deleteMany({}, (err) => {
            done();
        });
    });

    describe("/GET users", function() {
        it("should get all users", function(done) {
            chai.request(server)
                .get("/users")
                .end(function(err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(0);
                    done();
                });
        });
    });

    after(function(done) {
        server.stop(done);
        done();
    });
});