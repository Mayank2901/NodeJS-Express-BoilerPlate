/**
 * Expose
 */

module.exports = {
	db: 'mongodb://' + process.env.MONGO_HOST + ':' + process.env.MONGO_PORT + '/' + process.env.MONGO_DATABASE, //'mongodb://root:root@ds045027.mongolab.com:45027/askparrot_api',
	// db: 'mongodb://localhost:27017/trivia',
	logDir: './logs/', //@todo : check if log directory exits, if not create one.
	sessionSecret: "thisisareallylongandbigsecrettoken",
	mongoose: {
		user: process.env.MONGO_USER,
		pass: process.env.MONGO_PASS,
		server: {
			socketOptions: {
				keepAlive: 1
			}
		}
	}
};