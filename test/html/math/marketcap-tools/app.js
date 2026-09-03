import { calculateMarketcap, compareMarketcap } from '/src/v1/basics/simpleMath.mjs';

window.calculate = function () {
  const originalMarketCap = parseFloat(document.getElementById('originalMarketCap').value);
  const circulatingSupply = parseFloat(document.getElementById('circulatingSupply').value);
  const newMarketCap = parseFloat(document.getElementById('newMarketCap').value);
  const resultBox = document.getElementById('resultBox');
  resultBox.innerHTML = '';

  try {
    const originalPrice = calculateMarketcap(originalMarketCap, circulatingSupply);
    let html = `<p><strong>Original Price:</strong> $${originalPrice.toFixed(6)}</p>`;

    if (!isNaN(newMarketCap)) {
      const { newPrice, priceChangePercent } = compareMarketcap(
        originalMarketCap,
        circulatingSupply,
        newMarketCap,
      );
      html += `<p><strong>New Price:</strong> $${newPrice.toFixed(6)}</p>`;
      html += `<p><strong>Price Change:</strong> ${priceChangePercent.toFixed(2)}%</p>`;
    }

    resultBox.innerHTML = html;
  } catch (err) {
    resultBox.innerHTML = `<p class="error">⚠️ ${err.message}</p>`;
  }
};
