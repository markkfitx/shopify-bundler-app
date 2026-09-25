// Show/hide variant rows when the customer picks Single / Duo / Trio.
document.addEventListener('change', (event) => {
    const input = event.target;

    // Only react to the bundle-size radio buttons.
    if (!input.matches('[data-bundle-quantity]')) return;

    const bundle = input.closest('.bundle-selector');
    const quantity = Number(input.value);
    const rows = bundle.querySelectorAll('[data-bundle-item]');

    rows.forEach(row => {
        const itemNumber = Number(row.dataset.bundleItem);
        // Hide (and disable) any row beyond the selected bundle size.
        const shouldHide = itemNumber > quantity;

        row.hidden = shouldHide;
        row.querySelector("select").disabled = shouldHide;
    });
});

// Handle "Add to cart" clicks for the bundle selector.
document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-bundle-add-to-cart]');
    // Ignore clicks while an addition is already processing, or if the click wasn't on the button.
    if(!button || button.disabled) return;

    const bundle = button.closest('.bundle-selector');
    const message = bundle.querySelector('[data-bundle-message]');
    // Only include selects that are currently visible/enabled for the chosen bundle size.
    const dropdowns = bundle.querySelectorAll('[data-bundle-item] select:not([disabled])');

    const items = [];
    message.textContent = '';

    // Build the cart payload from each selected variant.
    for(const dropdown of dropdowns){
        const variantId = dropdown.value;
        if(!variantId){ message.textContent = 'Please select a variant for all items'; return; }

        // If the same variant is selected more than once, bump quantity instead of duplicating.
        const existingItem = items.find(item => item.id === variantId);
        if(existingItem){
            existingItem.quantity += 1;
        } else {
            items.push({ id: variantId, quantity: 1 });
        }
    }
    
    if(items.length === 0){ message.textContent = 'Please select at least one item'; return; }

    const originalText = button.textContent;
    // Shopify's localized store root (handles subdirectory storefronts).
    const storeRoot = window.Shopify.routes.root;

    button.disabled = true;
    button.textContent = 'Adding to cart...';
    message.textContent = '';

    try{
        // POST to Shopify's Ajax Cart API, then send the shopper to the cart page.
        await fetch(storeRoot + "cart/add.js", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ items })
        }).then(response =>{
            if(!response.ok){
                const result = response.json();
                throw new Error(
                    result.description || result.message || "Unable to add these items."
                );
            }
        })
        window.location.assign(storeRoot + "cart");

    }catch(error){
        message.textContent = `${error.message} Check your cart before trying again.`;
    } finally{
        // Always restore the button so the shopper can try again if something failed.
        button.disabled = false;
        button.textContent = originalText;
    }
});
