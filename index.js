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

// Multiple header configurations to try
const getRandomHeaders = () => {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
  ];

  return {
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
    'Pragma': 'no-cache'
  };
};

app.get('/', (req, res) => {
  res.json({
    message: '🔥 Insta Profile API by @nobi_shops',
    endpoints: {
      profile: '/profile?username=USERNAME',
      health: '/health'
    },
    status: 'active',
    version: '2.0',
    developer: '@nobi_shops'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Method 1: Try Instagram's embed endpoint
async function tryEmbedMethod(username) {
  try {
    const response = await axios.get(`https://www.instagram.com/p/${username}/embed/`, {
      headers: getRandomHeaders(),
      timeout: 8000
    });
    
    // This method is limited but sometimes works
    return null; // Placeholder - embed method needs different parsing
  } catch (error) {
    return null;
  }
}

// Method 2: Try alternative scraping with different patterns
async function tryAlternativeScraping(username) {
  try {
    const response = await axios.get(`https://www.instagram.com/${username}/`, {
      headers: getRandomHeaders(),
      timeout: 10000,
      maxRedirects: 5
    });

    const html = response.data;
    
    // Try multiple patterns to extract data
    const patterns = [
      /window\._sharedData\s*=\s*({.+?});/,
      /"entry_data":\s*({.+?}),"hostname"/,
      /"ProfilePage"\s*:\s*\[({.+?})\]/,
      /script type="application\/ld\+json">({.+?})<\/script>/g
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          const user = extractUserFromData(data);
          if (user) return user;
        } catch (e) {
          continue;
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Method 3: Try using Instagram's GraphQL endpoint (requires more headers)
async function tryGraphQLMethod(username) {
  try {
    // This would require proper Instagram session - simplified version
    const response = await axios.get(`https://www.instagram.com/web/search/topsearch/?query=${username}`, {
      headers: {
        ...getRandomHeaders(),
        'X-Requested-With': 'XMLHttpRequest',
        'X-IG-App-ID': '936619743392459'
      },
      timeout: 8000
    });

    const data = response.data;
    if (data?.users?.length > 0) {
      const user = data.users.find(u => u.user.username.toLowerCase() === username.toLowerCase());
      if (user) {
        return {
          username: user.user.username,
          full_name: user.user.full_name || '',
          profile_pic_url: user.user.profile_pic_url || '',
          is_verified: user.user.is_verified || false,
          is_private: user.user.is_private || false,
          follower_count: user.user.follower_count || 0
        };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Extract user data from various data structures
function extractUserFromData(data) {
  // Try different data structure paths
  const paths = [
    data?.graphql?.user,
    data?.entry_data?.ProfilePage?.[0]?.graphql?.user,
    data?.ProfilePage?.[0]?.graphql?.user,
    data?.user
  ];

  for (const userData of paths) {
    if (userData && userData.username) {
      return {
        username: userData.username,
        full_name: userData.full_name || userData.fullName || '',
        bio: userData.biography || userData.bio || '',
        profile_pic_url: userData.profile_pic_url_hd || userData.profile_pic_url || userData.profilePicUrl || '',
        followers: userData.edge_followed_by?.count || userData.followerCount || userData.followers || 0,
        following: userData.edge_follow?.count || userData.followingCount || userData.following || 0,
        posts: userData.edge_owner_to_timeline_media?.count || userData.mediaCount || userData.posts || 0,
        is_private: userData.is_private || userData.isPrivate || false,
        is_verified: userData.is_verified || userData.isVerified || false,
        external_url: userData.external_url || userData.externalUrl || '',
        is_business_account: userData.is_business_account || userData.isBusinessAccount || false
      };
    }
  }
  return null;
}

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
    console.log(`Fetching profile for: ${username}`);
    
    // Try multiple methods in sequence
    let userData = null;
    
    // Method 1: GraphQL search (fastest, limited data)
    userData = await tryGraphQLMethod(username);
    if (userData) {
      console.log('Success with GraphQL method');
      return res.json({
        status: 'success',
        method: 'graphql',
        developer: '@nobi_shops',
        data: userData
      });
    }

    // Method 2: Alternative scraping
    userData = await tryAlternativeScraping(username);
    if (userData) {
      console.log('Success with scraping method');
      return res.json({
        status: 'success',
        method: 'scraping',
        developer: '@nobi_shops',
        data: userData
      });
    }

    // If all methods fail
    throw new Error('All methods failed');

  } catch (error) {
    console.error('Error fetching profile:', error.message);
    
    // More specific error messages
    if (error.response?.status === 404) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found or username does not exist',
        developer: '@nobi_shops'
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        status: 'error',
        message: 'Rate limit exceeded. Please try again later',
        developer: '@nobi_shops'
      });
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        status: 'error',
        message: 'Instagram service temporarily unavailable',
        developer: '@nobi_shops'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Unable to fetch profile data. Instagram may have updated their security measures.',
      suggestion: 'Try again in a few minutes or contact the developer',
      developer: '@nobi_shops'
    });
  }
});

// Test endpoint with a known working username
app.get('/test', async (req, res) => {
  try {
    // Test with Instagram's official account
    const testResult = await tryGraphQLMethod('instagram');
    res.json({
      status: 'test',
      working: testResult !== null,
      data: testResult,
      developer: '@nobi_shops'
    });
  } catch (error) {
    res.json({
      status: 'test',
      working: false,
      error: error.message,
      developer: '@nobi_shops'
    });
  }
});

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
    available_endpoints: ['/', '/profile', '/health', '/test'],
    developer: '@nobi_shops'
  });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
