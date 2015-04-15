$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];
  //Binding Element
   // Initialize varibles
  var startPage = $('#startPage');
  var startButton = $("#startButton") ;
  var loginPage = $('#loginPage'); // The login page
  var chatPage = $('#chatroomPage'); // The chatroom page
  
  var usernameForm = $('#username-form');
  var usernameInput = $('#usernameInput') ; // Input for username
  var messageList = $('#messageList'); // Messages area
  var inputMessage = $('#inputMessage'); // Input message input box
  
  // Initialize varibles
  var color = true;
  var lastsender = "";
  
  // Prompt for setting a username
  var username;
  var typing = false;
  var lastTypingTime;
  var currentInput = usernameInput.focus();

  var socket = io();
  var groupList= [] ;
  var currentGroup ;
 
  //Listener Handle Function
  function pagechangeToLogin()  {
			document.getElementById("startPage").style.visibility='hidden';
			document.getElementById("startPage").style.display='none';
  
			document.getElementById("loginPage").style.display='block';
			document.getElementById("loginPage").style.visibility='visible';
		}

  function pagechangeToRoomGroup()  {
			document.getElementById("startPage").style.visibility='hidden';
			document.getElementById("startPage").style.display='none';

			document.getElementById("loginPage").style.visibility='hidden';
			document.getElementById("loginPage").style.display='none';
  
			document.getElementById("roomGroupPage").style.display='block';
			document.getElementById("roomGroupPage").style.visibility='visible';
			
			document.getElementById("chatroomPage").style.display='none';
			document.getElementById("chatroomPage").style.visibility='block';
			getGroupList();
		}
  function pagechangeToChatroom()  {
			document.getElementById("startPage").style.visibility='hidden';
			document.getElementById("startPage").style.display='none';

			document.getElementById("loginPage").style.visibility='hidden';
			document.getElementById("loginPage").style.display='none';
  
			document.getElementById("roomGroupPage").style.display='none' ;
			document.getElementById("roomGroupPage").style.visibility='hidden';
			
			document.getElementById("chatroomPage").style.display='block';
			document.getElementById("chatroomPage").style.visibility='visible';
		}
  //** Element Listener **
  //Leave group
  document.getElementById('leaveButton').addEventListener("click",leaveGroup) ;
  //Exit group
  document.getElementById('exitButton').addEventListener("click",exitGroup) ;
  //Chat Message
  document.getElementById('inputMessage').onkeypress = function(e) {
    		var event = e || window.event;
    		var charCode = event.which || event.keyCode;

    		if ( charCode == '13' ) {
      			// Enter pressed
      			sendMessage();
    		}
		}
    document.getElementById("sendButton").addEventListener("click", sendMessage );
  //Create Group Listener
  document.getElementById('chatroomName').onkeypress = function(e) {
    		var event = e || window.event;
    		var charCode = event.which || event.keyCode;

    		if ( charCode == '13' ) {
      			// Enter pressed
      			createGroup() ;
    		}
		}
    document.getElementById("createButton").addEventListener("click", createGroup);
  //Log in Listener
    document.getElementById('usernameInput').onkeypress = function(e) {
    		var event = e || window.event;
    		var charCode = event.which || event.keyCode;

    		if ( charCode == '13' ) {
      			// Enter pressed
      			setUsername() ;
    		}
		}
  document.getElementById("submitButton").addEventListener("click", setUsername);
  document.getElementById("startButton").addEventListener("click", pagechangeToLogin); 
  
  
  // Sets the client's username
  function setUsername () {
	  connected = true ;
	  var el = usernameInput.val() ;
	  console.log("set user" + el);
	  if (el) {
	  	username = el;
      		// Tell the server your username
      		socket.emit('log in', username ,function(responseCode){
			console.log('log in with ' +username+ "responseCode : " + responseCode);
			// RC = 0 new user
			if(responseCode == 0 ){
				pagechangeToRoomGroup() ;
				alert('New User : '+username);
				$("#uesrnameHeading").text(username);
			}
			// RC = 1 existing user
			else if(responseCode == 1 ){
				pagechangeToRoomGroup() ;
				alert('Log in as '+username);
				$("#uesrnameHeading").text(username);
			}
			// RC = 2 online user
			else if(responseCode == 2 ){
				alert('Try again , '+username +' is online.');
			}
	    });

  }
  }
  function getGroupList(){
  	socket.emit('get group') ;
  }
  function isInMemberList(username , memberList,gID){
	  for (i = 0 ; i < memberList.length ; i++){
		  if (username == memberList.username){
			  found = true ;
			  var oldText =  $("#gID"+gID).text() ;
			  $("#gID"+gID).text(oldText + " [JOINED]");
	  }
	  }
  }
  function updateGroupList(){
	  console.log('update list');
  	$("#chatroomList").empty();
	if (groupList.length != 0){
		for( i = 0 ; i < groupList.length ; i++ ){
			var gID = groupList[i].id ;
            var gName = groupList[i].name ;
			var join = "" ;
			console.log('update group :' + gID + " " + gName);
  			/*newL.onclick(function(gID){
				enterGroup(gID);
			})*/;
			//var newL = $("#chatroomList").append($('<li class="chatroom-member id="gID'+gID+'">Group ID '+gID+" \t Name :"+gName+"</li>"));
			var a = $("<li >", {
				"class" : "chatroom-member",
				"id" : "gID"+gID ,
				text: "Group ID "+gID+" \t Name :"+gName +" "+join
				});
			a.appendTo("#chatroomList");
			a.on("click", function(event) {
				var id = $(this).attr('id');
				console.log('enter group :' + id.replace('gID','')) ;
				enterGroup(id.replace('gID','')) ;
			});
			//isInMemberList(username , groupList[i].memberList,gID);
			 //document.getElementById("gID"+gID).addEventListener("click", setUsername);
	}
  }
  }
  function createGroup(){
	  if ($("#chatroomName").val() != "" ){
  	    var newGroupName = $('#chatroomName').val() ;
        socket.emit('new group',newGroupName,function(isValid){
			if(isValid){
				alert('Create Group ' + newGroupName + 'Successfully');
				getGroupList() ;
			}
			else{
				alert('Create Group ' + newGroupName + 'Fail!');
			}
			});
	}
	$("#chatroomName").val("") ;
  }
  
  function enterGroup(gID){
		 console.log("enter " + groupList[gID].name) ;
	  socket.emit('enter group',username,gID,function(group){
	    if (group != undefined){
			currentGroup = group ;
			$("#chatroomHeadingName").text(currentGroup.name) ;
			//createMessageList(currentGroup.messageList);
			createChatMemberList(currentGroup.memberList);
			pagechangeToChatroom();
		}else{
			alert('Cannot enter ' + roupList[gID].name + ". The Group may be down.")
		}
	  });
	  socket.emit('get unread',username,gID,function(unreadMessageList){
		  createMessageList(unreadMessageList);
	  });
  }	
  function createMessageList(msgList){
	  $("#messageList").empty();
	  //Get Unread!!!!
	  /*var nextMessage = messageList.length ;
	  var haveUnread = false ;
	  for (i = 0 ; i < currentGroup.memberList[i] ; i++){
		  if (username == currentGroup.memberList[i].username){
			  nextMessage = currentGroup.memberList[i].nextMessage ;
			  haveUnread = true ;	
	  }
	  }*/
	  if(msgList.length != 0){
	  var count = 0 ;
	  for (i = 0 ; i < msgList.length  ; i++){
			var message = msgList[i] ;
			var option = " style='background: #a5a;'";
			addChatMessage(message);
		/*$('#messageList').append('<li class="message-value"' + option + "><strong>" +
				message.sender + " (" + message.time + 
				") :</strong> " + message.message+"</li>");*/
			count++;
	  }
	  console.log(username + " have unread " + count + "messages .");
	  if (count >0 ) $('#messageList').append('<li class="message-value"> Unread '+ count +' Messagese </li>'); 
	  }
  }
  function createChatMemberList(memberList){
	  $("#memberList").empty();
	  for (i = 0 ; i < memberList.length &&  memberList.length != 0  ; i++){
			var member = memberList[i].username ;
			$('#memberList').append('<li class="chatroom-member" >' + member + "</li>");
	  }
  }

  // Sends a chat message
  function sendMessage () {
    var message = $("#inputMessage").val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $("#inputMessage").val('');
      // tell server to execute 'new message' and send along one parameter
	  console.log("chat : " + username + " ")
      socket.emit('chat message', username ,currentGroup.id, message );
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (newMessage) {
	var option="";
    if(newMessage.sender != lastsender){
      color = !color;
      lastsender = newMessage.sender;
    }
    if(color) option = " style='background: #eee;'";
    else option="";
    $('#messageList').append('<li class="message-value"' + option + "><strong>"+newMessage.sender + " (" + newMessage.time + ") :</strong> " + newMessage.message+"</li>");
    window.scrollBy(0, 100);
  }


  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }
  function leaveGroup(){
	$('#messageList').empty();
	console.log(username + " leave "+ currentGroup.id + currentGroup);
	socket.emit('leave',username,currentGroup.id);
    currentGroup = undefined;
	pagechangeToRoomGroup() ;
  }
  function exitGroup(){
    $('#messageList').empty();
	console.log(username + " exit "+ currentGroup.id + currentGroup);
    socket.emit('exit',username,currentGroup.id);
	currentGroup = undefined ;
	pagechangeToRoomGroup() ;
  }
  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }


  // Socket events 
  socket.on('update group', function (newGroupList) {
    groupList = newGroupList ;
    updateGroupList();
  });
  socket.on('private message', function (pm) {
    console.log('get pm : '+pm)
  });
  socket.on('chat message', function (newMessage) {
	  console.log('recieve message from... ' + socket.id);
    addChatMessage(newMessage);
  });
  
  socket.on('upadate member', function (newMemberList) {
	console.log('update member list!') ;
    createChatMemberList(newMemberList);
  });
  socket.on('send groupList',function(g){
	    groupList = g ;
		if(g.length >0 ) console.log('get list : ' + g[g.length-1].name);
		updateGroupList();
  });
/*
  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = "Welcome to Socket.IO Chat – ";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });*/
});
