let dishElements = {
    searchName: document.getElementById('dish-name'),
    searchCategory: document.getElementById('dish-category'),
    maxPrice: document.getElementById('dish-price'),
    prev: document.getElementById('dish-pgPrev'),
    first: document.getElementById('dish-pgFirst'),
    left: document.getElementById('dish-pgLeftDots'),
    current: document.getElementById('dish-pgCurrent'),
    right: document.getElementById('dish-pgRightDots'),
    last: document.getElementById('dish-pgLast'),
    next: document.getElementById('dish-pgNext'),
    results: document.getElementById('dish-results'),
    currentPage: 1,
    maxPage: 1
}

let dishModal = {
    modal: new bootstrap.Modal(document.getElementById('dish-modal')),
    title: document.getElementById('dish-modal-title'),
    body: document.getElementById('dish-modal-body'),
    img: document.getElementById('dish-modal-img'),
    restaurant: document.getElementById('dish-modal-restaurant'),
    category: document.getElementById('dish-modal-category'),
    ingredients: document.getElementById('dish-modal-ingredients'),
    price: document.getElementById('dish-modal-price'),
    amount: document.getElementById('dish-modal-amount'),
}

let restaurantElements = {
    searchName: document.getElementById('restaurant-name'),
    searchCity: document.getElementById('restaurant-city'),
    searchStreet: document.getElementById('restaurant-street'),
    prev: document.getElementById('restaurant-pgPrev'),
    first: document.getElementById('restaurant-pgFirst'),
    left: document.getElementById('restaurant-pgLeftDots'),
    current: document.getElementById('restaurant-pgCurrent'),
    right: document.getElementById('restaurant-pgRightDots'),
    last: document.getElementById('restaurant-pgLast'),
    next: document.getElementById('restaurant-pgNext'),
    results: document.getElementById('restaurant-results'),
    currentPage: 1,
    maxPage: 1
}

const nearby = document.getElementById('nearby');

let currentDishes;
let currentRestaurants;
let currentNearby;
let shownDish = {};
let currentCart;

window.onload = () => {
    currentCart = JSON.parse(localStorage.getItem('cart')) || {};
    localStorage.setItem('cart', JSON.stringify(currentCart));
    showCart();
    searchDishes().then(dishes => {currentDishes = dishes});
    searchRestaurants().then(restaurants => {currentRestaurants = restaurants});
    getNearby().then(restaurants => {currentNearby = restaurants});
    setPagination(dishElements);
    setPagination(restaurantElements);
}

async function searchDishes() {
    const name = dishElements.searchName.value;
    const category = dishElements.searchCategory.value;
    const price = dishElements.maxPrice.value;
    const page = dishElements.currentPage;

    const params = new URLSearchParams();

    if (name) params.append('name', name);
    if (category) params.append('category', category);
    if (price) params.append('price', (price * 100).toString());
    params.append('page', page);
    const query = params.toString();

    const res = await fetch(`/api/dishes/search?${query}`, {
        method: 'GET',
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    dishElements.results.scrollLeft = 0;
    dishElements.maxPage = Math.max(Math.floor(data.total / 20) + (data.total % 20 > 0 ? 1 : 0), 1);
    setPagination(dishElements);
    showCards(makeDishesCards(data.results), dishElements.results);
    return data.results;
}

function makeDishesCards(dishes) {
    let cards = [];
    for (let i = 0; i < dishes.length; i++) {
        const col = document.createElement('div');
        col.className = 'col-3 my-2';
        col.onclick = () => { showDish(dishes[i]) };

        const card = document.createElement('div');
        card.className = 'card custom-card';

        const cardImg = document.createElement('img');
        cardImg.className = 'card-img image-clip';
        cardImg.src = dishes[i].dish.image;

        const overlay = document.createElement('div');
        overlay.className = 'card-img-overlay';

        const cardTitle = document.createElement('div');
        cardTitle.className = 'card-title text-border p-0';
        cardTitle.innerText = dishes[i].dish.name.substring(0,20) + (dishes[i].dish.name.length > 20 ? '...' : '');

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body text-border';
        cardBody.innerText = dishes[i].dish.category + '\n' +
            dishes[i].price / 100 + '€\n' + dishes[i].restaurantName;

        overlay.append(cardTitle, cardBody);
        card.append(cardImg, overlay);
        col.append(card);
        cards.push(col);
    }

    return cards;
}

function showCards(cards, container) {
    container.innerHTML = '';
    if (cards.length === 0) {
        container.innerText = 'No results';
        return;
    }
    cards.forEach((card) => {container.append(card)});
}

function showDish(dish) {
    shownDish = dish;
    dishModal.title.innerText = dish.dish.name;
    dishModal.img.src = dish.dish.image;
    dishModal.restaurant.innerText = dish.restaurantName;
    dishModal.category.innerText = dish.dish.category;
    dishModal.price.innerText = dish.price / 100 + '€';
    dish.dish.ingredients.forEach( ingredient => {
        const li = document.createElement('li');
        li.innerText = ingredient;
        dishModal.ingredients.append(li);
    });
    dishModal.amount.value = currentCart[dish.restaurantId + dish.dish._id]?.amount || 1;
    dishModal.modal.show();
}

function dishToCart() {
    const key = shownDish.restaurantId + shownDish.dish._id;

    if (!dishModal.amount.checkValidity()) {
        addError('Please insert a valid amount.');
        showErrors();
        return;
    }

    currentCart[key] = {
        restaurant: shownDish.restaurantId,
        dish: shownDish.dish._id,
        amount: dishModal.amount.value
    }

    const cartString = JSON.stringify(currentCart);
    localStorage.setItem('cart', cartString);

    dishModal.modal.hide();
}

async function searchRestaurants() {
    const name = restaurantElements.searchName.value;
    const street = restaurantElements.searchStreet.value;
    const city = restaurantElements.searchCity.value;
    const page = restaurantElements.currentPage;

    const params = new URLSearchParams();

    if (name) params.append('name', name);
    if (street) params.append('street', street);
    if (city) params.append('city', city);
    params.append('page', page);
    const query = params.toString();

    const res = await fetch(`/api/restaurant/search?${query}`, {
        method: 'GET',
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    restaurantElements.results.scrollLeft = 0;
    restaurantElements.maxPage = Math.max(Math.floor(data.total / 20) + (data.total % 20 > 0 ? 1 : 0), 1);
    setPagination(restaurantElements);
    showCards(makeRestaurantCards(data.restaurants), restaurantElements.results);
}

async function getNearby() {
    const res = await fetch('/api/nearby', {
        method: 'GET',
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.message);
        showErrors();
        return;
    }

    showCards(makeRestaurantCards(data.nearbyRestaurants), nearby);
    return data.nearbyRestaurants;
}

function makeRestaurantCards(restaurant) {
    let cards = [];
    restaurant.forEach((restaurant) => {
        const col = document.createElement('div');
        col.className = 'col-3';
        col.onclick = () => { window.location.href = `/restaurant/${restaurant._id}`; };

        const card = document.createElement('div');
        card.className = 'card bg-dark-subtle';

        const cardTitle = document.createElement('div');
        cardTitle.className = 'card-title ms-2 mt-1 mb-0';
        cardTitle.innerText = restaurant.name;

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body pt-0';

        const address = document.createElement('div');
        address.innerText = restaurant.address.streetAddress + '\n' +
            restaurant.address.city + ', ' + restaurant.address.province;

        const phone = document.createElement('div');
        phone.innerText = restaurant.phoneNumber;

        cardBody.appendChild(address);
        cardBody.appendChild(phone);
        card.appendChild(cardTitle);
        card.appendChild(cardBody);
        col.appendChild(card);

        cards.push(col);
    });
    return cards;
}

function setPagination(elements){
    switch (elements.currentPage) {
        case 1:
            elements.prev.classList.add('disabled');
            elements.first.hidden = true;
            elements.left.hidden = true;
            break;
        case 2:
            elements.prev.classList.remove('disabled');
            elements.first.hidden = false;
            elements.left.hidden = true;
            break;
        default:
            elements.prev.classList.remove('disabled');
            elements.first.hidden = false;
            elements.left.hidden = false;
    }

    switch (elements.currentPage) {
        case (elements.maxPage):
            elements.next.classList.add('disabled');
            elements.last.hidden = true;
            elements.right.hidden = true;
            break;
        case (elements.maxPage - 1):
            elements.next.classList.remove('disabled');
            elements.last.hidden = false;
            elements.right.hidden = true;
            break;
        default:
            elements.next.classList.remove('disabled');
            elements.last.hidden = false;
            elements.right.hidden = false;
    }

    elements.current.firstElementChild.innerText = elements.currentPage;
    elements.last.firstElementChild.innerText = elements.maxPage;
}

async function goToPage(page, which) {
    if (which === 'dish') {
        dishElements.currentPage = page;
        currentDishes = await searchDishes();
    }
    if (which === 'restaurant') {
        restaurantElements.currentPage = page;
    }
}