/* GoGapo */

(() => {
    'use strict';

    /* ========== SETTINGS ========== */

    // Olongapo City center (fallback location)
    const CITY = { lat: 14.8292, lon: 120.2828 };
    const CITY_LIMIT_M = 12000; // meters

    const ENDPOINTS = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.private.coffee/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter'
    ];

   
    

    // 
    const AI_KEY = '';
    const AI_MODEL = '';

    /* ========== HELPERS ========== */

    const $ = (sel, root = document) => root.querySelector(sel);

    function el(tag, cls, text) {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text != null) node.textContent = text;
        return node;
    }

    function distanceM(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const rad = (d) => (d * Math.PI) / 180;
        const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
            Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    function fmtDist(m) {
        return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
    }

    function onceVisible(node, fn, margin = '200px') {
        if (!node) return;
        if (!('IntersectionObserver' in window)) { fn(); return; }
        const io = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
        }, { rootMargin: margin });
        io.observe(node);
    }

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    // set by the popup section
    const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // curated link/card > place object
    function entryFrom(link) {
        const d = link.dataset;
        return {
            id: 'cur:' + d.query,
            name: link.querySelector('h3').textContent,
            label: link.querySelector('.tag')?.textContent || '',
            cat: d.cat || 'destinations',
            desc: d.desc || '',
            query: d.query,
            osm: d.osm,
            lat: d.lat ? parseFloat(d.lat) : null,
            lon: d.lon ? parseFloat(d.lon) : null,
            tags: {}
        };
    }

    let openPopup = () => {};

    /* ========== PLACES (Overpass) ========== */

    const LABELS = {
        restaurant: 'Restaurant', cafe: 'Cafe', fast_food: 'Fast Food', bar: 'Bar', pub: 'Pub',
        hotel: 'Hotel', hostel: 'Hostel', guest_house: 'Guest House', resort: 'Resort', motel: 'Motel',
        cinema: 'Cinema', nightclub: 'Nightclub', sports_centre: 'Sports Center',
        fitness_centre: 'Gym', water_park: 'Water Park', marina: 'Marina', theme_park: 'Theme Park',
        park: 'Park', beach_resort: 'Beach Resort', attraction: 'Attraction', museum: 'Museum',
        viewpoint: 'Viewpoint', gallery: 'Gallery'
    };

    // returns [category, label]
    function classify(t) {
        const a = t.amenity, tr = t.tourism, l = t.leisure;
        if (['restaurant', 'cafe', 'fast_food', 'bar', 'pub'].includes(a)) return ['food', LABELS[a]];
        if (['hotel', 'hostel', 'guest_house', 'resort', 'motel'].includes(tr)) return ['stay', LABELS[tr]];
        if (['cinema', 'nightclub'].includes(a)) return ['activities', LABELS[a]];
        if (['sports_centre', 'fitness_centre', 'water_park', 'marina'].includes(l)) return ['activities', LABELS[l]];
        if (tr === 'theme_park') return ['activities', LABELS[tr]];
        if (t.natural === 'beach') return ['destinations', 'Beach'];
        if (l === 'beach_resort' || l === 'park') return ['destinations', LABELS[l]];
        if (['attraction', 'museum', 'viewpoint', 'gallery'].includes(tr)) return ['destinations', LABELS[tr]];
        if (t.historic) return ['destinations', 'Landmark'];
        return ['destinations', 'Place'];
    }

    function subtitle(t) {
        if (t.cuisine) {
            const c = t.cuisine.split(';').map((s) => s.replace(/_/g, ' ')).join(', ');
            return c.charAt(0).toUpperCase() + c.slice(1);
        }
        if (t['addr:street']) return t['addr:street'];
        return 'Olongapo City';
    }

    function buildQuery(lat, lon, radius, limit) {
        const ar = `(around:${radius},${lat},${lon})`;
        return `[out:json][timeout:30];(
            nwr["name"]["amenity"~"^(restaurant|cafe|fast_food|bar|pub|cinema|nightclub)$"]${ar};
            nwr["name"]["tourism"~"^(attraction|hotel|hostel|guest_house|resort|motel|museum|viewpoint|gallery|theme_park)$"]${ar};
            nwr["name"]["leisure"~"^(park|beach_resort|sports_centre|fitness_centre|water_park|marina)$"]${ar};
            nwr["name"]["natural"="beach"]${ar};
            nwr["name"]["historic"]${ar};
        );out center ${limit};`;
    }

    async function overpass(query) {
        const key = 'gogapo:' + query;
        try {
            const cached = sessionStorage.getItem(key);
            if (cached) return JSON.parse(cached);
        } catch (e) { /* storage unavailable, ignore */ }

        let lastError;
        for (let round = 0; round < 2; round++) {
            for (const url of ENDPOINTS) {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 15000);
                try {
                    const res = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(query), signal: ctrl.signal });
                    if (!res.ok) throw new Error('the map data server answered HTTP ' + res.status);
                    const json = await res.json();
                    try { sessionStorage.setItem(key, JSON.stringify(json)); } catch (e) { /* too big, ignore */ }
                    return json;
                } catch (err) {
                    console.warn('Map data request failed at', url, err);
                    if (err.name === 'AbortError') lastError = new Error('the map data server took too long');
                    else if (err instanceof SyntaxError) lastError = new Error('the map data server sent an unreadable reply');
                    else if (err instanceof TypeError) lastError = new Error('could not reach the map data server');
                    else lastError = err;
                } finally {
                    clearTimeout(timer);
                }
            }
            await wait(1500); // busy server: pause, then retry once
        }
        throw lastError;
    }

    async function fetchPlaces(lat, lon, radius, limit) {
        const data = await overpass(buildQuery(lat, lon, radius, limit));
        const seen = new Set();
        const out = [];
        for (const e of data.elements) {
            const pLat = e.lat ?? e.center?.lat;
            const pLon = e.lon ?? e.center?.lon;
            if (pLat == null || pLon == null || !e.tags?.name) continue;
            const id = e.type + e.id;
            if (seen.has(id)) continue;
            seen.add(id);
            const [cat, label] = classify(e.tags);
            out.push({ id, name: e.tags.name, cat, label, sub: subtitle(e.tags), lat: pLat, lon: pLon, tags: e.tags });
        }
        return out;
    }

    /* ========== NEAR YOU ========== */

    const nearBtn = $('.location-header .location');
    const nearStatus = $('#nearby-status');
    const nearList = $('#nearby-list');

    function renderNearList(places) {
        nearList.replaceChildren();
        places.forEach((p) => {
            const li = el('li');
            const a = el('a', 'popular-items');
            a.href = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;
            a.target = '_blank';
            a.rel = 'noopener';
            a.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey || e.shiftKey) return; // let "open in new tab" work
                e.preventDefault();
                openPopup(p);
            });

            const info = el('div', 'popular-info');
            info.append(el('h3', null, p.name), el('p', null, p.sub));

            a.append(el('span', 'distance', fmtDist(p.dist)), info, el('span', 'tag', p.label));
            li.appendChild(a);
            nearList.appendChild(li);
        });
    }

    async function showNear(lat, lon, note, isUser) {
        nearStatus.textContent = 'Searching nearby…';
        nearList.replaceChildren();
        try {
            let places = [];
            for (const r of [1000, 2000, 4000]) {
                places = await fetchPlaces(lat, lon, r, 150);
                places.forEach((p) => { p.dist = distanceM(lat, lon, p.lat, p.lon); p.fromUser = isUser; });
                places.sort((a, b) => a.dist - b.dist);
                if (places.length >= 8) break;
            }
            places = places.slice(0, 15);
            if (!places.length) {
                nearStatus.textContent = `${note} No places found around here yet.`;
                return;
            }
            nearStatus.textContent = `${note} Showing the ${places.length} closest places. Tap one for details.`;
            renderNearList(places);
        } catch (err) {
            console.error(err);
            nearStatus.textContent = `Could not load nearby places (${err.message}). Check your internet, then tap "Use my location" to try again.`;
        }
    }

    function geoMessage(err) {
        const fileTip = location.protocol === 'file:'
            ? ' Tip: browsers often block location on pages opened as a file. Open the site from localhost or HTTPS.'
            : '';
        if (err.code === 1) return 'Location access is blocked, so this shows places around Olongapo City center. Allow location for this site in your browser, then try again.' + fileTip;
        if (err.code === 3) return 'Getting your location timed out, so this shows places around Olongapo City center.' + fileTip;
        return 'We could not find your location (is location turned on for your device?), so this shows places around Olongapo City center.' + fileTip;
    }

    if (nearBtn && nearStatus && nearList) {
        // default: city center
        onceVisible($('#nearest'), () =>
            showNear(CITY.lat, CITY.lon, 'Showing places around Olongapo City center. Tap "Use my location" for what is closest to you.', false));

        nearBtn.addEventListener('click', () => {
            if (!('geolocation' in navigator)) {
                showNear(CITY.lat, CITY.lon, 'Your browser does not support location, so this shows places around Olongapo City center.', false);
                return;
            }
            nearBtn.disabled = true;
            nearBtn.textContent = 'Locating…';
            nearStatus.textContent = 'Getting your location…';

            const done = () => { nearBtn.disabled = false; nearBtn.textContent = 'Use my location'; };

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude: lat, longitude: lon } = pos.coords;
                    if (distanceM(lat, lon, CITY.lat, CITY.lon) > CITY_LIMIT_M) {
                        await showNear(CITY.lat, CITY.lon, 'You seem to be outside Olongapo, so this shows places around the city center.', false);
                    } else {
                        await showNear(lat, lon, 'Based on your location.', true);
                    }
                    done();
                },
                async (err) => {
                    await showNear(CITY.lat, CITY.lon, geoMessage(err), false);
                    done();
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
            );
        });
    }

    /* ========== EXPLORE (curated cards: filter + search) ========== */

    const grid = $('#explore-grid');
    const exploreStatus = $('#explore-status');
    const filterBtns = document.querySelectorAll('.explore-button .label');
    const searchBar = $('.search-bar');
    const cards = grid ? Array.from(grid.children) : [];

    let filter = 'all';
    let query = '';

    /* SEARCH SCORING: name match first, then category/description */
    function scorePlace(p, q) {
        const name = norm(p.name);
        if (name === q) return 100;
        if (name.startsWith(q)) return 80;
        if (name.split(/\s+/).some((w) => w.startsWith(q))) return 60;
        if (name.includes(q)) return 40;
        const info = norm([p.label, p.desc].join(' '));
        if (info.includes(q)) return 20;
        const all = name + ' ' + info;
        if (q.split(/\s+/).every((w) => all.includes(w))) return 10;
        return 0;
    }

    function setActiveFilter(value) {
        filter = value;
        filterBtns.forEach((b) => b.classList.toggle('active', b.dataset.filter === value));
    }

    function applyExplore() {
        const q = norm(query);
        const scored = cards.map((card, i) => ({ card, i, s: q ? scorePlace(entryFrom(card), q) : 1 }));
        scored.sort((a, b) => b.s - a.s || a.i - b.i);

        let visible = 0;
        scored.forEach(({ card, s }) => {
            const show = s > 0 && (filter === 'all' || card.dataset.cat === filter);
            card.hidden = !show;
            if (show) visible++;
            grid.appendChild(card);
        });

        if (!visible) exploreStatus.textContent = 'No places match. Try another word or category.';
        else if (q) exploreStatus.textContent = `${visible} result${visible === 1 ? '' : 's'} for "${query.trim()}"`;
        else exploreStatus.textContent = '';
    }

    if (grid && exploreStatus) {
        filterBtns.forEach((btn) => btn.addEventListener('click', () => {
            setActiveFilter(btn.dataset.filter || 'all');
            applyExplore();
        }));
    }

    /* ---- hero search bar ---- */

    const suggestBox = $('#search-suggest');
    let current = [];
    let activeIdx = -1;

    // Popular Now + Explore cards, no duplicates
    function searchEntries() {
        const seen = new Set();
        const out = [];
        document.querySelectorAll('.popular-items[data-query], .explore-card[data-query]').forEach((link) => {
            const e = entryFrom(link);
            const key = norm(e.name);
            if (seen.has(key)) return;
            seen.add(key);
            out.push(e);
        });
        return out;
    }

    function findSuggestions(text) {
        const q = norm(text);
        if (!q) return [];
        return searchEntries()
            .map((p) => ({ p, s: scorePlace(p, q) }))
            .filter((x) => x.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, 6)
            .map((x) => x.p);
    }

    function hideSuggest() {
        suggestBox.hidden = true;
        searchBar.setAttribute('aria-expanded', 'false');
        activeIdx = -1;
    }

    function setActiveSuggest(i) {
        activeIdx = i;
        Array.from(suggestBox.children).forEach((li, n) => {
            li.classList.toggle('active', n === i);
            li.setAttribute('aria-selected', n === i ? 'true' : 'false');
        });
    }

    function choose(i) {
        const p = current[i];
        if (!p) return;
        hideSuggest();
        searchBar.value = p.name;
        openPopup(p);
    }

    function showSuggest() {
        if (!searchBar.value.trim()) { hideSuggest(); return; }
        current = findSuggestions(searchBar.value);
        suggestBox.replaceChildren();
        if (!current.length) {
            suggestBox.appendChild(el('li', 'suggest-empty', 'No matches. Try another word.'));
        } else {
            current.forEach((p, i) => {
                const li = el('li', 'suggest-item');
                li.setAttribute('role', 'option');
                li.append(el('span', 'suggest-name', p.name), el('span', 'suggest-tag', p.label));
                li.addEventListener('mousedown', (e) => { e.preventDefault(); choose(i); });
                suggestBox.appendChild(li);
            });
        }
        suggestBox.hidden = false;
        searchBar.setAttribute('aria-expanded', 'true');
        activeIdx = -1;
    }

    function runSearch() {
        query = searchBar.value;
        setActiveFilter('all');
        hideSuggest();
        applyExplore();
        $('#recommendation').scrollIntoView({ behavior: 'smooth' });
    }

    if (searchBar && suggestBox && grid && exploreStatus) {
        searchBar.addEventListener('input', () => {
            if (searchBar.value === '' && query) { query = ''; applyExplore(); }
            showSuggest();
        });
        searchBar.addEventListener('focus', showSuggest);
        searchBar.addEventListener('keydown', (e) => {
            const n = current.length;
            if (e.key === 'ArrowDown' && n) { e.preventDefault(); setActiveSuggest((activeIdx + 1) % n); }
            else if (e.key === 'ArrowUp' && n) { e.preventDefault(); setActiveSuggest((activeIdx - 1 + n) % n); }
            else if (e.key === 'Escape') { hideSuggest(); }
            else if (e.key === 'Enter') { if (activeIdx >= 0) choose(activeIdx); else runSearch(); }
        });
        document.addEventListener('click', (e) => { if (!e.target.closest('.search-wrap')) hideSuggest(); });
    }

    /* ========== DESCRIPTIONS ========== */

    const NOUNS = {
        'Fast Food': 'fast food spot', 'Place': 'local spot', 'Gym': 'gym',
        'Guest House': 'guest house', 'Water Park': 'water park', 'Theme Park': 'theme park',
        'Sports Center': 'sports center', 'Beach Resort': 'beach resort'
    };

    // openers per category
    const INTROS = {
        food: [
            (n, a, t) => `${n} is ${a} ${t} where you can take a break and refuel while exploring Olongapo City.`,
            (n, a, t) => `Craving something good? ${n} is ${a} ${t} that locals and visitors can drop in on.`,
            (n, a, t) => `${n} is ${a} ${t} in Olongapo City, an easy stop for a satisfying meal.`
        ],
        stay: [
            (n, a, t) => `${n} is ${a} ${t} that gives you a place to rest and recharge in Olongapo City.`,
            (n, a, t) => `Need a base for your trip? ${n} is ${a} ${t} close to the city's sights, shops and Subic Bay.`,
            (n, a, t) => `${n} is ${a} ${t} in Olongapo City, a handy place to settle in during your visit.`
        ],
        activities: [
            (n, a, t) => `${n} is ${a} ${t} in Olongapo City, a fun way to fill part of your day.`,
            (n, a, t) => `Looking for something to do? ${n} is ${a} ${t} worth adding to your plans.`,
            (n, a, t) => `${n} is ${a} ${t} where you can unwind and enjoy your time in the city.`
        ],
        destinations: [
            (n, a, t) => `${n} is ${a} ${t} in Olongapo City, worth a stop while you explore the area.`,
            (n, a, t) => `Add ${n} to your list: ${a} ${t} that shows off a different side of Olongapo City.`,
            (n, a, t) => `${n} is ${a} ${t} that is easy to fit into a day of discovering Olongapo City.`
        ]
    };

    const CLOSERS = {
        food: ['Come hungry!', 'A tasty stop on your Olongapo trip.', 'Great for a quick bite or a relaxed meal.'],
        stay: ['A comfortable place to end your day.', 'Check ahead for rooms and rates.', 'A handy base for your trip.'],
        activities: ['Perfect for a break from sightseeing.', 'Bring friends along!', 'A great way to add some fun to your day.'],
        destinations: ['Don\'t forget your camera!', 'A nice spot to slow down and look around.', 'Worth a visit while you are nearby.']
    };

    // same place, same wording
    function pick(list, seed) {
        let h = 0;
        for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        return list[h % list.length];
    }

    const GENERIC_NAMES = ['eatery', 'canteen', 'restaurant', 'cafe', 'carinderia', 'bar', 'hotel', 'resort', 'park'];

    // from OpenStreetMap 
    function templateDescribe(p) {
        const t = p.tags || {};
        const cat = INTROS[p.cat] ? p.cat : 'destinations';
        const noun = NOUNS[p.label] || (p.label || 'local spot').toLowerCase();
        const article = /^[aeiou]/.test(noun) ? 'an' : 'a';

        
        const generic = GENERIC_NAMES.includes(p.name.trim().toLowerCase());
        const opener = generic ? `This local ${noun}` : p.name;
        const parts = [];

        if (t.description) {
            parts.push(t.description.replace(/\s+$/, '').replace(/([^.!?])$/, '$1.')); // written by OSM mappers
        } else if (generic) {
            parts.push(`${opener} in Olongapo City is an easy stop while you explore.`);
        } else {
            parts.push(pick(INTROS[cat], p.id)(opener, article, noun));
        }

        const street = t['addr:street'];
        if (street) parts.push(`You can find it along ${street}.`);
        if (t.cuisine) {
            const c = t.cuisine.split(';').map((s) => s.replace(/_/g, ' ').trim()).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
            parts.push(`The menu leans toward ${c} cuisine.`);
        }
        if (p.dist != null) {
            parts.push(p.fromUser
                ? `It is about ${fmtDist(p.dist)} from where you are.`
                : `It is about ${fmtDist(p.dist)} from Olongapo City center.`);
        }
        parts.push(pick(CLOSERS[cat], p.id + 'c'));
        return parts.join(' ');
    }

    // details card
    function detailsFor(p) {
        const t = p.tags || {};
        const rows = [];
        const addr = [t['addr:housenumber'], t['addr:street'], t['addr:city'] || t['addr:suburb']].filter(Boolean).join(' ');
        if (addr) rows.push(['📍', addr]);
        if (t.opening_hours && t.opening_hours.length <= 80) rows.push(['🕒', t.opening_hours.replace(/;\s*/g, ' · ')]);
        const phone = t.phone || t['contact:phone'];
        if (phone) rows.push(['📞', phone]);
        const web = t.website || t['contact:website'];
        if (web && /^https?:\/\//i.test(web)) rows.push(['🌐', web, web]);
        return rows;
    }

    function factsFor(p) {
        const t = p.tags || {};
        const lines = [`Name: ${p.name}`, `Type: ${p.label}`, 'Location: Olongapo City, Zambales, Philippines'];
        if (t['addr:street']) lines.push(`Street: ${t['addr:street']}`);
        if (t.cuisine) lines.push(`Cuisine: ${t.cuisine.replace(/[;_]/g, ' ')}`);
        if (t.opening_hours) lines.push(`Opening hours: ${t.opening_hours}`);
        if (t.description) lines.push(`Notes: ${t.description}`);
        return lines.join('\n');
    }

    const aiEnabled = () => Boolean(AI_URL && AI_KEY && AI_MODEL);

    async function aiDescribe(p) {
        const cacheKey = 'gogapo:desc:' + p.id;
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) return cached;
        } catch (e) { /* ignore */ }

        const res = await fetch(AI_URL.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + AI_KEY },
            body: JSON.stringify({
                model: AI_MODEL,
                temperature: 0.3,
                max_tokens: 120,
                messages: [
                    {
                        role: 'system',
                        content: 'You write short, friendly place descriptions for a tourism guide to Olongapo City, Philippines. ' +
                            'Write 2 sentences, at most 45 words. Use ONLY the facts provided. Never invent menu items, ' +
                            'history, prices, ratings, awards or opening years. If the facts are thin, keep it short and general.'
                    },
                    { role: 'user', content: factsFor(p) }
                ]
            })
        });
        if (!res.ok) throw new Error('AI HTTP ' + res.status);
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error('AI returned nothing');
        try { localStorage.setItem(cacheKey, text); } catch (e) { /* ignore */ }
        return text;
    }

    /* ========== PLACE POPUP ========== */

    const modal = $('#place-modal');
    if (modal) {
        const mTitle = $('#modal-title');
        const mTag = $('#modal-tag');
        const mDesc = $('#modal-desc');
        const mNote = $('#modal-note');
        const mDetails = $('#modal-details');
        const mMap = $('#modal-map');
        const mDir = $('#modal-directions');
        let lastFocus = null;
        let openToken = 0; // guards against stale lookups

        // find coordinates by name
        async function findByName(term) {
            const clean = term.replace(/[^\w\s'-]/g, '');
            const q = `[out:json][timeout:25];nwr["name"~"${clean}",i](around:10000,${CITY.lat},${CITY.lon});out center 10;`;
            const data = await overpass(q);
            const hit = data.elements.find((e) => (e.lat ?? e.center?.lat) != null);
            return hit ? { lat: hit.lat ?? hit.center.lat, lon: hit.lon ?? hit.center.lon } : null;
        }

        function directionsFor(p, pos) {
            const dest = pos ? `${pos.lat},${pos.lon}` : encodeURIComponent(p.query || `${p.name} Olongapo City`);
            return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
        }

        // OSM embed
        function showMap(pos) {
            const dLon = 0.005, dLat = 0.003;
            const bbox = [pos.lon - dLon, pos.lat - dLat, pos.lon + dLon, pos.lat + dLat].join('%2C');
            mMap.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${pos.lat}%2C${pos.lon}`;
            mMap.hidden = false;
        }

        async function loadMap(p, token) {
            let pos = p.lat != null && p.lon != null ? { lat: p.lat, lon: p.lon } : null;
            if (!pos && p.osm) {
                try { pos = await findByName(p.osm); } catch (err) { console.error(err); }
            }
            if (token !== openToken || !pos) return;
            showMap(pos);
            mDir.href = directionsFor(p, pos);
        }

        function renderDetails(p) {
            mDetails.replaceChildren();
            const rows = detailsFor(p);
            rows.forEach(([icon, text, href]) => {
                const li = el('li');
                li.append(el('span', 'detail-icon', icon));
                if (href) {
                    const a = el('a', null, text.replace(/^https?:\/\//i, '').replace(/\/$/, ''));
                    a.href = href; a.target = '_blank'; a.rel = 'noopener';
                    li.appendChild(a);
                } else {
                    li.appendChild(el('span', null, text));
                }
                mDetails.appendChild(li);
            });
            mDetails.hidden = !rows.length;
        }

        async function loadAi(p, token) {
            mDesc.classList.add('loading');
            try {
                const text = await aiDescribe(p);
                if (token !== openToken) return;
                mDesc.textContent = text;
                mNote.hidden = false;
            } catch (err) {
                console.warn('AI description failed, keeping the built-in one.', err);
            } finally {
                if (token === openToken) mDesc.classList.remove('loading');
            }
        }

        openPopup = (p) => {
            const token = ++openToken;
            mTitle.textContent = p.name;
            mTag.textContent = p.label || '';
            mTag.hidden = !p.label;
            mDesc.textContent = p.desc || templateDescribe(p);
            mDesc.classList.remove('loading');
            mNote.hidden = true;
            renderDetails(p);
            mMap.hidden = true;
            mMap.src = 'about:blank';
            mDir.href = directionsFor(p, p.lat != null ? p : null);

            lastFocus = document.activeElement;
            modal.hidden = false;
            document.body.classList.add('modal-open');
            $('.modal-close', modal).focus();

            loadMap(p, token);
            // curated text is kept
            if (!p.desc && aiEnabled()) loadAi(p, token);
        };

        function closePopup() {
            openToken++;
            modal.hidden = true;
            mMap.src = 'about:blank';
            document.body.classList.remove('modal-open');
            if (lastFocus) lastFocus.focus();
        }

        // Popular Now + Explore cards
        [$('.popular-list'), grid].forEach((list) => {
            if (!list) return;
            list.addEventListener('click', (e) => {
                const link = e.target.closest('[data-query]');
                if (!link || e.ctrlKey || e.metaKey || e.shiftKey) return;
                e.preventDefault();
                openPopup(entryFrom(link));
            });
        });

        modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closePopup(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closePopup(); });
    }

    /* ========== PROMOTE FORM ========== */

    const form = $('.promote-form');
    if (form) {
        const note = $('.form-note', form);
        const submit = $('button[type="submit"]', form);
        const defaultNote = note.textContent;

        const say = (msg, type) => { note.textContent = msg; note.className = 'form-note ' + (type || ''); };

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = new FormData(form);
            if (data.get('_gotcha')) return; // spam trap

            if (FORM_ENDPOINT) {
                submit.disabled = true;
                say('Sending…');
                try {
                    const res = await fetch(FORM_ENDPOINT, {
                        method: 'POST', body: data, headers: { Accept: 'application/json' }
                    });
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    form.reset();
                    say('Thanks! Your request was sent. We will email you after we review it.', 'success');
                } catch (err) {
                    console.error(err);
                    say('Something went wrong. Please try again in a moment.', 'error');
                } finally {
                    submit.disabled = false;
                }
            } else if (CONTACT_EMAIL) {
                const body = Array.from(data)
                    .filter(([k]) => k !== '_gotcha')
                    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('\n');
                window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('GoGapo business request')}&body=${encodeURIComponent(body)}`;
                say('Your email app should open with the details filled in. Press send to finish.', 'success');
            } else {
                say('This form is not connected yet. Set FORM_ENDPOINT or CONTACT_EMAIL at the top of script.js.', 'error');
            }
        });

        form.addEventListener('input', () => { if (note.textContent !== defaultNote) say(defaultNote); });
    }
})();

