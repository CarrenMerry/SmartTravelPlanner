const axios = require('axios');
const Destination = require('../models/Destination');
const Activity = require('../models/Activity');
const {
    getAttractionsByPlace,
    validateDestination: validateOpenTripDestination,
    MIN_VALID_ATTRACTIONS
} = require('../services/opentrip.service');
const { getCachedPexelsImage } = require('../services/pexels.service');
const curatedDestinations = require('../data/curatedDestinations');

const ITINERARY_TYPES = ['Adventure', 'Relaxation', 'Cultural'];
const WIKIPEDIA_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';

const CATEGORY_RULES = {
    adventure: ['hiking', 'beach', 'mountain', 'sport', 'natural'],
    relaxation: ['park', 'garden', 'scenic', 'viewpoint'],
    cultural: ['museum', 'architecture', 'historic', 'church', 'temple']
};

function normalizeDays(days) {
    const parsed = parseInt(days, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
}

function normalizeBudget(budget) {
    const parsed = parseFloat(budget);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
}

function roundCurrency(value) {
    return Number(value.toFixed(2));
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function getPlaceKey(place) {
    if (!place || typeof place !== 'object') {
        return '';
    }

    if (place.xid) {
        return String(place.xid).trim();
    }

    const name = String(place.name || '').trim().toLowerCase();
    const kinds = String(place.kinds || '').trim().toLowerCase();
    return `${name}::${kinds}`.trim();
}

function kindsScore(place, type) {
    const kinds = typeof place?.kinds === 'string' ? place.kinds.toLowerCase() : '';
    const keywords = CATEGORY_RULES[type] || [];

    if (!kinds) {
        return 0;
    }

    return keywords.reduce((score, keyword) => (
        kinds.includes(keyword) ? score + 1 : score
    ), 0);
}

function hashString(value) {
    const input = String(value || '');
    let hash = 2166136261;

    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

function categorize(place) {
    const kinds = String(place?.kinds || '').toLowerCase();

    if (kinds.includes('museum') || kinds.includes('historic')) {
        return 'cultural';
    }

    if (kinds.includes('park') || kinds.includes('nature')) {
        return 'relaxation';
    }

    return 'adventure';
}

function splitPlacesByKinds(places = []) {
    const adventurePlaces = [];
    const relaxationPlaces = [];
    const culturalPlaces = [];
    const otherPlaces = [];

    places.forEach(place => {
        const category = categorize(place);

        if (category === 'adventure') {
            adventurePlaces.push(place);
            return;
        }

        if (category === 'relaxation') {
            relaxationPlaces.push(place);
            return;
        }

        if (category === 'cultural') {
            culturalPlaces.push(place);
            return;
        }

        otherPlaces.push(place);
    });

    return {
        adventurePlaces,
        relaxationPlaces,
        culturalPlaces,
        otherPlaces
    };
}

function shuffleInPlace(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }

    return items;
}

function uniqueByName(places = []) {
    const seen = new Set();

    return places.filter(place => {
        const key = getPlaceKey(place).toLowerCase();
        if (!key.trim() || seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function isValidPlace(place) {
    return Boolean(
        place &&
        typeof place.name === 'string' &&
        place.name.trim() &&
        place.name !== 'Unknown Attraction'
    );
}

function normalizeDestinationKey(destination) {
    return String(destination || '')
        .trim()
        .toLowerCase()
        .replace(/[^\w\s,]/g, ' ')
        .replace(/\s*,\s*/g, ' ')
        .replace(/\s+/g, ' ');
}

function titleCaseDestination(value) {
    return String(value || '')
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

function levenshteinDistance(a, b) {
    const left = String(a || '');
    const right = String(b || '');

    if (!left) return right.length;
    if (!right) return left.length;

    const matrix = Array.from({ length: left.length + 1 }, (_, row) => (
        Array.from({ length: right.length + 1 }, (_, col) => (
            row === 0 ? col : (col === 0 ? row : 0)
        ))
    ));

    for (let row = 1; row <= left.length; row += 1) {
        for (let col = 1; col <= right.length; col += 1) {
            const cost = left[row - 1] === right[col - 1] ? 0 : 1;
            matrix[row][col] = Math.min(
                matrix[row - 1][col] + 1,
                matrix[row][col - 1] + 1,
                matrix[row - 1][col - 1] + cost
            );
        }
    }

    return matrix[left.length][right.length];
}

function similarityScore(a, b) {
    const left = normalizeDestinationKey(a);
    const right = normalizeDestinationKey(b);

    if (!left || !right) {
        return 0;
    }

    if (left === right) {
        return 1;
    }

    if (left.includes(right) || right.includes(left)) {
        return Math.min(left.length, right.length) / Math.max(left.length, right.length);
    }

    const distance = levenshteinDistance(left, right);
    return 1 - (distance / Math.max(left.length, right.length));
}

async function getDestinationCandidates() {
    const dbDestinations = await Destination.find({}, { name: 1, country: 1, image: 1 }).lean();
    const curatedCandidates = Object.keys(curatedDestinations).map(key => ({
        name: titleCaseDestination(key),
        country: null,
        image: null
    }));

    const seen = new Set();

    return [...dbDestinations, ...curatedCandidates].filter(destination => {
        const normalized = normalizeDestinationKey(destination.name);
        if (!normalized || seen.has(normalized)) {
            return false;
        }

        seen.add(normalized);
        return true;
    });
}

async function findBestDestinationCandidate(query) {
    const normalizedQuery = normalizeDestinationKey(query);

    if (!normalizedQuery) {
        return null;
    }

    const candidates = await getDestinationCandidates();
    const ranked = candidates
        .map(candidate => ({
            ...candidate,
            score: similarityScore(normalizedQuery, candidate.name)
        }))
        .filter(candidate => candidate.score >= 0.55)
        .sort((left, right) => right.score - left.score);

    return ranked[0] || null;
}

async function resolveDestination(query) {
    const normalizedQuery = normalizeDestinationKey(query);

    if (!normalizedQuery) {
        return null;
    }

    const directMatch = await validateOpenTripDestination(query);
    if (directMatch) {
        return {
            ...directMatch,
            query: normalizedQuery,
            displayName: [directMatch.name, directMatch.country].filter(Boolean).join(', '),
            corrected: normalizeDestinationKey(directMatch.name) !== normalizedQuery
        };
    }

    const bestCandidate = await findBestDestinationCandidate(query);
    if (!bestCandidate) {
        return null;
    }

    const validatedCandidate = await validateOpenTripDestination(bestCandidate.name);
    if (validatedCandidate) {
        return {
            ...validatedCandidate,
            country: validatedCandidate.country || bestCandidate.country || null,
            image: bestCandidate.image || null,
            query: normalizedQuery,
            displayName: [validatedCandidate.name, validatedCandidate.country || bestCandidate.country].filter(Boolean).join(', '),
            corrected: normalizeDestinationKey(validatedCandidate.name) !== normalizedQuery
        };
    }

    const curatedPlaces = getCuratedPlacesForDestination(bestCandidate.name);
    if (!curatedPlaces?.length) {
        return null;
    }

    return {
        name: bestCandidate.name,
        lat: null,
        lon: null,
        country: bestCandidate.country || null,
        image: bestCandidate.image || curatedPlaces[0]?.image || null,
        query: normalizedQuery,
        displayName: [bestCandidate.name, bestCandidate.country].filter(Boolean).join(', '),
        corrected: normalizeDestinationKey(bestCandidate.name) !== normalizedQuery
    };
}

function getCuratedPlacesForDestination(destination) {
    const normalizedInput = normalizeDestinationKey(destination);
    const keys = Object.keys(curatedDestinations);

    const matchedKey = keys.find(key => (
        normalizedInput === key ||
        normalizedInput.includes(key) ||
        key.includes(normalizedInput)
    ));

    return matchedKey ? curatedDestinations[matchedKey] : null;
}

function formatSlot(place) {
    if (!isValidPlace(place)) {
        return null;
    }

    return {
        name: place.name,
        description: place.description || 'No description available',
        image: place.image || null,
        xid: place.xid || null,
        kinds: place.kinds || ''
    };
}

function formatPlace(place) {
    return formatSlot(place);
}

function generateDays(pool, days) {
    const cleanedAttractions = (pool || []).filter(isValidPlace);
    const totalPlaces = cleanedAttractions.length;
    let index = 0;
    const daysPlan = [];

    for (let i = 0; i < days; i += 1) {
        const dayPlan = {
            day: i + 1,
            morning: null,
            morningImage: null,
            morningDetails: null,
            afternoon: null,
            afternoonImage: null,
            afternoonDetails: null,
            evening: null,
            eveningImage: null,
            eveningDetails: null
        };

        if (cleanedAttractions[index]) {
            dayPlan.morningDetails = formatPlace(cleanedAttractions[index]);
            dayPlan.morning = dayPlan.morningDetails?.name || null;
            dayPlan.morningImage = dayPlan.morningDetails?.image || null;
            index += 1;
        }

        if (cleanedAttractions[index]) {
            dayPlan.afternoonDetails = formatPlace(cleanedAttractions[index]);
            dayPlan.afternoon = dayPlan.afternoonDetails?.name || null;
            dayPlan.afternoonImage = dayPlan.afternoonDetails?.image || null;
            index += 1;
        }

        if (cleanedAttractions[index]) {
            dayPlan.eveningDetails = formatPlace(cleanedAttractions[index]);
            dayPlan.evening = dayPlan.eveningDetails?.name || null;
            dayPlan.eveningImage = dayPlan.eveningDetails?.image || null;
            index += 1;
        }

        daysPlan.push(dayPlan);
    }

    const filteredDays = daysPlan.filter(day => (
        day.morningDetails || day.afternoonDetails || day.eveningDetails
    ));

    console.log('Total places:', totalPlaces);
    console.log('Days expected:', days);
    console.log('Days generated:', filteredDays.length);

    return filteredDays;
}

function summarizeItinerary(type, destination, dayPlans) {
    const firstStop = dayPlans[0]?.morning || 'local highlights';

    if (type === 'Adventure') {
        return `An action-focused ${destination} itinerary with outdoor energy, scenic movement, and a strong start at ${firstStop}.`;
    }

    if (type === 'Relaxation') {
        return `A calm ${destination} escape built around slower pacing, scenic pauses, and restorative stops beginning with ${firstStop}.`;
    }

    return `A culture-first ${destination} plan that blends landmarks, history, and local character, starting with ${firstStop}.`;
}

function buildLegacyTripMeta(type, breakdown, days) {
    const pricePerNight = roundCurrency(breakdown.stay / days);
    const costPerDay = roundCurrency(breakdown.food / days);

    if (type === 'Adventure') {
        return {
            stay: { type: 'Adventure Base Stay', price_per_night: pricePerNight, total: breakdown.stay },
            food: { type: 'Local Energy Meals', cost_per_day: costPerDay, total: breakdown.food },
            transport: { mode: 'Local transit and activity transfers', total: breakdown.transport },
            highlights: ['Outdoor highlights', 'Active local experiences', 'Scenic exploration']
        };
    }

    if (type === 'Relaxation') {
        return {
            stay: { type: 'Comfort Stay & Scenic Retreats', price_per_night: pricePerNight, total: breakdown.stay },
            food: { type: 'Cafe and leisure dining plan', cost_per_day: costPerDay, total: breakdown.food },
            transport: { mode: 'Easy transfers and walkable routes', total: breakdown.transport },
            highlights: ['Parks and viewpoints', 'Flexible afternoons', 'Restorative evenings']
        };
    }

    return {
        stay: { type: 'Central heritage stay', price_per_night: pricePerNight, total: breakdown.stay },
        food: { type: 'Traditional dining plan', cost_per_day: costPerDay, total: breakdown.food },
        transport: { mode: 'City transit and walking', total: breakdown.transport },
        highlights: ['Museums and landmarks', 'Local stories', 'Historic neighborhoods']
    };
}

function buildPricing(totalBudget, days, type, placeCount) {
    const stayTotal = roundCurrency(totalBudget * 0.4);
    const stayPerNight = roundCurrency(stayTotal / Math.max(1, days));
    const foodTotal = roundCurrency(totalBudget * 0.25);

    let transportPercent = 0.15;
    if (type === 'Adventure') transportPercent = randomBetween(0.16, 0.20);
    else if (type === 'Relaxation') transportPercent = randomBetween(0.10, 0.13);
    else transportPercent = randomBetween(0.13, 0.16);
    const transportTotal = roundCurrency(totalBudget * transportPercent);

    let perPlaceMin = 30;
    let perPlaceMax = 39;
    if (type === 'Adventure') {
        perPlaceMin = 40;
        perPlaceMax = 50;
    } else if (type === 'Relaxation') {
        perPlaceMin = 20;
        perPlaceMax = 29;
    }

    const activityPerPlace = roundCurrency(randomBetween(perPlaceMin, perPlaceMax));
    const activitiesTotal = roundCurrency(activityPerPlace * Math.max(0, placeCount));

    const total = roundCurrency(stayTotal + foodTotal + transportTotal + activitiesTotal);

    return {
        stayTotal,
        stayPerNight,
        foodTotal,
        transportTotal,
        activitiesTotal,
        total,
        activityPerPlace
    };
}

function buildStructuredItinerary(type, destination, days, totalBudget, pool, recommended) {
    const dayPlans = generateDays(pool, days);
    const placeCount = dayPlans.length * 3;
    const pricing = buildPricing(totalBudget, days, type, placeCount);
    const summary = summarizeItinerary(type, destination, dayPlans);
    const breakdown = {
        stay: pricing.stayTotal,
        food: pricing.foodTotal,
        transport: pricing.transportTotal,
        activities: pricing.activitiesTotal,
        total: pricing.total
    };
    const legacyMeta = buildLegacyTripMeta(type, breakdown, days);

    return {
        type,
        summary,
        totalCost: pricing.total,
        stayCost: pricing.stayPerNight,
        foodCost: pricing.foodTotal,
        transportCost: pricing.transportTotal,
        activityCost: pricing.activitiesTotal,
        breakdown: {
            stay: breakdown.stay,
            food: breakdown.food,
            transport: breakdown.transport,
            activities: breakdown.activities
        },
        daysPlan: dayPlans,
        recommended,
        highlights: legacyMeta.highlights,
        stay: legacyMeta.stay,
        food: legacyMeta.food,
        transport: legacyMeta.transport,
        costBreakdown: {
            stay: breakdown.stay,
            food: breakdown.food,
            transport: breakdown.transport,
            activities: breakdown.activities,
            total: breakdown.total
        },
        itinerary: dayPlans.map(dayPlan => ({
            day: dayPlan.day,
            morning: dayPlan.morning,
            afternoon: dayPlan.afternoon,
            evening: dayPlan.evening
        }))
    };
}

async function hydrateItineraryImages(itineraries = []) {
    const allPlaces = itineraries.flatMap(itinerary => (
        (itinerary?.daysPlan || []).flatMap(day => [
            day.morningDetails,
            day.afternoonDetails,
            day.eveningDetails
        ]).filter(Boolean)
    ));

    const enrichedPlaces = await enrichImages(allPlaces);
    let index = 0;

    itineraries.forEach(itinerary => {
        (itinerary?.daysPlan || []).forEach(day => {
            if (day.morningDetails) {
                day.morningDetails.image = enrichedPlaces[index++]?.image || day.morningDetails.image || null;
            }

            if (day.afternoonDetails) {
                day.afternoonDetails.image = enrichedPlaces[index++]?.image || day.afternoonDetails.image || null;
            }

            if (day.eveningDetails) {
                day.eveningDetails.image = enrichedPlaces[index++]?.image || day.eveningDetails.image || null;
            }

            day.morningImage = day.morningDetails?.image || null;
            day.afternoonImage = day.afternoonDetails?.image || null;
            day.eveningImage = day.eveningDetails?.image || null;
        });
    });

    console.log('Images enriched:', enrichedPlaces.length);

    return itineraries;
}

async function getWikimediaImage(title) {
    if (!title) {
        return null;
    }

    try {
        const response = await axios.get(`${WIKIPEDIA_SUMMARY_URL}/${encodeURIComponent(title)}`, {
            validateStatus: () => true,
            timeout: 10000
        });

        if (response.status < 200 || response.status >= 300) {
            return null;
        }

        return response.data?.thumbnail?.source || null;
    } catch (error) {
        return null;
    }
}

async function enrichImages(places = []) {
    return Promise.all(places.map(async place => {
        if (!place || place.image || !place.name) {
            return place;
        }

        let image = await getWikimediaImage(place.name);

        if (!image) {
            image = await getCachedPexelsImage(place.name);
        }

        return {
            ...place,
            image: image || null
        };
    }));
}

function createTypePool(type, pools) {
    const base = {
        adventurePlaces: [...(pools.adventurePlaces || [])],
        relaxationPlaces: [...(pools.relaxationPlaces || [])],
        culturalPlaces: [...(pools.culturalPlaces || [])],
        otherPlaces: [...(pools.otherPlaces || [])]
    };

    if (type === 'Adventure') {
        return uniqueByName([
            ...base.adventurePlaces,
            ...base.otherPlaces,
            ...base.culturalPlaces,
            ...base.relaxationPlaces
        ]);
    }

    if (type === 'Relaxation') {
        return uniqueByName([
            ...base.relaxationPlaces,
            ...base.otherPlaces,
            ...base.culturalPlaces,
            ...base.adventurePlaces
        ]);
    }

    return uniqueByName([
        ...base.culturalPlaces,
        ...base.otherPlaces,
        ...base.relaxationPlaces,
        ...base.adventurePlaces
    ]);
}

function buildThreeItineraries(destination, days, budget, pools, preference) {
    return [
        {
            type: 'Adventure',
            daysPlan: generateDays(createTypePool('Adventure', pools), days)
        },
        {
            type: 'Relaxation',
            daysPlan: generateDays(createTypePool('Relaxation', pools), days)
        },
        {
            type: 'Cultural',
            daysPlan: generateDays(createTypePool('Cultural', pools), days)
        }
    ].map(itinerary => buildStructuredItinerary(
        itinerary.type,
        destination,
        days,
        budget,
        createTypePool(itinerary.type, pools),
        itinerary.type.toLowerCase() === preference
    ));
}

function generateItineraryFromCurated(destination, curatedPlaces, days, budget, preference = 'cultural') {
    const preferredType = typeof preference === 'string' ? preference.toLowerCase() : 'cultural';
    const validCuratedPlaces = uniqueByName((curatedPlaces || []).filter(isValidPlace));
    const split = splitPlacesByKinds(validCuratedPlaces);
    const pools = {
        adventurePlaces: shuffleInPlace([...split.adventurePlaces]),
        relaxationPlaces: shuffleInPlace([...split.relaxationPlaces]),
        culturalPlaces: shuffleInPlace([...split.culturalPlaces]),
        otherPlaces: shuffleInPlace([...split.otherPlaces])
    };

    return buildThreeItineraries(destination, days, budget, pools, preferredType);
}

function generateFallbackItinerary(destination, days, budget, preference = 'cultural', sourcePlaces = []) {
    const preferredType = typeof preference === 'string' ? preference.toLowerCase() : 'cultural';
    const pool = uniqueByName(sourcePlaces.filter(isValidPlace));
    const split = splitPlacesByKinds(pool);
    const pools = {
        adventurePlaces: shuffleInPlace([...split.adventurePlaces]),
        relaxationPlaces: shuffleInPlace([...split.relaxationPlaces]),
        culturalPlaces: shuffleInPlace([...split.culturalPlaces]),
        otherPlaces: shuffleInPlace([...split.otherPlaces])
    };

    return buildThreeItineraries(destination, days, budget, pools, preferredType);
}

async function getDatabaseAttractions(destination) {
    const destDoc = await Destination.findOne({ name: { $regex: new RegExp(destination, 'i') } });

    if (!destDoc) {
        return { destDoc: null, dbAttractions: [] };
    }

    const dbActivities = await Activity.find({ destination: destDoc._id });
    return {
        destDoc,
        dbAttractions: dbActivities.map(activity => ({
            xid: `db-${activity._id}`,
            name: activity.name || null,
            kinds: activity.type || 'attraction',
            description: activity.description || null,
            image: activity.image || null
        }))
    };
}

exports.getDestinations = async (req, res) => {
    try {
        let destinations = await Destination.find();

        if (destinations.length === 0) {
            const seedData = [
                {
                    country: 'INDONESIA',
                    description: 'Discover the emerald of the equator, endless pristine beaches, and vibrant cultural heritage spanning thousands of islands.',
                    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=2000',
                    name: 'Nusa Penida, Bali',
                    rating: 4.9
                },
                {
                    country: 'THAILAND',
                    description: 'Experience the perfect blend of ancient temples, tropical beaches, and bustling night markets in the Land of Smiles.',
                    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=2000',
                    name: 'Phi Phi Islands',
                    rating: 4.8
                },
                {
                    country: 'MALDIVES',
                    description: 'Relax in luxurious overwater bungalows surrounded by crystal clear turquoise waters and vibrant coral reefs.',
                    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=2000',
                    name: 'Male Atoll',
                    rating: 5
                },
                {
                    country: 'JAPAN',
                    description: 'Immerse yourself in a world where cutting-edge technology seamlessly meets centuries-old ancient traditions.',
                    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=2000',
                    name: 'Kyoto',
                    rating: 4.9
                }
            ];

            await Destination.insertMany(seedData);
            destinations = await Destination.find();
        }

        res.json(destinations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.generateFallbackItinerary = generateFallbackItinerary;

exports.validateDestination = async (req, res) => {
    try {
        const query = String(req.query.query || '').trim();

        if (!query) {
            return res.status(400).json({
                error: 'INVALID_DESTINATION',
                message: 'Destination query is required.'
            });
        }

        const location = await resolveDestination(query);

        if (!location) {
            return res.status(404).json({
                error: 'INVALID_DESTINATION',
                message: 'We couldn\'t find this location. Try a different or more specific place.'
            });
        }

        return res.json({
            valid: true,
            corrected: location.corrected,
            name: location.name,
            country: location.country,
            lat: location.lat,
            lon: location.lon,
            displayName: location.displayName
        });
    } catch (error) {
        return res.status(500).json({
            error: 'VALIDATION_FAILED',
            message: 'Destination validation is temporarily unavailable.'
        });
    }
};

exports.generateTrip = async (req, res) => {
    try {
        const destinationInput = (req.body.destination || '').trim();
        const preferenceInput = (req.body.preference || 'cultural').trim().toLowerCase();
        const days = normalizeDays(req.body.days);
        const budget = normalizeBudget(req.body.budget);

        if (!destinationInput) {
            return res.status(400).json({ error: 'Destination is required' });
        }

        const validatedLocation = await resolveDestination(destinationInput);

        if (!validatedLocation) {
            return res.status(400).json({
                error: 'INVALID_DESTINATION',
                message: 'We couldn\'t find this location. Try a different or more specific place.'
            });
        }

        const resolvedDestinationName = validatedLocation.name;
        const resolvedDestinationLabel = validatedLocation.displayName || resolvedDestinationName;

        const { destDoc, dbAttractions } = await getDatabaseAttractions(resolvedDestinationName);
        const curatedPlaces = getCuratedPlacesForDestination(resolvedDestinationName) || getCuratedPlacesForDestination(destinationInput);
        let openTripResult = null;

        if (curatedPlaces && curatedPlaces.length) {
            console.log('Using curated data for:', resolvedDestinationName);

            if (curatedPlaces.length < MIN_VALID_ATTRACTIONS) {
                return res.status(400).json({
                    error: 'NO_ITINERARY',
                    message: 'Not enough attractions found for this destination. Try reducing days or choosing another place.'
                });
            }

            const destinationMeta = {
                name: destDoc?.name || resolvedDestinationName,
                country: destDoc?.country || validatedLocation.country || 'Global',
                image: destDoc?.image || validatedLocation.image || curatedPlaces[0].image,
                coordinates: validatedLocation.lat != null && validatedLocation.lon != null
                    ? { lat: validatedLocation.lat, lon: validatedLocation.lon }
                    : null,
                formattedName: resolvedDestinationLabel
            };

            const itineraries = await hydrateItineraryImages(
                generateItineraryFromCurated(destinationMeta.name, curatedPlaces, days, budget, preferenceInput)
            );

            console.log('Days requested:', days);
            console.log('Generated days:', itineraries[0]?.daysPlan?.length || 0);
            console.log('Itinerary count:', itineraries.length);

            return res.json({
                destination: destinationMeta,
                days,
                budget,
                itineraries
            });
        }

        try {
            openTripResult = validatedLocation.lat != null && validatedLocation.lon != null
                ? await getAttractionsByPlace(resolvedDestinationName)
                : null;
            if (openTripResult) {
                console.log('[trip] coords:', openTripResult.coords);
                console.log('Raw attractions:', openTripResult.rawAttractions.length);
                console.log('[trip] attractions:', openTripResult.rawAttractions.length);
                console.log('[trip] cleaned data:', openTripResult.cleanedAttractions.length);
                console.log('Using API data:', openTripResult.cleanedAttractions.length);
                console.log('Images fetched:', openTripResult.imagesCount || 0);
            }
        } catch (error) {
            console.error('[trip] OpenTripMap failed:', error.message);
        }

        const detailedPlaces = ((openTripResult && openTripResult.detailedAttractions) || []).filter(place => (
            place &&
            place.name &&
            place.name.trim() !== ''
        ));
        const cleaned = uniqueByName(detailedPlaces);
        const validDbPlaces = uniqueByName((dbAttractions || []).filter(isValidPlace));

        console.log('Cleaned:', cleaned.length);

        const sourcePlaces = cleaned.length > 0 ? cleaned : validDbPlaces;

        if (!sourcePlaces.length || sourcePlaces.length < MIN_VALID_ATTRACTIONS) {
            return res.status(400).json({
                error: 'NO_ITINERARY',
                message: 'Not enough attractions found for this destination. Try reducing days or choosing another place.'
            });
        }

        const split = splitPlacesByKinds(sourcePlaces);
        let adventurePlaces = shuffleInPlace([...split.adventurePlaces]);
        let relaxationPlaces = shuffleInPlace([...split.relaxationPlaces]);
        let culturalPlaces = shuffleInPlace([...split.culturalPlaces]);
        const otherPlaces = shuffleInPlace([...split.otherPlaces]);

        if (adventurePlaces.length === 0) adventurePlaces = [...sourcePlaces];
        if (relaxationPlaces.length === 0) relaxationPlaces = [...sourcePlaces];
        if (culturalPlaces.length === 0) culturalPlaces = [...sourcePlaces];

        console.log('Adventure:', adventurePlaces.length);
        console.log('Relaxation:', relaxationPlaces.length);
        console.log('Cultural:', culturalPlaces.length);

        const destinationMeta = {
            name: destDoc?.name || resolvedDestinationName,
            country: destDoc?.country || validatedLocation.country || openTripResult?.coords?.country || 'Global',
            image: destDoc?.image || validatedLocation.image || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1000',
            coordinates: validatedLocation.lat != null && validatedLocation.lon != null
                ? { lat: validatedLocation.lat, lon: validatedLocation.lon }
                : (openTripResult?.coords
                    ? { lat: openTripResult.coords.lat, lon: openTripResult.coords.lon }
                    : null),
            formattedName: resolvedDestinationLabel
                
        };

        const pools = {
            adventurePlaces,
            relaxationPlaces,
            culturalPlaces,
            otherPlaces
        };

        let itineraries = buildThreeItineraries(destinationMeta.name, days, budget, pools, preferenceInput);
        itineraries = await hydrateItineraryImages(itineraries);

        console.log('Days requested:', days);
        console.log('Generated days:', itineraries[0]?.daysPlan?.length || 0);
        console.log('Itinerary count:', itineraries.length);

        const responsePayload = {
            destination: destinationMeta,
            days,
            budget,
            itineraries
        };

        console.log('[trip] final itinerary:', JSON.stringify({
            destination: responsePayload.destination.name,
            days: responsePayload.days,
            budget: responsePayload.budget,
            itineraryTypes: responsePayload.itineraries.map(item => item.type)
        }));

        return res.json(responsePayload);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
