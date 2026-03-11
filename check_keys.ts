import "dotenv/config";
const keys = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "API_KEY"];
keys.forEach(key => {
  const val = process.env[key];
  if (val) {
    console.log(`${key} is set. Length: ${val.length}. First 4: ${val.substring(0, 4)}`);
  } else {
    console.log(`${key} is NOT set.`);
  }
});
