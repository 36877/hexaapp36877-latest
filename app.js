/* 
 *	===============================================================================
 *	HexaLiveChat Application
 *	===============================================================================
 */

	var express = require('express');
	var http = require('http');
	var app = express();
	var bodyParser = require('body-parser');
	var server = http.createServer(app);
	var session = require('express-session');
	var io = require('socket.io').listen(server);
	var port = process.env.PORT || 3000;
	// var ioClient = require('socket.io-client')('https://agentlivechat-latest.herokuapp.com/');
	var ioClient = require('socket.io-client')('*');
	var mainController = require('./controller/mainController');
	
	var sess; 
	
	customers = [];
	agents = [];
	
	usersWaitingForAgents = [];
	usersConversationInPgrs = [];
	
	app.set('view engine','ejs');
	 app.use(bodyParser.json());
	app.use(express.static(__dirname + '/public'));	
	app.use(session({secret: 'ssshhhhh'}));

	mainController(app);
	
	io.set('log level', 2);
	io.set('transports', [ 'websocket', 'polling' ]);
	
	io.sockets.on('connection', function(socket) {

		socket.on('subscribe', function(data) { 
			
			socket.join(data.uId);
			
			console.log('\nUser ' + data.userName + ' has been joined in room '+data.uId);
			console.log('\n After subscribe :');
			console.log('\n Customers :');
			
			for( var i=0; i < customers.length; i++ ){
				console.log('\n User Id :' + customers[i].uId + ' User name :' + customers[i].userName);
			}
			
			console.log('\n Agents :');
			
			for(var i=0; i < agents.length; i++){
				console.log('\n Agent Id :' + agents[i].uId + ' Agent name :' + agents[i].userName);
			}
			
			console.log('\n total agents : '+agents.length);
			console.log('\n total customers : '+customers.length);
			console.log('\n------------------------------------------------');
		});
		
		socket.on('unsubscribe', function(data) {  
			console.log('unsubscribe called. usertype :'+data.userType+' userName :'+data.userName+' uId :'+data.uId);
			if(data.userType == 'customer'){
				io.of('/').in(data.uId).clients(function(error, clients) {
					if(clients.length > 0) {
						console.log('Inside customer part');
						clients.forEach(function (socket_id) {
							io.sockets.sockets[socket_id].leave(data.uId);
							
							var index = customers.map(function(e) { return e.uId; }).indexOf(data.uId);
							
							if(index > -1){
								customers.splice(index, 1);
								io.sockets.emit('userLeft', {uId : data.uId, totalWaitingUsers : customers.length} );
								
								console.log('\nAfter unsubscribe :');
								console.log('\n Customers :');
								
								for( var i=0; i < customers.length; i++ ){
									console.log('\n UserId :' + customers[i].uId + ' UserName :' + customers[i].userName);
								}
								
								console.log('\n Agents :');
								
								for(var i=0; i < agents.length; i++){
									console.log('\n Agent Id :' + agents[i].uId + ' Agent name :' + agents[i].userName);
								}
							}
						});
						
						console.log('\n Room for '+data.userName+' ('+data.uId+') deleted successfully');	
						
						console.log('\n total agents : '+agents.length);
						console.log('\n total customers : '+customers.length);
						console.log('\n------------------------------------------------');
					}
				});
			} else {
				io.of('/').in(data.uId).clients(function(error, clients) {
					if(clients.length > 0) {
						console.log('Inside agent part');
						clients.forEach(function (socket_id) {
							io.sockets.sockets[socket_id].leave(data.uId);
							
							var index = agents.map(function(e) { return e.uId; }).indexOf(data.uId);
							
							if(index > -1){
								agents.splice(index, 1);
								io.sockets.emit('userLeft', {uId : data.uId, totalWaitingUsers : customers.length} );
								
								console.log('\nAfter unsubscribe :');
								console.log('\n Customers :');
								
								for( var i=0; i < customers.length; i++ ){
									console.log('\n UserId :' + customers[i].uId + ' UserName :' + customers[i].userName);
								}
								
								console.log('\n Agents :');
								
								for(var i=0; i < agents.length; i++){
									console.log('\n Agent Id :' + agents[i].uId + ' Agent name :' + agents[i].userName);
								}
							}
						});
						
						console.log('\n Room for '+data.userName+' ('+data.uId+') deleted successfully');	
						
						console.log('\n total agents : '+agents.length);
						console.log('\n total customers : '+customers.length);
						console.log('\n------------------------------------------------');
					}
				});
			}
		});		
		
		socket.on('setUserName', function(data) {
			console.log('I am inside setUserName : ', data);
			var uId = generateId();
			
			if(data.userType === 'agent'){
				if(agents.indexOf(data.userName) > -1) {
					socket.emit('userExists',  { errorMsg : 'Agent Username already exists. Please try again.'});
				} else {
					if(agents.indexOf(uId) > -1) {
						socket.emit('userExists',  { errorMsg : 'Technical error. Please try again.'});
					} else {
						agents.push({uId: uId, userName : data.userName});
						socket.emit('userSet', {uId : uId, userName: data.userName});
						console.log('\n'+data.userName + ' has been added to the agents list');
					}
				}
				
			} else if(data.userType === 'customer'){
				if(customers.indexOf(data.userName) > -1) {
					socket.emit('userExists',  { errorMsg : 'Customer Username already exists. Please try again'});
				} else {
					if(customers.indexOf(uId) > -1) {
						socket.emit('userExists',  { errorMsg : 'Technical Error. Please try again.'});
					} else {
						customers.push({uId: uId, userName : data.userName, sockId : socket.id});
						socket.emit('userSet', {uId : uId, userName: data.userName});
						console.log( '\n '+data.userName + ' has been added to the customers list');
					}
				}
			} else {
				// as of now empty
			}
		});
		
		socket.on('userWaitingOnline', function(data) {
			io.sockets.emit('userWaitingOnline1', {uId : data.uId, userName: data.userName, totalWaitingUsers : customers.length} );
		})
		
		socket.on('msg', function(data) {
			io.sockets.in(data.uId).emit('newMsg', data);
		})		
		
	});
	
	function getRooms(){
		return Object.keys(io.sockets.adapter.rooms);
	}
	
	function generateId(){
		var S4 = function () {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
	}
	
	/*======================Webservices======================*/
	
	app.post('/setCustomerName', function (req, res) {
		
			console.log( 'Request object: ', JSON.stringify(req.body) );
			ioClient.emit('setUserName', {userName : req.body.userName, userType : req.body.userType});
			ioClient.emit('userWaitingOnline', {userName : req.body.userName, userType : req.body.userType});
			
			res.status(200).send({
				success: 'true',
				message: 'setUserName successfully triggered'
			})
		});

	server.listen(port,function(req,res){
		console.log('\nServer Running on port' , port);
	});