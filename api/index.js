// api/index.js
import express from 'express';
import axios from 'axios';

const app = express();

const fetchInstagramInfo = async (username) => {
  try {
    username = username.trim().toLowerCase().replace('@', '');
    const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;

    const headers = {
      'user-agent': 'Mozilla/5.0',
      'accept': 'application/json'
    };

    const response = await axios.get(url, { headers, timeout: 10000 });
    const user_data = response.data?.graphql?.user;

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
        <title>Insta Info API</title>
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
          .small {
            margin-top: 50px;
            font-size: 0.8em;
            opacity: 0.3;
          }
        </style>
      </head>
      <body>
        <h1>🔐 Insta Information API</h1>
        <p>This API allows you to send an Instagram password reset link.</p>

        <h3>📌 Endpoints:</h3>
        <p><code>GET  /api?username=cristiano</code></p>

        <h3>🧪 Example:</h3>
        <p><code>/api?username=cristiano</code></p>

        <a href="https://t.me/nobi_shops" class="button">Join Channel</a>
        <div class="small">Made with ❤️ by @nobi_shops</div>
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
