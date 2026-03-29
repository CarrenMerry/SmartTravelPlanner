document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

const mockUpcomingTrips = [
    {
        destination: "Goa, India",
        duration: "3 Days",
        budget: "₹20,000",
        status: "Upcoming",
        image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80&w=400"
    },
    {
        destination: "Malé Atoll, Maldives",
        duration: "7 Days",
        budget: "$5,000",
        status: "Planning",
        image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=400"
    }
];

const mockSavedPlans = [
    {
        title: "Bali Adventure",
        type: "Adventure",
        image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=400"
    },
    {
        title: "Kyoto Retreat",
        type: "Relaxation",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=400"
    }
];

const mockActivities = [
    {
        text: "You searched for flights to Bali",
        time: "2 hours ago",
        icon: `<polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>`
    },
    {
        text: "You planned a trip to Goa",
        time: "1 day ago",
        icon: `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>`
    },
    {
        text: "Saved Kyoto Itinerary",
        time: "3 days ago",
        icon: `<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>`
    }
];

function initDashboard() {
    checkAuth();
    renderUpcomingTrips();
    renderSavedPlans();
    renderActivities();
    setupLogout();

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
}

function checkAuth() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        document.getElementById('welcomeTitle').textContent = `Welcome, ${user.name}`;
        document.getElementById('welcomeAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`;
    } catch (e) {
        window.location.href = 'login.html';
    }
}

function renderUpcomingTrips() {
    const container = document.getElementById('upcomingTripsContainer');
    container.innerHTML = mockUpcomingTrips.map(trip => `
        <div class="trip-card section-fade">
            <img src="${trip.image}" alt="${trip.destination}" class="trip-img">
            <div class="trip-details">
                <h4>${trip.destination}</h4>
                <div class="trip-meta">
                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${trip.duration}</span>
                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> ${trip.budget}</span>
                </div>
            </div>
            <div class="status-badge ${trip.status === 'Upcoming' ? 'status-upcoming' : 'status-completed'}">${trip.status}</div>
        </div>
    `).join('');
}

function renderSavedPlans() {
    const container = document.getElementById('savedPlansContainer');
    container.innerHTML = mockSavedPlans.map(plan => `
        <div class="plan-card section-fade">
            <img src="${plan.image}" alt="${plan.title}">
            <div class="plan-overlay">
                <div class="plan-type">${plan.type}</div>
                <h4 class="m-0 fs-6 fw-bold text-white">${plan.title}</h4>
            </div>
        </div>
    `).join('');
}

function renderActivities() {
    const container = document.getElementById('activityContainer');
    container.innerHTML = mockActivities.map(activity => `
        <div class="activity-item section-fade">
            <div class="activity-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${activity.icon}
                </svg>
            </div>
            <div class="activity-details">
                <p>${activity.text}</p>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }
}
