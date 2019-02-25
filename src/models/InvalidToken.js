const mongoose = require("mongoose");

const InvalidTokenSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true
	},
	iat: {
		type: String,
		required: true
	},
	exp: {
		type: String,
		required: true
	}
});

const InvalidToken = mongoose.model("InvalidToken", InvalidTokenSchema);
module.exports = InvalidToken;
