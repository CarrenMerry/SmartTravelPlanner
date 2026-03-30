const axios = require('axios');

const PEXELS_URL = 'https://api.pexels.com/v1/search';
const imageCache = {};

async function getPexelsImage(query) {
    if (!process.env.PEXELS_API_KEY || !query) {
        return null;
    }

    try {
        const response = await axios.get(PEXELS_URL, {
            headers: {
                Authorization: process.env.PEXELS_API_KEY
            },
            params: {
                query,
                per_page: 1
            },
            timeout: 10000
        });

        if (response.data?.photos?.length > 0) {
            return response.data.photos[0].src?.large || null;
        }

        return null;
    } catch (error) {
        console.error('Pexels error:', error.message);
        return null;
    }
}

async function getCachedPexelsImage(query) {
    const normalizedQuery = String(query || '').trim().toLowerCase();

    if (!normalizedQuery) {
        return null;
    }

    if (Object.prototype.hasOwnProperty.call(imageCache, normalizedQuery)) {
        return imageCache[normalizedQuery];
    }

    const image = await getPexelsImage(query);
    imageCache[normalizedQuery] = image;

    return image;
}

module.exports = {
    getPexelsImage,
    getCachedPexelsImage
};
