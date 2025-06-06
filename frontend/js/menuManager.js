const searchResults = document.getElementById('results');
const searchDish = document.getElementById('searchDish');
const currentDishes = document.getElementById('dishes');
const pagination = {
    prev: document.getElementById('pgPrev'),
    first: document.getElementById('pgFirst'),
    leftDots: document.getElementById('pgLeftDots'),
    current: document.getElementById('pgCurrent'),
    rightDots: document.getElementById('pgRightDots'),
    last: document.getElementById('pgLast'),
    next: document.getElementById('pgNext')
}
const newDish = {
    name: document.getElementById('newDishName'),
    category: document.getElementById('newDishCategory'),
    image: document.getElementById('newDishImage'),
    ingredients: document.getElementById('newDishIngredients')
}
const shownDish = {
    modal: document.getElementById('dishModal'),
    name: document.getElementById('dishModalTitle'),
    category: document.getElementById('dishModalCategory'),
    image: document.getElementById('dishModalImg'),
    ingredients: document.getElementById('dishModalIngredients'),
    price: document.getElementById('price'),
    prepTime: document.getElementById('prepTime'),
}
const dishModal = new bootstrap.Modal(shownDish.modal);
const restId = localStorage.getItem('extraData');
let shownDishData = {
    data: null,
    index: null
}
let currentMenu = [];
let fetchedDishes = [];
let totalDishes = 0;
let currentPage = 1;
let maxPage = 1;

window.onload = () => {
    getCurrentMenu();
    getDishes();
}

async function submitDish() {
    const formData = makeNewDishData();

    if (isError()) {
        showErrors();
        return;
    }

    const res = await fetch('/api/dish/add', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    for (const property in newDish) {
        newDish[property].value = '';
    }

    await getDishes();
    showDish({
        dish: data.dish._id,
        name: data.dish.name,
        category: data.dish.category,
        image: data.dish.image,
        ingredients: data.dish.ingredients,
        restaurant: data.dish.restaurant
    });
}

function makeNewDishData() {
    if (!newDish.name.checkValidity()) addError('Please enter a name.');
    if (!newDish.category.checkValidity()) addError('Please enter a category.');
    if (!newDish.image.checkValidity()) addError('Please select an image.');
    if (!newDish.ingredients.checkValidity()) addError('Please enter at least one ingredient.');

    if (isError()) return null;

    const name = newDish.name.value;
    const category = newDish.category.value;
    const image = newDish.image.files[0];
    const ingredients = newDish.ingredients.value;



    const splitIngredients = ingredients.split(',').map(i => i.trim());

    const formData = new FormData();
    formData.append('image', image);
    formData.append('name', name);
    formData.append('category', category);
    formData.append('restaurant', restId);
    splitIngredients.forEach(i => { formData.append('ingredients[]', i) });

    return formData;
}

async function getDishes() {
    const query = searchDish.value;
    const res = await fetch(`/api/dishes?restaurant=${restId}&query=${query}&page=${currentPage}`, {
        method: 'GET',
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    fetchedDishes = data.dishes.map(item => {
        return {
            dish: item._id,
            category: item.category,
            name: item.name,
            ingredients: item.ingredients,
            image: item.image,
        }
    });
    totalDishes = data.total;
    maxPage = Math.floor(totalDishes / 20) + (totalDishes % 20 > 0 ? 1 : 0);

    searchResults.innerHTML = '';
    makeDishesCards(fetchedDishes).forEach((dish) => { searchResults.append(dish) });
    searchResults.scrollTop = 0;

    setPagination();
}

function makeDishesCards(dishes, indexed) {
    let cards = [];
    for (let i = 0; i < dishes.length; i++) {
        const col = document.createElement('div');
        col.className = 'col my-2';
        col.onclick = () => { showDish(dishes[i], indexed ? i : null ) };

        const card = document.createElement('div');
        card.className = 'card custom-card';

        const cardImg = document.createElement('img');
        cardImg.className = 'card-img image-clip';
        cardImg.src = dishes[i].image;

        const overlay = document.createElement('div');
        overlay.className = 'card-img-overlay';

        const cardTitle = document.createElement('div');
        cardTitle.className = 'card-title text-border';
        cardTitle.innerText = dishes[i].name.substring(0,40) + (dishes[i].name.length > 40 ? '...' : '');

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body text-border';
        cardBody.innerText = dishes[i].category;

        overlay.append(cardTitle, cardBody);
        card.append(cardImg, overlay);
        col.append(card);
        cards.push(col);
    }

    return cards;
}

async function getCurrentMenu() {
    const res = await fetch(`/api/menu/${restId}`, {
        method: 'GET',
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    currentMenu = data.menu.map(item => {
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

    makeDishesCards(currentMenu, true).forEach((dish) => { currentDishes.append(dish)});
}

function goToPage(page) {
    if (page > maxPage || page === currentPage) return;
    currentPage = page;
    getDishes();
}

function setPagination(){
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

function showDish(dish, index) {
    if (index === null || index === undefined) {
        const isPresent = currentMenu.findIndex(item => item.dish === dish.dish) !== -1;

        if (isPresent) {
            addError('Dish is already in the menu');
            showErrors();
            return;
        }
    }

    shownDishData = {
        data: dish,
        index
    }

    shownDish.name.innerText = dish.name;
    shownDish.category.innerText = dish.category;
    shownDish.image.src = dish.image;
    shownDish.ingredients.innerHTML = '';
    shownDish.price.value = dish.price / 100 || '';
    shownDish.prepTime.value = dish.prepTime || '';

    dish.ingredients.forEach(ingredient => {
        const ingredientElement = document.createElement('li');
        ingredientElement.innerText = ingredient;

        shownDish.ingredients.append(ingredientElement);
    })

    if (index !== null && index !== undefined) {
        document.getElementById('removeBtn').hidden = false;
    }

    dishModal.show();
}

function saveDish() {
    if (!shownDish.price.checkValidity()) addError('Insert a valid price in the format <euros>.<cents>');
    if (!shownDish.prepTime.checkValidity()) addError('Insert a valid preparation time.');

    if (isError()) {
        showErrors();
        return;
    }

    const dish = {
        dish: shownDishData.data.dish,
        category: shownDishData.data.category,
        name: shownDishData.data.name,
        ingredients: shownDishData.data.ingredients,
        image: shownDishData.data.image,
        price: shownDish.price.value * 100,
        prepTime: shownDish.prepTime.value,
    }

    if (!(shownDishData.index === null || shownDishData.index === undefined)) {
        currentMenu[shownDishData.index] = dish;
    } else {
        currentMenu.push(dish);
    }

    currentDishes.innerHTML = '';
    makeDishesCards(currentMenu, true).forEach((dish) => { currentDishes.append(dish)});
    dishModal.hide();
}

function removeDish(index) {
    currentMenu.splice(index, 1);

    currentDishes.innerHTML = '';
    makeDishesCards(currentMenu, true).forEach((dish) => { currentDishes.append(dish)});
    dishModal.hide();
}

async function submitChanges() {
    const newMenu = currentMenu.map((dish) => {
        return {
            dish: dish.dish,
            price: dish.price,
            preparationTime: dish.prepTime
        }
    });

    const res = await fetch('/api/menu/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newMenu, restaurant: restId }),
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    window.location.href = '/home';
}

