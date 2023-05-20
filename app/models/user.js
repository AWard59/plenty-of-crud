const mongoose = require('mongoose')

// Importing the UserProfileSchema from the 'userProfile' module
const { UserProfileSchema } = require('./userProfile')

// Defining the User schema
const User = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    hashedPassword: {
      type: String,
      required: true
    },
    userProfile: [UserProfileSchema], // Embedding UserProfileSchema as an array within the User schema
    token: String
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields to the documents
    toJSON: {
      // Defines a transformation that is applied when calling `.toJSON` on a document
      transform: (_doc, user) => {
        delete user.hashedPassword // Removes the hashedPassword field from the returned JSON
        return user
      }
    }
  }
)

// Exporting the User model
module.exports = mongoose.model('User', User)
