document.addEventListener('change', (event) => {
    const input = event.target;

    if (!input.matches('[data-bundle-quantity]')) return;

    const bundle = input.closest('.bundle-selector');
    const quantity = Number(input.value);
    const rows = bundle.querySelectorAll('[data-bundle-item]');

    rows.forEach(row => {
        const itemNumber = Number(row.dataset.bundleItem);
        const shouldHide = itemNumber > quantity;

        row.hidden = shouldHide;
        row.querySelector("select").disabled = shouldHide;
    });
});

document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-bundle-add-to-cart]');
    // This ignores clicks while an addition is already processing or if it doesnt exist.
    if(!button || button.disabled) return;

    const bundle = button.closest('.bundle-selector');
    const message = bundle.querySelector('[data-bundle-message]');
    const dropdowns = bundle.querySelectorAll('[data-bundle-item] select:not([disabled])');

    const items = [];
    message.textContent = '';

    for(const dropdown of dropdowns){
        const variantId = dropdown.value;
        if(!variantId){ message.textContent = 'Please select a variant for all items'; return; }

        const existingItem = items.find(item => item.variantId === variantId);
        if(existingItem){
            existingItem.quantity += 1;
        } else {
            items.push({ variantId, quantity: 1 });
        }
    }
    
  message.textContent = "Selections ready. Check the browser console.";
});