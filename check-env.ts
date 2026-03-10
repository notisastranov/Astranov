console.log("Environment Variables:");
Object.keys(process.env).forEach(key => {
  if (key.includes("PROJECT") || key.includes("FIREBASE") || key.includes("GOOGLE") || key.includes("GCLOUD")) {
    console.log(`${key}: ${process.env[key]}`);
  }
});
