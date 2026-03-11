
console.log("Checking for API keys...");
const keys = ["GOOGLE_API_KEY", "GEMINI_API_KEY", "API_KEY"];
keys.forEach(key => {
  const val = process.env[key];
  if (val) {
    console.log(`${key}: Found (starts with ${val.substring(0, 4)}, length: ${val.length})`);
  } else {
    console.log(`${key}: Not found`);
  }
});
