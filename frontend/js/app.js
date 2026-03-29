let destinations = [];
let currentIndex = 0;
let autoSlideInterval;

// DOM Elements
const bgContainer = document.getElementById('bg-container');
const heroTextContainer = document.getElementById('hero-text-container');
const carouselContainer = document.getElementById('carousel-container');
const progressIndicator = document.getElementById('progress-indicator');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const navbar = document.querySelector('.navbar');

// Fetch dynamic data from the backend API
async function fetchDestinations() {
    try {
        const res = await fetch('http://localhost:5000/api/destinations');
        const data = await res.json();
        
        // Map backend collection to frontend structure with fallbacks for older DB entries
        let fetchedDests = data.map((d, index) => ({
            id: index,
            title: d.country || d.name,
            subtitle: d.description || "Amazing destination waiting to be explored.",
            image: d.image || "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=2000",
            location: d.name,
            rating: d.rating || 4.5
        }));
        
        // Static premium data for filling unique items so UI doesn't break if DB is sparse
        const premiumDestinations = [
            {
                title: "INDONESIA",
                subtitle: "Discover the emerald of the equator, endless pristine beaches, and vibrant cultural heritage spanning thousands of islands.",
                image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=2000",
                location: "Nusa Penida, Bali",
                rating: 4.9
            },
            {
                title: "THAILAND",
                subtitle: "Experience the perfect blend of ancient temples, tropical beaches, and bustling night markets in the Land of Smiles.",
                image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=2000",
                location: "Phi Phi Islands",
                rating: 4.8
            },
            {
                title: "MALDIVES",
                subtitle: "Relax in luxurious overwater bungalows surrounded by crystal clear turquoise waters and vibrant coral reefs.",
                image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=2000",
                location: "Male Atoll",
                rating: 5.0
            },
            {
                title: "JAPAN",
                subtitle: "Immerse yourself in a world where cutting-edge technology seamlessly meets centuries-old ancient traditions.",
                image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=2000",
                location: "Kyoto",
                rating: 4.9
            }
        ];

        destinations = [...fetchedDests];
        let pIndex = 0;
        
        // Guarantee at least 4 UNIQUE items to preserve the multi-card overlapping slider animation
        while (destinations.length < 4) {
            destinations.push(premiumDestinations[pIndex % premiumDestinations.length]);
            pIndex++;
        }
        
        // Re-assign IDs properly
        destinations.forEach((d, i) => d.id = i);
        
        if (destinations.length > 0) {
            initUI();
        }
    } catch (err) {
        console.error("Error fetching destinations. Make sure the Node server is running on port 5000.", err);
    }
}

// Initialize the UI elements
function initUI() {
    renderBackgrounds();
    renderHeroText();
    renderCards();
    renderProgress();
    updateUI();
    
    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', () => nextSlide());
    if (prevBtn) prevBtn.addEventListener('click', () => prevSlide());
    
    const wrapper = document.querySelector('.hero-cards-wrapper');
    if (wrapper) {
        wrapper.addEventListener('mouseenter', pauseAutoSlide);
        wrapper.addEventListener('mouseleave', startAutoSlide);
    }
    
    // Navbar scroll effect & Active link highlighting
    window.addEventListener('scroll', () => {
        // Transparent to solid background on scroll
        if(window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link highlighting
        const sections = document.querySelectorAll('section');
        const scrollPos = window.scrollY + navbar.offsetHeight + 10;
        
        sections.forEach(section => {
            if (scrollPos >= section.offsetTop && scrollPos < (section.offsetTop + section.offsetHeight)) {
                document.querySelectorAll('.navbar-nav a.nav-link').forEach(a => {
                    a.classList.remove('active');
                    if (a.getAttribute('href') === `#${section.getAttribute('id')}`) {
                        a.classList.add('active');
                    }
                });
            }
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a.nav-link[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetSection.getBoundingClientRect().top + window.scrollY - navHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Smooth fade-in animation on scroll (Task 5)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.fade-in').forEach(element => {
        observer.observe(element);
    });

    startAutoSlide();
}

function renderBackgrounds() {
    bgContainer.innerHTML = destinations.map((dest, index) => `
        <div class="bg-layer" id="bg-${index}" style="background-image: url('${dest.image}')"></div>
    `).join('');
}

function renderHeroText() {
    heroTextContainer.innerHTML = destinations.map((dest, index) => `
        <div class="text-layer" id="text-${index}">
            <h1 class="display-1 fw-bold text-white hero-title">${dest.title}</h1>
            <p class="hero-subtitle text-light mt-3 mb-4">${dest.subtitle}</p>
            <a href="plan.html" class="btn-explore text-decoration-none">
                Plan a Trip <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ms-2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
        </div>
    `).join('');
}

function renderCards() {
    carouselContainer.innerHTML = ''; // reset first
    destinations.forEach((dest, index) => {
        const card = `
        <div class="destination-card" id="card-${index}" onclick="goToSlide(${index})">
            <img src="${dest.image}" alt="${dest.location}" class="card-img">
            <div class="card-glass-overlay">
                <div class="d-flex justify-content-between align-items-end">
                    <div>
                        <h5 class="card-location mb-1">${dest.location}</h5>
                        <p class="card-country mb-0">${dest.title}</p>
                    </div>
                    <div class="rating-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--bs-warning)" stroke="var(--bs-warning)" stroke-width="2" class="me-1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        ${dest.rating}
                    </div>
                </div>
            </div>
        </div>`;
        carouselContainer.innerHTML += card;
    });
}

function renderProgress() {
    progressIndicator.innerHTML = destinations.map((_, index) => `
        <div class="dot" id="dot-${index}" onclick="goToSlide(${index})"></div>
    `).join('');
}

function updateUI() {
    const total = destinations.length;
    
    document.querySelectorAll('.bg-layer').forEach((bg, index) => {
        bg.classList.toggle('active', index === currentIndex);
    });
    
    // Update hero section background dynamically as requested
    const heroSection = document.querySelector('.hero-section');
    if (heroSection && destinations[currentIndex]) {
        heroSection.style.backgroundImage = `url(${destinations[currentIndex].image})`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
        heroSection.style.backgroundRepeat = 'no-repeat';
        heroSection.style.transition = 'background-image 0.5s ease-in-out';
    }

    document.querySelectorAll('.text-layer').forEach((txt, index) => {
        txt.classList.toggle('active', index === currentIndex);
    });

    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });

    document.querySelectorAll('.destination-card').forEach((card, index) => {
        // Reset classes
        card.className = 'destination-card';

        if (index === currentIndex) {
            card.classList.add('active');
        } else if (index === (currentIndex + 1) % total) {
            card.classList.add('next-1');
        } else if (index === (currentIndex + 2) % total) {
            card.classList.add('next-2');
        } else {
            card.classList.add('hidden');
        }
    });
}

function nextSlide() {
    currentIndex = (currentIndex + 1) % destinations.length;
    updateUI();
}

function prevSlide() {
    currentIndex = (currentIndex - 1 + destinations.length) % destinations.length;
    updateUI();
}

function goToSlide(index) {
    currentIndex = index;
    updateUI();
    
    // Reset timer on manual jump
    startAutoSlide();
}

function startAutoSlide() {
    clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(nextSlide, 5000); // 5s interval matching Awwwards-style
}

function pauseAutoSlide() {
    clearInterval(autoSlideInterval);
}

// Run fetch Destenations when DOM is loaded
document.addEventListener('DOMContentLoaded', fetchDestinations);
