const lat = 19.0760;
const lon = 72.8777;
const query = `[out:json][timeout:5];(node["amenity"~"restaurant|cafe|fast_food|toilets|pharmacy|atm"](around:1000,${lat},${lon});node["shop"~"supermarket|convenience|mall"](around:1000,${lat},${lon}););out 5;`;

fetch("https://lz4.overpass-api.de/api/interpreter", {
  method: "POST",
  body: "data=" + encodeURIComponent(query),
  headers: { "Content-Type": "application/x-www-form-urlencoded" }
})
.then(res => {
  console.log("Status:", res.status);
  return res.text();
})
.then(text => console.log(text.substring(0, 500)))
.catch(e => console.error(e));
