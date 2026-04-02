import express from "express";

const app = express();

// ===== AUTH START =====
app.get("/auth", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;

  console.log("CLIENT_ID:", clientId);

  if (!clientId) {
    console.error("CLIENT_ID missing!");
    return res.status(500).send("Missing CLIENT_ID");
  }

  const redirect = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;

  console.log("Redirecting to GitHub:", redirect);

  res.redirect(redirect);
});

// ===== CALLBACK =====
app.get("/auth/callback", async (req, res) => {
  try {
    const code = req.query.code;

    console.log("CODE:", code);

    if (!code) {
      return res.status(400).send("Missing code");
    }

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

    const token = data.access_token;

    res.setHeader("Content-Type", "text/html");

    res.send(`
      <html>
        <body>
          <script>
            (function() {
              var target = window.opener || window.parent;

              if (!target) {
                document.body.innerText = "No opener window found";
                return;
              }

              target.postMessage(
                "authorization:github:success:${token}",
                "https://praxis-website-sand.vercel.app"
              );

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

// ===== HEALTH CHECK (sehr wichtig für Railway) =====
app.get("/", (req, res) => {
  res.send("OAuth server is running");
});

// ===== PORT FIX =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("OAuth server running on port", PORT);
});
