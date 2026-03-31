document.addEventListener('DOMContentLoaded', () => {
    initDestinationPage();
});

function initDestinationPage() {
    const params = new URLSearchParams(window.location.search);
    const placeKey = params.get('place');

    if (!placeKey || !destinationsData[placeKey]) {
        showErrorState();
        return;
    }

    const data = destinationsData[placeKey];
    populateContent(data, placeKey);
    setupAnimations();
    setupNavbarScroll();
    setupSmoothScroll();
    setupSectionSpy();
}

function populateContent(data, key) {
    // Hero
    const heroBg = document.getElementById('hero-bg');
    heroBg.style.backgroundImage = `url('${data.image}')`;
    setTimeout(() => heroBg.classList.add('active'), 100);

    document.getElementById('dest-title').innerText = data.name;
    document.getElementById('dest-country').innerText = data.country;
    document.getElementById('dest-hero-subtitle').innerText = data.heroSubtitle;

    // Overview
    document.getElementById('dest-full-description').innerText = data.description;
    document.getElementById('dest-best-time').innerText = data.bestTime;
    document.getElementById('dest-budget').innerText = data.budget;
    document.getElementById('dest-overview-img').src = data.image;

    // Hotels
    const hotelsGrid = document.getElementById('hotels-grid');
    hotelsGrid.innerHTML = data.hotels.map(hotel => `
        <div class="col-md-6 col-lg-4">
            <div class="hotel-card">
                <img src="${hotel.image}" class="card-img-top" alt="${hotel.name}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h4 class="mb-0 fs-5">${hotel.name}</h4>
                        <span class="type-badge">${hotel.type}</span>
                    </div>
                    <div class="price-tag">${hotel.price} <small class="text-white-50 fw-normal fs-6">/ night</small></div>
                </div>
            </div>
        </div>
    `).join('');

    // Activities
    const activitiesGrid = document.getElementById('activities-grid');
    activitiesGrid.innerHTML = data.activities.map(activity => `
        <div class="col-md-6">
            <div class="activity-card d-flex align-items-center">
                <div class="col-4 h-100">
                    <img src="${activity.image}" class="h-100 w-100" style="object-fit:cover;" alt="${activity.name}">
                </div>
                <div class="col-8 p-4">
                    <h4 class="fs-5 mb-2">${activity.name}</h4>
                    <p class="text-white-50 small mb-0">${activity.description}</p>
                </div>
            </div>
        </div>
    `).join('');

    // CTA
    document.getElementById('cta-dest-name').innerText = data.name;
    document.getElementById('main-cta-btn').href = `plan.html?destination=${encodeURIComponent(data.name)}`;
}

function setupAnimations() {
    const observerOptions = {
        root: null,
        threshold: 0.1,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section-fade').forEach(el => observer.observe(el));
}

function setupNavbarScroll() {
    const detailNav = document.getElementById('detail-section-nav');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            detailNav?.classList.add('scrolled');
        } else {
            detailNav?.classList.remove('scrolled');
        }
    });
}

function setupSmoothScroll() {
    document.querySelectorAll('.detail-nav-link[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function setupSectionSpy() {
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const navLinks = Array.from(document.querySelectorAll('.detail-section-nav .detail-nav-link'));

    if (!sections.length || !navLinks.length) return;

    const setActiveLink = activeId => {
        navLinks.forEach(link => {
            const isActive = link.getAttribute('href') === `#${activeId}`;
            link.classList.toggle('active', isActive);
        });
    };

    function updateActiveSection() {
        const detailNavHeight = document.getElementById('detail-section-nav')?.offsetHeight || 0;
        const viewportMidpoint = window.scrollY + detailNavHeight + (window.innerHeight * 0.35);
        const nearBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 40);

        if (nearBottom) {
            setActiveLink(sections[sections.length - 1].id);
            return;
        }

        if (viewportMidpoint < sections[0].offsetTop) {
            setActiveLink(null);
            return;
        }

        let activeSection = sections[0];

        sections.forEach(section => {
            if (viewportMidpoint >= section.offsetTop) {
                activeSection = section;
            }
        });

        setActiveLink(activeSection.id);
    }

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection);
    window.addEventListener('resize', updateActiveSection);
}

function showErrorState() {
    document.body.innerHTML = `
        <div class="container text-center py-5 mt-5">
            <h1 class="display-1 fw-bold text-white">404</h1>
            <p class="fs-3 text-white-50">Destination not found or invalid URL.</p>
            <a href="index.html" class="btn-explore mt-4">Back to Home</a>
        </div>
    `;
}
