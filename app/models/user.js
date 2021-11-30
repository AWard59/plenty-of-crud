const mongoose = require('mongoose')

const { UserProfileSchema, UserProfileModel } = require('./userProfile')

const User = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		hashedPassword: {
			type: String,
			required: true,
		},
		userProfile: [UserProfileSchema],
		token: String,
	},
	{
		timestamps: true,
		toJSON: {
			// remove `hashedPassword` field when we call `.toJSON`
			transform: (_doc, user) => {
				delete user.hashedPassword
				return user
			},
		},
	}
)

module.exports = mongoose.model('User', User)
