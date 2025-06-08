const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

// Landing Page
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <h2>📸 Insta Profile Info API</h2>
    <p>This API allows you to fetch public Instagram profile details.</p>

    <h3>📌 Endpoints:</h3>
    <ul>
      <li>GET /profile?username=your_instagram_username</li>
    </ul>

    <h3>🧪 Example:</h3>
    <code>/profile?username=teamnobi</code>

    <br><br>
    <p>Made with ❤️ by <strong>@nobi_shops</strong></p>
  `);
});

// Main API Route
app.get('/profile', async (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing username in query.',
      developer: '@nobi_shops'
    });
  }

  try {
    const response = await axios.get(`https://www.instagram.com/${username}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data);
    const fullNameRaw = $('meta[property="og:title"]').attr('content') || '';
    const bioRaw = $('meta[property="og:description"]').attr('content') || '';
    const profilePic = $('meta[property="og:image"]').attr('content') || null;

    const full_name = fullNameRaw.split('•')[0].trim();
    const bio = bioRaw.split('-')[1]?.trim() || null;

    // Extract numbers using regex
    const match = bioRaw.match(/([\d.,]+[MK]?) Followers, ([\d.,]+[MK]?) Following, ([\d.,]+[MK]?) Posts/);

    const followers = match?.[1] || null;
    const following = match?.[2] || null;
    const posts = match?.[3] || null;

    return res.json({
      status: 'success',
      developer: '@nobi_shops',
      data: {
        username,
        full_name,
        bio,
        profile_pic_url: profilePic,
        followers,
        following,
        posts
      }
    });

  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch data. User may not exist or is private.',
      developer: '@nobi_shops'
    });
  }
});

module.exports = app;
