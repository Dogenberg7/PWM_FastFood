const cardResults = document.getElementById('cards');
const total = document.getElementById('total');
let order;
let price;
let paymentMethods;
let selectedCard;

window.onload = () => {
    order = JSON.parse(localStorage.getItem('cart'));
    getTotal()
        .then((totalPrice) => {
            price = totalPrice;
            total.innerText = 'Total: ' + price / 100 + '€';
        });
    getPayments()
        .then((cards) => {
            paymentMethods = cards;
            printCards(makePaymentCards(paymentMethods), cardResults);
        });
}

async function getTotal() {
    let totalPrice = 0
    for (const key in order) {
        const item = order[key];

        const res = await fetch(`/api/menu/${item.restaurant}`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await res.json();

        if (!res.ok) {
            addError(data.error);
            showErrors();
            return;
        }

        const itemPrice = data.menu.find(dish => dish.dish._id === item.dish).price * item.amount;
        order[key].price = itemPrice;
        totalPrice += itemPrice;
    }

    return totalPrice;
}

async function getPayments() {
    const res = await fetch(`/api/cards`, {
        method: 'GET',
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    return data.cards;
}

function makePaymentCards(cards) {
    let cardsArray = [];
    cards.forEach((card, index) => {
        const col = document.createElement('div');
        col.className = 'col-4';

        const cardElement = document.createElement('div');
        cardElement.className = 'card bg-dark-subtle';
        cardElement.onclick = () => {
            if (selectedCard) selectedCard.className = 'card bg-dark-subtle';
            selectedCard = cardElement;
            cardElement.className = 'card bg-primary';
        };

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body pt-0';

        const owner = document.createElement('p');
        owner.innerText = 'Owner: ' + card.owner;

        const expiry = document.createElement('p');
        expiry.innerText = 'Expiration date: ' + card.expiry;

        const number = document.createElement('div');
        number.innerText = 'Number: ' + card.number;

        cardBody.append(owner, expiry, number);
        cardElement.append(cardBody);
        col.append(cardElement);

        cardsArray.push(col);
    });

    return cardsArray;
}

function printCards(cards, container) {
    cards.forEach((card) => {
        container.append(card);
    });
}

async function confirmOrder() {
    if (!selectedCard) {
        addError('Please select a payment method.');
        showErrors();
        return;
    }

    const res = await fetch(`/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
        credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    localStorage.removeItem('order');
    window.location.href = '/profile';
}