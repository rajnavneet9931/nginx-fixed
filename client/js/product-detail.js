/**
 * BareSober — Product Detail Page
 */

(async function () {
  const productId = Utils.getUrlParam('id');
  if (!productId) { window.location.href = '/products.html'; return; }

  const container = document.getElementById('product-detail-container');
  const loadingEl = document.getElementById('detail-loading');

  try {
    if (loadingEl) loadingEl.style.display = 'flex';
    const { product } = await API.Products.getOne(productId);

    // Update page meta
    document.title = `${product.name} | BareSober`;

    // Check if in wishlist
    let inWishlist = false;
    if (BSAuth.isLoggedIn()) {
      try { const r = await API.Wishlist.check(productId); inWishlist = r.inWishlist; } catch {}
    }

    const price = product.discountPrice || product.price;
    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    const outOfStock = product.stock === 0;
    const lowStock = product.stock > 0 && product.stock <= 5;

    if (container) {
      container.innerHTML = `
        <div class="product-detail">
          <!-- Gallery -->
          <div class="product-gallery">
            <div class="gallery-main" id="gallery-main">
              <img src="${product.images?.[0] || '/img/placeholder.jpg'}" alt="${product.name}" id="main-image">
            </div>
            ${product.images?.length > 1 ? `
              <div class="gallery-thumbs">
                ${product.images.map((img, i) => `
                  <div class="gallery-thumb${i === 0 ? ' active' : ''}" data-img="${img}" data-idx="${i}">
                    <img src="${img}" alt="View ${i + 1}">
                  </div>`).join('')}
              </div>` : ''}
          </div>

          <!-- Info -->
          <div class="product-info">
            <div class="product-card-category" style="font-size:.875rem;margin-bottom:8px">${product.category?.replace('-', ' ')}</div>
            <h1 style="font-size:clamp(1.75rem,4vw,2.5rem);margin-bottom:0">${product.name}</h1>
            
            <div class="star-rating" style="margin:12px 0">
              ${Utils.renderStars(Math.round(product.averageRating || 0))}
              <span class="rating-count">${product.numReviews || 0} reviews</span>
            </div>

            <div class="product-info-price">
              <span class="product-price-main">${Utils.formatPrice(price)}</span>
              ${hasDiscount ? `<span class="product-price-original">${Utils.formatPrice(product.price)}</span>` : ''}
              ${hasDiscount ? `<span class="product-discount-badge">${product.discountPercent}% OFF</span>` : ''}
            </div>

            <p style="color:var(--mid-gray);margin-bottom:20px;line-height:1.7">${product.shortDescription || product.description.slice(0, 150)}</p>

            ${product.skinType?.length ? `
              <div style="margin-bottom:16px">
                <div style="font-size:.8125rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--charcoal);margin-bottom:8px">Skin Type</div>
                <div class="flex gap-8" style="flex-wrap:wrap">
                  ${product.skinType.map(s => `<span class="pill">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`).join('')}
                </div>
              </div>` : ''}

            ${product.volume || product.weight ? `<p style="font-size:.875rem;color:var(--mid-gray);margin-bottom:20px">Size: <strong>${product.volume || product.weight}</strong></p>` : ''}

            <!-- Stock -->
            <div style="margin-bottom:24px">
              ${outOfStock ? `
                <div style="display:flex;align-items:center;gap:8px;color:var(--error);font-weight:600;margin-bottom:12px">
                  <span>●</span> Out of Stock
                </div>` :
                lowStock ? `
                <div style="display:flex;align-items:center;gap:8px;color:var(--warning);font-weight:600;margin-bottom:12px">
                  <span>●</span> Only ${product.stock} left!
                </div>` :
                `<div style="display:flex;align-items:center;gap:8px;color:var(--success);font-weight:600;margin-bottom:12px">
                  <span>●</span> In Stock
                </div>`
              }
            </div>

            <!-- Quantity & Actions -->
            ${outOfStock ? `
              <div style="display:flex;flex-direction:column;gap:12px">
                <button class="btn btn-outline w-full" id="notify-me-btn">🔔 Notify Me When Available</button>
              </div>` : `
              <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
                <div class="qty-control" style="border:1.5px solid var(--border);border-radius:var(--radius-full);padding:4px 12px">
                  <button class="qty-btn" id="qty-minus">−</button>
                  <span class="qty-value" id="qty-display">1</span>
                  <button class="qty-btn" id="qty-plus">+</button>
                </div>
              </div>
              <div style="display:flex;gap:12px;flex-wrap:wrap">
                <button class="btn btn-primary" style="flex:1;min-width:180px" id="add-cart-btn">Add to Cart</button>
                <button class="btn btn-outline" style="flex:1;min-width:180px" id="buy-now-btn">Buy Now</button>
              </div>`
            }

            <!-- Wishlist -->
            <button class="btn btn-outline-gold w-full" style="margin-top:12px" id="wishlist-btn">
              ${inWishlist ? '♥ Remove from Wishlist' : '♡ Add to Wishlist'}
            </button>

            <!-- Benefits -->
            ${product.benefits?.length ? `
              <div style="margin-top:28px;background:var(--cream-dark);border-radius:var(--radius-md);padding:20px">
                <div style="font-weight:700;margin-bottom:12px;font-size:.9375rem">Key Benefits</div>
                <ul style="display:flex;flex-direction:column;gap:8px">
                  ${product.benefits.map(b => `<li style="display:flex;gap:8px;align-items:flex-start;font-size:.9rem;color:var(--mid-gray)"><span style="color:var(--gold);flex-shrink:0;margin-top:2px">✓</span>${b}</li>`).join('')}
                </ul>
              </div>` : ''}
          </div>
        </div>

        <!-- Tabs -->
        <div class="product-tabs" style="margin-top:48px">
          <div class="tab-header">
            <button class="tab-btn active" data-tab="description">Description</button>
            <button class="tab-btn" data-tab="ingredients">Ingredients</button>
            <button class="tab-btn" data-tab="howto">How To Use</button>
            <button class="tab-btn" data-tab="reviews">Reviews (${product.numReviews || 0})</button>
          </div>
          <div class="tab-content active" id="tab-description">
            <p style="line-height:1.8;color:var(--mid-gray)">${product.description}</p>
          </div>
          <div class="tab-content" id="tab-ingredients">
            <p style="line-height:1.8;color:var(--mid-gray)">${product.ingredients || 'Ingredient list not available.'}</p>
          </div>
          <div class="tab-content" id="tab-howto">
            <p style="line-height:1.8;color:var(--mid-gray)">${product.howToUse || 'Usage instructions not available.'}</p>
          </div>
          <div class="tab-content" id="tab-reviews">
            ${renderReviews(product.reviews)}
            ${BSAuth.isLoggedIn() ? renderReviewForm() : `<p style="margin-top:20px"><a href="/auth.html" style="color:var(--gold)">Login</a> to write a review.</p>`}
          </div>
        </div>
      `;

      initInteractions(product);
    }
  } catch (err) {
    Toast.error('Failed to load product');
    console.error(err);
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }

  function renderReviews(reviews) {
    if (!reviews?.length) return '<p style="color:var(--light-gray);margin:20px 0">No reviews yet. Be the first!</p>';
    return reviews.slice(0, 5).map(r => `
      <div style="padding:16px 0;border-bottom:1px solid var(--border-light)">
        <div class="flex items-center justify-between" style="margin-bottom:6px">
          <div>
            <strong style="font-size:.9375rem">${r.name}</strong>
            <span style="font-size:.8125rem;color:var(--light-gray);margin-left:8px">${Utils.formatDate(r.createdAt)}</span>
          </div>
          ${Utils.renderStars(r.rating)}
        </div>
        <p style="font-size:.9rem;color:var(--mid-gray)">${r.comment}</p>
      </div>`).join('');
  }

  function renderReviewForm() {
    return `
      <div style="margin-top:28px;background:var(--cream-dark);border-radius:var(--radius-lg);padding:24px">
        <h4 style="margin-bottom:16px;font-family:var(--font-serif)">Write a Review</h4>
        <form id="review-form">
          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">Your Rating</label>
            <div style="display:flex;gap:10px;" id="star-picker">
              ${[1,2,3,4,5].map(n => `<span data-rating="${n}" style="font-size:1.75rem;cursor:pointer;color:var(--border);transition:color .15s">★</span>`).join('')}
            </div>
            <input type="hidden" id="review-rating" value="0">
          </div>
          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">Your Review</label>
            <textarea id="review-comment" class="form-input" rows="4" placeholder="Share your experience..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary" id="review-submit">Submit Review</button>
        </form>
      </div>`;
  }

  function initInteractions(product) {
    // Gallery thumbs
    document.querySelectorAll('.gallery-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        document.getElementById('main-image').src = thumb.dataset.img;
      });
    });

    // Quantity control
    let qty = 1;
    const maxQty = Math.min(product.stock, product.maxOrderQty || 10);
    const qtyDisplay = document.getElementById('qty-display');
    document.getElementById('qty-minus')?.addEventListener('click', () => {
      if (qty > 1) { qty--; qtyDisplay.textContent = qty; }
    });
    document.getElementById('qty-plus')?.addEventListener('click', () => {
      if (qty < maxQty) { qty++; qtyDisplay.textContent = qty; } else Toast.warning(`Max ${maxQty} units allowed`);
    });

    // Add to cart
    document.getElementById('add-cart-btn')?.addEventListener('click', async () => {
      if (!BSAuth.requireAuth()) return;
      const btn = document.getElementById('add-cart-btn');
      btn.classList.add('btn-loading');
      try {
        await API.Cart.add({ productId, quantity: qty });
        Toast.success(`Added ${qty} item${qty > 1 ? 's' : ''} to cart!`);
        CartBadge.refresh();
      } catch (err) { Toast.error(err.message); } finally { btn.classList.remove('btn-loading'); }
    });

    // Buy now
    document.getElementById('buy-now-btn')?.addEventListener('click', () => {
      if (!BSAuth.requireAuth()) return;
      localStorage.setItem('bs_buy_now', JSON.stringify({ productId, quantity: qty }));
      window.location.href = '/checkout.html?mode=buynow';
    });

    // Wishlist
    document.getElementById('wishlist-btn')?.addEventListener('click', async function () {
      if (!BSAuth.requireAuth()) return;
      try {
        const { inWishlist } = await API.Wishlist.toggle(productId);
        this.textContent = inWishlist ? '♥ Remove from Wishlist' : '♡ Add to Wishlist';
        Toast.info(inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
      } catch (err) { Toast.error(err.message); }
    });

    // Notify me
    document.getElementById('notify-me-btn')?.addEventListener('click', async () => {
      const email = prompt('Enter your email to be notified when this product is back in stock:');
      if (!email) return;
      try {
        await API.Notifications.stockSubscribe(productId, { email });
        Toast.success('We\'ll notify you when it\'s back!');
      } catch (err) { Toast.error(err.message); }
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
      });
    });

    // Star picker
    const stars = document.querySelectorAll('#star-picker span');
    const ratingInput = document.getElementById('review-rating');
    stars.forEach(star => {
      star.addEventListener('mouseover', () => {
        const n = parseInt(star.dataset.rating);
        stars.forEach((s, i) => s.style.color = i < n ? 'var(--gold)' : 'var(--border)');
      });
      star.addEventListener('mouseout', () => {
        const v = parseInt(ratingInput?.value || 0);
        stars.forEach((s, i) => s.style.color = i < v ? 'var(--gold)' : 'var(--border)');
      });
      star.addEventListener('click', () => {
        if (ratingInput) ratingInput.value = star.dataset.rating;
        stars.forEach((s, i) => s.style.color = i < parseInt(star.dataset.rating) ? 'var(--gold)' : 'var(--border)');
      });
    });

    // Review form
    document.getElementById('review-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rating = parseInt(document.getElementById('review-rating')?.value || 0);
      const comment = document.getElementById('review-comment')?.value?.trim();
      if (rating < 1) { Toast.error('Please select a rating'); return; }
      if (!comment) { Toast.error('Please write a review'); return; }
      const btn = document.getElementById('review-submit');
      btn.classList.add('btn-loading');
      try {
        await API.Products.addReview(productId, { rating, comment });
        Toast.success('Review submitted! Thank you.');
        setTimeout(() => location.reload(), 1500);
      } catch (err) { Toast.error(err.message); } finally { btn.classList.remove('btn-loading'); }
    });
  }
})();
