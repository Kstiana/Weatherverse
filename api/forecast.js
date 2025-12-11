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
                error: 'Server configuration error'
            });
        }
        
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Forecast API error:', errorText);
            
            return res.status(response.status).json({
                error: 'Forecast API error'
            });
        }
        
        const data = await response.json();

        return res.status(200).json(data);
        
    } catch (error) {
        console.error('Server error:', error);
        
        return res.status(500).json({ 
            error: 'Internal server error'
        });
    }
}
