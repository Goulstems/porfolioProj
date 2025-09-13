class PaymentDiv extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const amount = this.getAttribute('amount') || '0.00';
    const description = this.getAttribute('description') || '';
    const serviceFee = this.getAttribute('service-fee') || '2.00';
    let cardColor = '#e6fbe6';
    let borderColor = '#347d1b';
    let amountColor = '#347d1b';
    if (description.toLowerCase().includes('4 hours')) {
      cardColor = '#fff5e6';
      borderColor = '#ff9800';
      amountColor = '#ff9800';
    }
    shadow.innerHTML = `
      <style>
        .payment-option {
          border:2px solid ${borderColor};
          border-radius:12px;
          padding:18px 16px;
          margin-bottom:24px;
          box-shadow:0 2px 8px #00000011;
          position:relative;
          background:${cardColor};
        }
        .selected {
          border-color: #222 !important;
          box-shadow:0 2px 12px #22222222;
          transform: scale(1.05);
          transition: transform 0.18s cubic-bezier(.4,1.4,.4,1);
        }
        .select-btn {
          position:absolute;
          top:16px;
          right:16px;
          background:#222;
          color:#fff;
          border:none;
          border-radius:6px;
          padding:6px 16px;
          font-size:1em;
          cursor:pointer;
        }
        .select-btn.selected {
          background:#347d1b;
        }
        .desc {
          font-size:1.05em;
          color:#222;
          margin-bottom:12px;
        }
        .amount {
          color:${amountColor};
          font-weight:bold;
          margin:0;
        }
        .fee {
          font-size:0.9em;
          color:#888;
        }
      </style>
      <div class="payment-option">
        <button class="select-btn">Select</button>
        <div class="desc">${description}</div>
        <div style="display:flex;align-items:center;gap:10px;margin:0 0 18px 0;">
          <p class="amount">Amount: $${amount} USD</p>
          <span class="fee">+$${serviceFee} service fee</span>
        </div>
      </div>
    `;
    this.amount = amount;
    this.description = description;
    this.serviceFee = serviceFee;
    this.selectBtn = shadow.querySelector('.select-btn');
    this.paymentOptionDiv = shadow.querySelector('.payment-option');
    this.selectBtn.addEventListener('click', () => {
      if (this.paymentOptionDiv.classList.contains('selected')) {
        // Unselect if already selected
        window.dispatchEvent(new CustomEvent('payment-div-unselected', {
          detail: { element: this }
        }));
      } else {
        window.dispatchEvent(new CustomEvent('payment-div-selected', {
          detail: {
            amount: this.amount,
            serviceFee: this.serviceFee,
            description: this.description,
            element: this
          }
        }));
      }
    });
  }
  setSelected(selected) {
    if (selected) {
      this.paymentOptionDiv.classList.add('selected');
      this.selectBtn.classList.add('selected');
      this.selectBtn.textContent = 'Selected';
    } else {
      this.paymentOptionDiv.classList.remove('selected');
      this.selectBtn.classList.remove('selected');
      this.selectBtn.textContent = 'Select';
    }
  }
}
customElements.define('payment-div', PaymentDiv);
