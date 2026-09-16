const fs = require("fs");
const path = require("path");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// Load .env.local manually
const envPath = path.join(__dirname, ".env.local");
const envText = fs.readFileSync(envPath, "utf8");

for (const line of envText.split(/\r?\n/)) {
  if (!line || line.trim().startsWith("#")) continue;

  const index = line.indexOf("=");
  if (index === -1) continue;

  const key = line.slice(0, index).trim();
  let value = line.slice(index + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  process.env[key] = value;
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: node make-admin.cjs your-email@example.com");
    process.exit(1);
  }

  try {
    const auth = getAuth();

    const user = await auth.getUserByEmail(email);

    console.log("Found Firebase user:");
    console.log("Email:", user.email);
    console.log("UID:", user.uid);

    await auth.setCustomUserClaims(user.uid, {
      ...(user.customClaims || {}),
      admin: true,
    });

    console.log("");
    console.log("SUCCESS!");
    console.log(`${user.email} is now an administrator.`);
    console.log("Sign out of the website and sign back in.");
  } catch (error) {
    console.error("Failed to create administrator:");
    console.error(error);
    process.exit(1);
  }
}

makeAdmin();