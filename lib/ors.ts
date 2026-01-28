export async function getRoute(start, end, API_KEY) {
  const url =
    `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${API_KEY}`;

  const body = {
    coordinates: [
      [start.lng, start.lat],
      [end.lng, end.lat],
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return res.json();
}
