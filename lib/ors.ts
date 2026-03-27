export async function getRoute(start: { lng: number; lat: number }, end: { lng: number; lat: number }, API_KEY: string) {
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
