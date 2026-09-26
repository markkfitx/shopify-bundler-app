// Show/hide variant rows when the customer picks Single / Duo / Trio.
document.addEventListener("change", (event) => {

    const input = event.target;
    if (!input.matches("[data-bundle-quantity]")) return;

    const quantity = Number(input.value);
    const bundleOption = input.closest(".bundle-option");
    const container =  bundleOption.querySelector("[data-bundle-items]");
    const template = document.querySelector("[data-bundle-item-template]");

    container.innerHTML = "";
    for (let i = 0; i < quantity; i++) {
        const item = template.content.cloneNode(true);
        container.appendChild(item);
    }
});

// Handle "Add to cart" clicks for the bundle selector.
document.addEventListener('click', async (event) => {
    const cartBtn = event.target.closest('[data-bundle-add-to-cart]');
    // Ignore clicks while an addition is already processing, or if the click wasn't on the button.
    if (!cartBtn || cartBtn.disabled) return;

    const bundle = cartBtn.closest('.bundle-selector');
    const message = bundle.querySelector('[data-bundle-message]');
    const variants = JSON.parse(bundle.querySelector('[data-product-variants]').textContent);
    // Only read slots under the currently selected Single/Duo/Trio option.
    const selectedBundle = bundle.querySelector('[data-bundle-quantity]:checked')
        ?.closest('.bundle-option');
    const bundleItems = selectedBundle?.querySelectorAll('[data-bundle-item]') ?? [];
    const items = [];
    message.textContent = '';

    // Build the cart payload from each selected variant.
    for (const bundleItem of bundleItems) {
        const optionSelects = bundleItem.querySelectorAll('[data-variant-option]');
        const selectedOptions = [];

        for (const select of optionSelects) {
            if (!select.value) {
                message.textContent = 'Please select all options.';
                return;
            }
            selectedOptions.push(select.value);
        }

        const matchingVariant = variants.find((variant) => {
            return variant.options.every((option, index) => {
                return option === selectedOptions[index];
            });
        });

        if (!matchingVariant) {
            message.textContent = 'No matching variant found.';
            return;
        }
        const existingItem = items.find(
            item => item.id === matchingVariant.id
        );
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            items.push({
                id: matchingVariant.id,
                quantity: 1
            });
        }
    }

    if (items.length === 0) {
        message.textContent = 'Please select at least one item';
        return;
    }

    const originalText = cartBtn.textContent;
    // Shopify's localized store root (handles subdirectory storefronts).
    const storeRoot = window.Shopify.routes.root;

    cartBtn.disabled = true;
    cartBtn.textContent = 'Adding to cart...';
    message.textContent = '';

    try {
        // POST to Shopify's Ajax Cart API, then send the shopper to the cart page.
        const response = await fetch(storeRoot + 'cart/add.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items }),
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(
                result.description || result.message || 'Unable to add these items.'
            );
        }

        window.location.assign(storeRoot + 'cart');
    } catch (error) {
        message.textContent = `${error.message} Check your cart before trying again.`;
    } finally {
        // Always restore the button so the shopper can try again if something failed.
        cartBtn.disabled = false;
        cartBtn.textContent = originalText;
    }
});
