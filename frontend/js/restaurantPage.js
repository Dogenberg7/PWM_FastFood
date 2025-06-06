const restaurantInfo = {
    name: document.getElementById('restaurant-name'),
    phone: document.getElementById('restaurant-phone'),
    address: document.getElementById('restaurant-address'),
    phoneTitle: document.getElementById('phone-title'),
    menuTitle: document.getElementById('menu-title'),
    addressTitle: document.getElementById('address-title')
};
const restId = window.location.pathname.split('/').pop();
const menuElement = document.getElementById('menu');
const dishModal = {
    modal: new bootstrap.Modal(document.getElementById('dishModal')),
    name: document.getElementById('dishModalTitle'),
    category: document.getElementById('dishModalCategory'),
    price: document.getElementById('dishPrice'),
    image: document.getElementById('dishModalImg'),
    ingredients: document.getElementById('dishModalIngredients'),
    amount: document.getElementById('dishAmount')
};
let menu = [];
let shownDish = {};
let currentCart;

window.onload = () => {
    currentCart = JSON.parse(localStorage.getItem('cart')) || {};
    getMenu();
}

async function getMenu() {
    const res = await fetch(`/api/menu/${restId}`, {
        method: 'GET',
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        return window.location.href = '/home';
    }

    restaurantInfo.name.innerText = data.name;
    if (!data.active) {
        restaurantInfo.phoneTitle.innerText = '';
        restaurantInfo.menuTitle.innerText = '';
        restaurantInfo.addressTitle.innerText = 'This restaurant is permanently closed.';
        return;
    }
    restaurantInfo.address.innerText = data.address.streetAddress + '\n' + data.address.city + ' ' + data.address.province;
    restaurantInfo.phone.innerText = data.phone;
    menu = data.menu.map(item => {
        return {
            dish: item.dish._id,
            category: item.dish.category,
            name: item.dish.name,
            ingredients: item.dish.ingredients,
            image: item.dish.image,
            price: item.price,
            prepTime: item.preparationTime,
        }
    });

    makeDishesCards(menu).forEach((dish) => { menuElement.append(dish)});
}

function makeDishesCards(dishes) {
    let cards = [];
    for (let i = 0; i < dishes.length; i++) {
        const col = document.createElement('div');
        col.className = 'col my-2';
        col.onclick = () => { showDish(dishes[i]) };

        const card = document.createElement('div');
        card.className = 'card custom-card';

        const cardImg = document.createElement('img');
        cardImg.className = 'card-img image-clip';
        cardImg.src = dishes[i].image;

        const overlay = document.createElement('div');
        overlay.className = 'card-img-overlay';

        const cardTitle = document.createElement('div');
        cardTitle.className = 'card-title text-border';
        cardTitle.innerText = dishes[i].name.substring(0,20) + (dishes[i].name.length > 20 ? '...' : '');

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body text-border';
        cardBody.innerText = dishes[i].category + '\n' + dishes[i].price / 100 + '€';

        overlay.append(cardTitle, cardBody);
        card.append(cardImg, overlay);
        col.append(card);
        cards.push(col);
    }

    return cards;
}

function showDish(dish) {
    shownDish = dish;

    dishModal.name.innerText = dish.name;
    dishModal.category.innerText = dish.category;
    dishModal.price.innerText = dish.price / 100 + '€';
    dishModal.image.src = dish.image;
    dishModal.amount.value = currentCart[restId + dish.dish]?.amount || 1;
    dishModal.ingredients.innerHTML = '';

    dish.ingredients.forEach(ingredient => {
        const ingredientElement = document.createElement('li');
        ingredientElement.innerText = ingredient;

        dishModal.ingredients.append(ingredientElement);
    });

    dishModal.modal.show();
}

function dishToCart() {
    const key = restId + shownDish.dish;

    if (!dishModal.amount.checkValidity()) {
        addError('Please insert a valid amount.');
        showErrors();
        return;
    }

    currentCart[key] = {
        restaurant: restId,
        dish: shownDish.dish,
        amount: dishModal.amount.value
    }

    const cartString = JSON.stringify(currentCart);
    localStorage.setItem('cart', cartString);

    dishModal.modal.hide();
}