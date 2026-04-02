import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/auth", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;

  console.log("CLIENT_ID:", clientId);

  if (!clientId) {
    return res.status(500).send("Missing CLIENT_ID");
  }

  const redirect = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;
  res.redirect(redirect);
});

app.get("/auth/callback", async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).send("Missing code");
    }

    console.log("CODE:", code);

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();

    console.log("TOKEN RESPONSE:", data);

    if (!data.access_token) {
      return res.status(500).send("No access token: " + JSON.stringify(data));
    }

    res.setHeader("Content-Type", "text/html");

    res.send(`
      <html>
        <body>
          <script>
            (function() {
              const msg = "authorization:github:success:${data.access_token}";
              console.log("Sending token...");

              if (window.opener) {
                window.opener.postMessage(msg, "*");
              } else {
                console.error("No opener window");
              }

              window.close();
            })();
          </script>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send("Server error: " + err.message);
  }
});

app.listen(3000, () => {
  console.log("OAuth server running on port 3000");
});
