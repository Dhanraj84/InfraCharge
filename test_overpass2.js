const lat = 19.0760;
const lon = 72.8777;
const query = `[out:json][timeout:5];(node["amenity"~"restaurant|cafe|fast_food|toilets|pharmacy|atm"](around:1000,${lat},${lon});node["shop"~"supermarket|convenience|mall"](around:1000,${lat},${lon}););out 5;`;

const endpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
];

(async () => {
  for (const url of endpoints) {
    try {
      console.log("Testing", url);
      const res = await fetch(url, {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      console.log(url, "->", res.status, res.statusText);
      if (res.ok) {
         const json = await res.json();
         console.log(json.elements.length, "elements found");
      }
    } catch (e) {
      console.error(url, "failed", e.message);
    }
  }
})();
