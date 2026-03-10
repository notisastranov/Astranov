console.log("All Environment Variable Keys:");
Object.keys(process.env).sort().forEach(key => {
  const value = process.env[key];
  const displayValue = (key.includes("KEY") || key.includes("SECRET") || key.includes("PASSWORD") || key.includes("TOKEN")) 
    ? "[REDACTED]" 
    : value;
  console.log(`${key}: ${displayValue}`);
});
