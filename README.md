# PlayNearby — Local Sports Community & Coach Finder

A static directory of local sports clubs, academies and personal trainers on a free
Leaflet + OpenStreetMap map. No build step, no API keys.

## Run

Geolocation only works on a secure origin (`https://` or `localhost`), so serve the folder:

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Features

- **Geolocation API**: centres the map on you. If permission is denied, it falls back to New Delhi.
  Click anywhere on the map to search from that spot instead.
- **Filters**: sport (multi-select), type (club / academy / trainer), max monthly budget,
  minimum star rating, search radius (1–25 km) and free-text search. Sort by distance, rating or price.
- **Map**: colour-coded sport markers, a radius circle, popups with hours, phone and an OSM directions link.
  Clicking a result card flies to its marker.
- **Real venues (optional)**: "Show real OSM venues" pulls sports centres, pitches, gyms and pools near you
  from the free Overpass API (capped at 8 km). OSM has no price or rating data, so only the sport and search filters apply to these.
- **Favourites** and **"List a venue"** are saved in `localStorage` (this browser only).
- Responsive: on phones the List/Map toggle switches views. Dark mode follows the OS setting.

## Data

`js/data.js` holds 30 **sample** listings. They're stored as km offsets from a centre point
so the demo shows nearby results wherever you are. To use real data, give each entry
`lat`/`lng` instead of `offset`, or load the array from your backend.

## Files

```
index.html      page layout
css/styles.css  styling (light/dark, mobile)
js/data.js      sport catalogue + sample listings
js/app.js       map, geolocation, filtering, OSM loading, favourites
```
