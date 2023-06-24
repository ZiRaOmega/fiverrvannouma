export default {
    render: () => {
        return `<div class="popup">
                <form id="form-login">
                <label for="username">Username</label>
                <br>
                <input id="username" type="text" name="username" placeholder="Username">
                <br>
                <label for="password">Password</label>
                <br>
                <input id="password" type="password" name="password" placeholder="******">
                <br>
                <input id="loginsubmit" type="submit" class="pointer" value="Login" onclick="document.getElementById('user').innerHTML = document.getElementById('username').value">
                </form>
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
            document.getElementById("logout").style.display="none"
            //router.navigate(null,"/login")
        }
        document.querySelector('#form-login')
            .addEventListener('submit', (ev) => login(ev));
    },
}