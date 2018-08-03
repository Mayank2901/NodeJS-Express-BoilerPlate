'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
const User = mongoose.model('User');

/**
 * Expose
 */

module.exports = new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    const options = {
      criteria: {
        email: email
      },
      select: '_id user_name email active salt hashed_password'
    };
    User.findObject(options, function(err, user) {
      if (err) return done(err);
      if (!user) {
        return done(null, false, {
          message: 'Invalid Email'
        });
      }
      if (!user.authenticate(password)) {
        return done(null, false, {
          message: 'Invalid Pass'
        });
      }
      return done(null, user);
    });
  }
);