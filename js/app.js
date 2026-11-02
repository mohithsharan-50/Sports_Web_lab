(() => {
  "use strict";

  // ---------- Config ----------
  const FALLBACK_CENTER = { lat: 28.6139, lng: 77.209, label: "New Delhi (default)" };
  const STORE_FAVS = "playnearby.favs";
  const STORE_USER = "playnearby.userListings";
  // Public Overpass instances, tried in order until one answers.
  const OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  const OVERPASS_TIMEOUT_MS = 20000;
  const OSM_MAX_RADIUS_KM = 8; // keep Overpass queries light

  const SPORTS = window.SPORTS;
  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  // ---------- Storage helpers (never throw) ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
    },
  };

  // ---------- State ----------
  const state = {
    center: null,              // current search centre {lat, lng}
    anchor: null,              // where sample listings are placed around
    listings: [],              // resolved listings with lat/lng
    favs: new Set(store.get(STORE_FAVS, [])),
    userListings: store.get(STORE_USER, []),
    pendingPlacementId: null,  // newly added listing waiting for a map click
    osmPlaces: [],
    osmAbort: null,
    filters: {
      q: "", sports: new Set(), type: "all", budget: 10000,
      rating: 0, radius: 10, favOnly: false, sort: "distance",
    },
  };

  // ---------- DOM ----------
  const $ = (sel) => document.querySelector(sel);
  const els = {
    status: $("#statusBar"), results: $("#results"), count: $("#resultCount"),
    filters: $("#filters"), q: $("#q"), chips: $("#sportChips"),
    budget: $("#budget"), budgetOut: $("#budgetOut"),
    radius: $("#radius"), radiusOut: $("#radiusOut"),
    favOnly: $("#favOnly"), osmToggle: $("#osmToggle"), sort: $("#sort"),
    locateBtn: $("#locateBtn"), addBtn: $("#addBtn"),
    addDialog: $("#addDialog"), addForm: $("#addForm"), addSport: $("#addSport"), cancelAdd: $("#cancelAdd"),
  };

  // ---------- Utilities ----------
  const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);

  function haversineKm(a, b) {
    const R = 6371, toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function offsetToLatLng(origin, [eastKm, northKm]) {
    const lat = origin.lat + northKm / 110.574;
    const lng = origin.lng + eastKm / (111.32 * Math.cos((origin.lat * Math.PI) / 180));
    return { lat, lng };
  }

  const priceLabel = (p) => (p === 0 ? "Free" : inr.format(p));
  const typeLabel = { club: "Club", academy: "Academy", trainer: "Personal trainer" };
  const starsHtml = (r) =>
    `<span class="stars" style="--pct:${(r / 5) * 100}%" aria-label="${r} out of 5 stars"></span>`;

  function setStatus(msg, kind = "") {
    els.status.textContent = msg;
    els.status.className = "status" + (kind ? " " + kind : "");
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  // ---------- Map ----------
  const map = L.map("map", { zoomControl: true }).setView([FALLBACK_CENTER.lat, FALLBACK_CENTER.lng], 12);
  // OSM's tile servers reject requests without a Referer (403 "Access blocked"),
  // which is what happens when the page is opened as a file:// URL. In that case
  // fall back to Esri's street tiles, which don't need one. Serve over
  // http://localhost to get the regular OSM tiles.
  const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const isFileUrl = location.protocol === "file:";
  const tiles = isFileUrl
    ? L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
      })
    : L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: OSM_ATTR,
      });
  tiles.addTo(map);

  const listingLayer = L.layerGroup().addTo(map);
  const osmLayer = L.layerGroup().addTo(map);
  const markersById = new Map();
  let centerMarker = null;
  let radiusCircle = null;

  const centerIcon = L.divIcon({ className: "", html: '<div class="you-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });

  function sportIcon(sportKey, highlight) {
    const s = SPORTS[sportKey] || { icon: "📍", color: "#334155" };
    return L.divIcon({
      className: "",
      html: `<div class="pin${highlight ? " pin-fav" : ""}" style="--c:${s.color}"><span>${s.icon}</span></div>`,
      iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -32],
    });
  }

  function drawCenter() {
    const ll = [state.center.lat, state.center.lng];
    if (!centerMarker) {
      centerMarker = L.marker(ll, { icon: centerIcon, zIndexOffset: 1000, keyboard: false })
        .bindTooltip("Search centre").addTo(map);
    } else centerMarker.setLatLng(ll);

    const r = state.filters.radius * 1000;
    if (!radiusCircle) {
      radiusCircle = L.circle(ll, { radius: r, color: "#2563eb", weight: 1, fillOpacity: 0.05, interactive: false }).addTo(map);
    } else { radiusCircle.setLatLng(ll); radiusCircle.setRadius(r); }
  }

  function fitToRadius() {
    if (radiusCircle) map.fitBounds(radiusCircle.getBounds(), { padding: [20, 20] });
  }

  // ---------- Data resolution ----------
  function resolveListings() {
    const anchor = state.anchor || FALLBACK_CENTER;
    const samples = window.LISTINGS.map((l) => ({
      ...l,
      ...(l.lat != null ? { lat: l.lat, lng: l.lng } : offsetToLatLng(anchor, l.offset)),
      sample: true,
    }));
    const user = state.userListings.map((l) => ({ ...l, user: true }));
    state.listings = [...user, ...samples];
  }

  function setCenter(latlng, { anchorSamples = false, fit = true } = {}) {
    state.center = { lat: latlng.lat, lng: latlng.lng };
    if (anchorSamples || !state.anchor) {
      state.anchor = { ...state.center };
      resolveListings();
    }
    drawCenter();
    if (fit) fitToRadius();
    render();
    if (els.osmToggle.checked) loadOsmDebounced();
  }

  // ---------- Filtering ----------
  function filtered() {
    const f = state.filters;
    const q = f.q.trim().toLowerCase();
    return state.listings
      .map((l) => ({ ...l, distance: haversineKm(state.center, l) }))
      .filter((l) => {
        if (l.distance > f.radius) return false;
        if (f.type !== "all" && l.type !== f.type) return false;
        if (l.price > f.budget) return false;
        if (l.rating != null && l.rating < f.rating) return false;
        if (l.rating == null && f.rating > 0) return false;
        if (f.sports.size && !l.sports.some((s) => f.sports.has(s))) return false;
        if (f.favOnly && !state.favs.has(l.id)) return false;
        if (q) {
          const hay = [l.name, l.address, l.desc, ...l.sports.map((s) => SPORTS[s]?.label)].join(" ").toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (f.sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0) || a.distance - b.distance;
        if (f.sort === "price") return a.price - b.price || a.distance - b.distance;
        return a.distance - b.distance;
      });
  }

  // ---------- Rendering ----------
  function popupHtml(l) {
    const sports = l.sports.map((s) => `${SPORTS[s]?.icon ?? ""} ${escapeHtml(SPORTS[s]?.label ?? s)}`).join(" · ");
    const dir = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${state.center.lat.toFixed(5)}%2C${state.center.lng.toFixed(5)}%3B${l.lat.toFixed(5)}%2C${l.lng.toFixed(5)}`;
    const tel = l.phone ? `<a href="tel:${escapeHtml(l.phone.replace(/\s+/g, ""))}">📞 ${escapeHtml(l.phone)}</a>` : "";
    return `
      <div class="popup">
        <strong>${escapeHtml(l.name)}</strong>
        <div class="popup-meta">${escapeHtml(typeLabel[l.type] || l.type)} · ${sports}</div>
        <div>${l.rating != null ? `${starsHtml(l.rating)} ${l.rating.toFixed(1)} <span class="muted">(${l.reviews ?? 0})</span>` : '<span class="muted">No ratings yet</span>'}</div>
        <div class="popup-price">${priceLabel(l.price)}<span class="muted"> / month</span></div>
        ${l.desc ? `<p>${escapeHtml(l.desc)}</p>` : ""}
        ${l.address ? `<div class="muted">📍 ${escapeHtml(l.address)}</div>` : ""}
        ${l.hours ? `<div class="muted">🕒 ${escapeHtml(l.hours)}</div>` : ""}
        <div class="popup-links">${tel} <a href="${dir}" target="_blank" rel="noopener">🧭 Directions</a></div>
      </div>`;
  }

  function cardHtml(l) {
    const fav = state.favs.has(l.id);
    const tags = l.sports.map((s) =>
      `<span class="tag" style="--c:${SPORTS[s]?.color ?? "#64748b"}">${SPORTS[s]?.icon ?? ""} ${escapeHtml(SPORTS[s]?.label ?? s)}</span>`).join("");
    return `
      <li class="card" data-id="${escapeHtml(l.id)}" tabindex="0">
        <div class="card-top">
          <h3>${escapeHtml(l.name)}</h3>
          <button class="fav${fav ? " on" : ""}" data-fav="${escapeHtml(l.id)}" type="button"
                  aria-pressed="${fav}" aria-label="${fav ? "Remove from" : "Add to"} favourites">${fav ? "♥" : "♡"}</button>
        </div>
        <div class="card-meta">
          <span class="badge badge-${escapeHtml(l.type)}">${escapeHtml(typeLabel[l.type] || l.type)}</span>
          <span>${l.distance.toFixed(1)} km</span>
          ${l.user ? '<span class="badge badge-user">Your listing</span>' : ""}
        </div>
        <div class="card-rating">
          ${l.rating != null ? `${starsHtml(l.rating)} <b>${l.rating.toFixed(1)}</b> <span class="muted">(${l.reviews ?? 0})</span>` : '<span class="muted">No ratings yet</span>'}
          <span class="price">${priceLabel(l.price)}<small>/mo</small></span>
        </div>
        <div class="tags">${tags}</div>
      </li>`;
  }

  function render() {
    if (!state.center) return;
    const items = filtered();

    els.count.textContent = `${items.length} result${items.length === 1 ? "" : "s"} within ${state.filters.radius} km`;
    els.results.innerHTML = items.length
      ? items.map(cardHtml).join("")
      : `<li class="empty">No matches. Try widening the radius, raising the budget or clearing filters.</li>`;

    listingLayer.clearLayers();
    markersById.clear();
    for (const l of items) {
      const m = L.marker([l.lat, l.lng], { icon: sportIcon(l.sports[0], state.favs.has(l.id)), title: l.name })
        .bindPopup(() => popupHtml(l), { maxWidth: 280 });
      m.addTo(listingLayer);
      markersById.set(l.id, m);
    }
    renderOsm();
  }

  function focusListing(id) {
    const m = markersById.get(id);
    if (!m) return;
    if (document.body.classList.contains("mobile")) showView("map");
    map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.6 });
    m.openPopup();
    els.results.querySelectorAll(".card.active").forEach((c) => c.classList.remove("active"));
    els.results.querySelector(`.card[data-id="${CSS.escape(id)}"]`)?.classList.add("active");
  }

  // ---------- OpenStreetMap (real venues) ----------
  const OSM_SPORT_MAP = {
    soccer: "football", football: "football", cricket: "cricket", badminton: "badminton",
    tennis: "tennis", basketball: "basketball", swimming: "swimming", fitness: "fitness",
    yoga: "yoga", karate: "martial", martial_arts: "martial", judo: "martial", taekwondo: "martial",
    boxing: "martial", running: "running", athletics: "running", multi: null,
  };

  function osmSportsFor(tags) {
    const out = new Set();
    (tags.sport || "").split(";").forEach((s) => { const k = OSM_SPORT_MAP[s.trim()]; if (k) out.add(k); });
    if (tags.leisure === "fitness_centre") out.add("fitness");
    if (tags.leisure === "swimming_pool") out.add("swimming");
    if (tags.leisure === "track") out.add("running");
    return [...out];
  }

  async function fetchOverpass(query, signal) {
    let lastErr;
    for (const url of OVERPASS_URLS) {
      if (signal.aborted) break;
      const timeout = new AbortController();
      const timer = setTimeout(() => timeout.abort(), OVERPASS_TIMEOUT_MS);
      const onAbort = () => timeout.abort();
      signal.addEventListener("abort", onAbort, { once: true });
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(query),
          signal: timeout.signal,
        });
        if (!res.ok) throw new Error(`${url} responded ${res.status}`);
        return await res.json();
      } catch (err) {
        lastErr = err;
      } finally {
        clearTimeout(timer);
        signal.removeEventListener("abort", onAbort);
      }
    }
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    throw lastErr || new Error("No Overpass endpoint reachable");
  }

  async function loadOsm() {
    if (!state.center) return;
    state.osmAbort?.abort();
    const ctrl = new AbortController();
    state.osmAbort = ctrl;

    const r = Math.round(Math.min(state.filters.radius, OSM_MAX_RADIUS_KM) * 1000);
    const { lat, lng } = state.center;
    const around = `(around:${r},${lat},${lng})`;
    const query = `[out:json][timeout:25];(
      nwr["leisure"~"^(sports_centre|fitness_centre|stadium|swimming_pool|track)$"]${around};
      nwr["leisure"="pitch"]["name"]${around};
      nwr["club"="sport"]${around};
    );out center 300;`;

    setStatus("Loading real venues from OpenStreetMap…");
    try {
      const json = await fetchOverpass(query, ctrl.signal);
      state.osmPlaces = json.elements
        .map((e) => ({
          id: `osm-${e.type}-${e.id}`,
          lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon,
          name: e.tags?.name || (e.tags?.leisure || "Sports venue").replace(/_/g, " "),
          sports: osmSportsFor(e.tags || {}),
          tags: e.tags || {}, osmType: e.type, osmId: e.id,
        }))
        .filter((p) => p.lat != null);
      renderOsm();
      setStatus(`Loaded ${state.osmPlaces.length} real venues from OpenStreetMap (within ${r / 1000} km).`, "ok");
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(err);
      setStatus("Couldn't reach OpenStreetMap right now. Sample listings are still shown.", "warn");
    }
  }
  const loadOsmDebounced = debounce(loadOsm, 700);

  function renderOsm() {
    osmLayer.clearLayers();
    if (!els.osmToggle.checked) return;
    const f = state.filters;
    const q = f.q.trim().toLowerCase();
    for (const p of state.osmPlaces) {
      if (haversineKm(state.center, p) > f.radius) continue;
      if (f.sports.size && !p.sports.some((s) => f.sports.has(s))) continue;
      if (q && !p.name.toLowerCase().includes(q)) continue;
      const color = p.sports[0] ? SPORTS[p.sports[0]].color : "#64748b";
      const t = p.tags;
      const html = `<div class="popup"><strong>${escapeHtml(p.name)}</strong>
        <div class="popup-meta">OpenStreetMap · ${escapeHtml((t.leisure || t.club || "").replace(/_/g, " "))}${t.sport ? " · " + escapeHtml(t.sport.replace(/;/g, ", ")) : ""}</div>
        ${t["addr:street"] ? `<div class="muted">📍 ${escapeHtml([t["addr:housenumber"], t["addr:street"], t["addr:city"]].filter(Boolean).join(" "))}</div>` : ""}
        ${t.opening_hours ? `<div class="muted">🕒 ${escapeHtml(t.opening_hours)}</div>` : ""}
        ${t.website ? `<div><a href="${escapeHtml(t.website)}" target="_blank" rel="noopener">Website ↗</a></div>` : ""}
        <div class="popup-links"><a href="https://www.openstreetmap.org/${p.osmType}/${p.osmId}" target="_blank" rel="noopener">View on OSM ↗</a></div></div>`;
      L.circleMarker([p.lat, p.lng], { radius: 6, color: "#fff", weight: 1.5, fillColor: color, fillOpacity: 0.85 })
        .bindPopup(html, { maxWidth: 260 })
        .addTo(osmLayer);
    }
  }

  // ---------- Geolocation ----------
  function locate({ initial = false } = {}) {
    if (!("geolocation" in navigator)) {
      setStatus("Geolocation isn't supported in this browser. Showing " + FALLBACK_CENTER.label + ". Click the map to search elsewhere.", "warn");
      if (initial) setCenter(FALLBACK_CENTER, { anchorSamples: true });
      return;
    }
    setStatus("Locating you…");
    els.locateBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        els.locateBtn.disabled = false;
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setCenter({ lat, lng }, { anchorSamples: true });
        setStatus(`Showing venues near you (±${Math.round(accuracy)} m). Sample listings are demo data placed around your location.`, "ok");
      },
      (err) => {
        els.locateBtn.disabled = false;
        const why = { 1: "Location permission denied", 2: "Location unavailable", 3: "Location request timed out" }[err.code] || "Couldn't get location";
        setStatus(`${why}. Showing ${FALLBACK_CENTER.label} — click the map to search from any spot.`, "warn");
        if (initial || !state.center) setCenter(FALLBACK_CENTER, { anchorSamples: true });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  // ---------- Favourites ----------
  function toggleFav(id) {
    state.favs.has(id) ? state.favs.delete(id) : state.favs.add(id);
    store.set(STORE_FAVS, [...state.favs]);
    render();
  }

  // ---------- Add listing ----------
  function openAdd() {
    els.addForm.reset();
    els.addDialog.showModal();
  }

  function saveListing(data) {
    const c = map.getCenter();
    const listing = {
      id: "u" + Date.now().toString(36),
      name: data.name.trim(),
      type: data.type,
      sports: [data.sport],
      price: Math.max(0, Number(data.price) || 0),
      rating: null, reviews: 0,
      lat: c.lat, lng: c.lng,
      address: data.address.trim(), phone: data.phone.trim(), desc: data.desc.trim(),
      hours: "",
    };
    state.userListings.push(listing);
    store.set(STORE_USER, state.userListings);
    state.pendingPlacementId = listing.id;
    resolveListings();
    render();
    document.body.classList.add("placing");
    setStatus(`“${listing.name}” saved at the map centre. Click the map now to move it to its exact spot.`, "ok");
  }

  function placePending(latlng) {
    const l = state.userListings.find((x) => x.id === state.pendingPlacementId);
    state.pendingPlacementId = null;
    document.body.classList.remove("placing");
    if (!l) return;
    l.lat = latlng.lat; l.lng = latlng.lng;
    store.set(STORE_USER, state.userListings);
    resolveListings();
    render();
    setStatus(`Placed “${l.name}”.`, "ok");
    focusListing(l.id);
  }

  // ---------- Mobile view toggle ----------
  const mq = window.matchMedia("(max-width: 860px)");
  function showView(view) {
    document.body.dataset.view = view;
    document.querySelectorAll(".mobile-toggle button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    if (view === "map") setTimeout(() => map.invalidateSize(), 50);
  }
  function syncMobile() {
    document.body.classList.toggle("mobile", mq.matches);
    if (!mq.matches) map.invalidateSize();
  }

  // ---------- Wiring ----------
  function buildSportControls() {
    els.chips.innerHTML = Object.entries(SPORTS).map(([key, s]) =>
      `<button type="button" class="chip" data-sport="${key}" aria-pressed="false" style="--c:${s.color}">${s.icon} ${s.label}</button>`).join("");
    els.addSport.innerHTML = Object.entries(SPORTS).map(([key, s]) => `<option value="${key}">${s.icon} ${s.label}</option>`).join("");
  }

  function syncOutputs() {
    els.budgetOut.textContent = Number(els.budget.value) >= 10000 ? "Any" : inr.format(Number(els.budget.value));
    els.radiusOut.textContent = els.radius.value;
  }

  function bind() {
    const f = state.filters;

    els.q.addEventListener("input", debounce(() => { f.q = els.q.value; render(); }, 150));

    els.chips.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const k = chip.dataset.sport;
      f.sports.has(k) ? f.sports.delete(k) : f.sports.add(k);
      chip.setAttribute("aria-pressed", f.sports.has(k));
      render();
    });

    els.filters.addEventListener("change", (e) => {
      const t = e.target;
      if (t.name === "type") f.type = t.value;
      else if (t.name === "rating") f.rating = Number(t.value);
      else if (t === els.favOnly) f.favOnly = t.checked;
      else if (t === els.sort) f.sort = t.value;
      else if (t === els.osmToggle) {
        if (t.checked) loadOsm(); else { state.osmAbort?.abort(); osmLayer.clearLayers(); }
        return;
      } else return;
      render();
    });

    els.budget.addEventListener("input", () => {
      f.budget = Number(els.budget.value) >= 10000 ? Infinity : Number(els.budget.value);
      syncOutputs(); render();
    });

    els.radius.addEventListener("input", () => {
      f.radius = Number(els.radius.value);
      syncOutputs();
      if (state.center) drawCenter();
      render();
    });
    els.radius.addEventListener("change", () => {
      fitToRadius();
      if (els.osmToggle.checked) loadOsmDebounced();
    });

    els.filters.addEventListener("reset", () => {
      setTimeout(() => {
        Object.assign(f, { q: "", type: "all", budget: Infinity, rating: 0, radius: 10, favOnly: false, sort: "distance" });
        f.sports.clear();
        els.chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
        syncOutputs();
        if (!els.osmToggle.checked) osmLayer.clearLayers();
        if (state.center) { drawCenter(); fitToRadius(); }
        render();
      });
    });

    els.results.addEventListener("click", (e) => {
      const favBtn = e.target.closest("[data-fav]");
      if (favBtn) { e.stopPropagation(); toggleFav(favBtn.dataset.fav); return; }
      const card = e.target.closest(".card");
      if (card) focusListing(card.dataset.id);
    });
    els.results.addEventListener("keydown", (e) => {
      const card = e.target.closest(".card");
      if (card && (e.key === "Enter" || e.key === " ") && e.target === card) { e.preventDefault(); focusListing(card.dataset.id); }
    });

    map.on("click", (e) => {
      if (state.pendingPlacementId) { placePending(e.latlng); return; }
      setCenter(e.latlng, { fit: false });
      setStatus("Searching around the selected point. Press “Use my location” to go back.", "");
    });

    els.locateBtn.addEventListener("click", () => locate());
    els.addBtn.addEventListener("click", openAdd);
    els.cancelAdd.addEventListener("click", () => els.addDialog.close());
    els.addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!els.addForm.reportValidity()) return;
      saveListing(Object.fromEntries(new FormData(els.addForm)));
      els.addDialog.close();
    });

    document.querySelectorAll(".mobile-toggle button").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));
    mq.addEventListener("change", syncMobile);
  }

  // ---------- Init ----------
  state.filters.budget = Infinity;
  buildSportControls();
  syncOutputs();
  bind();
  syncMobile();
  showView("list");
  resolveListings();
  locate({ initial: true });
})();

