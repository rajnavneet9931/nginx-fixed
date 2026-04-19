/**
 * BareSober — Cart Drawer & Cart Page
 */

const CartUI = {
  async renderDrawer() {
    const drawerBody = document.getElementById('cart-drawer-body');
    const drawerFooter = document.getElementById('cart-drawer-footer');
    if (!drawerBody) return;

    if (!BSAuth.isLoggedIn()) {
      drawerBody.innerHTML = `
        <div class="empty-state" style="padding:40px 20px">
          <div class="empty-state-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p style="margin-bottom:20px">Please login to view your cart</p>
          <a href="/auth.html" class="btn btn-primary">Login</a>
        </div>`;
      if (drawerFooter) drawerFooter.style.display = 'none';
      return;
    }

    try {
      const { cart } = await API.Cart.get();

      if (!cart?.items?.length) {
        drawerBody.innerHTML = `
          <div class="empty-state" style="padding:40px 20px">
            <div class="empty-state-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <a href="/products.html" class="btn btn-primary" style="margin-top:16px">Shop Now</a>
          </div>`;
        if (drawerFooter) drawerFooter.style.display = 'none';
        return;
      }

      drawerBody.innerHTML = cart.items.map(item => `
        <div class="cart-item" data-product-id="${item.product?._id || item.product}">
          <img class="cart-item-img" src="${item.image || '/img/placeholder.jpg'}" alt="${item.name}">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${Utils.formatPrice(item.price)}</div>
            <div class="qty-control">
              <button class="qty-btn drawer-qty-btn" data-action="minus" data-id="${item.product?._id || item.product}">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn drawer-qty-btn" data-action="plus" data-id="${item.product?._id || item.product}">+</button>
              <button class="qty-btn drawer-remove-btn" data-id="${item.product?._id || item.product}" style="margin-left:8px;color:var(--error);border-color:var(--error)" title="Remove">×</button>
            </div>
          </div>
        </div>`).join('');

      const shipping = cart.totalPrice >= 499 ? 0 : 49;
      const total = cart.totalPrice + shipping;

      if (drawerFooter) {
        drawerFooter.style.display = 'block';
        drawerFooter.innerHTML = `
          <div class="order-summary-row"><span>Subtotal</span><span>${Utils.formatPrice(cart.totalPrice)}</span></div>
          <div class="order-summary-row"><span>Shipping</span><span class="${shipping === 0 ? 'free' : ''}">${shipping === 0 ? 'FREE' : Utils.formatPrice(shipping)}</span></div>
          ${shipping > 0 ? `<p style="font-size:.75rem;color:var(--light-gray);margin-bottom:8px">Add items worth ${Utils.formatPrice(499 - cart.totalPrice)} more for free shipping</p>` : ''}
          <div class="order-summary-row total"><span>Total</span><span>${Utils.formatPrice(total)}</span></div>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px">
            <a href="/checkout.html" class="btn btn-primary w-full">Proceed to Checkout</a>
            <a href="/cart.html" class="btn btn-outline w-full">View Cart</a>
          </div>`;
      }

      CartBadge.update(cart.totalItems);
      initDrawerEvents();
    } catch (err) {
      drawerBody.innerHTML = '<p style="text-align:center;padding:20px;color:var(--error)">Failed to load cart</p>';
    }
  },

  open() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    this.renderDrawer();
  },

  close() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  },
};

function initDrawerEvents() {
  document.querySelectorAll('.drawer-qty-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const qtyEl = btn.closest('.qty-control').querySelector('.qty-value');
      let qty = parseInt(qtyEl.textContent);
      qty = action === 'plus' ? qty + 1 : qty - 1;
      if (qty < 1) return;
      try {
        await API.Cart.update(id, { quantity: qty });
        qtyEl.textContent = qty;
        CartUI.renderDrawer();
      } catch (err) { Toast.error(err.message); }
    });
  });

  document.querySelectorAll('.drawer-remove-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await API.Cart.remove(btn.dataset.id);
        CartUI.renderDrawer();
        Toast.info('Item removed from cart');
      } catch (err) { Toast.error(err.message); }
    });
  });
}

// Full cart page
const CartPage = {
  async init() {
    const container = document.getElementById('cart-page-container');
    if (!container) return;

    if (!BSAuth.requireAuth()) return;

    await this.render();
  },

  async render() {
    const container = document.getElementById('cart-page-container');
    const summaryEl = document.getElementById('cart-summary');

    try {
      const { cart } = await API.Cart.get();

      if (!cart?.items?.length) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;padding:80px 20px">
            <div class="empty-state-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p style="margin-bottom:24px">Add some products to your cart and come back.</p>
            <a href="/products.html" class="btn btn-primary btn-lg">Explore Products</a>
          </div>`;
        if (summaryEl) summaryEl.innerHTML = '';
        return;
      }

      container.innerHTML = `
        <div style="background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border-light);overflow:hidden">
          <div style="padding:20px 24px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
            <h3 style="font-family:var(--font-serif);font-size:1.25rem">Shopping Cart (${cart.totalItems} items)</h3>
            <button id="clear-cart-btn" style="font-size:.875rem;color:var(--error);cursor:pointer;background:none;border:none">Clear all</button>
          </div>
          <div id="cart-items-list">
            ${cart.items.map(item => `
              <div class="cart-item" style="padding:20px 24px" data-id="${item.product?._id || item.product}">
                <img class="cart-item-img" src="${item.image || '/img/placeholder.jpg'}" alt="${item.name}" style="width:90px;height:90px">
                <div class="cart-item-info" style="flex:1">
                  <div class="cart-item-name" style="font-size:1rem;font-weight:600">${item.name}</div>
                  <div class="cart-item-price" style="font-size:1.0625rem;margin-top:4px">${Utils.formatPrice(item.price)}</div>
                  <div class="qty-control" style="margin-top:10px">
                    <button class="qty-btn page-qty-btn" data-action="minus" data-id="${item.product?._id || item.product}">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn page-qty-btn" data-action="plus" data-id="${item.product?._id || item.product}">+</button>
                  </div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:1.125rem;font-weight:700">${Utils.formatPrice(item.price * item.quantity)}</div>
                  <button class="page-remove-btn" data-id="${item.product?._id || item.product}" style="margin-top:8px;font-size:.8125rem;color:var(--error);cursor:pointer;background:none;border:none">Remove</button>
                </div>
              </div>`).join('')}
          </div>
        </div>`;

      const shipping = cart.totalPrice >= 499 ? 0 : 49;
      const tax = Math.round(cart.totalPrice * 0.18);
      const total = cart.totalPrice + shipping + tax;

      if (summaryEl) {
        summaryEl.innerHTML = `
          <div style="background:var(--white);border-radius:var(--radius-lg);padding:24px;border:1px solid var(--border-light);position:sticky;top:calc(var(--header-h) + 24px)">
            <h3 style="font-family:var(--font-serif);font-size:1.25rem;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--border-light)">Order Summary</h3>
            <div class="order-summary-row"><span>Subtotal</span><span>${Utils.formatPrice(cart.totalPrice)}</span></div>
            <div class="order-summary-row"><span>GST (18%)</span><span>${Utils.formatPrice(tax)}</span></div>
            <div class="order-summary-row"><span>Shipping</span><span class="${shipping === 0 ? 'free' : ''}">${shipping === 0 ? 'FREE' : Utils.formatPrice(shipping)}</span></div>
            ${shipping > 0 ? `<p style="font-size:.8125rem;color:var(--light-gray);margin-bottom:8px">Add ${Utils.formatPrice(499 - cart.totalPrice)} more for free shipping</p>` : ''}
            <div class="order-summary-row total"><span>Total</span><span>${Utils.formatPrice(total)}</span></div>
            <a href="/checkout.html" class="btn btn-primary w-full btn-lg" style="margin-top:20px">Proceed to Checkout</a>
            <a href="/products.html" class="btn btn-outline w-full" style="margin-top:10px">Continue Shopping</a>
          </div>`;
      }

      // Events
      document.getElementById('clear-cart-btn')?.addEventListener('click', async () => {
        if (!confirm('Clear entire cart?')) return;
        await API.Cart.clear();
        Toast.info('Cart cleared');
        this.render();
        CartBadge.update(0);
      });

      document.querySelectorAll('.page-qty-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const qtyEl = btn.closest('.cart-item').querySelector('.qty-value');
          let qty = parseInt(qtyEl.textContent);
          qty = btn.dataset.action === 'plus' ? qty + 1 : qty - 1;
          if (qty < 1) return;
          try { await API.Cart.update(id, { quantity: qty }); this.render(); } catch (err) { Toast.error(err.message); }
        });
      });

      document.querySelectorAll('.page-remove-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          await API.Cart.remove(btn.dataset.id);
          Toast.info('Item removed');
          this.render();
          CartBadge.refresh();
        });
      });

    } catch (err) {
      container.innerHTML = '<p style="padding:20px;color:var(--error)">Failed to load cart</p>';
    }
  },
};

// Initialize cart icon click handler
document.getElementById('cart-icon')?.addEventListener('click', (e) => {
  e.preventDefault();
  CartUI.open();
});
document.getElementById('cart-overlay')?.addEventListener('click', () => CartUI.close());
document.getElementById('cart-close-btn')?.addEventListener('click', () => CartUI.close());

// Init cart page if on /cart.html
if (window.location.pathname.includes('cart.html')) {
  document.addEventListener('DOMContentLoaded', () => CartPage.init());
}

window.CartUI = CartUI;
window.CartPage = CartPage;
