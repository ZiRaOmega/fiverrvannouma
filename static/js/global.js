// Login function that handles the login form submission
const login = async (ev) => {
    ev.preventDefault();

    const form = ev.target;
    const formData = new FormData(form);

    // Send a login request to the server
    await fetch("/api/login", {
        method: "post",
        body: formData,
    }).then(r => {
        if (r.status != 200) throw new Error("Wrong username or password.");

        // Initialize WebSocket connection
        initWebsocket();

        console.log("login");

        // Hide the login and register headers
        document.getElementById("loginHeader").style.display = "none";
        document.getElementById("registerHeader").style.display = "none";

        // Navigate to the forum page
        router.navigate(null, "/forum");
    }).catch(r => {
        alert(r);
        return r;
    });
};

// Register function that handles the registration form submission
const register = async (ev) => {
    ev.preventDefault();

    const form = ev.target;
    const formData = new FormData(form);

    // Send a registration request to the server
    await fetch("/api/register", {
        method: "post",
        body: formData,
    }).then(r => {
        if (r.status != 200) throw new Error("Something went wrong.");

        // Navigate to the login page
        router.navigate(null, "/login");
    }).catch(r => {
        alert(r);
        return r;
    });
};

// Logout function that handles user logout
const logout = async (ev) => {
    websocket.close();

    // Clear user-related data
    user.username = "";
    UserConversations = [];
    UsersOnline = [];
    UserList = [];
    Posts = [];
    userss = [];
    currentDiscussion = "";

    await fetch("/api/logout");

    // Show the login and register headers
    document.getElementById("loginHeader").style.display = "block";
    document.getElementById("registerHeader").style.display = "block";

    clearTimeout(UserLeftHeader);
    document.getElementById("user").innerText = "";
    console.log("Logout");

    // Navigate to the forum page
    router.navigate(null, "/forum");
};

// SearchPost function that filters posts based on the search query
const SearchPost = (search) => {
    let FilteredPosts = [];

    // Iterate through posts and check if the categories include the search query
    for (let i = 0; i < Posts.length; i++) {
        if (Posts[i].categories.includes(search)) {
            FilteredPosts.push(Posts[i]);
        }
    }

    if (FilteredPosts.length == 0 && search != "") {
        // Display "No post found" message if no matching posts are found
        var postSearch = document.querySelector('#postSearch');
        var noPost = document.createElement('p');
        noPost.innerHTML = "No post found";
        noPost.classList.add('noPost');
        var noPostPrevious = document.querySelector('.noPost');
        if (noPostPrevious) {
            noPostPrevious.remove();
        }
        postSearch.appendChild(noPost);
        loadPosts([]);
    } else {
        // Remove the "No post found" message if it exists
        var noPost = document.querySelector('.noPost');
        if (noPost) {
            noPost.remove();
        }
        loadPosts(FilteredPosts);
    }
};
