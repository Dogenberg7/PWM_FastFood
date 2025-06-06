// esegue il login, restituisce un token tramite cookies e fa un redirect alla home page

window.onload = () => {
    isLoggedIn();
}

async function login(){
    const username = document.getElementById('username');
    const password = document.getElementById('password');

    if (!username.checkValidity()) addError('Please enter a username.');
    if (!password.checkValidity()) addError('Please enter the password.');

    if (isError()) {
        showErrors();
        return;
    }

    const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.value, password: password.value }),
        credentials: 'include'
    });

    const data = await res.json();

    if (res.ok) {
        localStorage.setItem('username', data.username);
        localStorage.setItem('extraData', data.extraData);
        window.location.href = '/home';
    } else {
        addError('Login failed: ' + data.error);
        showErrors();
    }
}

// registra un utente e in caso di successo esegue il login
async function register(){
    const user = {
        username: document.getElementById('username'),
        firstName: document.getElementById('firstname'),
        lastName: document.getElementById('lastname'),
        email: document.getElementById('email'),
        type: document.getElementById('type'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmpassword')
    }

    for (const key in user) {
        if (!user[key].checkValidity()) addError('Please enter a valid ' + key + '.');
    }

    if (isError()) {
        showErrors();
        return;
    }

    const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: user.username.value,
            firstName: user.firstName.value,
            lastName: user.lastName.value,
            email: user.email.value,
            type: user.type.value,
            password: user.password.value,
            confirmPassword: user.confirmPassword.value,
        })
    });

    const data = await res.json();

    if (res.ok) {
        await login();
    } else {
        if (typeof data.error == 'string') {
            addError(data.error);
        } else {
            data.error.forEach((err) => {
                addError(err);
            });
        }

        showErrors();
    }
}

// controlla se l'utente ha già un token e se lo ha fa un redirect alla home page
async function isLoggedIn(){
    const res = await fetch('/auth/check', {
        method: 'GET',
        credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) return;

    if (data.ok) {
        window.location.href = '/home';
        return;
    }

    localStorage.clear();
    document.body.hidden = false;
}