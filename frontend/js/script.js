const destinations = [
    {
        name: "Paris",
        country: "FRANCE",
        image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=2000",
        description: "Explore timeless boulevards, iconic landmarks, and world-class art in one of Europe’s most celebrated cities.",
        rating: "4.9"
    },
    {
        name: "Phi Phi Islands",
        country: "THAILAND",
        image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=2000",
        description: "Experience the perfect blend of ancient temples, tropical beaches, and bustling night markets in the Land of Smiles.",
        rating: "4.8"
    },
    {
        name: "Tokyo",
        country: "JAPAN",
        image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=2000",
        description: "Experience neon-lit districts, historic temples, and meticulous food culture in Japan’s dynamic capital.",
        rating: "5.0"
    },
    {
        name: "Kyoto",
        country: "JAPAN",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=2000",
        description: "Immerse yourself in a world where cutting-edge technology seamlessly meets centuries-old ancient traditions.",
        rating: "4.9"
    }
];

let currentIndex = 0;
let autoSlideInterval;
const SLIDE_DURATION = 3500; // 3.5 seconds
let isMoving = false;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Restore state from last viewed destination
    const savedIndex = localStorage.getItem('smartTravel_currentIndex');
    if (savedIndex !== null) {
        currentIndex = parseInt(savedIndex);
    }

    renderBackgrounds();
    renderHeroText();
    renderCards();
    renderProgress();
    updateUI(true);
    checkAuthStatus();

    // Navbar Scroll effect and ScrollSpy
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // Active link highlighting - find the current active section
        const sections = document.querySelectorAll('main, section');
        let currentId = '';
        const navHeight = nav.offsetHeight;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - navHeight - 100; // Offset for better detection
            if (window.scrollY >= sectionTop) {
                currentId = section.getAttribute('id');
            }
        });

        // Force last section to be active if at the bottom of the page
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
            const lastSection = Array.from(sections).filter(s => s.id).pop();
            if (lastSection) currentId = lastSection.id;
        }

        // Update all links
        document.querySelectorAll('.navbar-nav a.nav-link').forEach(a => {
            const href = a.getAttribute('href');
            a.classList.remove('active', 'text-white', 'fw-medium');
            a.classList.add('text-white-50');
            
            if (currentId && href === `#${currentId}`) {
                a.classList.remove('text-white-50');
                a.classList.add('active', 'text-white', 'fw-medium');
            } else if (!currentId && href === '#') {
                a.classList.remove('text-white-50');
                a.classList.add('active', 'text-white', 'fw-medium');
            }
        });
    });


    // Native smooth scroll — GPU-accelerated, handled by the browser compositor
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            e.preventDefault();

            if (targetId === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const target = document.querySelector(targetId);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Intersection Observer for scroll animations
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section-fade').forEach(el => observer.observe(el));

    const carouselContainer = document.getElementById('carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', pauseAutoSlide);
        carouselContainer.addEventListener('mouseleave', startAutoSlide);
    }

    startAutoSlide();

    // Login Popup Logic
    const loginPopup = document.getElementById('loginPopup');
    const closeLoginPopup = document.getElementById('closeLoginPopup');
    
    if (loginPopup && closeLoginPopup) {
        if (!localStorage.getItem('hideSmartTravelLoginPopup')) {
            setTimeout(() => {
                loginPopup.classList.add('show');
            }, 4000);
        }

        closeLoginPopup.addEventListener('click', () => {
            loginPopup.classList.remove('show');
            localStorage.setItem('hideSmartTravelLoginPopup', 'true');
        });
    }
}

function renderBackgrounds() {
    const bgContainer = document.getElementById('bg-container');
    bgContainer.innerHTML = destinations.map((dest, index) => 
        `<div class="bg-layer" id="bg-${index}" style="background-image: url('${dest.image}')"></div>`
    ).join('');
}

function renderHeroText() {
    const heroTextContainer = document.getElementById('hero-text-container');
    heroTextContainer.innerHTML = destinations.map((dest, index) => {
        // Extract first word of destination name for the button
        const destinationMainName = dest.name.split(',')[0];
        return `
            <div class="text-layer" id="text-${index}">
                <h1 class="hero-title">${dest.country}</h1>
                <p class="hero-subtitle">${dest.description}</p>
                <button class="btn-explore" onclick="navigateToDestination('${dest.name}')">
                    Plan Trip to ${destinationMainName}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ms-2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
}

function renderCards() {
    const carouselContainer = document.getElementById('carousel-container');
    carouselContainer.innerHTML = destinations.map((dest, index) => `
        <div class="destination-card" id="card-${index}" onclick="handleCardClick(${index}, '${dest.name}')">
            <img src="${dest.image}" alt="${dest.name}" class="card-img">
            <div class="card-glass-overlay">
                <div class="card-info-wrapper">
                    <div>
                        <h4 class="card-location">${dest.name}</h4>
                        <p class="card-country">${dest.country}</p>
                    </div>
                    <div class="rating-badge">
                        <span>⭐</span> ${dest.rating}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderProgress() {
    const progressContainer = document.getElementById('progress-indicator');
    progressContainer.innerHTML = destinations.map((_, index) => `
        <div class="progress-dot" onclick="goToSlide(${index})">
            <div class="dot-inner"></div>
        </div>
    `).join('');
}

function updateUI(initial = false) {
    const total = destinations.length;

    // Backgrounds
    document.querySelectorAll('.bg-layer').forEach((bg, index) => {
        if (index === currentIndex) {
            bg.classList.add('active');
        } else {
            bg.classList.remove('active');
        }
    });

    // Texts
    document.querySelectorAll('.text-layer').forEach((text, index) => {
        if (index === currentIndex) {
            text.classList.add('active');
            text.style.pointerEvents = 'auto'; // allow clicking button
        } else {
            text.classList.remove('active');
            text.style.pointerEvents = 'none';
        }
    });

    // Progress Dots
    document.querySelectorAll('.progress-dot').forEach((dot, index) => {
        if (index === currentIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });

    // Cards
    document.querySelectorAll('.destination-card').forEach((card, index) => {
        card.classList.remove('active', 'next-1', 'prev-1', 'hidden');

        if (index === currentIndex) {
            card.classList.add('active');
        } else if (index === (currentIndex + 1) % total) {
            card.classList.add('next-1');
        } else if (index === (currentIndex - 1 + total) % total) {
            card.classList.add('prev-1');
        } else {
            card.classList.add('hidden');
        }
    });
}

function nextSlide(manual = true) {
    if (isMoving) return;
    isMoving = true;
    currentIndex = (currentIndex + 1) % destinations.length;
    updateUI();
    setTimeout(() => { isMoving = false; }, 800);
    if (manual) {
        pauseAutoSlide();
        startAutoSlide();
    }
}

function prevSlide(manual = true) {
    if (isMoving) return;
    isMoving = true;
    currentIndex = (currentIndex - 1 + destinations.length) % destinations.length;
    updateUI();
    setTimeout(() => { isMoving = false; }, 800);
    if (manual) {
        pauseAutoSlide();
        startAutoSlide();
    }
}

function goToSlide(index) {
    if (index === currentIndex) return;
    currentIndex = index;
    updateUI();
    // Reset timer
    pauseAutoSlide();
    startAutoSlide();
}

/**
 * Handle navigation to destination detail page (hero slider button)
 */
function navigateToDestination(name) {
    const isLoggedIn = localStorage.getItem('user');
    if (!isLoggedIn) {
        sessionStorage.setItem('pendingDestination', name);
        window.location.href = 'login.html';
        return;
    }
    window.location.href = `plan.html?destination=${encodeURIComponent(name)}`;
}

/**
 * Handle grid/card click — goes to destination detail page
 */
function handleDestinationClick(destination) {
    localStorage.setItem('smartTravel_currentIndex', currentIndex.toString());

    const isLoggedIn = localStorage.getItem('user');
    if (!isLoggedIn) {
        sessionStorage.setItem('pendingDestination', destination);
        window.location.href = 'login.html';
        return;
    }

    window.location.href = `destination.html?place=${encodeURIComponent(destination)}`;
}

function searchDestination() {
    const value = document.getElementById('destinationSearch')?.value.trim();
    if (!value) {
        // Shake the input to hint that it's required
        const input = document.getElementById('destinationSearch');
        input.classList.add('input-shake');
        setTimeout(() => input.classList.remove('input-shake'), 600);
        return;
    }

    const isLoggedIn = localStorage.getItem('user');
    if (!isLoggedIn) {
        sessionStorage.setItem('pendingDestination', value);
        window.location.href = 'login.html';
        return;
    }

    window.location.href = `plan.html?destination=${encodeURIComponent(value)}`;
}

/**
 * Handle card click: if active, navigate; if not, slide to it.
 */
function handleCardClick(index, name) {
    if (isMoving) return;
    if (index === currentIndex) {
        handleDestinationClick(name);
    } else {
        goToSlide(index);
    }
}

function startAutoSlide() {
    clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(() => nextSlide(false), SLIDE_DURATION);
}

function pauseAutoSlide() {
    clearInterval(autoSlideInterval);
}

function checkAuthStatus() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (!user || !user.name) {
                 // Invalid user object, clear it
                 localStorage.removeItem('user');
                 return;
            }

            const authSection = document.querySelector('.auth-buttons');
            if (authSection) {
                authSection.classList.remove('auth-buttons');
                authSection.classList.add('profile-section');
                authSection.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div data-currency-mount class="me-3"></div>
                        <span class="text-white me-3 d-none d-lg-block">Welcome, ${user.name}</span>
                        <div class="dropdown">
                            <a href="#" class="avatar-circle d-block text-decoration-none dropdown-toggle no-caret" data-bs-toggle="dropdown">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff" alt="${user.name}" class="img-fluid rounded-circle" style="width: 40px; height: 40px;">
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end bg-dark border-secondary mt-2 shadow">
                                <li><a class="dropdown-item text-white hover-blue" href="dashboard.html">Dashboard</a></li>
                                <li><hr class="dropdown-divider border-secondary"></li>
                                <li><a class="dropdown-item text-danger" href="#" id="logoutBtn">Logout</a></li>
                            </ul>
                        </div>
                    </div>
                `;

                window.SmartTravelCurrency?.initCurrencySelector();

                // Add Logout Event
                document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('user');
                    window.location.reload();
                });
            }
            
            // Prevent login popup if user is logged in
            localStorage.setItem('hideSmartTravelLoginPopup', 'true');
        } catch (e) {
            console.error("Error parsing user data", e);
            localStorage.removeItem('user');
        }
    }
}


