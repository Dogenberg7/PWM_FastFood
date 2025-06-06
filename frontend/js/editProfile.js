let profileForm = {
    tab: document.getElementById('profile-tab'),
    pane: document.getElementById('profile-tab-pane'),
    firstName: document.getElementById('first-name'),
    lastName: document.getElementById('last-name'),
    currentName: document.getElementById('current-name'),
    username: document.getElementById('username'),
    currentUsername: document.getElementById('current-username'),
    email: document.getElementById('email'),
    currentEmail: document.getElementById('current-email'),
    currentPassword: document.getElementById('current-password'),
    password: document.getElementById('password'),
    confirmPassword: document.getElementById('confirm-password')
}

let addressForm = {
    tab: document.getElementById('address-tab'),
    pane: document.getElementById('address-tab-pane'),
    street: document.getElementById('street'),
    currentStreet: document.getElementById('current-street'),
    city: document.getElementById('city'),
    currentCity: document.getElementById('current-city'),
    province: document.getElementById('province'),
    currentProvince: document.getElementById('current-province'),
    zipCode: document.getElementById('zip-code'),
    currentZipCode: document.getElementById('current-zip-code')
}

let cardsForm = {
    tab: document.getElementById('pay-tab'),
    pane: document.getElementById('pay-tab-pane'),
    owner: document.getElementById('new-card-owner'),
    number: document.getElementById('new-card-number'),
    expiry: document.getElementById('new-card-expiry'),
    cvc: document.getElementById('new-card-cvc'),
    currentCards: document.getElementById('current-cards'),
}

let restaurantForm = {
    tab: document.getElementById('restaurant-tab'),
    pane: document.getElementById('restaurant-tab-pane'),
    name: document.getElementById('restaurant-name'),
    currentName: document.getElementById('current-restaurant-name'),
    street: document.getElementById('restaurant-street'),
    currentStreet: document.getElementById('current-restaurant-street'),
    city: document.getElementById('restaurant-city'),
    currentCity: document.getElementById('current-restaurant-city'),
    province: document.getElementById('restaurant-province'),
    currentProvince: document.getElementById('current-restaurant-province'),
    zipCode: document.getElementById('restaurant-zip-code'),
    currentZipCode: document.getElementById('current-restaurant-zip-code'),
    phone: document.getElementById('restaurant-phone'),
    currentPhone: document.getElementById('current-restaurant-phone'),
    vat: document.getElementById('restaurant-vat'),
    currentVat: document.getElementById('current-restaurant-vat'),
}

let profileData;

window.onload = () => {
    getProfile()
        .then((profile) => {
            profileData = profile;
            fillForms();
            if (profileData.cards) showCards(makeCards(profileData.cards));
        });
}

async function getProfile() {
    const res = await fetch('/api/profile', {
        method: 'GET',
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    return data;
}

function fillForms() {
    profileForm.currentName.innerText = 'Current: ' + profileData.profile.firstName + ' ' + profileData.profile.lastName;
    profileForm.currentUsername.innerText = 'Current: ' + profileData.profile.username;
    profileForm.currentEmail.innerText = 'Current: ' + profileData.profile.email;

    if (profileData.address) {
        addressForm.tab.hidden = false;
        addressForm.currentStreet.innerText = 'Current: ' + profileData.address.streetAddress;
        addressForm.currentCity.innerText = 'Current: ' + profileData.address.city;
        addressForm.currentProvince.innerText = 'Current: ' + profileData.address.province;
        addressForm.currentZipCode.innerText = 'Current: ' + profileData.address.zipCode;
    }
    else addressForm.pane.remove();

    if (profileData.cards) {
        cardsForm.tab.hidden = false;
    }
    else cardsForm.pane.remove();

    if (profileData.restaurant) {
        restaurantForm.tab.hidden = false;
        restaurantForm.currentName.innerText = 'Current: ' + profileData.restaurant.name;
        restaurantForm.currentStreet.innerText = 'Current: ' + profileData.restaurant.address.streetAddress;
        restaurantForm.currentCity.innerText = 'Current: ' + profileData.restaurant.address.city;
        restaurantForm.currentProvince.innerText = 'Current: ' + profileData.restaurant.address.province;
        restaurantForm.currentZipCode.innerText = 'Current: ' + profileData.restaurant.address.zipCode;
        restaurantForm.currentPhone.innerText = 'Current: ' + profileData.restaurant.phoneNumber;
        restaurantForm.currentVat.innerText = 'Current: ' + profileData.restaurant.vatNumber;
    }
    else restaurantForm.pane.remove();
}

async function removeCard(id){
    const res = await fetch(`/api/card/delete/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return false;
    }

    profileData.cards = data.cards;

    return true;
}

async function addCard() {
    if (!cardsForm.owner.checkValidity()) addError('Please insert an owner.');
    if (!cardsForm.number.checkValidity()) addError('Please insert a card number.');
    if (!cardsForm.expiry.checkValidity()) addError('Please insert an expiration date.');
    if (!cardsForm.cvc.checkValidity()) addError('Please insert a security code.');
    if (isError()) {
        showErrors();
        return;
    }

    const card = {
        cardOwner: cardsForm.owner.value,
        cardNumber: cardsForm.number.value,
        expiryDate: cardsForm.expiry.value,
        cvc: cardsForm.cvc.value
    };

    const res = await fetch(`/api/card/add`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({ card })
    });

    const data = await res.json();

    console.log(data);

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    profileData.cards = data.cards;

    cardsForm.owner.value = '';
    cardsForm.number.value = '';
    cardsForm.expiry.value = '';
    cardsForm.cvc.value = '';
    cardsForm.currentCards.innerHTML = '';
    showCards(makeCards(profileData.cards));
}

function makeCards(cards) {
    let cardsArray = [];
    cards.forEach((card, index) => {
        const col = document.createElement('div');
        col.className = 'col-10';

        const cardElement = document.createElement('div');
        cardElement.className = 'card bg-dark-subtle my-2';

        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer p-0';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerText = 'Remove card';
        removeBtn.className = 'btn btn-danger m-0 w-100 rounded-top-0';
        removeBtn.onclick = () => { removeCard(card._id).then((res => { if (res) col.remove() })); };

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body pt-0';

        const owner = document.createElement('p');
        owner.innerText = 'Owner: ' + card.cardOwner;

        const expiry = document.createElement('p');
        expiry.innerText = 'Expiration date: ' + card.expiryDate;

        const number = document.createElement('div');
        number.innerText = 'Number: **** **** **** ' + card.cardNumber.substring(12);

        cardFooter.append(removeBtn);
        cardBody.append(owner, expiry, number);
        cardElement.append(cardBody, cardFooter);
        col.append(cardElement);

        cardsArray.push(col);
    });

    return cardsArray;
}

function showCards(cards) {
    cardsForm.currentCards.innerHTML = '';
    cards.forEach(card => cardsForm.currentCards.append(card));
}

async function editAddress() {
    const newAddress = {
        streetAddress: addressForm.street.value || null,
        city: addressForm.city.value || null,
        province: addressForm.province.value || null,
        zipCode: addressForm.zipCode.value || null
    };

    const res = await fetch(`/api/address/update`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({address: newAddress}),
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    window.location.href = '/profile';
}

async function editProfile() {
    const newProfile = {
        username: profileForm.username.value || null,
        firstName: profileForm.firstName.value || null,
        lastName: profileForm.lastName.value || null,
        email: profileForm.email.value || null,
        password: profileForm.currentPassword.value || null,
        newPassword: profileForm.password.value || null,
        confirmPassword: profileForm.confirmPassword.value || null
    }

    if (profileForm.email && !profileForm.email.checkValidity()) addError('Please insert a valid email address.');
    if (isError()) {
        showErrors();
        return;
    }

    const res = await fetch(`/api/profile/update`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ newProfile }),
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    window.location.href = '/profile';
}

async function editRestaurant() {
    const newRestaurant = {
        name: restaurantForm.name.value || null,
        address: {
            streetAddress: restaurantForm.street.value || null,
            city: restaurantForm.city.value || null,
            province: restaurantForm.province.value || null,
            zipCode: restaurantForm.zipCode.value || null
        },
        phoneNumber: restaurantForm.phone.value || null,
        vatNumber: restaurantForm.vat.value || null
    }

    const res = await fetch('/api/restaurant/update', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ newRestaurant })
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    window.location.href = '/profile';
}