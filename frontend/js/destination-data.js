const destinationsData = {
    "Bali": {
        name: "Nusa Penida, Bali",
        country: "INDONESIA",
        image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=2000",
        heroSubtitle: "Discover the emerald of the equator, endless pristine beaches, and vibrant cultural heritage spanning thousands of islands.",
        description: "Bali is a land that seems to have a magnet at its very heart. It is a feeling that is difficult to understand unless you have experienced it. It is one of those places where you can't help but feel like you belong. From lush rice terraces to world-class surfing, Bali offers a spiritual and tropical escape like nowhere else on Earth.",
        bestTime: "April to October",
        budget: "$1,200 - $3,000",
        locations: "Ubud, Kuta, Seminyak, Nusa Dua",
        hotels: [
            {
                name: "Ayana Resort",
                image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800",
                price: "$350",
                type: "Luxury"
            },
            {
                name: "Viceroy Bali",
                image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=800",
                price: "$520",
                type: "Ultra Luxury"
            },
            {
                name: "Ubud Hanging Gardens",
                image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=800",
                price: "$410",
                type: "Eco Luxury"
            }
        ],
        activities: [
            {
                name: "Scuba Diving",
                image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800",
                description: "Explore the vibrant marine life of the Coral Triangle."
            },
            {
                name: "Rice Terrace Trekking",
                image: "img/destinations/bali-rice.jpg",
                description: "Walk through the iconic Tegallalang terraces."
            },
            {
                name: "Uluwatu Temple Visit",
                image: "img/destinations/bali-temple.jpg",
                description: "Witness a traditional Kecak Fire Dance at sunset."
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
    "Male Atoll": {
        name: "Male Atoll",
        country: "MALDIVES",
        image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=2000",
        heroSubtitle: "Relax in luxurious overwater bungalows surrounded by crystal clear turquoise waters and vibrant coral reefs.",
        description: "The Maldives is a nation of islands in the Indian Ocean cast away from the rest of the world. It is the perfect destination for honeymooners and sun-seekers alike. Each resort is its own private island, promising complete seclusion and ultimate luxury amidst the bluest waters you've ever seen.",
        bestTime: "December to April",
        budget: "$3,000 - $7,000",
        locations: "Male, Maafushi, Ari Atoll",
        hotels: [
            {
                name: "Soneva Fushi",
                image: "img/destinations/maldives-villa.jpg",
                price: "$1,200",
                type: "Ultra Luxury"
            },
            {
                name: "Anantara Dhigu",
                image: "img/destinations/maldives-anantara.jpg",
                price: "$850",
                type: "Resort"
            }
        ],
        activities: [
            {
                name: "Sunset Cruise",
                image: "img/destinations/maldives-sunset.jpg",
                description: "Watch dolphins leap in the golden glow of the Indian Ocean."
            },
            {
                name: "Sandbank Picnic",
                image: "img/destinations/maldives-picnic.jpg",
                description: "Enjoy a private lunch on a secluded patch of white sand."
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
