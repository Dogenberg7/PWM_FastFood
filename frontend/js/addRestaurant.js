async function newRestaurant() {
    const restaurant = {
        name: document.getElementById('name').value,
        vatNumber: document.getElementById('vat').value,
        phoneNumber: document.getElementById('phone').value,
        address: {
            streetAddress: document.getElementById('streetaddress').value,
            city: document.getElementById('city').value,
            province: document.getElementById('province').value,
            zipCode: document.getElementById('zip').value
        }
    }

    const res = await fetch('/api/restaurant/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant }),
        credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
        addError(data.error);
        showErrors();
        return;
    }

    localStorage.setItem('extraData', data.restaurant);
    window.location.href='/home';
}