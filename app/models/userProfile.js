const mongoose = require('mongoose')

const userProfile = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		age: {
			type: Number,
			min: 18,
			max: 99,
			required: true,
		},
		gender: {
			type: String,
			enum: ['Male', 'Female'],
			required: true,
		},
		location: {
			type: String,
			required: true,
		},
		tag: {
			type: String,
		},
		description: {
			type: String,
			required: true,
		},
		// profilePicture: {
		//   data: Buffer,
		//   type: String
		// },
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		likes: [],
		dislikes: [],
		likedBy: [],
		dislikedBy: [],
		matched: []
	},
	{
		timestamps: true,
	}
)

module.exports.UserProfileModel = mongoose.model('UserProfile', userProfile)
module.exports.UserProfileSchema = userProfile
