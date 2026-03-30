// Global error listener to catch rendering crashes
window.onerror = function(msg, url, line, col, error) {
    console.error("Global Error Caught:", msg, "at", line, ":", col);
    const container = document.getElementById('results-container');
    if (container) {
        container.innerHTML = `<div class="alert alert-danger">A rendering error occurred: ${msg}. Check console for details.</div>`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("DOMContentLoaded: Initializing Results Page");
        syncNavbarUser();

        const tripData = JSON.parse(sessionStorage.getItem("tripData"));
        const meta = JSON.parse(sessionStorage.getItem("tripMeta"));

        console.log("RESULTS PAGE PARAMS:", {
            destination: meta?.destination,
            days: meta?.days,
            budget: meta?.budgetUsd || meta?.enteredBudget
        });

        const titleEl = document.querySelector(".title") || document.querySelector("h1") || document.getElementById("res-title");
        const subtitleEl = document.querySelector(".subtitle") || document.getElementById("res-subtitle");

        if (!tripData || !meta) {
            if (titleEl) {
                titleEl.innerText = "Invalid Destination";
            }
            return;
        }

        const { destination, days } = meta;

        if (titleEl) {
            titleEl.innerText = `${days} Days in ${destination}`;
        }

        if (subtitleEl) {
            const budgetUsd = Number(tripData?.budget || meta?.budgetUsd || 0);
            subtitleEl.innerHTML = `Configured for a <span data-price="${budgetUsd}"></span> Budget`;
        }

        const data = tripData;
        console.log("API DATA:", data);

        const dest = data.destination || { name: "Destination", image: "" };
        const destName = typeof dest === 'string' ? dest : (dest.name || "Destination");
        const destImage = dest.image || `https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1000&q=80&destination=${encodeURIComponent(destName)}`;

        const bgEl = document.getElementById('bg-img');
        if (bgEl) bgEl.style.backgroundImage = `url('${destImage}')`;

        if (data.itineraries && data.itineraries.length > 0) {
            renderItineraryPackages(data);
        } else if (data.type === "api-fallback" && data.attractions) {
            renderAttractionsFallback(data);
        } else {
            const container = document.getElementById('results-container');
            if (container) {
                container.innerHTML = '<div class="text-center w-100 my-5"><h3>No plans found for this destination.</h3><p>Try refining your preferences.</p></div>';
            }
        }

        window.SmartTravelCurrency?.updateAllPrices?.();

        if (data.message) console.log("Backend Message:", data.message);
        
    } catch (err) {
        console.error("Initialization Error:", err);
        const container = document.getElementById('results-container');
        if (container) container.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
});

function syncNavbarUser() {
    const userNameEl = document.getElementById('navUserName');
    const userAvatarEl = document.getElementById('navUserAvatar');
    const userStr = localStorage.getItem('user');

    if (!userStr) {
        return;
    }

    try {
        const user = JSON.parse(userStr);
        const name = user?.name?.trim();

        if (!name) {
            return;
        }

        if (userNameEl) {
            userNameEl.textContent = `Hello, ${name}`;
        }

        if (userAvatarEl) {
            userAvatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
            userAvatarEl.alt = name;
        }
    } catch (error) {
        console.warn('Unable to parse current user for navbar:', error);
    }
}

function renderItineraryPackages(data) {
    const container = document.getElementById('results-container');
    if (!container) return;
    
    container.innerHTML = '';
    console.log("Rendering Itinerary Packages...");

    data.itineraries.forEach((option, index) => {
        try {
            const highlightClass = option.recommended ? 'highlight' : '';
            const recBadge = option.recommended ? `<span class="badge bg-warning text-dark mb-3 px-3 py-2 align-self-start fw-bold" style="border-radius:20px; box-shadow: 0 4px 15px rgba(255,193,7,0.3);">Top Recommendation</span>` : `<div style="height:36px;" class="mb-3"></div>`;

            const breakdown = option.breakdown || { stay: 0, food: 0, transport: 0, activities: 0, total: 0 };
            const highlights = option.highlights || [];
            const stay = option.stay || { type: "Standard Stay", price_per_night: 0 };
            const food = option.food || { type: "Local Dining", cost_per_day: 0 };
            const transport = option.transport || { mode: "Local Transit" };

            const cardHtml = `
            <div class="col-lg-4 col-md-6 d-flex align-items-stretch mb-4">
                <div class="result-card w-100 ${highlightClass}" id="card-${index}">
                    ${recBadge}
                    <div class="card-summary-view">
                        <h3 class="text-capitalize mb-2 fw-bold text-white">${option.type || 'Standard'} Trip</h3>
                        <p class="text-white-50 small mb-4">${option.summary || 'A curated journey.'}</p>
                        
                        <div class="highlights-container mb-4">
                            ${highlights.map(h => `<span class="h-pill">${h}</span>`).join('')}
                        </div>

                        <div class="mini-breakdown mb-4">
                            <div class="b-item">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                <span>Stay: <span data-price="${breakdown.stay || 0}"></span></span>
                            </div>
                            <div class="b-item">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                <span>Activities: <span data-price="${breakdown.activities || 0}"></span></span>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-4 mt-auto">
                            <div>
                                <div class="text-white-50 x-small">Total Estimate</div>
                                <div class="fs-2 fw-bold text-success" data-price="${option.totalCost || breakdown.total || 0}"></div>
                            </div>
                            <button class="btn-view-plan" onclick="viewFullPlan(${index})">
                                <span>View Full Plan</span>
                                <svg class="ms-2" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
            container.innerHTML += cardHtml;
        } catch (cardErr) {
            console.error("Error rendering card for index:", index, cardErr);
        }
    });
}

function renderAttractionsFallback(data) {
    const container = document.getElementById("attractions-container");
    const resultsContainer = document.getElementById("results-container");
    const attractionsSection = document.getElementById("attractions-section");
    
    if (resultsContainer) resultsContainer.classList.add('d-none');
    if (container) container.innerHTML = "";

    const destName = typeof data.destination === 'string' ? data.destination : (data.destination?.name || "Destination");

    if (data.attractions && Array.isArray(data.attractions)) {
        data.attractions.forEach(place => {
            const fallbackImg = `https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1000&q=80&sig=${Math.random()}`;
            const card = `
                <div class="col-lg-4 col-md-6 d-flex align-items-stretch">
                    <div class="attraction-card w-100">
                        <img src="${place.image || fallbackImg}" alt="${place.name}" class="attraction-image" onerror="this.src='${fallbackImg}'">
                        <div class="attraction-content">
                            <h3 class="fw-bold mb-3">${place.name}</h3>
                            <p class="text-light opacity-75">${place.description || 'No description available for this popular spot.'}</p>
                        </div>
                        <div class="p-4 pt-0 mt-auto">
                             <button class="btn btn-outline-info w-100 rounded-pill" onclick="window.open('https://www.google.com/search?q=${encodeURIComponent(place.name + ' ' + destName)}', '_blank')">Learn More</button>
                        </div>
                    </div>
                </div>
            `;
            if (container) container.innerHTML += card;
        });
    }

    if (attractionsSection) attractionsSection.classList.remove("d-none");
}

window.viewFullPlan = function(index) {
    const dataStr = sessionStorage.getItem('tripData');
    if (dataStr) {
        try {
            const data = JSON.parse(dataStr);
            if (data.itineraries && data.itineraries[index]) {
                sessionStorage.setItem("selectedItinerary", JSON.stringify(data.itineraries[index]));
                // Add fade out effect
                document.body.style.opacity = '0';
                setTimeout(() => {
                    window.location.href = "itinerary.html";
                }, 300);
            }
        } catch (e) {
            console.error("Error navigating to itinerary:", e);
        }
    }
};
