/**
 * BareSober — Auth Helpers & State
 */

const BSAuth = {
  getUser() {
    try { return JSON.parse(localStorage.getItem('bs_user') || 'null'); } catch { return null; }
  },
  getToken() { return localStorage.getItem('bs_token'); },
  isLoggedIn() { return !!this.getToken() && !!this.getUser(); },
  isAdmin() { return this.getUser()?.role === 'admin'; },
  setSession(token, user) {
    localStorage.setItem('bs_token', token);
    localStorage.setItem('bs_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('bs_token');
    localStorage.removeItem('bs_user');
  },
  logout() {
    this.clearSession();
    window.location.href = '/auth.html';
  },
  requireAuth(redirectTo = '/auth.html') {
    if (!this.isLoggedIn()) {
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `${redirectTo}?redirect=${returnUrl}`;
      return false;
    }
    return true;
  },
  requireAdmin() {
    if (!this.isAdmin()) {
      window.location.href = '/';
      return false;
    }
    return true;
  },
};

/**
 * Toast Notification System
 */
const Toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 4000) {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
    toast.innerHTML = `<span style="font-size:1.125rem;flex-shrink:0">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  },
  success: (msg, d) => Toast.show(msg, 'success', d),
  error:   (msg, d) => Toast.show(msg, 'error', d),
  info:    (msg, d) => Toast.show(msg, 'info', d),
  warning: (msg, d) => Toast.show(msg, 'warning', d),
};

/**
 * Cart Badge Counter
 */
const CartBadge = {
  update(count) {
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
    localStorage.setItem('bs_cart_count', count);
  },
  restore() {
    const count = parseInt(localStorage.getItem('bs_cart_count') || '0');
    this.update(count);
  },
  async refresh() {
    if (!BSAuth.isLoggedIn()) return;
    try {
      const { cart } = await API.Cart.get();
      this.update(cart?.totalItems || 0);
    } catch {}
  },
};

/**
 * Navbar Component
 */
const Navbar = {
  init() {
    const header = document.querySelector('.header');
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileClose = document.querySelector('.mobile-close');

    // Scroll effect
    if (header) {
      window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
      });
    }

    // Mobile menu
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
    }
    if (mobileClose && mobileMenu) {
      mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
    }

    // Update auth UI
    const user = BSAuth.getUser();
    const authLink = document.getElementById('nav-auth-link');
    const profileLink = document.getElementById('nav-profile-link');

    if (user && authLink) authLink.style.display = 'none';
    if (user && profileLink) profileLink.style.display = 'flex';

    // Restore cart badge
    CartBadge.restore();
    CartBadge.refresh();

    // Mark active link
    document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
      if (a.getAttribute('href') === window.location.pathname.replace(/\/index\.html$/, '/')) {
        a.classList.add('active');
      }
    });
  },
};

/**
 * Scroll Reveal
 */
const ScrollReveal = {
  init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
  },
};

/**
 * Helpers
 */
const Utils = {
  formatPrice: (n) => '₹' + Number(n).toLocaleString('en-IN'),
  formatDate:  (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),

  renderStars(rating, max = 5) {
    let html = '<div class="stars">';
    for (let i = 1; i <= max; i++) {
      html += `<span class="star${i > rating ? ' empty' : ''}">★</span>`;
    }
    html += '</div>';
    return html;
  },

  renderProductCard(product) {
    const price = product.discountPrice || product.price;
    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    const outOfStock = product.stock === 0;
    const imgSrc = product.images?.[0] || '/img/placeholder.svg';

    return `
      <div class="product-card" data-product-id="${product._id}">
        <div class="product-card-img">
          <div class="product-card-skeleton"></div>
          <img
            src="${imgSrc}"
            alt="${product.name}"
            loading="lazy"
            onerror="this.onerror=null;this.src='/img/placeholder.svg';"
            onload="this.parentElement.querySelector('.product-card-skeleton')?.remove();this.classList.add('loaded');"
          >
          <div class="product-card-actions">
            <button class="icon-btn wishlist-btn" data-id="${product._id}" title="Add to Wishlist">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <a href="/product-detail.html?id=${product._id}" class="icon-btn" title="Quick View">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </a>
          </div>
          ${outOfStock ? '<span class="product-card-badge out-of-stock">Out of Stock</span>' :
            hasDiscount ? `<span class="product-card-badge sale">${product.discountPercent}% OFF</span>` :
            product.isBestSeller ? '<span class="product-card-badge">Best Seller</span>' : ''
          }
        </div>
        <div class="product-card-body">
          <div class="product-card-category">${product.category?.replace('-', ' ')}</div>
          <a href="/product-detail.html?id=${product._id}">
            <div class="product-card-name">${product.name}</div>
          </a>
          <div class="star-rating">
            ${Utils.renderStars(Math.round(product.averageRating || 0))}
            <span class="rating-count">(${product.numReviews || 0})</span>
          </div>
          <div class="product-card-price">
            <span class="price-current">${Utils.formatPrice(price)}</span>
            ${hasDiscount ? `<span class="price-original">${Utils.formatPrice(product.price)}</span>` : ''}
            ${hasDiscount ? `<span class="price-discount">Save ${product.discountPercent}%</span>` : ''}
          </div>
        </div>
        <div class="product-card-footer">
          ${outOfStock
            ? `<button class="btn btn-outline w-full notify-btn" data-id="${product._id}">Notify Me</button>`
            : `<button class="btn btn-primary w-full add-to-cart-btn" data-id="${product._id}">Add to Cart</button>`
          }
        </div>
      </div>
    `;
  },

  getUrlParam: (name) => new URLSearchParams(window.location.search).get(name),
  setUrlParam(name, value) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(name, value); else params.delete(name);
    history.replaceState(null, '', '?' + params.toString());
  },

  debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },
};

/**
 * Cart Actions (global)
 */
const CartActions = {
  async addToCart(productId) {
    if (!BSAuth.requireAuth()) return;
    try {
      await API.Cart.add({ productId, quantity: 1 });
      Toast.success('Added to cart!');
      CartBadge.refresh();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async toggleWishlist(productId, btn) {
    if (!BSAuth.requireAuth()) return;
    try {
      const { inWishlist } = await API.Wishlist.toggle(productId);
      if (btn) btn.classList.toggle('active', inWishlist);
      Toast.info(inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err) {
      Toast.error(err.message);
    }
  },
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  Navbar.init();
  ScrollReveal.init();

  // Global delegation for add-to-cart, wishlist, and notify
  document.addEventListener('click', async (e) => {
    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) { e.preventDefault(); await CartActions.addToCart(addBtn.dataset.id); }

    const wishBtn = e.target.closest('.wishlist-btn');
    if (wishBtn) { e.preventDefault(); await CartActions.toggleWishlist(wishBtn.dataset.id, wishBtn); }

    const notifyBtn = e.target.closest('.notify-btn');
    if (notifyBtn) {
      e.preventDefault();
      const email = prompt('Enter your email to get notified when this product is back in stock:');
      if (email) {
        try {
          await API.Notifications.stockSubscribe(notifyBtn.dataset.id, { email });
          Toast.success('You\'ll be notified when this product is back!');
        } catch (err) { Toast.error(err.message); }
      }
    }
  });
});

window.BSAuth   = BSAuth;
window.Toast    = Toast;
window.CartBadge = CartBadge;
window.Utils    = Utils;
window.CartActions = CartActions;
window.Navbar   = Navbar;
