import "dotenv/config";
console.log(Object.keys(process.env).filter(k => k.includes("KEY") || k.includes("API") || k.includes("SECRET")));
