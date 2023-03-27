export default {
    render: () => {
        return `
        <button id="filter_button" >Filter</button>
        <div id="postSearch" hidden>
        <input id="search" type="text" placeholder="Search by Categories">
        <button id="search_button">Search by Categories</button>
        </div>
        
        <div id="postList">
        </div>
        <div id="postcreator">
        <input id="post_title" class="post_element" type="text" placeholder="Title">
        <input id="post_categories" class="post_element" type="text" placeholder="Categories">
        <textarea id="post_content" class="post_element" type="text" placeholder="Content"></textarea>
        <button id="post_button">Créer</button>
        </div>`;
    },
    postRender: () => { 
        loadPosts(Posts);
        document.querySelector('#post_button').addEventListener('click', function() {
            let title = document.querySelector('#post_title').value;
            let content = document.querySelector('#post_content').value;
            let categories = document.querySelector('#post_categories').value;
            if (title != "" && content != "" && categories != "") {
                //Wait 500ms to avoid spamming
                setTimeout(function() {
                    document.querySelector('#post_button').disabled = false;
                }, 500);
                CreatePost(title, content, categories);
                //Auto scroll to the bottom of the page (document.body.scrollHeight)
                setTimeout(function() {

                window.scrollTo(0, document.body.scrollHeight);
                }, 200);
            }
            document.querySelector('#post_title').value = "";
            document.querySelector('#post_content').value = "";
            document.querySelector('#post_categories').value = "";
            if (document.querySelectorAll('.success').length > 0) {
                let success = document.createElement('p');
                success.innerHTML = "Post created";
                success.classList.add('successMessage');
                document.querySelector('#postcreator').appendChild(success);
            }
        });
        document.querySelector('#search_button').addEventListener('click', function() {
            let search = document.querySelector('#search').value;
            if (search != "") {
                SearchPost(search);
            }else{
                var noPost = document.querySelector('.noPost');
                if (noPost) {
                    noPost.remove();
                }
                loadPosts(Posts);
            }
            document.querySelector('#search').value = "";
        });

        const respButtons = document.querySelectorAll('.resp_button');
        console.log(respButtons);

        respButtons.forEach(function(respButton) {
          respButton.addEventListener('click', function() {
            const postDiv = respButton.closest('.post_container');
            const postCommentResponse = postDiv.querySelector('.response');
            const postId = postDiv.querySelector('.post_id');
    
            const commentResponseValue = postCommentResponse.value;
            const postIdValue = postId.value;
    
            AddComment(commentResponseValue, postIdValue);
          });
        });
        var filter_button = document.querySelector('#filter_button');
        filter_button.addEventListener('click', function() {
            var postSearch = document.querySelector('#postSearch');
            if (postSearch.hidden) {
                postSearch.hidden = false;
                postSearch.style.display = "flex";
            }else{
                postSearch.hidden = true;
                postSearch.style.display = "none";
            }
        });
    },
}