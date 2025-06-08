const express = require('express');
const axios = require('axios');

const app = express();

// Replace with your session cookies from browser
const IG_HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  'x-ig-app-id': '936619743392459',
  'x-asbd-id': '129477',
  'x-csrftoken': 'wytZHjMahu4YPRCoaWNjfN5WR3AWyCSy',
  'cookie': `sessionid=16223717497%3AaRJ2rf9MlVW4TK%3A12%3AAYcEYz2Mu_1sjlAdfOSlXVlhvJ2wmUlpl8m_xRMAVg; ds_user_id=16223717497; csrftoken=wytZHjMahu4YPRCoaWNjfN5WR3AWyCSy;`
};

app.get('/', (req, res) => {
  res.send(`<h2>🔥 Insta GraphQL Profile API by @nobi_shops</h2>`);
});

app.get('/profile', async (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ status: 'error', message: 'Missing username.', developer: '@nobi_shops' });
  }

  try {
    // Step 1: Get user ID from username
    const userInfo = await axios.get(`https://www.instagram.com/${username}/?__a=1&__d=dis`, {
      headers: IG_HEADERS
    });

    const user = userInfo.data?.graphql?.user;
    if (!user) throw new Error("User not found");

    res.json({
      status: 'success',
      developer: '@nobi_shops',
      data: {
        username: user.username,
        full_name: user.full_name,
        bio: user.biography,
        profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url,
        followers: user.edge_followed_by.count,
        following: user.edge_follow.count,
        posts: user.edge_owner_to_timeline_media.count,
        is_private: user.is_private,
        is_verified: user.is_verified
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user info. Check cookies or username.',
      developer: '@nobi_shops'
    });
  }
});

module.exports = app;
