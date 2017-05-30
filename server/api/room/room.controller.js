/* eslint-disable no-unused-vars,no-duplicate-imports */
/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/rooms              ->  index
 * POST    /api/rooms              ->  create
 * GET     /api/rooms/:id          ->  show
 * PUT     /api/rooms/:id          ->  upsert
 * PATCH   /api/rooms/:id          ->  patch
 * DELETE  /api/rooms/:id          ->  destroy
 */

'use strict';

import jsonpatch from 'fast-json-patch';
import Room from './room.model';
import {Message} from './room.model';
import User from '../user/user.model';
import mongoose from 'mongoose';

const multer = require('multer');
var path = require('path');
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, '/Users/matt/Desktop/projectTest/client/assets/files');
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
export const upload = multer({ storage: storage });

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if(entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function(entity) {
    try {
      jsonpatch.apply(entity, patches, /*validate*/ true);
    } catch(err) {
      return Promise.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function(entity) {
    if(entity) {
      return entity.remove()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if(!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of Rooms
export function index(req, res) {
  return Room.find().exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Room from the DB
export function show(req, res) {
  return Room.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Room in the DB
export function create(req, res) {
  if(req.body.private) {
    var privateRoom = true;
  } else {
    var privateRoom = false;
  }
  var params = {
    admin: mongoose.Types.ObjectId(req.body.adminId),
    members: [mongoose.Types.ObjectId(req.body.memberId), mongoose.Types.ObjectId(req.body.friendId)],
    name: req.body.name,
    private: privateRoom
  };
  Room.create(params).then(response => {
    return res.json(response);
  });
}

// Upserts the given Room in the DB at the specified ID
export function upsert(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  return Room.findOneAndUpdate({_id: req.params.id}, req.body, {new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true}).exec()

    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Room in the DB
export function patch(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  return Room.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Room from the DB
export function destroy(req, res) {
  return Room.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}

export function createMessage(req, res) {
  User.findById(req.body.author).then(response => {
    console.log('gdervr = ' + response.name);
    var params = {
      text: req.body.text,
      author: response.name,
      roomId: mongoose.Types.ObjectId(req.body.roomId)
    };
    Message.create(params)
      .then(response => {
        Room.findByIdAndUpdate(response.roomId, {$push: {messages: response._id}}).then(newResponse => {
        });
      });
  });
}

export function getMessages(req, res) {
  var roomId = req.params.id;
  Room.findOne({_id: roomId}).populate({path: 'messages'}).exec()
    .then(room => {
      console.log(room);
      return res.json(room);
    });
}

export function getParticipants(req, res) {
  var roomId = req.params.id;
  Room.findOne({_id: roomId}).populate('members').exec()
    .then(room => {
      console.log(room);
      return res.json(room);
    });
}

export function addMember(req, res) {
  var roomId = req.params.id;
  var newMember = req.body.newMemberId;
  Room.findByIdAndUpdate(roomId, {$push: {members: newMember}}).then(response => {
  });
}

export function getPublicUserRooms(req, res) {
  var userId = req.body.userId;
  Room.find({ private: false }).then(response => {
    return res.json(response);
  });
}

export function joinRoom(req, res) {
  var userId = req.body.userId;
  var roomId = req.params.id;
  Room.findByIdAndUpdate(roomId, {$push: {members: userId}}).then(response => {
  });
}

export function sendFile(req, res) {
  return res.json(req.file.filename);
}
