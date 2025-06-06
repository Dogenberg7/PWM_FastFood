const items = document.getElementById('items');
const total = document.getElementById('total');
const confirm = document.getElementById('confirm');
let currentOrder;
let cartMenus;

window.onload = () => {
    currentOrder = JSON.parse(localStorage.getItem('cart'));
    getMenus(currentOrder)
        .then(menus => {
            cartMenus = menus;
            confirmArea();
            printCards(makeCards(currentOrder, cartMenus), items);
        });
}

async function getMenus(order) {
    let menus = {};
    for (const key in order) {
        const item = order[key];

        if (!menus[item.restaurant]) {
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

            menus[item.restaurant] = {
                name: data.name,
                menu: data.menu
                    .filter(dish => currentOrder[item.restaurant + dish.dish._id])
                    .map(dish => {
                        return {
                            id: dish.dish._id,
                            name: dish.dish.name,
                            image: dish.dish.image,
                            price: dish.price
                        };
                    })
            };
        }
    }

    return menus;
}

function makeCards(order, menus) {
    let cards = [];

    for (const key in order) {
        const orderData = order[key];
        const dishId = orderData.dish;
        const restId = orderData.restaurant;
        const orderAmount = orderData.amount;

        const restName = menus[restId].name
        const dish = menus[restId].menu.find(dish => dish.id === dishId);

        const card = document.createElement('div');
        card.className = 'card mb-3';

        const row = document.createElement('div');
        row.className = 'row g-0';

        const colImg = document.createElement('div');
        colImg.className = 'col-2';
        colImg.style.height = '200px';

        const cardImg = document.createElement('img');
        cardImg.className = 'rounded-start img-fluid image-clip';
        cardImg.src = dish.image;

        const colBody = document.createElement('div');
        colBody.className = 'col-8';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title';
        cardTitle.innerText = dish.name;

        const restaurantName = document.createElement('p');
        restaurantName.className = 'card-text';
        restaurantName.innerText = restName;

        const price = document.createElement('p');
        price.className = 'card-text';
        price.innerText = dish.price / 100 + '€';

        const amount = document.createElement('input');
        amount.className = 'form-control w-25';
        amount.type = 'number';
        amount.value = orderAmount;
        amount.min = '0';
        amount.step = '1';
        amount.onchange = () => {
            if (!amount.checkValidity()){
                addError('Invalid amount.');
                showErrors();
                amount.value = currentOrder[restId+dishId].amount;
                return;
            }
            if (amount.value === '0') {
                card.remove();
                delete currentOrder[restId+dishId];
            } else {
                currentOrder[restId+dishId].amount = amount.value;
            }
            localStorage.setItem('cart', JSON.stringify(currentOrder));
            confirmArea();
        };

        cardBody.append(cardTitle, restaurantName, price, amount);
        colBody.append(cardBody);
        colImg.append(cardImg);
        row.append(colImg, colBody);
        card.append(row);
        cards.push(card);
    }

    return cards;
}

function printCards(cards, container) {
    if (cards.length === 0) return;
    cards.forEach(card => {
        container.append(card);
    });
}

function confirmArea(){
    if (!currentOrder || Object.keys(currentOrder).length === 0) {
        const empty = document.createElement('h4');
        empty.innerText = 'Your cart is empty.';
        items.innerHTML = '';
        items.append(empty);
        confirm.remove();
    } else {
        let totalPrice = 0;
        for (const key in currentOrder) {
            const order = currentOrder[key];
            totalPrice += cartMenus[order.restaurant].menu.find((dish) => dish.id === order.dish).price * order.amount;
        }

        total.innerHTML = 'Total ' + totalPrice / 100 + '€';
    }
}