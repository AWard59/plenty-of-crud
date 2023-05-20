const express = require('express')
const mongoose = require('mongoose')
const ObjectID = require('mongodb').ObjectID
const passport = require('passport')

// pull in Mongoose model for userProfile
const { UserProfileModel } = require('../models/userProfile')
const User = require('../models/user')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g. { userProfile: { title: '', text: 'foo' } } -> { userProfile: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /userProfile
// Fetches all user profiles
router.get('/userProfile', requireToken, (req, res, next) => {
  UserProfileModel.find()
  // respond with status 200 and JSON of the userProfile
    .then((userProfile) => res.status(200).json({ userProfile: userProfile }))
  // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /userProfile/5a7db6c74d55bc51bdf39793
// Fetches specific user profile by ID
router.get('/userProfile/matches/userData/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  UserProfileModel.findById(req.params.id)
    .then(handle404)
  // if `findById` is successful, respond with 200 and "userProfile" JSON
    .then((userProfile) => res.status(200).json({
      data: {
        name: userProfile.name,
        age: userProfile.age,
        gender: userProfile.gender,
        location: userProfile.location,
        description: userProfile.description,
        tag: userProfile.tag,
        id: userProfile._id
      }
    }))
  // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /userProfile/5a7db6c74d55bc51bdf39793/matches
// Fetches matches for a specific user profile
router.get('/userProfile/:id/matches', requireToken, removeBlanks, (req, res, next) => {
  UserProfileModel.findById(req.params.id)
    .then(handle404)
    .then((userProfile) => res.status(200).json({ matches: userProfile.matched }))
  // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /userProfile
// Creates a new user profile
router.post('/userProfile', requireToken, (req, res, next) => {
  // set owner of new userProfile to be current user
  req.body.userProfile.owner = req.user._id
  let profile
  UserProfileModel.create(req.body.userProfile)
    .then(handle404)
    .then((userProfile) => {
      profile = userProfile
      res.status(201).json({ userProfile })
    })
    .then(() => User.findById(req.user.id))
    .then(handle404)
    .then(user => {
      user.userProfile.push(profile)
      return user.save()
    })
  // if an error occurs, pass it off to our error handler
  // the error handler needs the error message and the `res` object so that it
  // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /userProfile/5a7db6c74d55bc51bdf39793
// Updates a user profile
router.patch('/userProfile/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.userProfile.owner
  const profileData = req.body.userProfile
  const profileId = req.params.id

  User.findById(req.user.id)
    .then(handle404)
    .then(user => {
      const profileUpdate = user.userProfile.id(profileId)
      profileUpdate.set(profileData)
      return user.save()
    })
  // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
  // if an error occurs, pass it to the handler
    .catch(next)
})

// UPDATE
// PATCH /userProfile/5a7db6c74d55bc51bdf39793/likeOrDislike
// Updates the like or dislike status for a user profile
router.patch('/userProfile/:id/likeOrDislike', requireToken, removeBlanks, (req, res, next) => {
  const targetId = req.body.id
  const likeOrDislike = req.body.data
  const profileId = req.params.id

  User.findById(req.user.id)
    .then(handle404)
    .then((user) => {
      const profileToUpdate = user.userProfile.id(profileId)
      if (likeOrDislike === 'Like') {
        profileToUpdate.likes.push(targetId)
      } else if (likeOrDislike === 'Dislike') {
        profileToUpdate.dislikes.push(targetId)
      }
      return user.save()
    })
    .then(() => {
      UserProfileModel.findById(targetId)
        .then(handle404)
        .then((otherUser) => {
          if (likeOrDislike === 'Like') {
            otherUser.likedBy.push(profileId)
          } else if (likeOrDislike === 'Dislike') {
            profileToUpdate.dislikedBy.push(profileId)
          }
          return otherUser.save()
        })
        .then((otherUserData) => {
          User.findById(otherUserData.owner)
            .then((user) => {
              const profileUpdate = user.userProfile.id(targetId)
              if (profileUpdate !== null) {
                profileUpdate.set(otherUserData)
              }
              return user.save()
            })
        })
    })
  // if that succeeded, return 204
    .then(() => res.sendStatus(204))
  // if an error occurs, pass it to the handler
    .catch(next)
})

// UPDATE
// PATCH /userProfile/5a7db6c74d55bc51bdf39793/likeOrDislike
// Updates matches for a user profile
router.patch('/userProfile/:id/matches', requireToken, removeBlanks, (req, res, next) => {
  const profileId = req.params.id
  const matchIDs = req.body.matchIds
  let newLikes = req.body.newLikes
  let newLikedBy = req.body.newLikedBy

  UserProfileModel.findById(profileId)
    .then(handle404)
    .then((userProfile) => {
      userProfile.likes = newLikes
      userProfile.likedBy = newLikedBy
      for (let j = 0; j < matchIDs.length; j++) {
        userProfile.matched.push(matchIDs[j])
      }
      return userProfile.save()
    })
    .then(() => {
      for (let i = 0; i < matchIDs.length; i++) {
        UserProfileModel.findById(matchIDs[i])
          .then((profile) => {
            profile.matched.push(profileId)
            let likesIndex = profile.likes.indexOf(profileId)
            let likedByIndex = profile.likedBy.indexOf(profileId)
            profile.likes.splice(likesIndex, 1)
            profile.likedBy.splice(likedByIndex, 1)
            return UserProfileModel.updateOne()
          })
      }
    })
  // if that succeeded, return 204
    .then(() => res.sendStatus(204))
  // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /userProfile/5a7db6c74d55bc51bdf39793
// Deletes a user profile
router.delete('/userProfile/:id', requireToken, (req, res, next) => {
  UserProfileModel.findById(req.params.id)
    .then(handle404)
  // ensure the signed in user (req.user.id) is the same as the userProfile's owner (userProfile.owner)
    .then((userProfile) => requireOwnership(req, userProfile))
  // delete userProfile from mongodb
    .then((userProfile) => userProfile.deleteOne())
    .then(() => User.findById(req.user.id))
    .then(user => {
      user.userProfile.pull(req.params.id)
      return user.save()
    })
  // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
  // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
