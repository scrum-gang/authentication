const restify = require("restify");
const mongoose = require("mongoose");
const rjwt = require("restify-jwt-community");
const config = require("./config");

const server = restify.createServer();

const isTestEnv = process.env.NODE_ENV == "test";

const mongoMem = isTestEnv ? require("mongodb-memory-server") : null;
const mongoServer = isTestEnv ? new mongoMem.MongoMemoryServer() : null;

// server.use(rjwt({ secret: config.JWT_SECRET }).unless({ path: ["/auth"] }));
server.use(restify.plugins.bodyParser());

if (isTestEnv) {
	mongoServer.getConnectionString().then((mongoUri) => {
		const mongooseOpts = {
			autoReconnect: true,
			reconnectTries: Number.MAX_VALUE,
			reconnectInterval: 1000,
			useNewUrlParser: true
		};

		server.listen(config.PORT, () => {
			mongoose.set("useFindAndModify", false);
			mongoose.connect(mongoUri, mongooseOpts);
		});
	});
} else {
	server.listen(config.PORT, () => {
		mongoose.set("useFindAndModify", false);
		mongoose.connect(((process.env.NODE_ENV == "staging") ? config.MONGODB_URI_STAGING : config.MONGODB_URI), { useNewUrlParser: true });
	});
}

const db = mongoose.connection;

db.on("error", err => console.log(err));

db.once("open", () => {
	require("./routes/users")(server);
	console.log(`Server started on port ${config.PORT}`);
});

function stop () {
	if (isTestEnv) {
		mongoServer.stop();
	}
	server.close();
}

module.exports = server;
module.exports.stop = stop;
