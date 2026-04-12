const query = `
  [out:json][timeout:25];
  (
    node["amenity"~"restaurant|cafe|fast_food|toilets|pharmacy|atm"](around:1000,28.6139,77.2090);
    node["shop"~"supermarket|convenience|mall"](around:1000,28.6139,77.2090);
  );
  out center;
`;
async function run() {
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.elements[0], null, 2));
}
run();
