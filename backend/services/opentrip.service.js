const axios = require('axios');

const BASE_URL = 'https://api.opentripmap.com/0.1/en/places';
const WIKIMEDIA_URL = 'https://commons.wikimedia.org/w/api.php';
const WIKIPEDIA_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const DEFAULT_RADIUS_METERS = 5000;
const DEFAULT_LIMIT = 30;
const MIN_VALID_ATTRACTIONS = 5;
const TOP_DETAIL_COUNT = 20;

function getApiKey() {
    const apiKey = process.env.OPENTRIP_API_KEY;

    if (!apiKey) {
        throw new Error('OpenTripMap API key is not configured');
    }

    return apiKey;
}

async function getCoordinates(place) {
    const apiKey = getApiKey();

    const response = await axios.get(`${BASE_URL}/geoname`, {
        params: {
            name: place,
            apikey: apiKey
        },
        timeout: 10000
    });

    const { lat, lon, country, city, name } = response.data || {};

    if (typeof lat !== 'number' || typeof lon !== 'number') {
        throw new Error(`Coordinates not found for "${place}"`);
    }

    return {
        lat,
        lon,
        country: country || null,
        city: city || name || place
    };
}

async function getAttractions(lat, lon) {
    const apiKey = getApiKey();

    const response = await axios.get(`${BASE_URL}/radius`, {
        params: {
            radius: DEFAULT_RADIUS_METERS,
            lon,
            lat,
            limit: DEFAULT_LIMIT,
            rate: 2,
            format: 'json',
            apikey: apiKey
        },
        timeout: 10000
    });

    return Array.isArray(response.data) ? response.data : [];
}

async function getPlaceDetails(xid) {
    const apiKey = getApiKey();

    if (!xid) {
        throw new Error('Attraction xid is required');
    }

    const response = await axios.get(`${BASE_URL}/xid/${encodeURIComponent(xid)}`, {
        params: {
            apikey: apiKey
        },
        timeout: 10000
    });

    return response.data || {};
}

function normalizeKinds(kinds) {
    if (!kinds || typeof kinds !== 'string') {
        return 'attraction';
    }

    return kinds
        .split(',')
        .map(kind => kind.trim())
        .filter(Boolean)
        .join(', ') || 'attraction';
}

function cleanName(name) {
    if (!name || typeof name !== 'string') {
        return 'Unknown Attraction';
    }

    const cleaned = name
        .replace(/\s*[\(\[\{（【][^)\]\}）】]*[\)\]\}）】]\s*/g, ' ')
        .replace(/[^\x00-\x7F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return cleaned || 'Unknown Attraction';
}

function isEnglish(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }

    const normalized = text.trim();
    if (!normalized) {
        return false;
    }

    const lettersOnly = normalized.replace(/[^a-zA-Z]/g, '');
    if (!lettersOnly.length) {
        return false;
    }

    return (lettersOnly.length / normalized.length) > 0.6;
}

function cleanDescription(text) {
    if (!text || typeof text !== 'string') {
        return null;
    }

    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) {
        return null;
    }

    return cleaned.length > 200 ? `${cleaned.slice(0, 200)}...` : cleaned;
}

function cleanAttractions(rawData = []) {
    const seen = new Set();
    const cleaned = [];

    rawData.forEach(item => {
        if (!item || typeof item !== 'object') {
            return;
        }

        const name = cleanName(item.name);
        if (!name || name === 'Unknown Attraction') {
            return;
        }

        const xid = item.xid ? String(item.xid).trim() : '';
        const kinds = normalizeKinds(item.kinds);
        const dedupeKey = xid || name.toLowerCase();

        if (!dedupeKey || seen.has(dedupeKey)) {
            return;
        }

        seen.add(dedupeKey);

        cleaned.push({
            xid,
            name,
            kinds,
            point: item.point && typeof item.point === 'object'
                ? {
                    lat: typeof item.point.lat === 'number' ? item.point.lat : null,
                    lon: typeof item.point.lon === 'number' ? item.point.lon : null
                }
                : null
        });
    });

    return cleaned;
}

async function getWikimediaImage(placeName) {
    if (!placeName) {
        return null;
    }

    try {
        const response = await axios.get(WIKIMEDIA_URL, {
            params: {
                action: 'query',
                prop: 'pageimages',
                format: 'json',
                piprop: 'original',
                titles: placeName
            },
            timeout: 10000
        });

        const pages = response.data?.query?.pages || {};
        const firstPage = Object.values(pages)[0];
        return firstPage?.original?.source || null;
    } catch (error) {
        return null;
    }
}

async function getWikipediaDescription(name) {
    if (!name) {
        return null;
    }

    try {
        const response = await axios.get(`${WIKIPEDIA_SUMMARY_URL}/${encodeURIComponent(name)}`, {
            validateStatus: () => true,
            timeout: 10000
        });

        if (response.status < 200 || response.status >= 300) {
            return null;
        }

        const extract = response.data?.extract;
        return typeof extract === 'string' && extract.length > 50 ? extract : null;
    } catch (error) {
        return null;
    }
}

async function searchWikipedia(name) {
    if (!name) {
        return null;
    }

    try {
        const response = await axios.get('https://en.wikipedia.org/w/api.php', {
            params: {
                action: 'query',
                list: 'search',
                srsearch: name,
                format: 'json',
                origin: '*'
            },
            timeout: 10000
        });

        const firstResult = response.data?.query?.search?.[0]?.title;
        if (!firstResult) {
            return null;
        }

        return getWikipediaDescription(firstResult);
    } catch (error) {
        return null;
    }
}

function generateFallbackDescription(name) {
    return `${name} is a popular attraction known for its unique experience and local significance. A great place to explore during your trip.`;
}

function shorten(text, max = 200) {
    if (!text) {
        return text;
    }

    return text.length > max ? `${text.slice(0, max)}...` : text;
}

async function resolvePlaceImage(details, placeName) {
    let image = null;

    if (details.preview?.source) {
        image = details.preview.source;
    } else if (details.image) {
        image = details.image;
    }

    if (image) {
        return image;
    }

    const wikimediaImage = await getWikimediaImage(placeName);
    if (wikimediaImage) {
        return wikimediaImage;
    }

    return null;
}

async function mergeDetailsForPlaces(places = [], detailsList = []) {
    const merged = await Promise.all(places.map(async (place, index) => {
        const details = detailsList[index] || {};
        const resolvedName = cleanName(details.name || place.name);
        const rawDescription = details.wikipedia_extracts?.text || details.info?.descr || null;
        let wikiDescription = null;
        let description = null;

        if (isEnglish(rawDescription)) {
            description = rawDescription;
        } else {
            wikiDescription = await getWikipediaDescription(resolvedName) || await searchWikipedia(resolvedName);
            description = wikiDescription || generateFallbackDescription(resolvedName);
        }

        console.log('DESC DEBUG:', {
            name: resolvedName,
            otm: !!details.wikipedia_extracts?.text || !!details.info?.descr,
            wiki: !!wikiDescription
        });

        console.log('CLEANED:', {
            original: place.name,
            cleaned: resolvedName,
            isEnglish: isEnglish(description)
        });

        return {
            xid: place.xid,
            name: resolvedName,
            kinds: normalizeKinds(details.kinds || place.kinds),
            description: cleanDescription(description),
            image: await resolvePlaceImage(details, resolvedName),
            address: details.address || null,
            point: place.point || null
        };
    }));

    return merged.filter(place => place && place.name && place.xid);
}

async function getAttractionsByPlace(place) {
    const coords = await getCoordinates(place);
    const rawAttractions = await getAttractions(coords.lat, coords.lon);
    const cleanedAttractions = cleanAttractions(rawAttractions);

    if (!cleanedAttractions.length) {
        return {
            coords,
            rawAttractions,
            cleanedAttractions,
            detailedAttractions: []
        };
    }

    const topPlaces = cleanedAttractions.slice(0, Math.min(cleanedAttractions.length, TOP_DETAIL_COUNT));
    const detailResults = await Promise.allSettled(
        topPlaces.map(attraction => getPlaceDetails(attraction.xid))
    );

    const detailsList = detailResults.map(result => (
        result.status === 'fulfilled' ? result.value : {}
    ));

    const detailedAttractions = await mergeDetailsForPlaces(topPlaces, detailsList);
    const imagesCount = detailedAttractions.filter(attraction => Boolean(attraction.image)).length;
    console.log('Detailed places:', detailedAttractions.length);

    return {
        coords,
        rawAttractions,
        cleanedAttractions,
        detailedAttractions,
        imagesCount,
        hasEnoughAttractions: cleanedAttractions.length >= MIN_VALID_ATTRACTIONS
    };
}

module.exports = {
    DEFAULT_LIMIT,
    MIN_VALID_ATTRACTIONS,
    TOP_DETAIL_COUNT,
    getCoordinates,
    getAttractions,
    getPlaceDetails,
    cleanAttractions,
    getAttractionsByPlace
};
