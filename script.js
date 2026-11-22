/* GoGapo – everything runs on free services (no payment):
   - Browser Geolocation API
   - OpenStreetMap data through the Overpass API
   - OpenStreetMap's own embeddable map (inside the popup)
   - Google Maps links for directions (just URLs)
   - Optional: any AI service with a free tier for place descriptions (see AI settings) */

(() => {
    'use strict';

    /* ========== SETTINGS ========== */

    // Olongapo City center. Used when the visitor is outside the city
    // or blocks location access.
    const CITY = { lat: 14.8292, lon: 120.2828 };
    const CITY_LIMIT_M = 12000; // farther than this = "not in Olongapo"

    const ENDPOINTS = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.private.coffee/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter'
    ];

    console.info('GoGapo script v4 loaded');

    // Promote form (pick ONE, both are free):
    //  1) Sign up at https://formspree.io, create a form, paste its URL here
    //     e.g. 'https://formspree.io/f/abcdwxyz'
    //  2) Or put an email in CONTACT_EMAIL and the form opens the visitor's email app
    const FORM_ENDPOINT = '';
    const CONTACT_EMAIL = '';

    // AI place descriptions (OPTIONAL). Leave these empty and the popup uses the
    // built-in description made from OpenStreetMap facts (free, always the same).
    // To turn AI on, fill in all three with any OpenAI-compatible service that has
    // a free tier, e.g. AI_URL 'https://api.groq.com/openai/v1'.
    // WARNING: the key is visible to anyone who views your page source, so use a
    // free-tier key with low limits, never a paid one.
    const AI_URL = '';
    const AI_KEY = '';
    const AI_MODEL = '';

    /* ========== HELPERS ========== */

    const $ = (sel, root = document) => root.querySelector(sel);

    function el(tag, cls, text) {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text != null) node.textContent = text; // textContent = safe from HTML injection
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
        return m < 1000 ? ${Math.round(m)} m : ${(m / 1000).toFixed(1)} km;
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

    // Filled in by the popup section below
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

    // Returns [category, label]. Categories match the Explore buttons.
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
        const ar = (around:${radius},${lat},${lon});
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

    /* ========== NEAR YOU (list only) ========== */

    const nearBtn = $('.location');
    const nearStatus = $('#nearby-status');
    const nearList = $('#nearby-list');

    function renderNearList(places) {
        nearList.replaceChildren();
        places.forEach((p) => {
            const li = el('li');
            const a = el('a', 'popular-items');
            a.href = https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}; // fallback if JS popup fails
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
                if (places.length >= 😎 break;
            }
            places = places.slice(0, 15);
            if (!places.length) {
                nearStatus.textContent = ${note} No places found around here yet.;
                return;
            }
            nearStatus.textContent = ${note} Showing the ${places.length} closest places. Tap one for details.;
            renderNearList(places);
        } catch (err) {
            console.error(err);
            nearStatus.textContent = Could not load nearby places (${err.message}). Check your internet, then tap "Use my location" to try again.;
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
        // Show the city center right away so the section is never empty
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

    /* ========== EXPLORE (filters + search) ========== */

    const grid = $('#explore-grid');
    const exploreStatus = $('#explore-status');
    const moreBtn = $('#explore-more');
    const filterBtns = document.querySelectorAll('.explore-button .label');
    const searchBar = $('.search-bar');
    const PAGE = 12;

    let allPlaces = [];
    let filter = 'all';
    let query = '';
    let shown = PAGE;
    let loading = null;

    function setActiveFilter(value) {
        filter = value;
        filterBtns.forEach((b) => b.classList.toggle('active', b.dataset.filter === value));
    }

    function renderExplore() {
        const q = query.trim().toLowerCase();
        const matches = allPlaces.filter((p) =>
            (filter === 'all' || p.cat === filter) && (!q || p.name.toLowerCase().includes(q)));

        grid.replaceChildren();
        matches.slice(0, shown).forEach((p) => {
            const card = el('article', 'explore-card');
            card.append(el('span', 'tag', p.label), el('h3', null, p.name), el('p', null, p.sub));
            const btn = el('button', 'explore-link', 'View details');
            btn.type = 'button';
            btn.addEventListener('click', () => openPopup(p));
            card.appendChild(btn);
            grid.appendChild(card);
        });

        if (!matches.length) {
            exploreStatus.textContent = q
                ? No places match "${query.trim()}". Try another name or category.
                : 'No places found in this category yet.';
        } else {
            exploreStatus.textContent = q
                ? ${matches.length} result${matches.length === 1 ? '' : 's'} for "${query.trim()}"
                : ${matches.length} places in Olongapo;
        }
        moreBtn.hidden = matches.length <= shown;
    }

    function loadExplore() {
        if (loading) return loading;
        exploreStatus.textContent = 'Loading places…';
        loading = fetchPlaces(CITY.lat, CITY.lon, 8000, 500)
            .then((list) => {
                allPlaces = list.sort((a, b) => a.name.localeCompare(b.name));
                renderExplore();
            })
            .catch((err) => {
                console.error(err);
                loading = null;
                exploreStatus.textContent = Could not load places (${err.message}). Check your internet and refresh the page.;
            });
        return loading;
    }

    if (grid && exploreStatus && moreBtn) {
        onceVisible($('#recommendation'), loadExplore, '300px');

        filterBtns.forEach((btn) => btn.addEventListener('click', () => {
            setActiveFilter(btn.dataset.filter || 'all');
            shown = PAGE;
            loadExplore().then(renderExplore);
        }));

        moreBtn.addEventListener('click', () => { shown += PAGE; renderExplore(); });

        // Hero search: press Enter to search all Olongapo places
        if (searchBar) {
            searchBar.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter') return;
                query = searchBar.value;
                shown = PAGE;
                setActiveFilter('all');
                $('#recommendation').scrollIntoView({ behavior: 'smooth' });
                loadExplore().then(renderExplore);
            });
            searchBar.addEventListener('input', () => {
                if (searchBar.value === '' && query) { query = ''; if (allPlaces.length) renderExplore(); }
            });
        }
    }

    /* ========== DESCRIPTIONS ========== */

    const NOUNS = { 'Fast Food': 'fast food restaurant', 'Place': 'local spot', 'Gym': 'gym' };
    const CLOSERS = {
        food: 'A good stop for a bite while you explore the city.',
        stay: 'A handy base for exploring the city.',
        activities: 'A fun addition to your day out.',
        destinations: 'Worth a stop while you are in the area.'
    };

    // Built only from facts in OpenStreetMap, so it never invents anything.
    function templateDescribe(p) {
        const t = p.tags || {};
        if (t.description) return t.description; // written by OpenStreetMap mappers

        const noun = NOUNS[p.label] || p.label.toLowerCase();
        const article = /^[aeiou]/.test(noun) ? 'an' : 'a';
        const street = t['addr:street'];
        const parts = [`${p.name} is ${article} ${noun}${street ? ' on ' + street : ''} in Olongapo City.`];

        let extras = 0;
        if (t.cuisine) {
            parts.push('Cuisine: ' + t.cuisine.split(';').map((s) => s.replace(/_/g, ' ')).join(', ') + '.');
            extras++;
        }
        if (t.opening_hours && t.opening_hours.length <= 60) { parts.push(Hours: ${t.opening_hours}.); extras++; }
        const phone = t.phone || t['contact:phone'];
        if (phone) { parts.push(Phone: ${phone}.); extras++; }
        if (p.dist != null) {
            parts.push(p.fromUser
                ? About ${fmtDist(p.dist)} from your location.
                : About ${fmtDist(p.dist)} from Olongapo City center.);
        }
        if (!extras) parts.push(CLOSERS[p.cat] || CLOSERS.destinations);
        return parts.join(' ');
    }

    function factsFor(p) {
        const t = p.tags || {};
        const lines = [`Name: ${p.name}`, Type: ${p.label}, 'Location: Olongapo City, Zambales, Philippines'];
        if (t['addr:street']) lines.push(Street: ${t['addr:street']});
        if (t.cuisine) lines.push(Cuisine: ${t.cuisine.replace(/[;_]/g, ' ')});
        if (t.opening_hours) lines.push(Opening hours: ${t.opening_hours});
        if (t.description) lines.push(Notes: ${t.description});
        return lines.join('\n');
    }

    const aiEnabled = () => Boolean(AI_URL && AI_KEY && AI_MODEL);

    async function aiDescribe(p) {
        const cacheKey = 'gogapo:desc:' + p.id;
        try {
            const cached = localStorage.getItem(cacheKey); // same place = same text next time
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
        const mMap = $('#modal-map');
        const mDir = $('#modal-directions');
        let lastFocus = null;
        let openToken = 0; // ignores slow lookups from a popup that was already closed

        // Look a place up by name in OpenStreetMap (only for Popular Now items without data-lat/data-lon)
        async function findByName(term) {
            const clean = term.replace(/[^\w\s'-]/g, '');
            const q = [out:json][timeout:25];nwr["name"~"${clean}",i](around:10000,${CITY.lat},${CITY.lon});out center 10;;
            const data = await overpass(q);
            const hit = data.elements.find((e) => (e.lat ?? e.center?.lat) != null);
            return hit ? { lat: hit.lat ?? hit.center.lat, lon: hit.lon ?? hit.center.lon } : null;
        }

        function directionsFor(p, pos) {
            const dest = pos ? ${pos.lat},${pos.lon} : encodeURIComponent(p.query || ${p.name} Olongapo City);
            return https://www.google.com/maps/dir/?api=1&destination=${dest};
        }

        // OpenStreetMap's official embed: free, no key, no tiles for us to manage
        function showMap(pos) {
            const dLon = 0.005, dLat = 0.003;
            const bbox = [pos.lon - dLon, pos.lat - dLat, pos.lon + dLon, pos.lat + dLat].join('%2C');
            mMap.src = https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${pos.lat}%2C${pos.lon};
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
            mMap.hidden = true;
            mMap.src = 'about:blank';
            mDir.href = directionsFor(p, p.lat != null ? p : null);

            lastFocus = document.activeElement;
            modal.hidden = false;
            document.body.classList.add('modal-open');
            $('.modal-close', modal).focus();

            loadMap(p, token);
            // Hand-written descriptions (Popular Now) are never replaced by AI
            if (!p.desc && aiEnabled()) loadAi(p, token);
        };

        function closePopup() {
            openToken++;
            modal.hidden = true;
            mMap.src = 'about:blank';
            document.body.classList.remove('modal-open');
            if (lastFocus) lastFocus.focus();
        }

        // Popular Now items
        const popularList = $('.popular-list');
        if (popularList) {
            popularList.addEventListener('click', (e) => {
                const link = e.target.closest('.popular-items');
                if (!link || e.ctrlKey || e.metaKey || e.shiftKey) return;
                e.preventDefault();
                const d = link.dataset;
                openPopup({
                    id: 'pop:' + d.query,
                    name: link.querySelector('h3').textContent,
                    label: link.querySelector('.tag')?.textContent || '',
                    desc: d.desc || '',
                    query: d.query,
                    osm: d.osm,
                    lat: d.lat ? parseFloat(d.lat) : null,
                    lon: d.lon ? parseFloat(d.lon) : null
                });
            });
        }

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
                    .map(([k, v]) => ${k.replace(/_/g, ' ')}: ${v}).join('\n');
                window.location.href = mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('GoGapo business request')}&body=${encodeURIComponent(body)};
                say('Your email app should open with the details filled in. Press send to finish.', 'success');
            } else {
                say('This form is not connected yet. Set FORM_ENDPOINT or CONTACT_EMAIL at the top of script.js.', 'error');
            }
        });

        form.addEventListener('input', () => { if (note.textContent !== defaultNote) say(defaultNote); });
    }
})();
