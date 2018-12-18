	var express = require('express');
	var app = express();
	var bodyParser = require('body-parser');
	var session = require('express-session');
	var urlencodedParser = bodyParser.urlencoded({extended:true});
	
	var MongoClient = require('mongodb').MongoClient;
	var url = 'mongodb://localhost:27017/hexalivechat';
	var sess;
	
	app.use(bodyParser.json());
	app.use(session({secret: 'ssshhhhh'}));
	app.use(bodyParser.json());
	app.use(urlencodedParser);

	/* Customer facing routes */
	module.exports = (function(app){
	app.get('/', function(req, res, next){
		res.render('index');
	});
  
	/* ====================  admin routes ==========================  */
	app.get('/admin', function(req, res, next){
		res.render('admin/login');
	});

	// Login TO DB ==================================================================
	app.post('/admin/dashbrd',urlencodedParser,function(req, res){
		
		res.render('admin/dashboard',{loginData:user});
		/*MongoClient.connect(url, function(err, db) {
			db.collection('adminuser').findOne({ name: req.body.uname}, function(err, user) {
			if(err) {
				console.log(err);
				}else {
					if(user ===null){
						res.end("Login invalid");
					} else if (user.name === req.body.uname && user.pass === req.body.pass){
						res.render('admin/dashboard',{loginData:user});
					} else {
						console.log("Credentials wrong");
						res.end("Login invalid");
					}
				}
			});
		});*/
	});	
	
	/* ==================================== agent routes ======================== */
	app.get('/agent', function(req, res, next){
		sess = req.session;
		
		if(sess.uname) {
			res.redirect('/agent/dashbrd');
		} else {
			res.render('agent/login');
		}
	});	
	
  
	// Login TO DB==================================================================
	app.post('/agent/dashbrd',urlencodedParser,function(req, res){
		
		sess = req.session;
			sess.uname = req.body.uname;
						res.render('agent/dashbrd',{uname: sess.uname});
		
		/*MongoClient.connect(url, function(err, db) {
			db.collection('agents').findOne({ name: req.body.uname}, function(err, user) {
				if(err)	{
					console.log(err);
				}else {
					if(user ===null){
						res.end("Login invalid");
					}else if (user.name === req.body.uname && user.pass === req.body.pass){
						sess.uname = req.body.uname;
						res.render('agent/dashbrd',{uname: sess.uname});
					} else {
						console.log("Credentials wrong");
						res.end("Login invalid");
					}
				}	
			});
		});*/
	});
	
	/* ==================================== agent routes (get) ======================== */
	app.get('/agent/dashbrd', function(req, res, next){
		
		session1 = req.session;
		
		if(session1.uname) {
			res.render('agent/dashbrd', {uname:session1.uname});
		} else {
			res.redirect('/agent');
		}
	});

	// Logout from agent system
	app.get('/agent/logout',function(req, res){
		
		req.session.destroy(function(err) {
			if(err) {
				console.log(err);
			} else {
				res.redirect('/agent');
			}
		});
	});
});