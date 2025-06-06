let errorToast = initError();

function showErrors() {
    errorToast.text.innerHTML = '';

    const list = document.createElement('ul');
    errorToast.messages.forEach((error) => {
        const errorElement = document.createElement('li');
        errorElement.classList.add('text-danger');
        errorElement.innerText = error;
        list.append(errorElement);
    });

    errorToast.text.append(list);

    errorToast.toast.show();
    errorToast.messages = [];
}

function initError() {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';

    const toast = document.createElement('div');
    toast.role = 'alert';
    toast.className = 'toast';
    toast.id = 'errorToast';

    const toastHeader = document.createElement('div');
    toastHeader.className = 'toast-header';

    const title = document.createElement('strong');
    title.className = 'me-auto';
    title.innerText = 'Error!';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn-close';
    close.dataset.bsDismiss = 'toast';

    const toastBody = document.createElement('div');
    toastBody.className = 'toast-body';

    toastHeader.append(title, close);
    toast.append(toastHeader, toastBody);
    toastContainer.appendChild(toast);
    document.body.append(toastContainer);

    const bsToast = bootstrap.Toast.getOrCreateInstance(toast);

    return { toast: bsToast, text: toastBody, messages: [] };
}

function addError(message) {
    errorToast.messages.push(message);
}

function isError() {
    return errorToast.messages.length > 0;
}