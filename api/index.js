// api/index.js
import express from 'express';
import axios from 'axios';

const app = express();

const fetchInstagramInfo = async (username) => {
  try {
    username = username.trim().toLowerCase().replace('@', '');
    const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

    const headers = {
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.9',
      'origin': 'https://www.instagram.com',
      'referer': 'https://www.instagram.com/',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'x-asbd-id': '198387',
      'x-csrftoken': 'V9FEMGcZBdh2U1lbzDvsAM6aRjMqxzXjc',
      'x-ig-app-id': '936619743392459',
      'x-ig-www-claim': '0',
    };

    const response = await axios.get(url, { headers, timeout: 10000 });
    const user_data = response.data?.data?.user;

    if (!user_data) {
      return {
        success: false,
        error: 'User not found',
        message: 'The username does not exist or account is private'
      };
    }

    const profile_pic = user_data.profile_pic_url_hd || user_data.profile_pic_url || 'N/A';

    return {
      success: true,
      data: {
        Developer: "https://t.me/nobi_shops",
        basic_info: {
          full_name: user_data.full_name || 'N/A',
          username: username,
          user_id: user_data.id || 'N/A',
          biography: user_data.biography || 'N/A',
          profile_picture: profile_pic,
          external_url: user_data.external_url || 'N/A'
        },
        stats: {
          followers: user_data.edge_followed_by?.count || 0,
          following: user_data.edge_follow?.count || 0,
          posts: user_data.edge_owner_to_timeline_media?.count || 0
        },
        account_info: {
          verified: user_data.is_verified || false,
          private: user_data.is_private || false,
          business_account: user_data.is_business_account || false,
          professional_account: user_data.is_professional_account || false,
          account_type: user_data.is_business_account ? "Business" : "Personal"
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.name || 'Unexpected error',
      message: error.message || 'An unknown error occurred'
    };
  }
};

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Instagram Info API</title>
        <style>
          body {
            margin: 0;
            font-family: monospace;
            background: black;
            color: #00ffcc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            text-align: center;
          }
          a.button {
            background: #00ffcc;
            color: black;
            padding: 10px 20px;
            border-radius: 10px;
            text-decoration: none;
            margin-top: 20px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <h1>💻 HACKER THEME INSTAGRAM INFO API</h1>
        <p>Use <code>/api?username=cristiano</code> to fetch info</p>
        <a href="https://t.me/nobi_shops" class="button">Join Channel</a>
      </body>
    </html>
  `);
});

app.get('/api', async (req, res) => {
  const username = req.query.username?.trim();
  if (!username) {
    return res.status(400).json({
      success: false,
      error: 'Missing username parameter',
      message: 'Please provide a username parameter in the URL'
    });
  }

  const result = await fetchInstagramInfo(username);
  res.status(result.success ? 200 : 404).json(result);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Instagram Info API'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist'
  });
});

export default app;
