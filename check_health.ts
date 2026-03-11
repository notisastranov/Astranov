import axios from "axios";

async function check() {
  try {
    const res = await axios.get("http://localhost:3000/api/health");
    console.log("Health Check:", JSON.stringify(res.data, null, 2));
  } catch (error: any) {
    console.error("Health Check Error:", error.message);
  }
}

check();
