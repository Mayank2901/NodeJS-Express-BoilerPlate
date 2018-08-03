var mongoose = require('mongoose');
var User = mongoose.model('User');
var session = {};


var response = {
  error: false,
  data: null,
  userMessage: '',
  errors: null
};
var sendResponse = function(res,status){
	return res.status(status || 200).send(response);
}



/*=========================================
***   check token for loggedin user  ***
===========================================*/
session.checkToken = function(req,res,next){
    var bearerToken;
	var bearerHeader = req.headers["authorization"];
	if (typeof(bearerHeader) !== 'undefined') {

		var bearer = bearerHeader.split(" ");
		bearerToken = bearer[1];
		req.token = bearerToken;
		//bearerToken = bearerToken.slice(1,bearerToken.length).slice(0,-1);
	}
	var token = bearerToken || req.body.token || req.query.token;
	
	const options = {
      criteria: {
        authToken: token
      },
    };
	User
	.load(options, function(err,data){
		if(err){
			response.error = true;
      response.errors = err
			response.userMessage = "There was a problem with the request, please try again."
			return sendResponse(res, 500);
		}
		else{
			if(data)
			{ // Horray!! Your session exists.
				req.user = data;
				return next();
			}
			else
			{
        response.userMessage = "Your session doesn't exits.";
        response.error = true
				return sendResponse(res,403);
			}
		}
  })
};
/*-----  End of checkToken  ------*/

module.exports = session;