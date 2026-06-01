// ── Translations ──────────────────────────────────────────────
const translations = {
    bm: {
        subtitle: "Cari barang termurah di Shopee, Lazada, TikTok Shop & Lain-lain!",
        searchPlaceholder: "Cth: power bank, kasut, blender...",
        maxPricePlaceholder: "Max RM",
        sortAsc: "Harga: Rendah → Tinggi",
        sortDesc: "Harga: Tinggi → Rendah",
        sortRelevance: "Relevan",
        searchBtn: "Cari",
        loading: "Mencari harga terbaik...",
        noResults: "Tiada produk dijumpai. Cuba kata kunci lain.",
        errorBackend: "Gagal menyambung ke backend. Pastikan Flask berjalan.",
        cheapestLabel: "💰 Termurah",
        platformsLabel: "🛒 Platform",
        voucherLabel: "🎫 Voucher",
        voucherUnit: "produk",
        bestDeal: "🌟 Tawaran Terbaik!",
        freeShipping: "Free Shipping",
        voucherBadge: "Voucher",
        visitLink: "Lihat di",
        langToggle: "EN"
    },
    en: {
        subtitle: "Find the cheapest items on Shopee, Lazada, TikTok Shop & More!",
        searchPlaceholder: "e.g. power bank, shoes, blender...",
        maxPricePlaceholder: "Max RM",
        sortAsc: "Price: Low → High",
        sortDesc: "Price: High → Low",
        sortRelevance: "Relevance",
        searchBtn: "Search",
        loading: "Finding the best prices...",
        noResults: "No products found. Try another keyword.",
        errorBackend: "Failed to connect to backend. Make sure Flask is running.",
        cheapestLabel: "💰 Cheapest",
        platformsLabel: "🛒 Platforms",
        voucherLabel: "🎫 Voucher",
        voucherUnit: "products",
        bestDeal: "🌟 Best Deal!",
        freeShipping: "Free Shipping",
        voucherBadge: "Voucher",
        visitLink: "View on",
        langToggle: "BM"
    }
};

// ── State ─────────────────────────────────────────────────────
let currentLang = localStorage.getItem('lang') || 'bm';
let lastData = null;   // stores the latest search result

// ── DOM elements ──────────────────────────────────────────────
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const maxPriceInput = document.getElementById('maxPriceInput');
const sortSelect = document.getElementById('sortSelect');
const summaryDiv = document.getElementById('summary');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');
const langToggleBtn = document.getElementById('langToggle');

// ── Apply language to static UI ───────────────────────────────
function applyStaticLanguage(lang) {
    const t = translations[lang];
    document.getElementById('subtitle').textContent = t.subtitle;
    searchInput.placeholder = t.searchPlaceholder;
    maxPriceInput.placeholder = t.maxPricePlaceholder;
    searchBtn.textContent = t.searchBtn;
    loadingDiv.textContent = t.loading;

    sortSelect.options[0].textContent = t.sortAsc;
    sortSelect.options[1].textContent = t.sortDesc;
    sortSelect.options[2].textContent = t.sortRelevance;

    langToggleBtn.textContent = t.langToggle;
}

// ── Language toggle ───────────────────────────────────────────
langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'bm' ? 'en' : 'bm';
    localStorage.setItem('lang', currentLang);
    applyStaticLanguage(currentLang);

    // Re-render the last data if available
    if (lastData) {
        displayResults(lastData);
    }
});

// ── Initial setup ─────────────────────────────────────────────
applyStaticLanguage(currentLang);

// ── Search logic ──────────────────────────────────────────────
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    const maxPrice = maxPriceInput.value.trim();
    const sort = sortSelect.value;

    loadingDiv.classList.remove('hidden');
    resultsDiv.innerHTML = '';
    summaryDiv.classList.add('hidden');

    let url = `https://manamurah-api.onrender.com/api/search?q=${encodeURIComponent(query)}`;
    if (maxPrice && !isNaN(maxPrice) && Number(maxPrice) > 0) {
        url += `&max_price=${encodeURIComponent(maxPrice)}`;
    }
    url += `&sort=${sort}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            resultsDiv.innerHTML = `<p style="color:red;">${translations[currentLang].errorBackend}</p>`;
            lastData = null;
            return;
        }

        lastData = data;   // save for language switch
        displayResults(data);
    } catch (err) {
        resultsDiv.innerHTML = `<p style="color:red;">${translations[currentLang].errorBackend}</p>`;
        lastData = null;
    } finally {
        loadingDiv.classList.add('hidden');
    }
}

function displayResults(data) {
    const t = translations[currentLang];

    if (!data.results || data.results.length === 0) {
        resultsDiv.innerHTML = `<p>${t.noResults}</p>`;
        return;
    }

    // Summary
    if (data.summary) {
        summaryDiv.classList.remove('hidden');
        summaryDiv.innerHTML = `
            <span><strong>${t.cheapestLabel}:</strong> ${data.summary.cheapest_item}</span> &nbsp;|&nbsp;
            <span><strong>${t.platformsLabel}:</strong> ${data.summary.platforms_available.join(', ')}</span> &nbsp;|&nbsp;
            <span><strong>${t.voucherLabel}:</strong> ${data.summary.voucher_available} ${t.voucherUnit}</span>
        `;
    }

    // Product cards
    const cheapestPrice = data.results[0].price;

    resultsDiv.innerHTML = data.results.map(product => {
        const isCheapest = product.price === cheapestPrice;
        let badgeClass = 'default-platform';
        if (product.platform === 'Shopee') {
            badgeClass = 'shopee';
        } else if (product.platform === 'Lazada') {
            badgeClass = 'lazada';
        } else if (product.platform === 'TikTok Shop') {
            badgeClass = 'tiktok';
        }

        return `
            <div class="product-card">
                ${isCheapest ? `<div class="best-deal">${t.bestDeal}</div>` : ''}
                <span class="platform-badge ${badgeClass}">${product.platform}</span>
                <h3>${product.title}</h3>
                <div class="price">RM ${product.price.toFixed(2)}</div>
                ${product.discount > 0 ? `<div class="discount">-${product.discount}% <span class="original-price">RM ${product.original_price.toFixed(2)}</span></div>` : ''}
                <div class="details">
                    ⭐ ${product.rating} &nbsp;
                    ${product.voucher ? `<span class="voucher">${t.voucherBadge}</span>` : ''}
                    ${product.free_shipping ? `<span class="free-shipping">${t.freeShipping}</span>` : ''}
                </div>
                <a href="${product.link}" target="_blank" class="visit-link">${t.visitLink} ${product.platform}</a>
            </div>
        `;
    }).join('');
}
// ── Dark Mode Toggle ──────────────────────────────────────────
const darkModeToggle = document.getElementById('darkModeToggle');

// Load saved preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀️';
} else {
    darkModeToggle.textContent = '🌙';
}

darkModeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', dark);
    darkModeToggle.textContent = dark ? '☀️' : '🌙';
});