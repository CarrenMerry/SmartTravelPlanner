document.addEventListener('DOMContentLoaded', () => {
    try {
        syncNavbarUser();
        const itineraryStr = sessionStorage.getItem('selectedItinerary');
        const tripDataStr = sessionStorage.getItem('tripData');
        const container = document.getElementById('itinerary-container');

        if (!container) {
            console.error('itinerary-container not found');
            return;
        }

        console.log('Rendering inside:', container);

        if (!itineraryStr || !tripDataStr) {
            container.innerHTML = `
                <div class="text-center w-100 my-5 p-5 itinerary-card" style="margin-top: 100px !important;">
                    <h2 class="text-warning mb-4 fw-bold">No Itinerary Selected</h2>
                    <p class="text-light opacity-75 mb-5 fs-5">Please select a full plan from the trip results first.</p>
                    <button class="btn btn-outline-info rounded-pill px-5 py-3" onclick="window.location.href='results.html'">
                        Back to Results
                    </button>
                </div>
            `;
            return;
        }

        const itinerary = JSON.parse(itineraryStr);
        const tripData = JSON.parse(tripDataStr);
        const tripMeta = JSON.parse(sessionStorage.getItem('tripMeta') || 'null');
        const dest = tripData.destination || { name: 'Destination', image: '' };
        const destName = typeof dest === 'string' ? dest : (dest.name || 'Destination');
        const destImage = dest.image || `https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1000&q=80&destination=${encodeURIComponent(destName)}`;
        const type = itinerary.type || 'Standard';
        const breakdown = itinerary.breakdown || { stay: 0, food: 0, transport: 0, activities: 0, total: 0 };
        const daysPlan = Array.isArray(itinerary.daysPlan) ? itinerary.daysPlan : [];
        const totalValue = itinerary.totalCost || breakdown.total || (breakdown.stay + breakdown.food + breakdown.transport + breakdown.activities) || 0;

        const bgEl = document.getElementById('bg-img');
        if (bgEl) {
            bgEl.style.backgroundImage = `url('${destImage}')`;
        }

        function getTag(kind) {
            const normalizedKind = String(kind || '').toLowerCase();

            if (!normalizedKind) return 'Attraction';
            if (normalizedKind.includes('cultural') || normalizedKind.includes('museum')) return 'Cultural';
            if (normalizedKind.includes('beach') || normalizedKind.includes('nature')) return 'Nature';
            if (normalizedKind.includes('sport') || normalizedKind.includes('adventure')) return 'Adventure';

            return 'Landmark';
        }

        function getActivityData(day, slotKey) {
            const detailsKey = `${slotKey}Details`;
            const details = day?.[detailsKey];

            if (!details || !details.name) {
                return null;
            }

            return {
                name: details.name,
                image: details.image || '',
                description: details.description || '',
                tag: getTag(details.kind || details.kinds || ''),
                mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.name)}`
            };
        }

        function renderActivityColumn(label, activityDetails) {
            if (!activityDetails) {
                return '';
            }

            console.log('Rendering activity:', activityDetails.name);

            return `
                <div class="col-md-4">
                    <span class="badge bg-warning text-dark mb-2 px-3 py-1 fw-bold rounded-pill"><small>${label}</small></span>
                    ${activityDetails.image ? `<img src="${activityDetails.image}" class="activity-img mt-2" alt="${activityDetails.name}" onerror="this.remove()">` : ''}
                    <h4 class="text-white mt-3 fs-5">${activityDetails.name}</h4>
                    <p class="text-info opacity-75 mb-2">${activityDetails.tag}</p>
                    ${activityDetails.description ? `<p class="text-light fs-6 lh-lg mt-2">${activityDetails.description}</p>` : ''}
                    <a href="${activityDetails.mapsUrl}" target="_blank" rel="noopener noreferrer" class="text-info text-decoration-none">View on Map</a>
                </div>
            `;
        }

        function validateRenderedCards() {
            const activeContainer = document.getElementById('itinerary-content') || document.getElementById('itinerary-container');

            if (!activeContainer) {
                throw new Error('Container missing');
            }

            let cards = document.querySelectorAll('.day-card');

            if (cards.length === 0) {
                console.error('No cards rendered');
                return;
            }

            console.log('Cards rendered:', cards.length);

            let hasInvisibleCards = false;

            cards.forEach((card, index) => {
                const rect = card.getBoundingClientRect();

                if (rect.height === 0 || rect.width === 0) {
                    hasInvisibleCards = true;
                    console.error(`Card ${index} not visible`);
                } else {
                    console.log(`Card ${index} visible`);
                }
            });

            if (hasInvisibleCards) {
                cards.forEach(card => {
                    card.style.position = 'relative';
                    card.style.zIndex = '9999';
                    card.style.border = '2px solid red';
                });

                cards = document.querySelectorAll('.day-card');
                cards.forEach(card => {
                    if (card.parentElement !== activeContainer) {
                        activeContainer.appendChild(card);
                    }
                });
            }

            if (document.querySelectorAll('.day-card').length > 0) {
                console.log('Itinerary rendering SUCCESS');
            } else {
                console.error('Rendering FAILED');
            }
        }

        container.innerHTML = `
            <div class="text-center mb-5">
                <span class="badge bg-info text-dark mb-3 px-3 py-2 fw-bold" style="border-radius:20px; box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3);">${type} Experience</span>
                <h1 class="display-4 fw-bold text-capitalize text-white mb-3">${tripData.days || '?'} Days in ${destName}</h1>
                <p class="fs-5 text-light opacity-75">Target Budget: <span data-price="${tripData.budget || tripMeta?.budgetUsd || 0}"></span></p>
            </div>

            <div class="row g-4">
                <div class="col-lg-4 order-2 order-lg-1">
                    <div class="itinerary-card sticky-top" style="top: 100px;">
                        <h4 class="mb-3 text-info fw-bold d-flex align-items-center">
                            <svg width="20" height="20" class="me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            Overview
                        </h4>
                        <p class="text-light opacity-75 mb-5 lh-lg">${itinerary.summary || 'A beautifully curated journey specifically tailored to your preferences, blending top highlights and hidden gems.'}</p>

                        <h4 class="mb-4 text-info fw-bold d-flex align-items-center">
                            <svg width="20" height="20" class="me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>
                            Cost Breakdown
                        </h4>
                        <div class="cost-item">
                            <span class="d-flex align-items-center text-light">
                                <svg class="me-2 text-warning" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                                Stay
                            </span>
                            <span class="fw-bold fs-5 text-white" data-price="${breakdown.stay || 0}"></span>
                        </div>
                        <div class="cost-item">
                            <span class="d-flex align-items-center text-light">
                                <svg class="me-2 text-warning" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                Food
                            </span>
                            <span class="fw-bold fs-5 text-white" data-price="${breakdown.food || 0}"></span>
                        </div>
                        <div class="cost-item">
                            <span class="d-flex align-items-center text-light">
                                <svg class="me-2 text-warning" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                                Transport
                            </span>
                            <span class="fw-bold fs-5 text-white" data-price="${breakdown.transport || 0}"></span>
                        </div>
                        <div class="cost-item mb-4">
                            <span class="d-flex align-items-center text-light">
                                <svg class="me-2 text-warning" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                Activities
                            </span>
                            <span class="fw-bold fs-5 text-white" data-price="${breakdown.activities || 0}"></span>
                        </div>
                        <div class="cost-item fs-4 text-success border-top border-secondary pt-3 mt-2">
                            <span class="fw-bold">Total Estimate</span>
                            <span class="fw-bold" data-price="${totalValue}"></span>
                        </div>
                    </div>
                </div>

                <div class="col-lg-8 order-1 order-lg-2">
                    <div class="itinerary-card">
                        <h3 class="mb-4 text-white fw-bold d-flex align-items-center">
                            <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="me-2 text-warning"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                            Your Daily Plan
                        </h3>
                        <div id="itinerary-content"></div>
                    </div>
                </div>
            </div>
        `;

        const itineraryContainer = document.getElementById('itinerary-content');

        if (!itineraryContainer) {
            console.error('Container not found');
            return;
        }

        console.log('Rendering inside:', itineraryContainer);
        itineraryContainer.innerHTML = '';

        daysPlan.forEach((day, index) => {
            const dayNum = day.day || (index + 1);
            const morning = getActivityData(day, 'morning');
            const afternoon = getActivityData(day, 'afternoon');
            const evening = getActivityData(day, 'evening');
            const dayDiv = document.createElement('div');
            const activitiesMarkup = [
                renderActivityColumn('MORNING', morning),
                renderActivityColumn('AFTERNOON', afternoon),
                renderActivityColumn('EVENING', evening)
            ].filter(Boolean).join('');

            if (!activitiesMarkup) {
                return;
            }

            dayDiv.className = 'day-card';
            dayDiv.innerHTML = `
                <h4 class="text-info mb-4 border-bottom border-secondary pb-3 d-flex align-items-center">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="me-2"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    Day ${dayNum}
                </h4>
                <div class="row g-4">
                    ${activitiesMarkup}
                </div>
            `;

            console.log('Rendered Day:', day);
            console.log('Final Render Activity:', day.morningDetails);
            console.log('Appending day:', dayDiv);
            itineraryContainer.appendChild(dayDiv);
        });

        if (!itineraryContainer.children.length) {
            itineraryContainer.innerHTML = '<p>No itinerary found</p>';
        }

        window.SmartTravelCurrency?.updateAllPrices?.();

        if (itineraryContainer.children.length > 0) {
            itineraryContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }

        validateRenderedCards();
    } catch (err) {
        console.error('Error rendering itinerary:', err);
        const container = document.getElementById('itinerary-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center w-100 my-5 p-5 itinerary-card border-danger">
                    <h2 class="text-danger mb-4 fw-bold">Oops, something went wrong</h2>
                    <p class="text-light fs-5 mb-5">${err.message}</p>
                    <button class="btn btn-outline-light rounded-pill px-5 py-3" onclick="window.location.href='results.html'">Go Back</button>
                </div>
            `;
        }
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
