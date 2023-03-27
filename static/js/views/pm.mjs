export default {
    render: () => {
        return `<div class="convHolder">
        <div class="conv">
        </div>
        <div id="currentDiscussion"></div>
        <form id="form-send-message">
        <input id="sender" type="text" placeholder="Send">
        <input type="submit" id="sender_button" value="Envoyer"></input>
        </form>
        </div>
        <div class="recentconv">
        <div id="recent">Recent</div>
        <div class="convs">
        <div>
        </div>`;
    },
    postRender: () => {
        var refresh = false;
        setInterval(() => {
            if (refresh) {
                refresh = false;
            } else {
                refresh = true;
            }
        }, 1000);
        var Scrolled = false;
        document.addEventListener("mousemove", () => {
            if (!refresh) {
                return;
            }
            const element = document.querySelector('.convHolder');

            element.addEventListener('scroll', function () {
                if (element.scrollTop === 0 && !Scrolled && Counter != userMessages.length) {
                    Scrolled = true;
                    console.log('Scrollbar has reached the top!');
                    const scrollHeight = element.scrollHeight;
                    setTimeout(() => {
                        loadConversation(currentDiscussion);
                        element.scrollTop = element.scrollHeight - scrollHeight - (Counter / 10 / scrollHeight) + 20;
                        Scrolled = false;
                    }, 50);
                    //loadConversation(currentDiscussion);

                } else if (Counter == userMessages.length) {
                    setTimeout(() => {
                        loadConversation(currentDiscussion);
                    }, 50);
                }
            });
            var crs = document.getElementsByClassName("cr");
            const list = document.createElement("ul");

            userss.sort((a, b) => {
                a = GetLastMessage(a) || 0;
                b = GetLastMessage(b) || 0;
                if (typeof a !== "number") a = parseInt(a.Date);
                if (typeof b !== "number") b = parseInt(b.Date);
                if (a < b) return 1;
                else if (a > b) return -1;
                else return 0;
            });

            userss.forEach((item) => {
                if (item != user.username) {
                    const span = document.createElement("span");
                    const user = document.createElement("p");
                    user.addEventListener("click", function () {
                        loadConversation(item);
                    });
                    user.textContent = item;
                    const lastMessage = GetLastMessage(item);
                    if (lastMessage != null) {
                        user.textContent += " - " + lastMessage.Content;
                    }
                    span.classList.add("dot");
                    list.classList.add("cr");
                    for (let i = 0; i < UsersOnline.length; i++) {
                        if (UsersOnline[i].username == item) {
                            span.classList.add("online");
                        }
                    }
                    list.appendChild(span);
                    list.appendChild(user);
                }
            });
            refresh = false;
            if (document.querySelector(".convs") != null) {
                document.querySelector(".convs").innerHTML = "";
                document.querySelector(".convs").appendChild(list);
            }
        });

        let inputsender = document.getElementById("sender");
        inputsender.addEventListener("keyup", function (event) {
            SendTypingInProgress(currentDiscussion);
        });

        document
            .querySelector("#form-send-message")
            .addEventListener("submit", (ev) => {
                ev.preventDefault();

                const field = document.querySelector("#sender");
                let text = field.value;
                if (text != "") {
                    field.value = "";

                    text = text.replaceAll("$", "🐧");

                    const recipient = currentDiscussion;
                    sendPrivateMessage(text, recipient);
                }
            });
        createList(UserList);
        setInterval(() => {
            var recents = document.getElementsByClassName("cr")[0];
            for (let children of recents.children) {
                //Get only p elements
                if (children.tagName == "P") {

                    if (children.innerText.includes("Typing...")) {
                        children.innerText = children.innerText.replace("- Typing...", "");
                        children.classList.remove("typing-demo");
                    }

                }

            }

        }, 10000);
    },
};
