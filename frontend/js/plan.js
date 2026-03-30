/**
 * plan.js — Smart Travel Planner
 * Handles destination suggestions + form submission → results page
 */

document.addEventListener('DOMContentLoaded', async () => {
    const currencyUtils = window.SmartTravelCurrency;
    const planForm       = document.getElementById('planForm');
    const submitBtn      = document.getElementById('submitBtn');
    const destinationInput = document.getElementById('destinationInput');
    const daysInput      = document.getElementById('daysInput');
    const budgetInput    = document.getElementById('budgetInput');
    const validationMsg  = document.getElementById('validationMsg');
    const validationText = document.getElementById('validationText');

    // ── Pre-fill destination from URL param (e.g. plan.html?destination=Paris)
    const params = new URLSearchParams(window.location.search);
    const preselectedDest = params.get('destination');
    if (preselectedDest && destinationInput) {
        destinationInput.value = preselectedDest;
    }

    // ── Load destination suggestions from API
    try {
        const res = await fetch('http://localhost:5000/api/destinations');
        const destinations = await res.json();
        const list = document.getElementById('destinationList');
        if (list && Array.isArray(destinations)) {
            list.innerHTML = '';
            destinations.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.name;
                opt.textContent = d.country || '';
                list.appendChild(opt);
            });
        }
    } catch (e) {
        console.warn('Could not load destination suggestions:', e);
    }

    // ── Hide validation message whenever the user types
    [destinationInput, daysInput, budgetInput].forEach(el => {
        if (!el) return;
        el.addEventListener('input', () => hideValidation());
        el.addEventListener('focus', () => hideValidation());
    });

    // ── Form submit handler
    planForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await generateItinerary();
    });

    // ── Core generate function
    async function generateItinerary() {
        hideValidation();

        const destination = destinationInput?.value.trim() || '';
        const days        = daysInput?.value.trim() || '';
        const budget      = budgetInput?.value.trim() || '';
        const selectedCurrency = currencyUtils?.getCurrency?.() || 'USD';
        const budgetUsd = currencyUtils?.convertToUSD
            ? Number(currencyUtils.convertToUSD(budget, selectedCurrency).toFixed(2))
            : Number(budget);

        // Validate — all fields required
        if (!destination || !days || !budget || Number(days) < 1 || Number(budget) < 1) {
            alert('Please fill all fields');
            if (!destination) {
                destinationInput.focus();
            } else if (!days || Number(days) < 1) {
                daysInput.focus();
            } else {
                budgetInput.focus();
            }
            return;
        }

        const btn = submitBtn || document.querySelector('button');

        if (btn) {
            btn.dataset.originalText = btn.dataset.originalText || btn.innerText;
            btn.innerText = 'Generating...';
            btn.disabled = true;
            btn.classList.add('loading');
        }

        try {
            const res = await fetch('http://localhost:5000/api/generate-trip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    destination,
                    days,
                    budget: budgetUsd
                })
            });

            const data = await res.json();

            if (!res.ok || !data || !Array.isArray(data.itineraries) || data.itineraries.length === 0) {
                throw new Error(data?.error || data?.message || 'No itinerary');
            }

            sessionStorage.setItem('tripData', JSON.stringify(data));
            sessionStorage.setItem('tripMeta', JSON.stringify({
                destination,
                days,
                budgetUsd,
                enteredBudget: Number(budget),
                currency: selectedCurrency
            }));

            window.location.href = 'results.html';
        } catch (err) {
            console.error('Failed to generate itinerary:', err);
            alert('Failed to generate itinerary. Try again.');
            setLoading(false);
        }
    }

    // ── Helpers
    function showValidation(message) {
        if (validationText) validationText.textContent = message;
        if (validationMsg)  validationMsg.classList.add('show');
    }

    function hideValidation() {
        if (validationMsg) validationMsg.classList.remove('show');
    }

    function setLoading(isLoading) {
        if (!submitBtn) return;
        if (isLoading) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            submitBtn.innerText = 'Generating...';
        } else {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.innerText = submitBtn.dataset.originalText || 'Generate Itinerary';
        }
    }
});
