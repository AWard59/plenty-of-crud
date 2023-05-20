const mongoose = require('mongoose')

// Defining the userProfile Schema
const userProfile = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      min: 18,
      max: 99,
      required: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true
    },
    location: {
      type: String,
      required: true
    },
    tag: {
      type: String
    },
    description: {
      type: String,
      required: true
    },
    // profilePicture: {
    //   data: Buffer,
    //   type: String
    // },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likes: [],
    dislikes: [],
    likedBy: [],
    dislikedBy: [],
    matched: []
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt fields to the documents
  }
)

// Exporting the UserProfile model and schema
module.exports.UserProfileModel = mongoose.model('UserProfile', userProfile)
module.exports.UserProfileSchema = userProfile
