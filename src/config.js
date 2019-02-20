module.exports = {
	ENV: process.env.NODE_ENV || "development",
	PORT: process.env.PORT || 3000,
	URL: process.env.BASE_URL || "http://localhost:3000",
	MONGODB_URI: process.env.MONGODB_URI,
	MONGODB_URI_STAGING: process.env.MONGODB_URI_STAGING,
	JWT_SECRET: process.env.JWT_SECRET || "secret"
};
