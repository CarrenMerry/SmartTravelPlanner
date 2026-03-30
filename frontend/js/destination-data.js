const destinationsData = {
    "Paris": {
        name: "Paris",
        country: "FRANCE",
        image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=2000",
        heroSubtitle: "Stroll through elegant avenues, landmark museums, and riverfront neighborhoods full of character.",
        description: "Paris blends monumental architecture, celebrated art, neighborhood cafes, and centuries of culture into one of the most rewarding city escapes in the world. From the Seine to Montmartre, every district offers its own texture and rhythm.",
        bestTime: "April to June & September to October",
        budget: "$1,800 - $4,500",
        locations: "Eiffel Tower, Louvre, Montmartre, Le Marais",
        hotels: [
            {
                name: "Le Bristol Paris",
                image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800",
                price: "$980",
                type: "Luxury"
            },
            {
                name: "Shangri-La Paris",
                image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=800",
                price: "$1,150",
                type: "Ultra Luxury"
            },
            {
                name: "Hotel Providence",
                image: "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&q=80&w=800",
                price: "$620",
                type: "Boutique"
            }
        ],
        activities: [
            {
                name: "Seine River Cruise",
                image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=800",
                description: "See the city’s grand landmarks from the water at golden hour."
            },
            {
                name: "Louvre Visit",
                image: "https://images.unsplash.com/photo-1565099824688-e93eb20fe622?auto=format&fit=crop&q=80&w=800",
                description: "Spend an afternoon among some of the world’s most famous masterpieces."
            },
            {
                name: "Montmartre Walk",
                image: "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&q=80&w=800",
                description: "Wander artistic streets, hilltop stairways, and lively cafe terraces."
            }
        ]
    },
    "Phi Phi Islands": {
        name: "Phi Phi Islands",
        country: "THAILAND",
        image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=2000",
        heroSubtitle: "Experience the perfect blend of ancient temples, tropical beaches, and bustling night markets in the Land of Smiles.",
        description: "The Phi Phi Islands are some of the loveliest in Southeast Asia. Just a 45-minute speedboat trip or a 90-minute ferry ride from either Phuket or Krabi, these picture-postcard islands offer the ultimate tropical getaway. Classic white sandy beaches, exotic marine life, and limestone mountains with turquoise waters await.",
        bestTime: "November to April",
        budget: "$800 - $2,000",
        locations: "Maya Bay, Monkey Beach, Phi Phi Don",
        hotels: [
            {
                name: "Phi Phi Island Village",
                image: "img/destinations/phiphi-resort.jpg",
                price: "$280",
                type: "Resort"
            },
            {
                name: "Zeavola Resort",
                image: "img/destinations/phiphi-zeavola.jpg",
                price: "$340",
                type: "Luxury"
            }
        ],
        activities: [
            {
                name: "Island Hopping",
                image: "img/destinations/phiphi-island-hopping.jpg",
                description: "Visit Maya Bay and Bamboo Island by longtail boat."
            },
            {
                name: "Snorkeling Safari",
                image: "img/destinations/phiphi-snorkeling.jpg",
                description: "Swim with colorful tropical fish and reef sharks."
            }
        ]
    },
    "Tokyo": {
        name: "Tokyo",
        country: "JAPAN",
        image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=2000",
        heroSubtitle: "Step into a city where neon skylines, historic shrines, and food culture all collide brilliantly.",
        description: "Tokyo offers an unmatched mix of precision, energy, and discovery. One moment you are in a lantern-lit alley or temple garden, the next you are inside a dazzling district full of design, shopping, and late-night dining.",
        bestTime: "March to May & October to November",
        budget: "$1,700 - $4,800",
        locations: "Shibuya, Asakusa, Shinjuku, Ginza",
        hotels: [
            {
                name: "Aman Tokyo",
                image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=800",
                price: "$1,250",
                type: "Ultra Luxury"
            },
            {
                name: "Hoshinoya Tokyo",
                image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800",
                price: "$940",
                type: "Luxury Ryokan"
            }
        ],
        activities: [
            {
                name: "Shibuya Crossing Visit",
                image: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&q=80&w=800",
                description: "Experience one of the world’s most iconic urban intersections in motion."
            },
            {
                name: "Senso-ji Temple Walk",
                image: "https://images.unsplash.com/photo-1526481280695-3c4691f56e82?auto=format&fit=crop&q=80&w=800",
                description: "Explore Tokyo’s historic temple quarter and its lively traditional streets."
            },
            {
                name: "Tokyo Food Tour",
                image: "https://images.unsplash.com/photo-1554797589-7241bb691973?auto=format&fit=crop&q=80&w=800",
                description: "Taste sushi, ramen, and izakaya classics across the city’s most exciting neighborhoods."
            }
        ]
    },
    "Kyoto": {
        name: "Kyoto",
        country: "JAPAN",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=2000",
        heroSubtitle: "Immerse yourself in a world where cutting-edge technology seamlessly meets centuries-old ancient traditions.",
        description: "Kyoto is old Japan writ large: atmospheric temples, sublime gardens, traditional teahouses and geisha scurrying to secret liaisons. While much of the city is modern, the sheer abundance of traditional sites is staggering. Kyoto is the cultural heart of Japan and a must-visit for anyone seeking a deeper understanding of the country.",
        bestTime: "March to May & October to November",
        budget: "$1,500 - $4,000",
        locations: "Gion, Arashiyama, Kiyomizu-dera",
        hotels: [
            {
                name: "Ritz-Carlton Kyoto",
                image: "img/destinations/kyoto-hotel.jpg",
                price: "$1,100",
                type: "Luxury"
            },
            {
                name: "Hoshinoya Kyoto",
                image: "img/destinations/kyoto-riverside.jpg",
                price: "$950",
                type: "Traditional Ryokan"
            }
        ],
        activities: [
            {
                name: "Bamboo Forest Walk",
                image: "img/destinations/kyoto-bamboo.jpg",
                description: "Stroll through the towering bamboo stalks of Arashiyama."
            },
            {
                name: "Tea Ceremony",
                image: "img/destinations/kyoto-tea.jpg",
                description: "Learn the intricate art of preparing matcha from a master."
            }
        ]
    }
};
