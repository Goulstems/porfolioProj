// stats.js
// Injects a stats div with cards
export function injectStats() {
  const statsDiv = document.createElement('div');
  statsDiv.className = 'stats-container';
  // Remove fixed positioning so stats scroll with the page
  // statsDiv.style.position = 'fixed';
  // statsDiv.style.left = '50%';
  // statsDiv.style.top = '66vh';
  // statsDiv.style.transform = 'translateX(-50%)';
  statsDiv.style.zIndex = '1';
  statsDiv.style.width = '340px';
  statsDiv.style.display = 'flex';
  statsDiv.style.flexDirection = 'column';
  statsDiv.style.gap = '8px';
  statsDiv.style.margin = '-7em auto 2em auto'; // Move stats up by 5em
  statsDiv.innerHTML = `
    <div class="stat-card" style="height:2em; min-width:180px; background:#fff; border-radius:22px; box-shadow:0 2px 8px #006ad122; border:1.5px solid #e0e0e0; display:flex; align-items:center; justify-content:space-between; padding:0 1.2em;">
      <span class="stat-title" style="color:#006ad1;font-weight:bold; text-align:left;">Hours tutored:</span>
      <span class="stat-value" style="text-align:right; margin-left:2em;">1,118!</span>
    </div>
    <div class="stat-card" style="height:2em; min-width:180px; background:#fff; border-radius:22px; box-shadow:0 2px 8px #006ad122; border:1.5px solid #e0e0e0; display:flex; align-items:center; justify-content:space-between; padding:0 1.2em;">
      <span class="stat-title" style="color:#006ad1;font-weight:bold; text-align:left;">Specialized subjects:</span>
      <span class="stat-value" style="text-align:right; margin-left:2em;">Math, Reading/Writing</span>
    </div>
    <div class="stat-card" style="height:2em; min-width:180px; background:#fff; border-radius:22px; box-shadow:0 2px 8px #006ad122; border:1.5px solid #e0e0e0; display:flex; align-items:center; justify-content:center; padding:0 1.2em;">
      <span class="stat-title" style="color:#006ad1;font-weight:bold; text-align:center; width:100%;">FLEXIBLE scheduling</span>
    </div>
  `;
  document.body.appendChild(statsDiv);

  // Hide stats on PayPal button click
  window.addEventListener('paypal-button-clicked', () => {
    statsDiv.style.display = 'none';
  });
  // Show stats after payment is approved
  window.addEventListener('paypal-payment-approved', () => {
    statsDiv.style.display = 'flex';
  });
}

// Auto-inject on module load
injectStats();
