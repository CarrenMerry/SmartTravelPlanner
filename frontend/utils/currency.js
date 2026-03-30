(function attachCurrencyUtilities(window) {
    const DEFAULT_CURRENCY = 'USD';
    const STORAGE_KEY = 'currency';
    const RATES_KEY = 'smartTravel_currencyRates';
    const RATES_TS_KEY = 'smartTravel_currencyRatesTs';
    const RATE_CACHE_MS = 12 * 60 * 60 * 1000;

    const staticRates = {
        USD: 1,
        INR: 83,
        EUR: 0.92,
        GBP: 0.78,
        AED: 3.67,
        CAD: 1.35,
        AUD: 1.5
    };

    const currencySymbols = {
        USD: '$',
        INR: '₹',
        EUR: '€',
        GBP: '£',
        AED: 'AED',
        CAD: 'C$',
        AUD: 'A$'
    };

    let rates = { ...staticRates };
    let selectorInitialized = false;

    function getCurrency() {
        return localStorage.getItem(STORAGE_KEY) || DEFAULT_CURRENCY;
    }

    function setCurrency(currency) {
        if (!currency) {
            return;
        }

        localStorage.setItem(STORAGE_KEY, currency);
        window.dispatchEvent(new Event('currencyChanged'));
    }

    function getCachedRates() {
        try {
            const cached = localStorage.getItem(RATES_KEY);
            const timestamp = Number(localStorage.getItem(RATES_TS_KEY));

            if (!cached || !timestamp || Date.now() - timestamp > RATE_CACHE_MS) {
                return null;
            }

            const parsed = JSON.parse(cached);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch (error) {
            console.warn('Unable to read cached currency rates:', error);
            return null;
        }
    }

    function cacheRates(nextRates) {
        try {
            localStorage.setItem(RATES_KEY, JSON.stringify(nextRates));
            localStorage.setItem(RATES_TS_KEY, String(Date.now()));
        } catch (error) {
            console.warn('Unable to cache currency rates:', error);
        }
    }

    async function loadRates() {
        const cachedRates = getCachedRates();

        if (cachedRates) {
            rates = { ...staticRates, ...cachedRates };
            return rates;
        }

        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

            if (!response.ok) {
                throw new Error(`Currency rate request failed with status ${response.status}`);
            }

            const data = await response.json();
            if (data && data.rates) {
                rates = { ...staticRates, ...data.rates };
                cacheRates(rates);
            }
        } catch (error) {
            console.warn('Falling back to static currency rates:', error);
            rates = { ...staticRates };
        }

        return rates;
    }

    function convertPrice(amountUSD, targetCurrency) {
        const numericAmount = Number(amountUSD || 0);
        const rate = rates[targetCurrency] || 1;
        return (numericAmount * rate).toFixed(2);
    }

    function formatAmount(value) {
        return Number(value || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function convertToUSD(amount, sourceCurrency) {
        const numericAmount = Number(amount || 0);
        const rate = rates[sourceCurrency] || 1;
        return rate ? numericAmount / rate : numericAmount;
    }

    function getCurrencySymbol(currencyCode) {
        return currencySymbols[currencyCode] || `${currencyCode} `;
    }

    function formatPrice(amountUSD, targetCurrency) {
        const currency = targetCurrency || getCurrency();
        return `${getCurrencySymbol(currency)} ${formatAmount(convertPrice(amountUSD, currency))}`;
    }

    function updateBudgetInputHint() {
        const currency = getCurrency();
        const symbol = getCurrencySymbol(currency);
        const budgetInput = document.getElementById('budgetInput');
        const budgetHint = document.querySelector('[data-budget-currency]');

        if (budgetInput) {
            budgetInput.placeholder = `Budget (${symbol})`;
        }

        if (budgetHint) {
            budgetHint.textContent = `Budget is entered in ${symbol} and converted automatically for trip generation.`;
        }

        document.querySelectorAll('[data-currency-symbol]').forEach((element) => {
            element.textContent = symbol;
        });
    }

    function updateAllPrices() {
        const currency = getCurrency();

        document.querySelectorAll('[data-price]').forEach((element) => {
            const usd = parseFloat(element.dataset.price || '0');
            const suffix = element.dataset.priceSuffix || '';
            element.innerText = `${formatPrice(usd, currency)}${suffix}`;
        });

        document.querySelectorAll('[data-currency-label]').forEach((element) => {
            element.textContent = currency;
        });

        document.querySelectorAll('[data-currency-btn]').forEach((element) => {
            element.innerText = currency;
        });

        updateBudgetInputHint();
    }

    function closeAllDropdowns() {
        document.querySelectorAll('[data-currency-dropdown]').forEach((dropdown) => {
            dropdown.classList.add('hidden');
        });
    }

    function createSelectorMarkup() {
        return `
            <div class="currency-selector" data-currency-selector>
                <button type="button" class="currency-btn" data-currency-btn>USD</button>
                <div class="currency-dropdown hidden" data-currency-dropdown>
                    <div data-currency="USD">USD</div>
                    <div data-currency="INR">INR</div>
                    <div data-currency="EUR">EUR</div>
                    <div data-currency="CAD">CAD</div>
                    <div data-currency="AED">AED</div>
                    <div data-currency="GBP">GBP</div>
                    <div data-currency="AUD">AUD</div>
                </div>
            </div>
        `;
    }

    function initCurrencySelector() {
        document.querySelectorAll('[data-currency-mount]').forEach((mountPoint) => {
            if (!mountPoint.querySelector('[data-currency-selector]')) {
                mountPoint.innerHTML = createSelectorMarkup();
            }
        });

        document.querySelectorAll('[data-currency-selector]').forEach((selector) => {
            if (selector.dataset.bound === 'true') {
                return;
            }

            const button = selector.querySelector('[data-currency-btn]');
            const dropdown = selector.querySelector('[data-currency-dropdown]');

            if (!button || !dropdown) {
                return;
            }

            button.innerText = getCurrency();

            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const willOpen = dropdown.classList.contains('hidden');
                closeAllDropdowns();
                dropdown.classList.toggle('hidden', !willOpen);
            });

            dropdown.querySelectorAll('[data-currency]').forEach((item) => {
                item.addEventListener('click', () => {
                    const selected = item.dataset.currency;
                    setCurrency(selected);
                    button.innerText = selected;
                    dropdown.classList.add('hidden');
                });
            });

            selector.dataset.bound = 'true';
        });

        if (!selectorInitialized) {
            document.addEventListener('click', (event) => {
                if (!event.target.closest('[data-currency-selector]')) {
                    closeAllDropdowns();
                }
            });

            window.addEventListener('currencyChanged', updateAllPrices);
            selectorInitialized = true;
        }

        updateAllPrices();
    }

    window.SmartTravelCurrency = {
        DEFAULT_CURRENCY,
        rates,
        getCurrency,
        setCurrency,
        loadRates,
        convertPrice,
        convertToUSD,
        formatPrice,
        getCurrencySymbol,
        updateAllPrices,
        initCurrencySelector
    };

    document.addEventListener('DOMContentLoaded', async () => {
        await loadRates();
        window.SmartTravelCurrency.rates = rates;
        initCurrencySelector();
        updateAllPrices();
    });
})(window);
