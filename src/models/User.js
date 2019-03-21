const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		trim: true
	},
	password: {
		type: String,
		required: true
	},
	type: {
		type: String,
		required: true,
		trim: true
	},
	verified: {
		type: Boolean,
		required: true
	},
	name: {
		type: String,
		required: false,
		trim: true
	},
	address: {
		type: String,
		required: false,
		trim: true
	},
	github: {
		type: String,
		required: false,
		trim: true
	},
	linkedin: {
		type: String,
		required: false,
		trim: true
	},
	stackoverflow: {
		type: String,
		required: false,
		trim: true
	}
},
{
	timestamps: {
		createdAt: "created_at",
		updatedAt: "updated_at"
	}
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
