$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize varibles
  var startPage = $('#startPage');
  var startButton = $("#startButton") ;
  var loginPage = $('#loginPage'); // The login page
  var chatPage = $('#chatroomPage'); // The chatroom page
  
  var usernameForm = $('#username-form');
  var usernameInput = $('#usernameInput') ; // Input for username
  var messageList = $('#messageList'); // Messages area
  var inputMessage = $('#inputMessage'); // Input message input box
  
  // Prompt for setting a username
  var username;
  var connected = false;
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
  	socket.emit('get group',function(g){
		groupList = g ;
		console.log('get list : ' + g.length);
		updateGroupList();
	});
  }
  function updateGroupList(){
	  console.log('update list');
  	$("#chatroomList").empty();
	if (groupList.length != 0){
		for( i = 0 ; i < groupList.length ; i++ ){
			var gID = groupList[i].id ;
            var gName = groupList[i].name ;
			console.log('update group :' + gID + " " + gName);
  			/*newL.onclick(function(gID){
				enterGroup(gID);
			})*/;
			//var newL = $("#chatroomList").append($('<li class="chatroom-member id="gID'+gID+'">Group ID '+gID+" \t Name :"+gName+"</li>"));
			var a = $("<li >", {
				"class" : "chatroom-member",
				"id" : "gID"+gID ,
				text: "Group ID "+gID+" \t Name :"+gName
				});
			a.appendTo("#chatroomList");
			a.on("click", function(event) {
				var id = $(this).attr('id');
				console.log('enter group :' + id.replace('gID','')) ;
				enterGroup(id.replace('gID','')) ;
			});
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
	  socket.emit('enter group',username,gID,function(msgListMemberList){
	    if (msgListMemberList !== undefined){
			$("#chatroomHeadingName").text(groupList[gID].name) ;
			createMessageList(msgListMemberList.messageList);
			createChatMemberList(msgListMemberList.memberList);
			pagechangeToChatroom(); 
		}else{
			alert('Cannot enter ' + roupList[gID].name + ". The Group may be down.")
		}
	  });
  }	
  function createMessageList(msgList){
	  for (i = 0 ; i < msgList.length &&  msgList.length != 0  ; i++){
			var message = msgList[i] ;
	  }
  }
  function createChatMemberList(memberList){
	  for (i = 0 ; i < memberList.length &&  memberList.length != 0  ; i++){
			var member = memberList[i] ;
	  }
  }
  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  

  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    $('#messageList').append($('<li class="message-value">').text('Hii'));
  }


  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
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
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

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
