export default {
    render: () => {
        return `<div class="profile">
        <img class="pp" src="./static/img/logo.png">
        <div><p id="profile-username"></p></div>
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
        setTimeout(() => {
            document.querySelector('#profile-username').innerText = user.username;
        }, 500);
    },
}