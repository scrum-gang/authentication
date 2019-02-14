const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = mongoose.model("User");

exports.authenticate = (email, password) => {
	return new Promise(async (resolve, reject) => {
		try {
			const user = await User.findOne({ email });

			bcrypt.compare(password, user.password, (err, isMatch) => {
				if (err) throw err;
				if (isMatch) {
					if (!user.verified) {
						reject("Unverified user.");
					} else {
						resolve(user);
					}
				} else {
					reject("Authentication failed.");
				}
			});
		} catch (err) {
			// email not found
			reject("Authentication failed");
		}
	});
};
