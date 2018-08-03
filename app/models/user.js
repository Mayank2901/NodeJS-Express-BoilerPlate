'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const config = require('config');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const jwt = require('jsonwebtoken')
// const oAuthTypes = require('oauth');


/**
 * User Schema
 */

const UserSchema = new Schema({
  _id: {
    type: ObjectId,
    default: mongoose.Types.ObjectId
  },
  user_name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: '',
    index: { 
      unique: true 
    }
  },
  hashed_password: {
    type: String,
    default: ''
  },
  unique_code: {
    type: Number,
    default: 0
  },
  salt: {
    type: String,
    default: ''
  },
  authToken: {
    type: String,
    default: ''
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  created: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
  }
});


/**
 * Virtuals
 */

UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });


/**
 * Methods
 */

UserSchema.methods = {

  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */

  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */

  makeSalt: function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */

  encryptPassword: function(password) {
    if (!password) return '';
    try {
      return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
    } catch (err) {
      return '';
    }
  },

  /**
   * Validation is not required if using OAuth
   * Used on the case of different providers like google, facebook etc.
   */

  // skipValidation: function() {
  //   return ~oAuthTypes.indexOf(this.provider);
  // }
};


/**
 * Statics
 */

UserSchema.statics = {

  /**
   * Create
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */
  create: function(options, cb) {
    var newUser = this(options)
    return newUser.save(cb)
  },


  /**
   * Load
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  load: function(options, cb) {
    options.select = options.select || 'user_name email _id email_verified';
    return this.findOne(options.criteria)
      // .populate(options.populate)
      .select(options.select)
      .lean()
      .exec(cb);
  },

  /**
   * FindOne
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  findObject: function(options, cb) {
    options.select = options.select || 'user_name email _id email_verified';
    return this.findOne(options.criteria)
      // .populate(options.populate)
      .select(options.select)
      .exec(cb);
  },

  /**
   * findMany
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  findMany: function(options, cb) {
     options.select = options.select || 'user_name email _id email_verified';
    return this.find(options.criteria)
      // .populate(options.populate)
      .select(options.select)
      .lean()
      .exec(cb);
  },

  /**
   * generateToken
   *
   * @param {ObjectId} _id
   * @param {String} email, user_name
   * @param {Function} cb
   * @api private
   */

  generateToken: function(_id, email, user_name){
    var token = jwt.sign({
      _id: String(_id),
      user_name: user_name,
      email: email,
    }, config.sessionSecret, {
      expiresIn: 60 * 120
    });
    return token
  },

  /**
   * update
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  updateUser: function(options, cb) {
    options.fields = options.select || 'user_name email _id email_verified';
    return this.findOneAndUpdate(options.criteria, {$set: options.selector}, {new: true, fields: options.fields})
      .exec(cb)
  },

};

mongoose.model('User', UserSchema);