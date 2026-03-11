console.log("All Env Keys:", Object.keys(process.env).filter(k => !k.startsWith("npm_")).join(", "));
