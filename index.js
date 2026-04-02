import express from "express";
import fetch from "node-fetch";

const app = express();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

app.get("/auth", (req, res) => {
  const redirect = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
  res.redirect(redirect);
});

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
    }),
  });

  const data = await response.json();

  res.send(`
    <script>
      window.opener.postMessage(
        "authorization:github:success:${data.access_token}",
        "*"
      );
      window.close();
    </script>
  `);
});

app.listen(3000, () => {
  console.log("OAuth server running");
});
