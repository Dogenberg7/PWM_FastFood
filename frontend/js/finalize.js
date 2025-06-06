async function finalizeSetup() {
    const address = {
        streetAddress: document.getElementById('streetaddress').value,
        city: document.getElementById('city').value,
        province: document.getElementById('province').value,
        zipCode: document.getElementById('zip').value,
    }

    const card = {
        cardOwner: document.getElementById('cardowner').value,
        cardNumber: document.getElementById('number').value,
        expiryDate: document.getElementById('expiry').value,
        cvc: document.getElementById('cvc').value
    }

    try {
        const res = await fetch('/api/finalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, card }),
            credentials: 'include'
        });

        if (res.ok) window.location.href='/home';
    } catch (err) {
        console.log(err);
    }
}