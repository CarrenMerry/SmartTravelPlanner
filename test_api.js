const axios = require('axios');

async function testFallback() {
    try {
        const res = await axios.post('http://localhost:5000/api/generate-trip', {
            destination: 'Paris',
            days: 5,
            budget: 2000,
            preference: 'adventure'
        });
        console.log('SUCCESS:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.log('ERROR STATUS:', err.response?.status);
        console.log('ERROR DATA:', JSON.stringify(err.response?.data, null, 2));
        console.log('ERROR MESSAGE:', err.message);
    }
}

testFallback();
