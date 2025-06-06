const userProfile = {
    profile: document.getElementById('profile'),
    username: document.getElementById('username'),
    firstName: document.getElementById('firstname'),
    lastName: document.getElementById('lastname'),
    email: document.getElementById('email'),
    type: document.getElementById('type'),
};

const userAddress = {
    street: document.getElementById('usrstraddress'),
    city: document.getElementById('usrcity'),
    province: document.getElementById('usrprov'),
    zip: document.getElementById('usrzip')
}

const restaurantData = {
    name: document.getElementById('restname'),
    phone: document.getElementById('restphone'),
    address: {
        street: document.getElementById('reststraddress'),
        city: document.getElementById('restcity'),
        province: document.getElementById('restprov'),
        zip: document.getElementById('restzip'),
    }
}

const pagination = {
    prev: document.getElementById('pgPrev'),
    first: document.getElementById('pgFirst'),
    leftDots: document.getElementById('pgLeftDots'),
    current: document.getElementById('pgCurrent'),
    rightDots: document.getElementById('pgRightDots'),
    last: document.getElementById('pgLast'),
    next: document.getElementById('pgNext'),
    nav: document.getElementById('pag-nav')
}

let deactivateModal = {
    modalhtml: document.getElementById('deactivate-modal'),
    modal: null,
    password: document.getElementById('deactivate-password'),
}

let fetchedProfile;
const ordersElement = document.getElementById('orders');
let currentPage = 1;
let totalOrders;
let maxPage = 1;

window.onload = () => {
    fetchedProfile = getProfile()
        .then(data => { fetchedProfile = data; });

    deactivateModal.modal = new bootstrap.Modal(deactivateModal.modalhtml);
    showOrders();
    setInterval(showOrders, 60 * 1000); // refresh ogni minuto dato che i tempi di attesa sono in minuti
}

async function getProfile() {
    const res = await fetch('/api/profile', {
        method: 'GET',
        credentials: "include"
    });

    const data = await res.json();

    if (!res.ok){
        addError(data.error);
        showErrors();
        return;
    }

    userProfile.username.innerText = data.profile.username;
    userProfile.firstName.innerText = data.profile.firstName;
    userProfile.lastName.innerText = data.profile.lastName;
    userProfile.email.innerText = data.profile.email;
    userProfile.type.innerText = data.profile.type;

    if (data.address) {
        userAddress.street.innerText = data.address.streetAddress;
        userAddress.city.innerText = data.address.city;
        userAddress.province.innerText = data.address.province;
        userAddress.zip.innerText = data.address.zipCode;
        document.getElementById('usraddress').hidden = false;
    }

    if (data.restaurant){
        restaurantData.name.innerText = data.restaurant.name;
        restaurantData.phone.innerText = data.restaurant.phoneNumber;
        restaurantData.address.street.innerText = data.restaurant.address.streetAddress;
        restaurantData.address.city.innerText = data.restaurant.address.city;
        restaurantData.address.province.innerText = data.restaurant.address.province;
        restaurantData.address.zip.innerText = data.restaurant.address.zipCode;
    } else {
        document.getElementById('restaurant').remove();
    }

    return data;
}

async function getOrders(page) {
    const res = await fetch(`/api/orders?page=${page}`, {
        method: 'GET',
        credentials: "include"
    });
    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    totalOrders = data.total;
    maxPage = Math.floor(totalOrders / 10) + (totalOrders % 10 > 0 ? 1 : 0);

    let orders = [];
    for(let order of data.orders) {
        const newOrder = await getEstimation(order);
        orders.push(newOrder);
    }

    return orders;
}

async function getEstimation(order){
    if (!(order.state === 'received' || order.state === 'preparing') || fetchedProfile.restaurant){
        return order;
    }

    const res = await fetch(`/api/estimate/${order.id}`, {
        method: 'GET',
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    return {
        ...order,
        estimatedTime: data.estimatedTime
    };

}

async function showOrders() {
    ordersElement.innerHTML = '';

    const receivedOrders = await getOrders(currentPage);

    if (totalOrders === 0) {
        ordersElement.innerText = 'No orders yet.';
        setPagination();
        return;
    }

    orderCards(receivedOrders).forEach(order => {
        ordersElement.append(order);
    });

    setPagination();
}

function orderCards(orders) {
    let cards = [];

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'card mb-3';

        const row = document.createElement('div');
        row.className = 'row g-0';

        const colImg = document.createElement('div');
        colImg.className = 'col-3';
        colImg.style.height = '200px';

        const cardImg = document.createElement('img');
        cardImg.className = 'rounded-start img-fluid image-clip';
        cardImg.src = order.dish.image;

        const colBody = document.createElement('div');
        colBody.className = 'col-7';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title';
        cardTitle.innerText = order.dish.name;

        const priceAmount = document.createElement('div');
        priceAmount.className = 'card-text';
        priceAmount.innerText = 'Amount: ' + order.amount + ', Total: ' + order.price / 100 + '€';

        const status = document.createElement('div');
        status.className = 'card-text';
        status.innerText = 'Status: ' + order.state;

        cardBody.append(cardTitle);
        row.append(colImg, colBody);

        if (!fetchedProfile.restaurant) {
            const restaurantText = document.createElement('div');
            restaurantText.className = 'card-text';
            restaurantText.innerText = 'Restaurant: ';

            const restaurantName = document.createElement('a');
            restaurantName.className = 'card-text';
            restaurantName.innerText = order.restaurant.name;
            restaurantName.href = `/restaurant/${order.restaurant.id}`;

            restaurantText.append(restaurantName);
            cardBody.append(restaurantText);
        } else {
            const customer = document.createElement('div');
            customer.className = 'card-text';
            customer.innerText = 'Customer: ' + order.customer.name;

            cardBody.append(customer);
        }

        if (order.estimatedTime) {
            const estimate = document.createElement('div');
            estimate.className = 'card-text';
            estimate.innerText = 'Estimated time: ' + order.estimatedTime;
            cardBody.append(estimate);
        }

        if (!fetchedProfile.restaurant && order.state === 'ready') {
            const colBtn = document.createElement('div');
            colBtn.className = 'col-2 ';

            const confBtn = document.createElement('button');
            confBtn.type = 'button';
            confBtn.className = 'btn btn-primary';
            confBtn.innerText = 'Confirm pickup';
            confBtn.onclick = () => { confirmPickup(order.id).then((res) => { if (res) {status.innerText = 'Status: completed';colBtn.remove()}}) };

            colBtn.append(confBtn);
            row.append(colBtn);
        }

        cardBody.append(priceAmount, status);
        colBody.append(cardBody);
        colImg.append(cardImg);
        card.append(row);

        cards.push(card);
    });

    return cards;
}

async function confirmPickup(orderId) {
    const res = await fetch(`/api/confirmpickup/${orderId}`,{
        method: 'PUT',
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return false;
    }

    return true;
}

function setPagination(){
    if (totalOrders === 0) pagination.nav.hidden = true;

    switch (currentPage) {
        case 1:
            pagination.prev.classList.add('disabled');
            pagination.first.hidden = true;
            pagination.leftDots.hidden = true;
            break;
        case 2:
            pagination.prev.classList.remove('disabled');
            pagination.first.hidden = false;
            pagination.leftDots.hidden = true;
            break;
        default:
            pagination.prev.classList.remove('disabled');
            pagination.first.hidden = false;
            pagination.leftDots.hidden = false;
    }

    switch (currentPage) {
        case (maxPage):
            pagination.next.classList.add('disabled');
            pagination.last.hidden = true;
            pagination.rightDots.hidden = true;
            break;
        case (maxPage - 1):
            pagination.next.classList.remove('disabled');
            pagination.last.hidden = false;
            pagination.rightDots.hidden = true;
            break;
        default:
            pagination.next.classList.remove('disabled');
            pagination.last.hidden = false;
            pagination.rightDots.hidden = false;
    }

    pagination.current.firstElementChild.innerText = currentPage;
    pagination.last.firstElementChild.innerText = maxPage;
}

function goToPage(page) {
    if (page > maxPage || page === currentPage) return;
    currentPage = page;
    showOrders();
}

function deactivateBtn() {
    deactivateModal.modal.show();
}

async function deactivateAccount() {
    if (!deactivateModal.password.checkValidity()) {
        addError('Please insert a valid password');
        showErrors();
        return;
    }

    const password = deactivateModal.password.value;

    const res = await fetch(`/api/deactivate`,{
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({password}),
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    localStorage.clear();

    window.location.href = '/';
}

function editProfile() {
    window.location.href = '/profile/edit';
}

function analytics() {
    window.location.href = '/restaurant/analytics';
}