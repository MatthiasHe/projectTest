'use strict';

import User from './user.model';
import config from '../../config/environment';
import jwt from 'jsonwebtoken';

const multer = require('multer');
var path = require('path');
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, '/Users/matt/Desktop/projectTest/server/api/user/avatar');
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
export const upload = multer({ storage: storage });


function validationError(res, statusCode) {
  statusCode = statusCode || 422;
  return function(err) {
    return res.status(statusCode).json(err);
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    return res.status(statusCode).send(err);
  };
}

/**
 * Get list of users
 * restriction: 'admin'
 */
export function index(req, res) {
  return User.find({}, '-salt -password').exec()
    .then(users => {
      res.status(200).json(users);
    })
    .catch(handleError(res));
}

/**
 * Creates a new user
 */
export function create(req, res) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.save()
    .then(function(user) {
      var token = jwt.sign({ _id: user._id }, config.secrets.session, {
        expiresIn: 60 * 60 * 5
      });
      res.json({ token });
    })
    .catch(validationError(res));
}

/**
 * Get a single user
 */
export function show(req, res, next) {
  var userId = req.params.id;

  return User.findById(userId).exec()
    .then(user => {
      if(!user) {
        return res.status(404).end();
      }
      res.json(user);
    })
    .catch(err => next(err));
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
export function destroy(req, res) {
  return User.findByIdAndRemove(req.params.id).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}

/**
 * Change a users password
 */
export function changePassword(req, res) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  return User.findById(userId).exec()
    .then(user => {
      if(user.authenticate(oldPass)) {
        user.password = newPass;
        return user.save()
          .then(() => {
            res.status(204).end();
          })
          .catch(validationError(res));
      } else {
        return res.status(403).end();
      }
    });
}

/**
 * Get my info
 */
export function me(req, res, next) {
  var userId = req.user._id;

  return User.findOne({ _id: userId }, '-salt -password').populate('friends.user friends.room request awaitingRequest').exec()
    .then(user => { // don't ever give out the password or salt
      if(!user) {
        return res.status(401).end();
      }
      return res.json(user);
    })
    .catch(err => next(err));
}

/**
 * Add a friend
 */
export function addFriend(req, res) {
  var userId = req.params.id;
  var roomId = req.body.roomId;
  var newFriendId = req.body.friendId;

  User.findByIdAndUpdate(newFriendId, {$push: {friends: {user: userId, room: roomId}}}).then(newresponse => {
  });
  User.findByIdAndUpdate(newFriendId, {$pull: {awaitingRequest: userId}}).then(newresponse => {
  });
  User.findByIdAndUpdate(userId, {$pull: {request: newFriendId}}).then(newresponse => {
  });
  User.findByIdAndUpdate(userId, {$push: {friends: {user: newFriendId, room: roomId}}}).then(newresponse => {
  });
}

export function rejectFriend(req, res) {
  var userId = req.params.id;
  var newFriendId = req.body.friendId;

  User.findByIdAndUpdate(newFriendId, {$pull: {awaitingRequest: userId}}).then(newresponse => {
  });
  User.findByIdAndUpdate(userId, {$pull: {request: newFriendId}}).then(newresponse => {
  });
}

export function searchFriend(req, res) {
  var friendId;
  var name = req.body.nickname;
  console.log(name);
  User.findOne({name: new RegExp('^' + name)}).exec()
    .then(response => {
      friendId = response._id;
      return res.json(friendId);
    });
}

export function getFriends(req, res) {
  var userId = req.params.id;
  User.findOne({_id: userId}).exec()
    .then(users => { // don't ever give out the password or salt
      if(!users) {
        return res.status(401).end();
      }
      return res.json(users.friends);
    })
    .catch(err => next(err));
}
export function sendFriendRequest(req, res) {
  var userId = req.params.id;
  var friendId = req.body.friendId;
  User.findByIdAndUpdate(friendId, {$push: {request: userId}}).then(response => {
  });
  return User.findByIdAndUpdate(userId, {$push: {awaitingRequest: friendId}}).then(response => {
  });
}

export function getFriendRequest(req, res) {
  var userId = req.params.id;
  User.findOne({_id: userId}).populate('request').exec()
    .then(user => { // don't ever give out the password or salt
      if(!user) {
        return res.status(401).end();
      }
      console.log('fergergergegregregergergergre');
      console.log(user);
      return res.json(user.request);
    })
    .catch(err => next(err));
}

export function getAwaitingRequest(req, res) {
  var userId = req.params.id;
  User.findOne({_id: userId}).populate('awaitingRequest').exec()
    .then(user => { // don't ever give out the password or salt
      if(!user) {
        return res.status(401).end();
      }
      console.log('fergergergegregregergergergre');
      console.log(user);
      return res.json(user.awaitingRequest);
    })
    .catch(err => next(err));
}

export function sendAvatar(req, res) {
  const userId = req.params.id;
  console.log(userId);
  User.findByIdAndUpdate(userId, {avatar: req.file.path}).then(response => {
  });
  console.log(req.file);
}

/**
 * Authentication callback
 */
export function authCallback(req, res) {
  res.redirect('/');
}
