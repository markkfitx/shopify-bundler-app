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

        const existingItem = items.find(item => item.id === variantId);
        if(existingItem){
            existingItem.quantity += 1;
        } else {
            items.push({ id: variantId, quantity: 1 });
        }
    }
    
    if(items.length === 0){ message.textContent = 'Please select at least one item'; return; }

    const originalText = button.textContent;
    const storeRoot = window.Shopify.routes.root;

    button.disabled = true;
    button.textContent = 'Adding to cart...';
    message.textContent = '';

    try{
        const response = await fetch(storeRoot + "cart/add.js", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ items })
        });
        const result = await response.json();
        if(!response.ok){
            throw new Error(
                result.description || result.message || "Unable to add these items."
            );
        }
        window.location.assign(storeRoot + "cart");

    }catch(error){
        message.textContent = `${error.message} Check your cart before trying again.`;
    } finally{
        button.disabled = false;
        button.textContent = originalText;
    }
});