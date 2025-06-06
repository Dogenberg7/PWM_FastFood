const dataElements = {
    start: document.getElementById('start'),
    end: document.getElementById('end'),
    totalOrders: document.getElementById('total-orders'),
    totalEarned: document.getElementById('total-earned'),
    avgEarned: document.getElementById('avg-earned'),
    bestName: document.getElementById('best-selling-name'),
    bestAmount: document.getElementById('best-selling-amount'),
    bestEarned: document.getElementById('best-selling-earned')
}

let analyticsData;

window.onload = () => {
    getAnalytics()
        .then((data) => {
            analyticsData = data;
            showAnalytics(analyticsData)
        });
}

async function getAnalytics() {
    const start = dataElements.start.valueAsNumber;
    const end = dataElements.end.valueAsNumber;

    const res = await fetch(`/api/restaurant/analytics?start=${start}&end=${end}`, {
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

function showAnalytics(data) {
    dataElements.totalOrders.innerText = 'Total orders: ' + data.totalOrders;
    dataElements.totalEarned.innerText = 'Total earnings: ' + data.totalEarned / 100 + '€';
    dataElements.avgEarned.innerText = 'Average per order: ' + data.avgEarned / 100 + '€';
    dataElements.bestName.innerText = 'Best selling dish: ' + data.mostOrdered.dishData.name;
    dataElements.bestAmount.innerText = 'Amount: ' + data.mostOrdered.totalAmount;
    dataElements.bestEarned.innerText = 'Earnings: ' + data.mostOrdered.totalEarned / 100 + '€';
}