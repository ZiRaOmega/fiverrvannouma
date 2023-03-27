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
        document.querySelector('#form-login')
            .addEventListener('submit', (ev) => login(ev));
    },
}