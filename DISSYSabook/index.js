// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {

  console.log('Initiate server finish!');	
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Group
var groupList = [] ;
var lastID = 0 ;
// usernames which are currently connected to the chat
var usernameList = {} ;
var socketList = {} ;
var numUsers = 0;

io.on('connection', function (socket) {
  var login = false;
  var socketID = "" ;
  // when the client emits 'new message', this listens and executes
  socket.on('chat message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });
  // when the client emits 'add user', this listens and executes
  socket.on('log in', function (username,callbackResponseCode) {
    // we store the username in the socket session for this client
	socket.username = username;
	if (usernameList[username] === 2){
		// Error : user is online
		callbackResponseCode(2);
	}
	else {
	if (usernameList[username] === undefined){
		// Create new user
		//Change state to online
		usernameList[username] = 2;
		callbackResponseCode(0);
	}
	else if (usernameList[username] ===  1){
		//Change state to online
		usernameList[username] = 2;
		callbackResponseCode(1);
	}
    // add the client's username to the global list
    ++numUsers;
	socketList[username] = socket.id ;
	socketID = socket.id ;
	login = true ;
	socket.join("_LOBBY_");
	console.log('log in... '+ username +' total user : ' + numUsers + " socketID : " + socketList[username]) ;
  }
  });
  socket.on('get group', function(){
	  console.log(socketID+" Resquest GL : " + groupList.length);
	  io.to(socketID).emit('send groupList',groupList);
  });
  
  socket.on('new group', function(newName,callbackValid){
	  var found = false ;
	  for (i = 0 ; i<groupList.length ; i++ ){
		  if(groupList[i].name == newName ){ 
				found = true ;
				break ;
		  }
	  }
	  if (!found) {
		callbackValid(true); 
		var newGroup = {id : lastID++ ,
						name : newName ,
						memberList : [] ,
						messageList : []};
		groupList[groupList.length] = newGroup ;
		socket.broadcast.emit('update group',groupList);
		console.log("list length : "+groupList.length);
		//console.log("new group :" + newName + " id: " + groupList[groupList.size - 1].id );
		//socket.to(socketList["mma"]).emit('private message', 'Hi dude!' );
		}
		else {
			callbackValid(false); 
			console.log("Same group name :" + newName) ;
			}
  });
  // when the client emits 'typing', we broadcast it to others
  socket.on('enter group', function (username,gID,callbackGroup) {
		if(groupList[gID].id != undefined){
			// Group is available
			console.log(username + " enter group " + gID);
			var joined = false ;
			for(i = 0 ; i < groupList[gID].memberList.length ; i++){
				if (groupList[gID].memberList[i].username == username) joined = true ;
			}
			//enter this group first time 
			if(!joined) groupList[gID].memberList.push({username :username , nextMessage : groupList[gID].messageList.length}) ;
			
			io.to(gID).emit('upadate member',groupList[gID].memberList);
			callbackGroup(groupList[gID]);
			socket.join(gID) ;
		}
		else {
			callbackList(undefined);
		}
  }); 
  socket.on('chat message', function(user,gID,msg){
    console.log('socket.on(chat message) is called' + msg + " " + user + " " + gID + " gName " + groupList[gID].name);
    if(gID < 0 || gID >= groupList.length) return;
    var d = new Date(); // for now
    var min = d.getMinutes();
    var sec = d.getSeconds();
    if(min<10) min = '0' + min;
    if(sec<10) sec = '0' + sec;
	
    var curtime = d.getHours() + ":"+ min+ ":"+sec; 
    var newMessage = {sender:user, message:msg, time:curtime};
    groupList[gID].messageList[groupList[gID].messageList.length] = newMessage ;
	io.to(gID).emit('chat message', newMessage);
  });
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if(login){
		usernameList[socket.username] = 1;
		--numUsers;
		//console.log(socketList[username] + " username : "+socket.username +  " log out");
		//socketList[username] = "" ;
		}
  });
  socket.on('leave', function(usr,gID){
    console.log('socket.on(leave) is called' + usr + " " + gID) ;
    for(i=0;i<	groupList[gID].memberList.length;i++){
      if(usr == groupList[gID].memberList[i].username) groupList[gID].memberList[i].splice(i,1); // remove that user
    }
    socket.leave(gID); // SOCKET ROOM
    socket.join("_LOBBY_");
	io.to(gID).emit('upadate member',groupList[gID].memberList);
    io.to(socket.id).emit('returntolobby',usr);
    io.to("_LOBBY_").emit('returntolobby', usr);
  });

  socket.on('exit', function(usr,gID){
    console.log('socket.on(exit) is called' + usr + " " + gID);
    if(gID == -1) return;
    for(i=0;i < groupList[gID].memberList.length;i++){
      if(usr == groupList[gID].memberList[i].username) groupList[gID].memberList[i].nextMessage = groupList[gID].messageList.length;
    }
    //io.to(socket.id).emit('exit', usr);
    socket.leave(gID); // SOCKET ROOM
    socket.join("_LOBBY_");
	io.to(gID).emit('upadate member',groupList[gID].memberList);
    io.to(socket.id).emit('returntolobby',usr);
    io.to("_LOBBY_").emit('returntolobby', usr);
  });
  socket.on('get unread', function(usr,gID , callbackUnreadMessage){
    console.log('socket.on(get unread) is called' + usr + " " + gID);
    if(gID == -1) return;
    var unreadmsg = [];
    var startunread = 0;
    console.log("CHAT ROOM IDX " + gID + " " + groupList[gID].memberList.length);
    for(i=0 ; i<groupList[gID].memberList.length ; i++){
      if(usr == groupList[gID].memberList[i].username){
        startunread = groupList[gID].memberList[i].nextMessage;
        break;
      }
    }
    for(i = startunread;i<groupList[gID].messageList.length;i++){
      unreadmsg[unreadmsg.length] = groupList[gID].messageList[i];
    }
	callbackUnreadMessage(unreadmsg);
  });
});
