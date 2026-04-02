import express from "express";

const app = express();

// 🔥 Health check (EXTREM wichtig für Railway)
app.get("/", (req, res) => {
  res.send("OAuth server is running");
});

// 👉 Login redirect
app.get("/auth", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return res.status(500).send("Missing CLIENT_ID");
  }

  const redirect = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;

  res.redirect(redirect);
});

// 👉 Callback
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
      return res
        .status(500)
        .send("No access token: " + JSON.stringify(data));
    }

    const token = data.access_token;

    res.setHeader("Content-Type", "text/html");
    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h2>OAuth callback reached</h2>
          <p>Token received: yes</p>
          <p>window.opener exists: <span id="opener"></span></p>
          <p>window.parent exists: <span id="parent"></span></p>
          <p>Message sent: <span id="sent"></span></p>
          <button id="sendBtn">Send token to CMS</button>
          <script>
            const openerExists = !!window.opener;
            const parentExists = !!window.parent;
            document.getElementById("opener").textContent = openerExists;
            document.getElementById("parent").textContent = parentExists;

            function sendToken() {
              try {
                const target = window.opener || window.parent;
                if (!target) {
                  document.getElementById("sent").textContent = "no target";
                  return;
                }

                target.postMessage(
                  "authorization:github:success:${token}",
                  "*"
                );

                document.getElementById("sent").textContent = "yes";
              } catch (e) {
                document.getElementById("sent").textContent = "error: " + e.message;
              }
            }

            document.getElementById("sendBtn").addEventListener("click", sendToken);
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send("Server error: " + err.message);
  }
});

    const data = await response.json();

    if (!data.access_token) {
      return res.status(500).send("No access token");
    }

    const token = data.access_token;

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
    res.status(500).send("Server error: " + err.message);
  }
});

// 🔥 Railway Port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("OAuth server running on port", PORT);
});

setInterval(() => {
  console.log("still alive");
}, 10000);
