/*
Load all models here
*/
var mongoose = require('mongoose');
var session = require('session');
var config = require('config');
var https = require('https');
var passport = require('passport');
var User = mongoose.model('User');
  /* the response object for API
    error : true / false 
    code : contains any error code
    data : the object or array for data
    userMessage : the message for user, if any.
  */

var response = {
  error: false,
  data: null,
  userMessage: '',
  errors: null
};

var NullResponseValue = function() {
  response = {
    error: false,
    data: null,
    userMessage: '',
    errors: null
  };
  return true;
};
var SendResponse = function(res, status) {
  return res.status(status || 200).send(response);
};

var methods = {};
/*
Routings/controller goes here
*/
module.exports.controller = function(router) {

  router.route('/users')
    .post(methods.createUser)
    // .put(session.checkToken, methods.updateUser)
    .get(session.checkToken, methods.getUser)

  router.route('/users/session')
    .post(methods.login)
    .delete(session.checkToken, methods.logout)

};

/**************************************************************************************************************************/
/***************************************** All the HTTP methods goes here *************************************************/
/**************************************************************************************************************************/

generateRandomNumber = function(length) {
  Math.floor(Math.pow(10, (length - 1)) + Math.random() * (9 * Math.pow(10, (length - 1))))
}

/*=========================================
***   create user for the first time  ***
===========================================*/
methods.createUser = function(req, res) {
  req.checkBody('email', 'Valid Email address is required.').notEmpty().isEmail();
  req.checkBody('user_name', 'User name cannot be empty.').notEmpty();
  req.checkBody('password', 'password cannot be empty and must be greater that 8 characters.').notEmpty().isLength({ min: 8 });
  var errors = req.validationErrors(true);
  if(errors){
    response.error = true;
    response.userMessage = 'Validation Error'
    response.data = null;
    response.errors = errors;
    return SendResponse(res, 400);
  } else {
    var options = {
      email: req.body.email,
      password: req.body.password,
      user_name: req.body.user_name,
      authToken: User.generateToken(mongoose.Types.ObjectId, req.body.email, req.body.user_name)
    }
    User.create(options, function(err, newUser){
      if (err) {
        if (err.ValidationError) {
          response.error = true;
          response.userMessage = 'Validation Error'
          response.data = null;
          response.errors = err.errors;
          return SendResponse(res, 400);
        } else {
          response.error = true;
          response.userMessage = 'Server Error'
          response.data = null;
          response.errors = err;
          return SendResponse(res, 500);
        }
      } else {
        // mail(newuser.email, 'Validation Code', 'Your verification code for AskParrot is ' + newuser.authToken);
        // response.error = false;
        // response.data = {
        //   user: {
        //     email: newuser.email,
        //     user_name: newuser.firstName,
        //     last_name: newuser.lastName,
        //     _id: newuser._id,
        //     email_verified: newuser.email_verified,
        //     last_login: newuser.last_login,
        //   },
        //   token: session.token
        // };
        response.error = false;
        response.userMessage = 'User signup successfully'
        response.errors = null;
        response.data = {'token': options.authToken}
        return SendResponse(res, 200);
      }
    });
  }
};
/*-----  End of createUser  ------*/


/*=========================================
      ***   update user  ***
===========================================*/
methods.updateUser = function(req, res) {
  req.checkBody('user_name', 'First name cannot be empty.').notEmpty();
  var errors = req.validationErrors(true);
  if(errors){
    response.error = true;
    response.userMessage = 'Validation Error'
    response.data = null;
    response.errors = errors;
    return SendResponse(res, 400);
  } else {
    var options = {
      criteria: {
        _id: req.user._id
      },
      selector: {
        user_name: req.body.user_name,
      }
    }
    User.updateUser(options, function(err, updatedUser){
      if (err) {
        if (err.ValidationError) {
          response.error = true;
          response.userMessage = 'Validation Error'
          response.data = null;
          response.errors = err.errors;
          return SendResponse(res, 400);
        } else {
          response.error = true;
          response.userMessage = 'Server Error'
          response.data = null;
          response.errors = err;
          return SendResponse(res, 500);
        }
      } else {
        response.error = false;
        response.userMessage = 'User updated successfully'
        response.errors = null;
        response.code = 200;
        return SendResponse(res, 200);
      }
    });
  }
};
/*-----  End of updateUser  ------*/


/*=========================================
      ***   get user  ***
===========================================*/
methods.getUser = function(req, res) {
  var options = {
    criteria: {
      _id: req.user._id
    }
  }
  User.load(options, function(err, user){
    if (err) {
      if (err.ValidationError) {
        response.error = true;
        response.userMessage = 'Validation Error'
        response.data = null;
        response.errors = err.errors;
        return SendResponse(res, 400);
      } else {
        response.error = true;
        response.userMessage = 'Server Error'
        response.data = null;
        response.errors = err;
        return SendResponse(res, 500);
      }
    } else {
      response.error = false;
      response.userMessage = 'User data'
      response.errors = null;
      response.data = user;
      return SendResponse(res, 200);
    }
  });
};
/*-----  End of getUser  ------*/


/*=========================================
      ***   user login  ***
===========================================*/
methods.login = function(req, res, next) {
	//Check for any errors.
	req.checkBody('email', 'Email cannot be empty.').notEmpty();
	req.checkBody('password', 'Password cannot be empty.').notEmpty();

	var errors = req.validationErrors(true);
	if (errors) {
		response.error = true;
		response.errors = errors;
		response.userMessage = 'Validation Errors';
		return SendResponse(res, 400);
	} else {
		passport.authenticate('local', function(err, user, info) {
			if (err) {
				response.error = true;
				response.userMessage = 'Server Error';
        response.data = null;
        response.errors = err; 
				return SendResponse(res, 500);
			} else {
				if (!user) {
					response.error = true;
					response.data = null;
					response.userMessage = info.message;
					return SendResponse(res, 400);
				} else {
					if (user.active) {
            var options = {
              criteria: {
                _id: user._id
              },
              selector: {
                authToken: User.generateToken(user._id, user.email, user.user_name)
              }
            }
            User.updateUser(options, function(err, updatedUser){
              if (err) {
                response.error = true;
								response.userMessage = 'Server Error';
								response.data = null;
								response.errors = err;
								return SendResponse(res, 500);
              } else {
                response.error = false;
								response.userMessage = 'User loggin successfully';
								response.data = {'token': options.selector.authToken};
                response.errors = null;
								return SendResponse(res, 200);
              }
            })
					} else {
						response.error = true;
						response.userMessage = 'Not Active';
						response.data = null;
						response.errors = null;
						return SendResponse(res, 410);
					}
				}
			}
		})(req, res, next);
	}
};
/*-----  End of login  ------*/


/*=========================================
      ***   user logout  ***
===========================================*/
methods.logout = function(req, res) {
  var options = {
    criteria: {
      _id: req.user._id
    },
    selector: {
      authToken: "logout"
    }
  }
  User.updateUser(options, function(err, user){
    if (err) {
      if (err.ValidationError) {
        response.error = true;
        response.userMessage = 'Validation Error'
        response.data = null;
        response.errors = err.errors;
        return SendResponse(res, 400);
      } else {
        response.error = true;
        response.userMessage = 'Server Error'
        response.data = null;
        response.errors = err;
        return SendResponse(res, 500);
      }
    } else {
      response.error = false;
      response.userMessage = 'User successfully logged out'
      response.errors = null;
      response.data = null;
      return SendResponse(res, 200);
    }
  });
};
/*-----  End of logout  ------*/

