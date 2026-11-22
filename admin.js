/* GoGapo admin: manage the Explore cards (saved in this browser's localStorage) */
(() => {
    'use strict';

    // Soft gate only: this is a static site, so the passcode is visible to anyone who views this file.
    // Change it. For real protection, move the data to a backend (e.g. Supabase) with proper login.
    const PASSCODE = 'gogapo2026';

    const KEY = 'gogapo:explore';
    const AUTH = 'gogapo:admin';
    const TAGS = { destinations: 'Destination', food: 'Food', stay: 'Hotels & Services', activities: 'Activities' };

    const DEFAULTS = [
        { id: 'rizal', name: 'Rizal Triangle', cat: 'destinations', tag: 'Destination', img: 'rizal-triangle.png', visible: true,
          blurb: 'A lively area for street food, bars and people-watching in the heart of the city.',
          desc: 'A small park surrounded by one of Olongapo\'s busiest districts. It is known for its bars, restaurants and nightlife, a legacy of the years when the nearby U.S. Naval Base Subic Bay was active.',
          query: 'Rizal Triangle, Olongapo City' },
        { id: 'magsaysay', name: 'Magsaysay Drive Eats', cat: 'food', tag: 'Food', img: 'magsaysay-drive.png', visible: true,
          blurb: 'Restaurants, cafés and shops lined up along the city\'s main road.',
          desc: 'Restaurants, cafés and shops lined up along Magsaysay Drive, one of the city\'s main roads. An easy area to walk through when you are looking for a meal or a snack.',
          query: 'Magsaysay Drive, Olongapo City' },
        { id: 'barretto', name: 'Barrio Barretto', cat: 'destinations', tag: 'Destination', img: 'barretto-beach.jpg', visible: true,
          blurb: 'A beachfront stretch with seaside dining, sunsets and places to stay.',
          desc: 'A coastal barangay on Subic Bay with a long stretch of beachfront resorts, restaurants and bars. A common choice for a weekend swim, a seafood meal or a short stay by the sea.',
          query: 'Barrio Barretto, Olongapo City' },
        { id: 'stay', name: 'Stay & Relax', cat: 'stay', tag: 'Hotels & Services', img: 'stay-relax.png', visible: true,
          blurb: 'Hotels, inns and resorts for every budget, close to the city\'s best spots.',
          desc: 'Hotels, inns and resorts across Olongapo City and along the Subic Bay shoreline. Check each place for rooms and rates before you go.',
          query: 'Hotels in Olongapo City' },
        { id: 'subic', name: 'Subic Bay Adventures', cat: 'activities', tag: 'Activities', img: 'subic-bay.png', visible: true,
          blurb: 'Boat rides, beach days and outdoor fun around beautiful Subic Bay.',
          desc: 'Boat rides, beach days and outdoor fun around Subic Bay, with plenty to try for families and groups of friends.',
          query: 'Subic Bay' },
        { id: 'streetfood', name: 'Street Food Crawl', cat: 'food', tag: 'Food', img: 'street-food.png', visible: true,
          blurb: 'Grilled favorites, snacks and sweet treats served up by local vendors.',
          desc: 'Grilled favorites, snacks and sweet treats served up by local vendors. A tasty way to get to know the city, one stall at a time.',
          query: 'Street food, Olongapo City' }
    ];

    const $ = (s, r = document) => r.querySelector(s);
    function el(tag, cls, text) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }

    /* ---------- storage ---------- */
    function load() {
        try {
            const v = JSON.parse(localStorage.getItem(KEY) || 'null');
            if (Array.isArray(v)) return v;
        } catch (e) { /* fall through */ }
        return DEFAULTS.map((d) => ({ ...d }));
    }
    let items = load();

    function save() {
        try {
            localStorage.setItem(KEY, JSON.stringify(items));
            return true;
        } catch (e) {
            alert('Could not save. The browser storage is full, so try a smaller image or delete some cards.');
            return false;
        }
    }

    /* ---------- login ---------- */
    const loginView = $('#login-view');
    const dashView = $('#dash-view');
    const logoutBtn = $('#logout');

    function showDash(on) {
        loginView.hidden = on;
        dashView.hidden = !on;
        logoutBtn.hidden = !on;
        if (on) render();
    }

    $('#login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        if ($('#passcode').value === PASSCODE) {
            sessionStorage.setItem(AUTH, '1');
            $('#passcode').value = '';
            $('#login-error').textContent = '';
            showDash(true);
        } else {
            $('#login-error').textContent = 'Wrong passcode.';
        }
    });
    logoutBtn.addEventListener('click', () => { sessionStorage.removeItem(AUTH); showDash(false); });
    showDash(sessionStorage.getItem(AUTH) === '1');

    /* ---------- list ---------- */
    const grid = $('#admin-grid');
    const status = $('#admin-status');
    let filter = 'all';

    $('#admin-filters').addEventListener('click', (e) => {
        const b = e.target.closest('.label');
        if (!b) return;
        filter = b.dataset.filter;
        document.querySelectorAll('#admin-filters .label').forEach((x) => x.classList.toggle('active', x === b));
        render();
    });

    function move(id, dir) {
        const i = items.findIndex((p) => p.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= items.length) return;
        [items[i], items[j]] = [items[j], items[i]];
        save(); render();
    }

    function render() {
        grid.replaceChildren();
        const shown = items.filter((p) => filter === 'all' || p.cat === filter);
        status.textContent = shown.length
            ? `${shown.length} card${shown.length === 1 ? '' : 's'}${filter === 'all' ? '' : ' in this category'}. ${items.filter((p) => p.visible === false).length} hidden.`
            : 'No cards here yet. Click "+ Add place".';

        shown.forEach((p) => {
            const card = el('div', 'explore-card' + (p.visible === false ? ' is-hidden' : ''));
            const img = el('img');
            img.src = p.img || '';
            img.alt = p.name;
            const body = el('div', 'explore-body');
            body.append(el('h3', null, p.name), el('p', null, p.blurb));
            const actions = el('div', 'admin-card-actions');

            const btn = (label, cls, fn) => {
                const b = el('button', 'admin-btn small ' + cls, label);
                b.type = 'button';
                b.addEventListener('click', fn);
                return b;
            };
            actions.append(
                btn('Edit', 'ghost', () => openForm(p)),
                btn(p.visible === false ? 'Show' : 'Hide', 'ghost', () => { p.visible = p.visible === false; save(); render(); }),
                btn('←', 'ghost', () => move(p.id, -1)),
                btn('→', 'ghost', () => move(p.id, 1)),
                btn('Delete', 'danger', () => {
                    if (confirm(`Delete "${p.name}"?`)) { items = items.filter((x) => x.id !== p.id); save(); render(); }
                })
            );
            actions.children[2].title = 'Move earlier';
            actions.children[3].title = 'Move later';

            card.append(img, el('span', 'tag', p.tag), body, actions);
            if (p.visible === false) card.appendChild(el('span', 'hidden-flag', 'Hidden'));
            grid.appendChild(card);
        });
    }

    /* ---------- form ---------- */
    const modal = $('#edit-modal');
    const form = $('#edit-form');
    const f = {
        name: $('#f-name'), cat: $('#f-cat'), tag: $('#f-tag'), blurb: $('#f-blurb'),
        query: $('#f-query'), visible: $('#f-visible')
    };
    const imgEl = $('#img-el');
    const imgEmpty = $('#img-empty');
    let editing = null;
    let imgData = '';
    let tagTouched = false;

    function setPreview(src) {
        imgData = src || '';
        imgEl.hidden = !imgData;
        imgEmpty.hidden = !!imgData;
        if (imgData) imgEl.src = imgData;
    }

    function openForm(p) {
        editing = p || null;
        $('#form-title').textContent = p ? 'Edit place' : 'Add place';
        f.name.value = p?.name || '';
        f.cat.value = p?.cat || 'destinations';
        f.tag.value = p?.tag || TAGS[f.cat.value];
        f.blurb.value = p?.blurb || '';
        f.query.value = p?.query || '';
        f.visible.checked = p ? p.visible !== false : true;
        tagTouched = !!p;
        setPreview(p?.img || '');
        $('#img-file').value = '';
        $('#form-error').textContent = '';
        modal.hidden = false;
        f.name.focus();
    }
    const closeForm = () => { modal.hidden = true; };

    $('#add-btn').addEventListener('click', () => openForm(null));
    modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeForm(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeForm(); });
    f.tag.addEventListener('input', () => { tagTouched = true; });
    f.cat.addEventListener('change', () => { if (!tagTouched) f.tag.value = TAGS[f.cat.value]; });

    // shrink uploads so they fit in browser storage
    $('#img-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const im = new Image();
            im.onload = () => {
                const max = 900;
                const scale = Math.min(1, max / im.width);
                const c = document.createElement('canvas');
                c.width = Math.round(im.width * scale);
                c.height = Math.round(im.height * scale);
                c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
                setPreview(c.toDataURL('image/jpeg', 0.8));
            };
            im.onerror = () => { $('#form-error').textContent = 'That file is not a readable image.'; };
            im.src = reader.result;
        };
        reader.readAsDataURL(file);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!imgData) { $('#form-error').textContent = 'Please upload an image.'; return; }
        const data = {
            name: f.name.value.trim(), cat: f.cat.value, tag: f.tag.value.trim(),
            blurb: f.blurb.value.trim(), desc: f.blurb.value.trim(),
            query: f.query.value.trim() || f.name.value.trim() + ', Olongapo City',
            img: imgData, visible: f.visible.checked
        };
        const backup = JSON.stringify(items);
        if (editing) Object.assign(editing, data);
        else items.push({ id: 'p' + Date.now().toString(36), ...data });
        if (!save()) { items = JSON.parse(backup); return; }
        closeForm();
        render();
    });

    $('#reset-btn').addEventListener('click', () => {
        if (!confirm('Reset Explore to the original 6 cards? Your changes will be lost.')) return;
        localStorage.removeItem(KEY);
        items = load();
        render();
    });
})();
