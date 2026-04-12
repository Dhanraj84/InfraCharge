const fetch = require('node-fetch');

async function run() {
  const payload = {
    stations: [
      { id: 1, lat: 28.6139, lon: 77.2090 } // New Delhi center
    ]
  };
  const res = await fetch("http://localhost:3000/api/amenities-bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    console.log("Failed", res.status);
    return;
  }
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
