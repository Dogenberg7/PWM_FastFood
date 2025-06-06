const queueElement = document.getElementById('queue');
let currentQueue;

window.onload = () => {
    getQueue()
        .then((queue) => {
            currentQueue = queue;
            showCards(orderCards(queue), queueElement);
        });
}

async function getQueue() {
    const res = await fetch('/api/queue', {
        method: 'GET',
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    return data.queue;
}

function orderCards(orders) {
    let cards = [];

    orders.forEach((order, index) => {
        const col = document.createElement('div');
        col.className = 'col-6';

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

        const customer = document.createElement('div');
        customer.className = 'card-text';
        customer.innerText = 'Customer: ' + order.customer.name;

        const priceAmount = document.createElement('div');
        priceAmount.className = 'card-text';
        priceAmount.innerText = 'Amount: ' + order.amount + ', Total: ' + order.price / 100 + '€';

        const status = document.createElement('div');
        status.className = 'card-text';
        status.innerText = 'Status: ' + order.state;

        cardBody.append(cardTitle, customer, priceAmount, status);
        colBody.append(cardBody);
        colImg.append(cardImg);
        row.append(colImg, colBody,);

        if (index === 0) {
            const colBtn = document.createElement('div');
            colBtn.className = 'col-2 ';

            const confBtn = document.createElement('button');
            confBtn.type = 'button';
            confBtn.className = 'btn btn-primary';
            confBtn.innerText = 'Next stage';
            confBtn.onclick = () => {
                advanceOrder()
                    .then((res) => {
                        if (res) currentQueue = getQueue()
                            .then((queue) => {
                                currentQueue = queue;
                                showCards(orderCards(queue), queueElement)
                            });
                    });
            };

            colBtn.append(confBtn);
            row.append(colBtn);
        }

        card.append(row);
        col.append(card);

        cards.push(col);
    });

    return cards;
}

function showCards(cards, container) {
    container.innerHTML = '';

    if (cards.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'col-12';
        empty.innerText = 'Your queue is currently empty.';

        container.append(empty);
        return;
    }

    cards.forEach((card) => {
        container.append(card);
    });
}

async function advanceOrder() {
    const res = await fetch('/api/order/update', {
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