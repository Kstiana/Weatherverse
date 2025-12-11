export default async function handler(req, res) {

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { lat, lon } = req.query;
        
        if (!lat || !lon) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        
        const apiKey = process.env.OPENWEATHER_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'Server configuration error',
                airQuality: null,
                uvIndex: 5 
            });
        }
        

        const aqResponse = await fetch(
            `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        
        let airQuality = null;
        if (aqResponse.ok) {
            const aqData = await aqResponse.json();
            airQuality = aqData.list ? aqData.list[0] : null;
        }
        
 
        const now = new Date();
        const hour = now.getUTCHours();
        let uvIndex = 5; 
        const latFactor = Math.abs(lat) / 90;
        const timeFactor = Math.cos((hour - 12) * Math.PI / 12);
        uvIndex = uvIndex * (1 - latFactor * 0.5) * (1 + timeFactor * 0.5);
        uvIndex = Math.min(Math.max(uvIndex, 0), 12);
        
        return res.status(200).json({
            airQuality,
            uvIndex: Math.round(uvIndex * 10) / 10
        });
        
    } catch (error) {
        console.error('Server error:', error);
        
        return res.status(500).json({ 
            error: 'Internal server error',
            airQuality: null,
            uvIndex: 5
        });
    }
}
