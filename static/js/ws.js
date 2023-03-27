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
    }),
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
    }),
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
    }),
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
    }),
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
  if (document.getElementsByClassName("convHolder")[0] != null) {
    var conv = document.getElementsByClassName("convHolder")[0];
    conv.scrollTop = conv.scrollHeight;
  }
}
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
        console.log('conv')
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
        TypingInProgress(message.from)
        console.log(message);
    }
   
  };
};

initWebsocket();

//PM page

var userss = [];

const GetConversation = (user) => {
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
  users.forEach((item) => {
    userss.push(item.username);
  });
  //document.querySelector(".convs").appendChild(list);
}



setTimeout(() => {
  document.querySelector("#user").innerText = user.username;
}, 500);
var Counter = 10;
var FirstLoad = true;

console.log(FirstLoad)
let userMessages = [];
function loadConversation(user) {
  userMessages = [];
  if (user!=currentDiscussion) {
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
      }
    }
  }
  var lenmsg = userMessages.length;
  if (lenmsg > 10) {
    
    //Reverse userMessages and get the last 10 messages
    userMessages = userMessages.reverse().slice(0, Counter);
    console.log(userMessages)
    console.log(lenmsg)
    //Reverse userMessages again to get the correct order
    userMessages = userMessages.reverse();
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
    if (userMessages[j].To == user) {
      p.classList.add("sent");
    } else {
      p.classList.add("received");
    }
    p.innerText = userMessages[j].Content;
    if (document.querySelector(".conv") != null) {
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
    resp_button.innerText = "Send"
    resp_button.classList.add("resp_button")
    resp_button.addEventListener('click', function() {
      const postDiv = resp_button.closest('.post_container');
      const postCommentResponse = postDiv.querySelector('.response');
      const postId = postDiv.querySelector('.post_id');

      const commentResponseValue = postCommentResponse.value;
      const postIdValue = postId.value;

      AddComment(commentResponseValue, postIdValue);
    });
    response.placeholder = "Comment"
    response.classList.add("post_comment")
    response.classList.add("response")
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
const TypingInProgress=(user)=>{
  var recents = document.getElementsByClassName("cr")[0];
  for (let children of recents.children) {
    //Get only p elements
    if (children.tagName == "P") {
      let splitted = children.innerText.replace(" ", "").split("-");
      console.log(splitted,user)
      if (splitted[0] == user) {
        if (children.innerText.includes("Typing...")) {
          return
        }
        children.innerText += " - Typing...";
        children.classList.add("typing-demo");
      }
    }
      
  }
}