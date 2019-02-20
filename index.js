const restify = require("restify");
const mongoose = require("mongoose");
const rjwt = require("restify-jwt-community");
const config = require("./config");
const corsMiddleware = require("restify-cors-middleware");

const server = restify.createServer();

const isTestEnv = (config.ENV == "test" || config.ENV == "development");

const mongoMem = isTestEnv ? require("mongodb-memory-server") : null;
const mongoServer = isTestEnv ? new mongoMem.MongoMemoryServer() : null;

var cron = require("node-cron");
const InvalidToken = require("./models/InvalidToken");

// server.use(rjwt({ secret: config.JWT_SECRET }).unless({ path: ["/auth"] }));
server.use(restify.plugins.bodyParser());

const cors = corsMiddleware({
	preflightMaxAge: 5, //Optional
	origins: ["*"],
	allowHeaders: ["API-Token", "Authorization"],
	exposeHeaders: ["API-Token-Expiry"]
});

server.pre(cors.preflight);
server.use(cors.actual);

if (isTestEnv) {
	mongoServer.getConnectionString().then(mongoUri => {
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
		mongoose.connect(
			config.ENV == "staging"
				? config.MONGODB_URI_STAGING
				: config.MONGODB_URI,
			{ useNewUrlParser: true }
		);
	});
}

const db = mongoose.connection;

db.on("error", err => console.log(err));

db.once("open", () => {
	require("./routes/users")(server);
	console.log(`Server started on port ${config.PORT}`);
});

function stop() {
	if (isTestEnv) {
		mongoServer.stop();
	}
	server.close();
}

cron.schedule("*/1 * * * *", async () => {
	const tkns = await InvalidToken.find({});
	const current_time = new Date().getTime() / 1000;

	tkns.forEach(function(tkn, index) {
		if (current_time > tkn.exp) {
			/* expired */
			InvalidToken.deleteOne({}, err => {
				if (err !== null) {
					console.log(err);
				}
			});
		}
	});
});

module.exports = server;
module.exports.stop = stop;
