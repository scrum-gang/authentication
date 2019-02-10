module.exports = {
	ENV: process.env.NODE_ENV || "development",
	PORT: process.env.PORT || 3000,
	URL: process.env.BASE_URL || "http://localhost:3000",
	MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb://seb:boiii1@ds121455.mlab.com:21455/authboiis",
	MONGODB_URI_STAGING:
    process.env.MONGODB_URI_STAGING ||
    "mongodb://seb:boiii1@ds129045.mlab.com:29045/authboiis-test",
	JWT_SECRET: process.env.JWT_SECRET || "secret"
};
