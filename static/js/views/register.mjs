export default {
    render: () => {
        return `<div class="popup">
                <form id="form-register">
                <label for="username">Username</label>
                <br>
                <input id="username" type="text" name="username" placeholder="Username">
                <br>
                <label for="firstname">FirstName</label>
                <br>
                <input id="firstname" type="text" name="firstname" placeholder="Bob">
                <br>
                <label for="lastname">LastName</label>
                <br>
                <input id="lastname"type="text" name="lastname" placeholder="Smith">
                <br>
                <label for="email">EMail</label>
                <br>
                <input id="email" type="email" name="email" placeholder="example@test.com">
                <br>
                <label for="age">Age</label>
                <br>
                <input id="age" type="number" name="age" placeholder="10" min="10">
                <br>
                <label for="gender">Gender</label>
                <br>
                <select id="gender" name="gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="undefined">Undefined</option>
                </select>
                <br>
                <label for="password">Password</label>
                <br>
                <input id="password" type="password" name="password" placeholder="******">
                <br>
                <input id="registersubmit" type="submit" class="pointer" value="Register">
                </form>
                </div>`;
    },
    postRender: () => {
        document.querySelector('#form-register')
            .addEventListener('submit', (ev) => register(ev));
    },
} 