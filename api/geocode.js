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
        const { q, lat, lon } = req.query;
        const apiKey = process.env.OPENWEATHER_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'Server configuration error'
            });
        }
        
        if (q) {
            const response = await fetch(
                `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${apiKey}`
            );
            
            if (!response.ok) {
                return res.status(response.status).json({ error: 'Geocoding failed' });
            }
            
            const data = await response.json();
            return res.status(200).json(data);
        }

        if (lat && lon) {
            const response = await fetch(
                `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`
            );
            
            if (!response.ok) {
                return res.status(response.status).json({ error: 'Reverse geocoding failed' });
            }
            
            const data = await response.json();
            return res.status(200).json(data);
        }
        
        return res.status(400).json({ error: 'Either q or lat/lon parameters are required' });
        
    } catch (error) {
        console.error('Server error:', error);
        
        return res.status(500).json({ 
            error: 'Internal server error'
        });
    }
}
