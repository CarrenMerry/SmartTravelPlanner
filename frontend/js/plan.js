/**
 * plan.js - Smart Travel Planner
 * Handles destination validation, autocorrect, suggestions, and itinerary generation.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = '/api';
    const currencyUtils = window.SmartTravelCurrency;
    const planForm = document.getElementById('planForm');
    const submitBtn = document.getElementById('submitBtn');
    const destinationInput = document.getElementById('destinationInput');
    const daysInput = document.getElementById('daysInput');
    const budgetInput = document.getElementById('budgetInput');
    const validationMsg = document.getElementById('validationMsg');
    const validationText = document.getElementById('validationText');
    const destinationList = document.getElementById('destinationList');

    let destinationOptions = [];
    let validationTimer = null;
    let lastValidatedQuery = '';
    let lastValidationResult = null;

    const params = new URLSearchParams(window.location.search);
    const preselectedDest = params.get('destination');
    if (preselectedDest && destinationInput) {
        destinationInput.value = preselectedDest;
    }

    await loadDestinationSuggestions();
    updateDestinationSuggestions(destinationInput?.value || '');

    [destinationInput, daysInput, budgetInput].forEach(element => {
        if (!element) {
            return;
        }

        element.addEventListener('input', () => hideValidation());
        element.addEventListener('focus', () => hideValidation());
    });

    if (destinationInput) {
        destinationInput.addEventListener('input', () => {
            lastValidationResult = null;
            updateDestinationSuggestions(destinationInput.value);

            clearTimeout(validationTimer);
            validationTimer = window.setTimeout(async () => {
                const query = destinationInput.value.trim();
                if (query.length < 3) {
                    return;
                }

                const validated = await validateDestination(query, { showError: false });
                updateDestinationSuggestions(destinationInput.value, validated);
            }, 350);
        });

        destinationInput.addEventListener('blur', async () => {
            await validateDestination(destinationInput.value, { autocorrect: true, showError: false });
        });
    }

    planForm?.addEventListener('submit', async event => {
        event.preventDefault();
        await generateItinerary();
    });

    async function loadDestinationSuggestions() {
        try {
            const response = await fetch(`${API_BASE}/destinations`);
            const destinations = await response.json();

            if (!Array.isArray(destinations)) {
                return;
            }

            destinationOptions = destinations.map(destination => ({
                name: destination.name,
                country: destination.country || ''
            }));
        } catch (error) {
            console.warn('Could not load destination suggestions:', error);
        }
    }

    function updateDestinationSuggestions(query, validated = null) {
        if (!destinationList) {
            return;
        }

        const normalizedQuery = String(query || '').trim().toLowerCase();
        const options = [];
        const seen = new Set();

        const addOption = value => {
            const normalizedValue = String(value || '').trim().toLowerCase();
            if (!normalizedValue || seen.has(normalizedValue)) {
                return;
            }

            seen.add(normalizedValue);
            options.push(value);
        };

        if (validated?.displayName) {
            addOption(validated.displayName);
        }

        destinationOptions
            .filter(option => {
                if (!normalizedQuery) {
                    return true;
                }

                const haystack = `${option.name} ${option.country}`.toLowerCase();
                return haystack.includes(normalizedQuery);
            })
            .slice(0, 8)
            .forEach(option => addOption([option.name, option.country].filter(Boolean).join(', ')));

        destinationList.innerHTML = '';

        if (!options.length) {
            const fallback = document.createElement('option');
            fallback.value = 'Try a city, island, country, or region';
            destinationList.appendChild(fallback);
            return;
        }

        options.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            destinationList.appendChild(option);
        });
    }

    async function validateDestination(query, options = {}) {
        const { autocorrect = false } = options;
        const trimmedQuery = String(query || '').trim();

        if (!trimmedQuery) {
            return null;
        }

        if (trimmedQuery === lastValidatedQuery && lastValidationResult) {
            if (autocorrect && lastValidationResult.displayName && destinationInput) {
                destinationInput.value = lastValidationResult.displayName;
            }

            return lastValidationResult;
        }

        try {
            const response = await fetch(`${API_BASE}/validate-destination?query=${encodeURIComponent(trimmedQuery)}`);
            const data = await response.json();

            lastValidatedQuery = trimmedQuery;
            lastValidationResult = response.ok ? data : {
                valid: true,
                allowAttempt: true,
                name: trimmedQuery,
                displayName: trimmedQuery
            };

            if (autocorrect && lastValidationResult.displayName && destinationInput) {
                destinationInput.value = lastValidationResult.displayName;
            }

            return lastValidationResult;
        } catch (error) {
            lastValidatedQuery = trimmedQuery;
            lastValidationResult = {
                valid: true,
                allowAttempt: true,
                name: trimmedQuery,
                displayName: trimmedQuery
            };
            return lastValidationResult;
        }
    }

    async function generateItinerary() {
        hideValidation();

        const destination = destinationInput?.value.trim() || '';
        const days = daysInput?.value.trim() || '';
        const budget = budgetInput?.value.trim() || '';
        const selectedCurrency = currencyUtils?.getCurrency?.() || 'USD';
        const budgetUsd = currencyUtils?.convertToUSD
            ? Number(currencyUtils.convertToUSD(budget, selectedCurrency).toFixed(2))
            : Number(budget);

        if (!destination || !days || !budget || Number(days) < 1 || Number(budget) < 1) {
            const message = 'Please fill all fields with valid values.';
            showValidation(message);
            showError(message);

            if (!destination) {
                destinationInput?.focus();
            } else if (!days || Number(days) < 1) {
                daysInput?.focus();
            } else {
                budgetInput?.focus();
            }
            return;
        }

        const validated = await validateDestination(destination, { autocorrect: true });

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/generate-trip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    destination: destinationInput?.value.trim() || validated?.displayName || destination,
                    days,
                    budget: budgetUsd
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || 'Failed to generate itinerary.');
            }

            if (data?.success !== true) {
                const message = data?.message || 'We could not generate an itinerary for this destination.';
                showValidation(message);
                showError(message);
                setLoading(false);
                return;
            }

            sessionStorage.setItem('tripData', JSON.stringify(data));
            sessionStorage.setItem('tripMeta', JSON.stringify({
                destination: destinationInput?.value.trim() || validated?.displayName || destination,
                days,
                budgetUsd,
                enteredBudget: Number(budget),
                currency: selectedCurrency
            }));

            window.location.href = 'results.html';
        } catch (error) {
            console.error('Failed to generate itinerary:', error);
            showValidation(error.message);
            showError(error.message);
            setLoading(false);
        }
    }

    function showValidation(message) {
        if (validationText) {
            validationText.textContent = message;
        }

        if (validationMsg) {
            validationMsg.classList.add('show');
        }
    }

    function hideValidation() {
        if (validationMsg) {
            validationMsg.classList.remove('show');
        }
    }

    function showError(message) {
        const existingBox = document.querySelector('.error-box');
        if (existingBox) {
            existingBox.remove();
        }

        const box = document.createElement('div');
        box.className = 'error-box';
        box.innerText = message;

        document.body.appendChild(box);

        window.setTimeout(() => box.remove(), 4000);
    }

    function setLoading(isLoading) {
        if (!submitBtn) {
            return;
        }

        if (isLoading) {
            submitBtn.dataset.originalHtml = submitBtn.dataset.originalHtml || submitBtn.innerHTML;
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            const label = submitBtn.querySelector('.btn-label');
            if (label) {
                label.innerText = 'Generating...';
            }
            return;
        }

        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtn.dataset.originalHtml || 'Generate Itinerary';
    }
});
