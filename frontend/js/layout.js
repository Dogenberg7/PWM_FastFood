// applica le parti comuni (come la navbar) a ogni pagina html che importa questo script
// sposta il contenuto del div con id="content" all'interno del main-container
// il div content deve contenere colonne adeguate in base alla pagina
function applyLayout(){
    document.body.classList.add('bg-dark-subtle');

    const username = localStorage.getItem('username');

    // navbar
    const navbar = document.createElement('nav');
    navbar.className = 'navbar bg-primary text-white mb-0 my-navbar';

    const navbarContainer = document.createElement('div');
    navbarContainer.className = 'container-fluid';

    const navbarBrand = document.createElement('span');
    navbarBrand.className = 'navbar-brand mb-0 h1 text-white';
    navbarBrand.innerText = 'PWM FastFood';

    const navbarBtns = document.createElement('span');

    if (username) {
        const homeBtn = document.createElement('button');
        homeBtn.className = 'btn btn-primary my-0';
        homeBtn.type = 'button';
        homeBtn.onclick = () => {
            window.location.href = '/home';
        };
        homeBtn.innerText = 'Home';

        const profileBtn = document.createElement('button');
        profileBtn.className = 'btn btn-primary my-0';
        profileBtn.type = 'button';
        profileBtn.onclick = () => {
            window.location.href = '/profile'
        };
        profileBtn.innerText = username;

        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-primary my-0';
        logoutBtn.type = 'button';
        logoutBtn.onclick = () => {
            logout()
        };
        logoutBtn.innerText = 'Logout';

        const cartBtn = document.createElement('button');
        cartBtn.id = 'cart-btn'
        cartBtn.className = 'btn btn-primary my-0';
        cartBtn.type = 'button';
        cartBtn.onclick = () => { window.location.href = '/cart'; }
        cartBtn.hidden = true;

        const cartIcon = document.createElement('img');
        //cartIcon.className = 'img-fluid';
        cartIcon.src = '/images/cart.png';

        cartBtn.append(cartIcon);

        navbarBtns.append(homeBtn, cartBtn, profileBtn, logoutBtn);
    }

    navbarContainer.append(navbarBrand, navbarBtns);
    navbar.append(navbarContainer);

    // main container
    const container = document.createElement('div');
    container.className = 'bg-dark container main-container px-5 pt-3';

    const row = document.createElement('div');
    row.className = 'row h-100';

    // sposta il contenuto di content
    const content = document.getElementById('content');
    if (content) {
        while (content.firstChild) {
            row.appendChild(content.firstChild);
        }
        content.remove();
    }

    // composizione del layout
    container.append(row);
    document.body.prepend(container); // metto container come primo child, così viene messo prima degli script
    document.body.prepend(navbar); // metto navbar come primo child, così viene messo prima degli script e prima di container
}

async function logout(){
    const res = await fetch('/auth/logout', {
        method: 'GET',
        credentials: 'include'
    });
    if (res.ok) {
        localStorage.clear();
        window.location.href = '/';
    }
}

function showCart() {
    if (localStorage.getItem('cart')) document.getElementById('cart-btn').hidden = false;
}

applyLayout();
showCart();