const express = require('express');
const axios = require('axios');
const app = express();

// Middleware
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Updated Instagram headers (you'll need to update these regularly)
const IG_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0'
};

app.get('/', (req, res) => {
  res.json({
    message: '🔥 Insta Profile API by @nobi_shops',
    endpoints: {
      profile: '/profile?username=USERNAME',
      health: '/health'
    },
    developer: '@nobi_shops'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/profile', async (req, res) => {
  const username = req.query.username;
  
  if (!username) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Missing username parameter. Use: /profile?username=USERNAME', 
      developer: '@nobi_shops' 
    });
  }

  // Validate username format
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(username)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid username format',
      developer: '@nobi_shops'
    });
  }

  try {
    // Method 1: Try public profile scraping (no authentication needed)
    const response = await axios.get(`https://www.instagram.com/${username}/`, {
      headers: IG_HEADERS,
      timeout: 10000
    });

    const html = response.data;
    
    // Extract JSON data from HTML
    const jsonMatch = html.match(/window\._sharedData\s*=\s*({.+?});/);
    if (!jsonMatch) {
      throw new Error('Could not extract profile data');
    }

    const sharedData = JSON.parse(jsonMatch[1]);
    const userData = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;

    if (!userData) {
      // Try alternative method
      const altMatch = html.match(/"ProfilePage"\s*:\s*\[\s*({.+?})\s*\]/);
      if (altMatch) {
        const profileData = JSON.parse(altMatch[1]);
        const user = profileData?.graphql?.user;
        if (user) {
          return res.json(formatUserData(user));
        }
      }
      throw new Error('User not found or profile is private');
    }

    res.json(formatUserData(userData));

  } catch (error) {
    console.error('Error fetching profile:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        developer: '@nobi_shops'
      });
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        status: 'error',
        message: 'Service temporarily unavailable',
        developer: '@nobi_shops'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile data. The user might be private or Instagram has updated their structure.',
      developer: '@nobi_shops'
    });
  }
});

function formatUserData(user) {
  return {
    status: 'success',
    developer: '@nobi_shops',
    data: {
      username: user.username,
      full_name: user.full_name || '',
      bio: user.biography || '',
      profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url || '',
      followers: user.edge_followed_by?.count || 0,
      following: user.edge_follow?.count || 0,
      posts: user.edge_owner_to_timeline_media?.count || 0,
      is_private: user.is_private || false,
      is_verified: user.is_verified || false,
      external_url: user.external_url || '',
      is_business_account: user.is_business_account || false
    }
  };
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    developer: '@nobi_shops'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    developer: '@nobi_shops'
  });
});

module.exports = app;
