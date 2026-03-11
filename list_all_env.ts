
console.log("All environment variables:");
Object.keys(process.env).sort().forEach(key => {
  if (key.includes("KEY") || key.includes("SECRET") || key.includes("PASSWORD")) {
    console.log(`${key}: [REDACTED] (length: ${process.env[key]?.length})`);
  } else {
    console.log(`${key}: ${process.env[key]}`);
  }
});
