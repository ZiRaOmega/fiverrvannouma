class Message {
  stringify() {
    return JSON.stringify(this);
  }

  constructor(username, message, type) {
    this.username = username;
    this.message = message;
    this.type = type;
  }
}

let user = {
  username: null,
};

let UserConversations = [];
let UsersOnline = [];
let UserList = [];
let Posts = [];
let currentDiscussion = "";

/**
 * @type {Websocket}
 */
let websocket = null;

const ping = () => {
  var message = new Message("server", "request", "ping");
  websocket.send(message.stringify());
};

const sendPrivateMessage = (message, recipient) => {
  websocket.send(
    JSON.stringify({
      type: "private",
      message: {
        from: user.username,
        to: recipient,
        content: message,
        date: Date.now().toString(),
      },
    })
  );
};
const SendTypingInProgress = (recipient) => {
  websocket.send(
    JSON.stringify({
      type: "typing",
      message: {
        from: user.username,
        to: recipient,
      },
    })
  );
};
const CreatePost = (title, content, categories) => {
  websocket.send(
    JSON.stringify({
      type: "post",
      message: {
        title: title,
        username: user.username,
        date: Date.now().toString(),
        content: content,
        categories: categories,
      },
    })
  );
};
const AddComment = (content, postID) => {
  websocket.send(
    JSON.stringify({
      type: "comment",
      message: {
        username: user.username,
        content: content,
        postID: postID,
      },
      username: user.username,
    })
  );
};
const synchronizeProfile = () => {
  var message = new Message("server", "request", "sync:profile");
  websocket.send(message.stringify());
};

const synchronizeMessages = () => {
  var message = new Message("server", "request", "sync:messages");
  websocket.send(message.stringify());
};
const synchronizePosts = () => {
  var message = new Message("server", "request", "sync:posts");
  websocket.send(message.stringify());
};
const synchronizeUsers = () => {
  var message = new Message("server", "request", "sync:users");
  websocket.send(message.stringify());
};

const synchronizeUserList = () => {
  var message = new Message("server", "request", "sync:userList");
  websocket.send(message.stringify());
};
const AutoScrollMessages = () => {
    //Delay the func if the delay is not finish stop the func 
    if (delayFunc(3000) > 0) return;
  if (document.getElementsByClassName("convHolder")[0] != null) {
    var conv = document.getElementsByClassName("convHolder")[0];
    conv.scrollTop = conv.scrollHeight;
  }
};
const initWebsocket = () => {
  if (websocket && websocket.readyState == WebSocket.OPEN) {
    console.error("already connected");
    return;
  }

  websocket = new WebSocket("ws://localhost:8080/ws");
  websocket.onopen = function () {
    console.log("Connected to server");
    synchronizeUserList();
    synchronizeProfile();
    synchronizeMessages();
    synchronizeUsers();
    synchronizePosts();
  };

  websocket.onmessage = function (event) {
    console.log(event.data);
    var message = JSON.parse(event.data);
    switch (message.type) {
      case "sync:profile":
        user = message.profile;
        break;
      case "sync:messages":
        console.log(message.Messages);
        UserConversations = message.Messages;
        console.log("conv");
        loadConversation(currentDiscussion);
        setTimeout(() => {
          AutoScrollMessages();
        }, 100);
        //AutoScrollMessages();
        break;
      case "sync:users":
        console.log(message.Users);
        UsersOnline = message.online;
        break;
      case "sync:userList":
        console.log(message.userList);
        UserList = message.userList;
        createList(UserList);
        break;
      case "sync:posts":
        console.log(message.posts);
        Posts = message.posts;
        loadPosts(Posts);
        break;
      case "typing":
        TypingInProgress(message.from);
        console.log(message, "TYPING");
    }
  };
};

initWebsocket();

//PM page

var userss = [];

const GetConversation = (user) => {
  if (UserConversations == undefined) {
    return [];
  }
  return UserConversations.filter((conversation) => {
    return conversation.From === user || conversation.To === user;
  });
};

const GetMessagesSorted = (user) => {
  return GetConversation(user).sort((a, b) => {
    if (parseInt(a.Date) < parseInt(b.Date)) {
      return -1;
    }
    if (parseInt(a.Date) > parseInt(b.Date)) {
      return 1;
    }
    return 0;
  });
};

const GetLastMessage = (user) => {
  const messages = GetMessagesSorted(user);
  return messages[messages.length - 1] || null;
};

function createList(users) {
  userss = [];
  let mapDuplicates = {};
  users.forEach((item) => {
    if (mapDuplicates[item.username] != true) {
      userss.push(item.username);
      mapDuplicates[item.username] = true;
    }
  });
  //document.querySelector(".convs").appendChild(list);
}

let UserLeftHeader = setTimeout(() => {
  document.querySelector("#user").innerText = user.username;
}, 500);
window.UserLeftHeader = UserLeftHeader;
var Counter = 10;
var FirstLoad = true;

console.log(FirstLoad);
let userMessages = [];
let userMessagesDates = [];
function loadConversation(user) {
  userMessages = [];
  userMessagesDates = [];
  if (user != currentDiscussion) {
    Counter = 10;
    FirstLoad = true;
  }
  currentDiscussion = user;
  if (document.querySelector("#currentDiscussion") != null) {
    document.querySelector("#currentDiscussion").innerText = currentDiscussion;
  }
  if (UserConversations != undefined) {
    for (let i = 0; i < UserConversations.length; i++) {
      if (
        UserConversations[i].To == user ||
        UserConversations[i].From == user
      ) {
        userMessages.push(UserConversations[i]);
        userMessagesDates.push(UserConversations[i].Date);
      }
    }
  }
  var lenmsg = userMessages.length;
  if (lenmsg > 10) {
    //Reverse userMessages and get the last 10 messages
    userMessages = userMessages.reverse().slice(0, Counter);
    userMessagesDates = userMessagesDates.reverse().slice(0, Counter);
    console.log(userMessages);
    console.log(lenmsg);
    //Reverse userMessages again to get the correct order
    userMessages = userMessages.reverse();
    userMessagesDates = userMessagesDates.reverse();
    Counter += 10;
    if (Counter > lenmsg) {
      Counter = lenmsg;
    }
  }
  if (document.querySelector(".conv") != null) {
    document.querySelector(".conv").innerHTML = "";
  }
  for (let j = 0; j < userMessages.length; j++) {
    let p = document.createElement("p");
    let p2 = document.createElement("p");
    if (userMessages[j].To == user) {
      p.classList.add("sent");
      p2.classList.add("sentDate");
    } else {
      p.classList.add("received");
    }
    p.innerText = userMessages[j].Content;
    console.log(userMessages[j]);
    const date = new Date(Number(userMessagesDates[j]));
    const dateString = date.toLocaleString();
    p2.innerText = dateString;
    if (document.querySelector(".conv") != null) {
      document.querySelector(".conv").appendChild(p2);
      document.querySelector(".conv").appendChild(p);
    }
  }
  if (FirstLoad) {
    AutoScrollMessages();
    FirstLoad = false;
  }
  //AutoScrollMessages();
}

//Forum page

function loadPosts(posts) {
  if (document.querySelector("#postList") != null) {
    document.querySelector("#postList").innerHTML = "";
  }
  for (let i = 0; i < posts.length; i++) {
    let container = document.createElement("div");
    let title = document.createElement("h2");
    let username = document.createElement("p");
    let date = document.createElement("p");
    let content = document.createElement("p");
    let categories = document.createElement("p");
    let comment = document.createElement("p");
    let response = document.createElement("input");
    let postID = document.createElement("input");
    let resp_button = document.createElement("button");
    resp_button.innerText = "Send";
    resp_button.classList.add("resp_button");
    resp_button.addEventListener("click", function () {
      const postDiv = resp_button.closest(".post_container");
      let postCommentResponse = postDiv.querySelector(".response");
      const postId = postDiv.querySelector(".post_id");

      const commentResponseValue = postCommentResponse.value;
      const postIdValue = postId.value;

      postCommentResponse = postDiv.querySelector(".response");
      //Regex for special characters
      special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
      //commentResponseValue = postCommentResponse.value;
      console.log(special.test(commentResponseValue), "specialtest");

      if (special.test(commentResponseValue)) {
        alert("Special characters are not allowed");
        postCommentResponse.value = "";
      } else {
        AddComment(commentResponseValue, postIdValue);
      }
    });

    response.placeholder = "Comment";
    response.classList.add("post_comment");
    response.classList.add("response");
    title.innerHTML = posts[i].title;
    username.innerHTML = posts[i].username;
    postDate = new Date(Number(posts[i].date)).toUTCString();
    date.innerHTML = postDate;
    content.innerHTML = posts[i].content;
    categories.innerHTML = posts[i].categories;
    postID.setAttribute("value", posts[i].id);
    for (let j = 0; j < posts[i].comments.length; j++) {
      comment.innerHTML +=
        posts[i].comments[j].username +
        ": " +
        posts[i].comments[j].comment +
        "<br>";
    }
    container.classList.add("post_container");
    title.classList.add("post_title");
    username.classList.add("post_username");
    date.classList.add("post_date");
    content.classList.add("post_content");
    categories.classList.add("post_categories");
    comment.classList.add("post_comment");
    postID.classList.add("post_id");
    comment.style.display = "none";
    postID.style.display = "none";
    container.appendChild(title);
    container.appendChild(username);
    container.appendChild(date);
    container.appendChild(content);
    container.appendChild(categories);
    container.appendChild(comment);
    container.appendChild(response);
    container.appendChild(postID);
    container.appendChild(resp_button);
    if (document.querySelector("#postList") != null) {
      document.querySelector("#postList").appendChild(container);
    }

    container.addEventListener("click", (ev) => {
      const comments = ev.currentTarget.querySelector(".post_comment");
      if (comments.style.display === "none") comments.style.display = "block";
      else comments.style.display = "none";
    });
  }
}

let typingUsers = {};
let oldTypingUsers = {};

const TypingInProgress = (user) => {
  console.log(window.location);

  typingUsers[user] = true;
  oldTypingUsers[user]=false;
  if (window.location.pathname != "/pm") {
    //Check if there is already a typing_div if yes just change the innerText else do the next
    if (document.querySelector(".typing_div") != null) {
      console.log("lllll");
      document.querySelector(
        ".typing_div"
      ).innerText = `🔔 ${user} is typing !`;
    } else {
      //Create a div that will say user is typing on the bottom right
      const typingDiv = document.createElement("div");
      typingDiv.classList.add("typing_div");
      typingDiv.innerText = `🔔 ${user} is typing !`;
      //Set the div to the bottom right of the window
      typingDiv.addEventListener("click", () => {
        typingDiv.remove();
        router.navigate(null, "/pm?user=" + user);
      });
      document.body.appendChild(typingDiv);
      //Set a timeout then delete the notif
      setTimeout(() => {
        typingDiv.remove();
      }, 10000);
    }
    return;
  }

  const list = document.createElement("ul");
  document.querySelector(".convs").innerHTML = "";
  userss.sort((a, b) => {
    a = GetLastMessage(a) || 0;
    b = GetLastMessage(b) || 0;
    if (typeof a !== "number") a = parseInt(a.Date);
    if (typeof b !== "number") b = parseInt(b.Date);
    if (a < b) return 1;
    else if (a > b) return -1;
    else return 0;
  });

  let mapDuplicates = {};
  userss.forEach((user, i) => {
    //remove duplicates
    if (mapDuplicates[user] != undefined || user.username == user) {
      userss.splice(i, 1);
    } else {
      mapDuplicates[user] = true;
    }
  });

  console.log(userss);
  userss.forEach((item) => {
    if (item != localStorage.getItem("username")) {
      console.log(item, user.username);
      const span = document.createElement("span");
      const usersss = document.createElement("p");
      usersss.addEventListener("click", function () {
        loadConversation(item);
      });
      usersss.textContent = item;
      const lastMessage = GetLastMessage(item);
      if (lastMessage != null) {
        if (!oldTypingUsers[item]) {
          if (typingUsers[item]){

            usersss.classList.add("typing-demo");
            setTimeout(() => {
              usersss.classList.remove("typing-demo")
              typingUsers[item]=false
              usersss.textContent = item+" - " + lastMessage.Content;
              console.log("Debug setTimeout")

            }, 5000);
          }
          oldTypingUsers[item] = true;
        

        if (typingUsers[item]) {
          usersss.textContent += " is typing...";
          console.log("Debug condition")
        } else {
          usersss.textContent = item+" - " + lastMessage.Content;
        }
      }
      }
      span.classList.add("dot");
      list.classList.add("cr");
      for (let i = 0; i < UsersOnline.length; i++) {
        if (UsersOnline[i].username == item) {
          span.classList.add("online");
        }
      }

      list.appendChild(span);
      list.appendChild(usersss);
    }
  });

  refresh = false;
  if (document.querySelector(".convs") != null) {
    document.querySelector(".convs").innerHTML = "";
    document.querySelector(".convs").appendChild(list);
  }

  //delayFunc();
};

let timeoutId = null;
let startTime = null;

function delayFunc(timeout) {
  if (timeoutId !== null) {
    let elapsedTime = Date.now() - startTime;
    let remainingTime = timeout - elapsedTime;
    console.log(
      "The function is already running. Remaining time: " + remainingTime + "ms"
    );
    return remainingTime;
  }

  startTime = Date.now();
  timeoutId = setTimeout(function () {
    console.log("3 seconds have passed");
    timeoutId = null;
    startTime = null;
  }, timeout);
}
