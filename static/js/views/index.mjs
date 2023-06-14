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
        <button id="post_button">Create</button>
        </div>`;
    },
    postRender: () => { 
        
        let GetCookieValue=(cookieName)=>{
            let cookieValue = document.cookie.match('(^|;)\\s*' + cookieName + '\\s*=\\s*([^;]+)');
            return cookieValue ? cookieValue.pop() : '';
        }
        window.GetCookieValue=GetCookieValue;
        if (GetCookieValue("SESSION_ID")!=''){
            document.getElementById("loginHeader").style.display="none"
            document.getElementById("registerHeader").style.display="none"
        }else{
            router.navigate(null,"/login")
        }
        loadPosts(Posts);
        document.querySelector('#post_button').addEventListener('click', function() {
            let title = document.querySelector('#post_title').value;
            let content = document.querySelector('#post_content').value;
            let categories = document.querySelector('#post_categories').value;
            //Regex for special characters
            let special =   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
            if (special.test(title) || special.test(content) || special.test(categories)) {
                alert("Special characters are not allowed");
                let specinter=setInterval(()=>{
                    if (document.location.pathname!="/forum"){
                        clearInterval(specinter);
                    }else{

                        let title = document.querySelector('#post_title').value;
                let content = document.querySelector('#post_content').value;
                let categories = document.querySelector('#post_categories').value;
                        console.log(!(special.test(title) || special.test(content) || special.test(categories)))
                        if (!(special.test(title) || special.test(content) || special.test(categories))) {
                            document.querySelector('#post_button').disabled = false;
                            clearInterval(specinter);
    
                            } else {
                                document.querySelector('#post_button').disabled = true;
                            }
                    }



                },1000)
                document.querySelector('#post_button').disabled = true;
                return;
            }
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
                const postIdValue = postId.value;
        
                //Regex for special characters
                let special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
                let commentResponseValue = postCommentResponse.value;
                console.log(special.test(commentResponseValue),"specialtest")
                
                if (special.test(commentResponseValue)) {
                    alert("Special characters are not allowed");
                    
                    let specinter=setInterval(()=>{
                        console.log("SpecialInter");
                        if (document.location.pathname != "/forum"){
                            clearInterval(specinter);
                        } else {
                            // Obtain the current value of the comment inside the interval
                            commentResponseValue = postCommentResponse.value;
                            if (!special.test(commentResponseValue)) {
                                respButton.disabled = false;
                                clearInterval(specinter);
                            } else {
                                respButton.disabled = true;
                            }
                        }
                    }, 1000);
                } else {
                    //AddComment(commentResponseValue, postIdValue);
                }
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