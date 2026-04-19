/**
 * BareSober — Checkout & Payment
 * UPI flow: opens a premium payment modal with QR, timer, and mock confirmation
 */

(async function () {
  if (!BSAuth.requireAuth()) return;

  const mode = Utils.getUrlParam('mode');
  let orderItems = null;
  let cart = null;
  let selectedAddress = null;
  let selectedPayment = 'cod';

  // ─── UPI modal state ───
  let upiTimerInterval = null;
  let upiPaymentId = null;

  try {
    if (mode === 'buynow') {
      const buyNow = JSON.parse(localStorage.getItem('bs_buy_now') || 'null');
      if (!buyNow) { window.location.href = '/products.html'; return; }
      orderItems = [buyNow];
    } else {
      const res = await API.Cart.get();
      cart = res.cart;
      if (!cart?.items?.length) { window.location.href = '/cart.html'; return; }
    }
  } catch { window.location.href = '/cart.html'; return; }

  // ════════════════════════════════════════════
  //  Order Summary
  // ════════════════════════════════════════════
  const renderSummary = async () => {
    const summaryEl = document.getElementById('checkout-order-summary');
    if (!summaryEl) return;
    let items = cart ? cart.items : [];
    let subtotal = cart ? cart.totalPrice : 0;
    const shipping = subtotal >= 499 ? 0 : 49;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;
    window._checkoutTotal = total;

    summaryEl.innerHTML = `
      <div style="font-family:var(--font-serif);font-size:1.25rem;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--border-light)">Order Summary</div>
      <div>${items.map(item => `
        <div class="order-item">
          <img class="order-item-img" src="${item.image||'/img/placeholder.jpg'}" alt="${item.name}">
          <div class="order-item-info">
            <div class="order-item-name">${item.name}</div>
            <div class="order-item-qty">Qty: ${item.quantity}</div>
          </div>
          <div class="order-item-price">${Utils.formatPrice(item.price * item.quantity)}</div>
        </div>`).join('')}</div>
      <hr style="border:none;border-top:1px solid var(--border-light);margin:16px 0">
      <div class="order-summary-row"><span>Subtotal</span><span>${Utils.formatPrice(subtotal)}</span></div>
      <div class="order-summary-row"><span>GST (18%)</span><span>${Utils.formatPrice(tax)}</span></div>
      <div class="order-summary-row"><span>Shipping</span><span class="${shipping===0?'free':''}">${shipping===0?'FREE':Utils.formatPrice(shipping)}</span></div>
      <div class="order-summary-row total"><span>Total</span><strong>${Utils.formatPrice(total)}</strong></div>`;
  };

  // ════════════════════════════════════════════
  //  Address Section
  // ════════════════════════════════════════════
  const renderAddressSection = async () => {
    const addrEl = document.getElementById('address-section');
    if (!addrEl) return;
    let userFull;
    try { const r = await API.Auth.getMe(); userFull = r.user; } catch {}
    const addresses = userFull?.addresses || [];

    const formHtml = `
      <form id="address-form">
        <div class="grid-2"><div class="form-group"><label class="form-label">Full Name *</label><input name="fullName" class="form-input" placeholder="Full name" required></div>
        <div class="form-group"><label class="form-label">Phone *</label><input name="phone" class="form-input" placeholder="Mobile number" required></div></div>
        <div class="form-group" style="margin-top:16px"><label class="form-label">Address *</label><input name="addressLine1" class="form-input" placeholder="House/Flat, Street" required></div>
        <div class="form-group" style="margin-top:12px"><input name="addressLine2" class="form-input" placeholder="Landmark (optional)"></div>
        <div class="grid-2" style="margin-top:12px">
          <div class="form-group"><label class="form-label">City *</label><input name="city" class="form-input" required></div>
          <div class="form-group"><label class="form-label">State *</label><input name="state" class="form-input" required></div>
        </div>
        <div class="grid-2" style="margin-top:12px">
          <div class="form-group"><label class="form-label">Pincode *</label><input name="pincode" class="form-input" required></div>
          <div class="form-group"><label class="form-label">Country</label><input name="country" class="form-input" value="India"></div>
        </div>
        <button type="button" id="save-address-btn" class="btn btn-outline btn-sm" style="margin-top:14px">Save Address</button>
      </form>`;

    if (addresses.length) {
      selectedAddress = addresses[0];
      addrEl.innerHTML = `
        <div id="addr-list">${addresses.map((addr, i) => `
          <label style="display:flex;gap:12px;padding:14px;border:1.5px solid ${i===0?'var(--gold)':'var(--border)'};border-radius:var(--radius-md);cursor:pointer;margin-bottom:10px">
            <input type="radio" name="address" value="${i}" ${i===0?'checked':''} style="accent-color:var(--gold);margin-top:3px">
            <div><div style="font-weight:600">${addr.fullName} · ${addr.phone}</div>
            <div style="font-size:.875rem;color:var(--mid-gray)">${addr.addressLine1}, ${addr.city}, ${addr.state} - ${addr.pincode}</div></div>
          </label>`).join('')}</div>
        <button id="add-new-addr-btn" class="btn btn-outline btn-sm" style="margin-top:8px">+ Add New Address</button>
        <div id="new-addr-form" style="display:none;margin-top:16px">${formHtml}</div>`;
      document.querySelectorAll('input[name="address"]').forEach((r, i) => r.addEventListener('change', () => { selectedAddress = addresses[i]; }));
      document.getElementById('add-new-addr-btn')?.addEventListener('click', () => {
        const f = document.getElementById('new-addr-form');
        f.style.display = f.style.display === 'none' ? 'block' : 'none';
      });
    } else {
      addrEl.innerHTML = formHtml;
    }

    document.getElementById('save-address-btn')?.addEventListener('click', () => {
      const form = document.getElementById('address-form');
      if (!form) return;
      const data = Object.fromEntries(new FormData(form));
      if (!data.fullName || !data.phone || !data.addressLine1 || !data.city || !data.state || !data.pincode) {
        Toast.error('Fill all required address fields'); return;
      }
      selectedAddress = data;
      Toast.success('Address saved');
    });
  };

  // ════════════════════════════════════════════
  //  Payment Method Selection
  // ════════════════════════════════════════════
  const initPaymentOptions = () => {
    document.querySelectorAll('.payment-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedPayment = opt.dataset.method;
        const r = opt.querySelector('input[type=radio]');
        if (r) r.checked = true;
      });
    });
  };

  // ════════════════════════════════════════════
  //  UPI Payment Modal
  // ════════════════════════════════════════════
  const openUPIModal = (session) => {
    upiPaymentId = session.paymentId;
    const body = document.getElementById('upi-modal-body');
    const overlay = document.getElementById('upi-overlay');
    const isGPay = session.method === 'googlepay';

    // Format the amount
    const formattedAmt = '₹' + Number(session.amount).toLocaleString('en-IN');

    body.innerHTML = `
      <!-- App strip -->
      <div class="upi-app-strip">
        <div class="upi-app-logo ${isGPay ? 'gpay' : 'phonepe'}">${isGPay ? 'G' : 'Pe'}</div>
        <div class="upi-app-info">
          <div class="upi-app-name">${session.methodName}</div>
          <div class="upi-app-desc">Scan QR code to pay</div>
        </div>
        <div style="font-weight:800;font-size:1.375rem;color:var(--forest)">${formattedAmt}</div>
      </div>

      <!-- Details grid -->
      <div class="upi-details">
        <div class="upi-detail-card">
          <div class="upi-detail-label">Merchant</div>
          <div class="upi-detail-value">${session.merchantName}</div>
        </div>
        <div class="upi-detail-card">
          <div class="upi-detail-label">UPI ID</div>
          <div class="upi-detail-value" style="font-family:monospace;font-size:.9375rem">${session.upiId}</div>
        </div>
        <div class="upi-detail-card">
          <div class="upi-detail-label">Order</div>
          <div class="upi-detail-value">#${session.orderNumber}</div>
        </div>
        <div class="upi-detail-card">
          <div class="upi-detail-label">Amount</div>
          <div class="upi-detail-value amount">${formattedAmt}</div>
        </div>
      </div>

      <!-- QR Code -->
      <div id="upi-qr-section" class="upi-qr-section">
        <div class="upi-qr-label">Scan with ${session.methodName}</div>
        <div class="upi-qr-frame">
          <img src="${session.qrImage}" class="upi-qr-img" alt="UPI QR Code" onerror="this.src='/img/placeholder.svg'">
          <div class="upi-qr-badge">${session.methodName} · UPI</div>
        </div>
      </div>

      <!-- Countdown Timer -->
      <div class="upi-timer-section">
        <div class="upi-timer-ring" id="upi-timer-ring">
          <span class="upi-timer-text" id="upi-timer-text">5:00</span>
        </div>
        <div class="upi-timer-label">Payment session expires</div>
      </div>

      <!-- Actions -->
      <div id="upi-scan-actions" class="upi-actions">
        <button class="upi-btn-confirm" id="upi-paid-btn">✓ &nbsp;I Have Paid</button>
        <button class="upi-btn-cancel" id="upi-cancel-btn">Cancel Payment</button>
      </div>

      <!-- UTR Entry Area -->
      <div id="upi-utr-actions" class="upi-actions" style="display:none; text-align:left;">
        <label style="font-size:0.8125rem; font-weight:700; color:var(--charcoal); margin-bottom:6px; display:block">Enter 12-digit UTR / Reference No.</label>
        <input type="text" id="upi-utr-input" class="form-input" placeholder="e.g. 312345678901" style="margin-bottom:12px; font-family:monospace; font-size:1.0625rem; padding:12px 16px;">
        <button class="upi-btn-confirm" id="upi-confirm-btn">Submit Payment</button>
        <button class="upi-btn-cancel" id="upi-back-btn" style="margin-top:8px">← Back to QR Code</button>
      </div>

      <div class="upi-security-note">
        🔒 This is a secure payment session.
      </div>
    `;

    // Start countdown timer
    startTimer(session.expiresAt);

    // Wire up buttons
    document.getElementById('upi-paid-btn').addEventListener('click', () => {
      document.getElementById('upi-scan-actions').style.display = 'none';
      document.getElementById('upi-qr-section').style.display = 'none';
      document.getElementById('upi-utr-actions').style.display = 'flex';
      document.getElementById('upi-utr-input').focus();
    });

    document.getElementById('upi-back-btn').addEventListener('click', () => {
      document.getElementById('upi-utr-actions').style.display = 'none';
      document.getElementById('upi-scan-actions').style.display = 'flex';
      document.getElementById('upi-qr-section').style.display = 'block';
    });

    document.getElementById('upi-confirm-btn').addEventListener('click', () => handleConfirm());
    document.getElementById('upi-cancel-btn').addEventListener('click', () => handleCancel());
    document.getElementById('upi-close-btn').addEventListener('click', () => handleCancel());

    // Show modal
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeUPIModal = () => {
    document.getElementById('upi-overlay').classList.remove('active');
    document.body.style.overflow = '';
    if (upiTimerInterval) { clearInterval(upiTimerInterval); upiTimerInterval = null; }
  };

  // ─── Timer ───
  const startTimer = (expiresAtISO) => {
    const expiresAt = new Date(expiresAtISO).getTime();
    const totalDuration = expiresAt - Date.now();

    const tick = () => {
      const remaining = Math.max(0, expiresAt - Date.now());
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      const timerText = document.getElementById('upi-timer-text');
      const timerRing = document.getElementById('upi-timer-ring');

      if (timerText) {
        timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        timerText.classList.toggle('warning', remaining < 60000);
      }
      if (timerRing) {
        const pct = (remaining / totalDuration) * 100;
        timerRing.style.setProperty('--progress', pct + '%');
      }

      if (remaining <= 0) {
        clearInterval(upiTimerInterval);
        upiTimerInterval = null;
        handleExpired();
      }
    };

    tick();
    upiTimerInterval = setInterval(tick, 1000);
  };

  // ─── Confirm Payment ───
  const handleConfirm = async () => {
    const utrInput = document.getElementById('upi-utr-input');
    const utr = utrInput ? utrInput.value.trim() : '';

    if (!/^\d{12}$/.test(utr)) {
      Toast.error('Please enter a valid 12-digit UTR / reference number');
      if (utrInput) utrInput.focus();
      return;
    }

    const btn = document.getElementById('upi-confirm-btn');
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;margin-right:8px;display:inline-block"></span> Verifying...';

    try {
      const res = await API.Payment.confirmUPI({ paymentId: upiPaymentId, utr });
      const confirmedUtr = res.utr;

      // Show success state
      if (upiTimerInterval) { clearInterval(upiTimerInterval); upiTimerInterval = null; }
      const body = document.getElementById('upi-modal-body');
      body.innerHTML = `
        <div class="upi-success-state">
          <div class="upi-success-icon">✓</div>
          <div class="upi-success-title">Payment Successful!</div>
          <div class="upi-success-sub">Your order has been confirmed</div>
          ${confirmedUtr ? `<div class="upi-success-utr">UTR: ${confirmedUtr}</div>` : ''}
        </div>
      `;
      document.getElementById('upi-close-btn').style.display = 'none';
      Toast.success('Payment verified! 🎉');

      if (mode === 'buynow') localStorage.removeItem('bs_buy_now');
      setTimeout(() => {
        closeUPIModal();
        window.location.href = '/profile.html?tab=orders';
      }, 2500);
    } catch (err) {
      Toast.error(err.message || 'Payment verification failed');
      btn.disabled = false;
      btn.innerHTML = 'Submit Payment';
    }
  };

  // ─── Cancel Payment ───
  const handleCancel = async () => {
    if (!upiPaymentId) { closeUPIModal(); return; }
    try {
      await API.Payment.cancelUPI({ paymentId: upiPaymentId });
      Toast.info('Payment cancelled');
    } catch {}
    closeUPIModal();
    // Re-enable the place order button
    const btn = document.getElementById('place-order-btn');
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  };

  // ─── Expired ───
  const handleExpired = async () => {
    try {
      await API.Payment.expireUPI({ paymentId: upiPaymentId });
    } catch {}

    const body = document.getElementById('upi-modal-body');
    body.innerHTML = `
      <div class="upi-expired-state">
        <div class="upi-expired-icon">⏱</div>
        <div class="upi-success-title" style="color:var(--error)">Session Expired</div>
        <div class="upi-success-sub">Your payment session has timed out</div>
        <p style="margin-top:16px;font-size:.875rem;color:var(--mid-gray)">Please go back and try again.</p>
        <button class="upi-btn-cancel" style="margin-top:20px" onclick="window.location.reload()">Try Again</button>
      </div>
    `;
    document.getElementById('upi-close-btn').style.display = 'none';
    Toast.error('Payment session expired');
  };



  // ════════════════════════════════════════════
  //  Place Order Handler
  // ════════════════════════════════════════════
  document.getElementById('place-order-btn')?.addEventListener('click', async () => {
    if (!selectedAddress) { Toast.error('Please select or add a delivery address'); return; }
    const btn = document.getElementById('place-order-btn');
    btn.classList.add('btn-loading'); btn.disabled = true;

    try {
      // 1. Place the order
      const { order } = await API.Orders.place({
        shippingAddress: selectedAddress,
        paymentMethod: selectedPayment,
        ...(orderItems ? { items: orderItems } : {}),
      });

      // ──── COD ────
      if (selectedPayment === 'cod') {
        await API.Payment.cod({ orderId: order._id });
        Toast.success('Order placed successfully! 🎉');
        if (mode === 'buynow') localStorage.removeItem('bs_buy_now');
        setTimeout(() => window.location.href = '/profile.html?tab=orders', 2000);

      // ──── Google Pay / PhonePe ────
      } else if (['googlepay', 'phonepe'].includes(selectedPayment)) {
        const { paymentSession } = await API.Payment.initiateUPI({
          orderId: order._id,
          upiMethod: selectedPayment,
        });
        // Open the payment modal instead of prompt()
        openUPIModal(paymentSession);
        // Note: don't re-enable the button here — modal handles it

      // ──── Razorpay ────
      } else {
        const { paymentOrder } = await API.Payment.createOrder({ orderId: order._id, amount: window._checkoutTotal });
        await API.Payment.verify({
          razorpayOrderId: paymentOrder.id,
          razorpayPaymentId: 'pay_mock_' + Date.now(),
          razorpaySignature: 'mock_sig',
          orderId: order._id,
        });
        Toast.success('Payment verified! 🎉');
        if (mode === 'buynow') localStorage.removeItem('bs_buy_now');
        setTimeout(() => window.location.href = '/profile.html?tab=orders', 2000);
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to place order');
      btn.classList.remove('btn-loading'); btn.disabled = false;
    }
  });

  // Prevent overlay click from closing if in success state
  document.getElementById('upi-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  });

  // ──── Init ────
  await Promise.all([renderSummary(), renderAddressSection()]);
  initPaymentOptions();
})();
