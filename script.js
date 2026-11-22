/* IMPORT FONTS*/
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

/* GENERAL SETTINGS */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: "Poppins", sans-serif;
}

html {
    scroll-behavior: smooth;
    scroll-padding-top: 80px;
}

body {
    background-color: #dcecc9;
    color: #123e32;
    min-height: 100vh;
    height: auto;
}

/* HIDDEN */
[hidden] {
    display: none !important;
}

:focus-visible {
    outline: 3px solid #ffb31b;
    outline-offset: 2px;
}

.section-content {
    width: 100%;
    margin: 0 auto;
    max-width: 1100px;
}

/*CONTENT SECTION*/

.content-section {
    padding: 50px 25px;
    min-height: 200px;
    border-top: 1px solid #b8d1a7;
}

.content-section h2 {
    font-size: 32px;
}

/* NAVIGATION BAR */

.navbar {
    padding: 10px 0;
    background-color: #0e3b2e;
    width: 100%;
    position: fixed;
    z-index: 100;
    top: 0;
}

.nav-inner {
    display: flex;
    padding: 5px;
    align-items: center;
    justify-content: space-between;
}

.nav-menu {
    display: flex;
    gap: 20px;
    list-style: none;
}

.nav-links {
    display: inline-block;
    color: white;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;

    padding: 10px 20px;
    background: transparent;
    border-radius: 999px;
    transition: 0.5s ease;
}

.nav-links:hover {
    background: #cde8a3;
    color: #0e3b2e;
}

.nav-item:last-child .nav-links {
    background: #ffb31b;
    color: #0e3b2e;
    font-weight: 600;
}

.logo {
    color: white;
    font-size: 20px;
    font-weight: bold;
    letter-spacing: auto;
    text-decoration: none;
}

.logo img {
    height: 50px;
    width: auto;
    display: block;
}

/* HERO SECTION */

.hero {
    height: 780px;

    background:
        linear-gradient(to bottom,
            #0e3b2e,
            hsla(162, 61%, 14%, 0.544),
            rgba(220, 236, 201, 1)),
        url("OlongapoAerialView.webp");

    background-size: cover;
    background-position: center;
    position: relative;
}

/* MAIN TITLE */

.hero-content {
    width: 100%;
    margin: 10px auto 0;
    text-align: center;
}

.title-group {
    padding: 80px;
    display: flex;
    justify-content: center;
}

.discoverolongapo {
    display: block;
    height: 600px;
    width: auto;

}

.search-wrap {
    position: relative;
    top: -150px;
    width: 95%;
    max-width: 800px;
    margin: 0 auto;
    z-index: 60;
    text-align: left;
}

.search-bar {
    display: block;
    width: 100%;
    padding: 10px 30px;
    border-radius: 40px;
    background-color: #f7f8ee;
    font-size: 18px;
    border: none;
}

.search-suggest {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 8px);
    list-style: none;
    background: #f7f8ee;
    border-radius: 20px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    max-height: 340px;
    overflow-y: auto;
}

.suggest-item,
.suggest-empty {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    font-size: 15px;
    cursor: pointer;
}

.suggest-empty { cursor: default; color: #286c53; }
.suggest-item + .suggest-item { border-top: 1px solid #dcecc9; }
.suggest-item:hover,
.suggest-item.active { background: #dcecc9; }
.suggest-name { font-weight: 600; overflow-wrap: anywhere; }

.suggest-tag {
    flex-shrink: 0;
    padding: 3px 10px;
    border-radius: 999px;
    background: #ffd98a;
    font-size: 12px;
    font-weight: 600;
}

.search-bar:focus {
    outline: none;
    box-shadow: 0 0 0 3px #ffb31b;
}

/* POPULAR NOW */
.popular-section .content-section {
    border-top: none;
}

.popular-list {
    list-style: none;
    margin-top: 24px;
    padding-left: 100px;
    padding-right: 100px;
}

.popular-items {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 16px 0;
    border-bottom: 1px solid #b8d1a7;
    text-decoration: none;
    color: #0e3b2e;
}

.popular-items:hover {
    color: #ffb31b;
    transition: 0.3s;
}

.rank {
    width: 40px;
    flex-shrink: 0;
    font-size: 32px;
    font-weight: 700;
    color: #286c53;
}

.popular-list li:first-child .rank {
    color: #ffb31b;
}

.popular-info {
    flex: 1;
}

.popular-info h3 {
    font-size: 17px;
}

.popular-info p {
    font-size: 14px;
    color: #0e3b2e;
}

.tag {
    flex-shrink: 0;
    padding: 4px 12px;
    border-radius: 999px;
    background: #ffd98a;
    color: #0e3b2e;
    font-size: 12px;
    font-weight: 600;
}

/* NEAR YOU */
.nearyou-section {
    background-color: #f7f8ee;
}

.location-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
}

.location {
    padding: 10px 20px;
    border: 2px solid #244e42;
    border-radius: 999px;
    background: #244e42;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: 0.3s;
}

.location:hover:not(:disabled) {
    padding: 10px 20px;
    border-radius: 999px;
    background: transparent;
    color: #244e42;
    cursor: pointer;
    transition: 0.3s;
}

.location:disabled {
    opacity: 0.6;
    cursor: wait;
}

.nearby-status {
    margin-top: 16px;
    min-height: 21px;
    font-size: 14px;
    color: #286c53;
}

.nearby-list {
    list-style: none;
    margin-top: 10px;
}

.nearby-list .distance {
    width: 80px;
    flex-shrink: 0;
    font-size: 16px;
    font-weight: 700;
    color: #286c53;
}

.nearby-credit {
    margin-top: 16px;
    font-size: 12px;
    color: #507c56;
}

/* EXPLORE */

.explore-button {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 20px;
}

.explore-button ul {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    list-style: none;
}

.explore-button li {
    list-style: none;
}

.explore-button .label {
    padding: 10px 20px;
    border: 2px solid #244e42;
    border-radius: 999px;
    background: transparent;
    color: #244e42;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: 0.3s;
}

.explore-button .label:hover {
    padding: 10px 20px;
    border-radius: 999px;
    background: #244e42;
    color: white;
    cursor: pointer;
    transition: 0.3s;
}

.explore-button .label.active {
    padding: 10px 20px;
    border-radius: 999px;
    background: #244e42;
    color: white;
}

.explore-button .label.active:hover {
    padding: 10px 20px;
    border-radius: 999px;
    background: transparent;
    color: #244e42;
    cursor: pointer;
    transition: 0.3s;
}

.explore-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 16px;
}

.explore-card {
    position: relative;
    display: block;
    overflow: hidden;
    border-radius: 24px;
    background: #f7f8ee;
    color: #123e32;
    text-decoration: none;
    box-shadow: 0 6px 18px rgba(23, 70, 56, 0.12);
    transition: transform 0.3s, box-shadow 0.3s;
}

.explore-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(23, 70, 56, 0.2);
}

.explore-card img {
    display: block;
    width: 100%;
    height: 220px;
    object-fit: cover;
    background: #cde8a3;
}

.explore-card .tag {
    position: absolute;
    top: 14px;
    left: 14px;
    padding: 6px 14px;
    background: #ffb31b;
    font-size: 13px;
}

.explore-body {
    padding: 22px 24px 26px;
}

.explore-body h3 {
    font-size: 22px;
    margin-bottom: 8px;
}

.explore-body p {
    font-size: 16px;
    line-height: 1.5;
    color: #286c53;
}


/* PROMOTE YOUR BUSINESS */

.business-section {
    padding: 0px;
    min-height: 0px;
    background-color: #0e3b2e;
}

.small-title {
    font-size: 15px;
    font-weight: bold;
    color: #ffb31b;
    margin-bottom: 20px;
}

.business-section h2 {
    color: white;
    margin-bottom: 20px;
}

.business-description {
    color: #cde8a3;
    max-width: 550px;
    line-height: 1.5;
    margin-bottom: 20px;
}

.business-button {
    display: inline-block;
    background-color: #ffb31b;
    color: #0e3b2e;
    text-decoration: none;
    padding: 10px 20px;
    border-radius: 999px;
    font-weight: bold;
    transition: 0.3s;
}

.business-button:hover {
    background-color: #cde8a3;

}

.checklist {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 40px;
    flex-wrap: wrap;
}

.business-text {
    flex: 1;
    min-width: 280px;
}

.business-section ul {
    padding: 10px;
    list-style: none;
}

.business-section li {
    padding: 14px 18px;
    color: white;
}

/* PROMOTE SECTION (promote.html) */

.back-pill {
    display: inline-block;
    padding: 10px 20px;

    color: #dcecc9;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;

    background: transparent;
    border: 2px solid #dcecc9;
    border-radius: 999px;
    cursor: pointer;
    transition: 0.3s;
}

.back-pill:hover {
    background: #dcecc9;
    color: #0e3b2e;
}

.navbar .promote-back {
    color: white;
    margin-bottom: 0;
}

.navbar {
    padding: 10px 50px;
    background-color: #0e3b2e;
    width: 100%;
    position: fixed;
    z-index: 100;
    top: 0;
    left: 0;
}

.nav-inner {
    display: flex;
    padding: 5px;
    align-items: center;
    justify-content: space-between;
}

.promote {
    text-align: center;
    padding-top: 110px;
}

.promote-back {
    display: block;
    margin-bottom: 20px;
    text-align: left;
    color: #174638;
    font-weight: 600;
    text-decoration: none;
}

.promote-back:hover {
    text-decoration: underline;
}

.promote-intro {
    max-width: 550px;
    margin: 0 auto 32px;
}

.promote-intro .small-title {
    margin-bottom: 12px;
}

.promote-intro h2 {
    margin-bottom: 8px;
}

.promote-intro p {
    line-height: 1.5;
}

.promote-form {
    max-width: 420px;
    margin: 0 auto;
    padding: 28px;
    text-align: left;

    background: #fff;
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(23, 70, 56, 0.12);
}

.promote-form label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: bold;
    color: #174638;
}

.promote-form input,
.promote-form textarea {
    display: block;
    width: 100%;
    margin-bottom: 16px;
    padding: 12px 14px;

    font-family: inherit;
    font-size: 15px;
    color: #123e32;

    border: 1px solid #c9dcb8;
    border-radius: 12px;
    background: #f7f8ee;
}

.promote-form input:focus,
.promote-form textarea:focus {
    outline: none;
    border-color: #286c53;
    box-shadow: 0 0 0 3px rgba(40, 108, 83, 0.2);
}

.promote-form textarea {
    resize: vertical;
}

.promote-form button {
    width: 100%;
    padding: 14px;

    font-family: inherit;
    font-size: 16px;
    font-weight: bold;
    color: #fff;

    background-color: #174638;
    border: none;
    border-radius: 15px;
    cursor: pointer;
    transition: 0.3s;
}

.promote-form button:hover {
    background-color: #286c53;
}

.promote-form button:disabled {
    opacity: 0.6;
    cursor: wait;
}

/* SPAM TRAP */
.promote-form .hp-field {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    opacity: 0;
}

.form-note {
    margin-top: 12px;
    font-size: 12px;
    text-align: center;
    color: #507c56;
}

.form-note.success {
    color: #1b6b3a;
    font-weight: 600;
}

.form-note.error {
    color: #b3261e;
    font-weight: 600;
}

/* ABOUT SECTIONS */
.about {
    padding: 30px 0px;
    min-height: auto;
}

.about h3 {
    padding: 3px 0px;
    color: #507c56;
}

.about p {
    padding: 3px 0px;
    color: black;
    text-align: justify;
}

/* FLOPPYMEMBERS */
.floppy {
    background-color: #0e3b2e;
    padding: 30px 25px;
    text-align: center;
}

.floppy p {
    color: #f6f1e4;
    font-size: 15px;
}

/* PLACE POPUP */

body.modal-open {
    overflow: hidden;
}

.modal {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
}

.modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(14, 59, 46, 0.65);
}

.modal-card {
    position: relative;
    width: min(520px, 100%);
    max-height: 100%;
    overflow-y: auto;
    background: #f7f8ee;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.modal-map {
    display: block;
    width: 100%;
    height: 240px;
    border: 0;
    background: #dcecc9;
}

.modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 1;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: #17453a;
    color: white;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
}

.modal-close:hover {
    background: #0e3b2e;
}

.modal-body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 20px;
}

.modal-body h3 {
    font-size: 20px;
    overflow-wrap: anywhere;
}

.modal-body p {
    font-size: 15px;
    line-height: 1.5;
}

.modal-body p.loading {
    opacity: 0.6;
}

.modal-details {
    list-style: none;
    align-self: stretch;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    background: #fff;
    border: 1px solid #b8d1a7;
    border-radius: 14px;
    font-size: 14px;
}

.modal-details li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    overflow-wrap: anywhere;
}

.modal-details a {
    color: #244e42;
    font-weight: 600;
}

.detail-icon {
    flex-shrink: 0;
}

.modal-note {
    font-size: 12px;
    color: #507c56;
}

.modal-directions {
    align-self: stretch;
    margin-top: 6px;
    padding: 14px 20px;
    border-radius: 999px;
    background: #17453a;
    color: white;
    font-weight: 600;
    text-align: center;
    text-decoration: none;
    transition: 0.3s;
}

.modal-directions:hover {
    background: #ffb31b;
    color: #0e3b2e;
}

/* RESPONSIVE */

/* TABLET & PHONE (max 768px) */
@media (max-width: 768px) {

    html { scroll-padding-top: 130px; }
    body { overflow-x: hidden; }

    /* NAVBAR */
    .navbar {
        width: 100%;
        padding: 8px 0;
        border-radius: 0;
    }

    .nav-inner {
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 4px 12px;
    }

    .logo img { height: 40px; }

    .nav-menu {
        width: 100%;
        gap: 6px;
        overflow-x: auto;
        flex-wrap: nowrap;
        justify-content: flex-start;
        list-style: none;
        padding-bottom: 2px;
        scrollbar-width: none;
    }
    .nav-menu::-webkit-scrollbar { display: none; }

    .nav-item { flex-shrink: 0; }

    .nav-links {
        display: inline-block;
        width: auto;
        overflow: visible;
        padding: 8px 14px;
        font-size: 13px;
        white-space: nowrap;
    }

    /* HERO */
    .hero {
        height: auto;
        min-height: 0;
        padding-bottom: 50px;
    }

    .hero-content { margin-top: 0;
                  padding-top: 130px;}

    .title-group { padding: 10px 16px 20px; }

    .discoverolongapo {
        height: auto;
        width: 100%;
        max-width: 380px;
    }

    .search-wrap {
        top: 0;
        width: calc(100% - 32px);
    }
    .search-bar {
        padding: 12px 20px;
        font-size: 16px;
    }

    /* GENERAL SECTIONS */
    .content-section { padding: 40px 16px; }
    .content-section h2 { font-size: 24px; }
    .promote { padding-top: 100px; }

    /* POPULAR NOW */
    .popular-list {
        padding-left: 0;
        padding-right: 0;
    }

    .popular-items { gap: 12px; }
    .rank { width: 28px; font-size: 24px; }
    .popular-info { min-width: 0; }
    .popular-info h3 { font-size: 15px; }
    .popular-info p  { font-size: 13px; overflow-wrap: anywhere; }

    /* NEAR YOU */
    .location-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    .location { width: 100%; }

    .nearby-list .distance { width: 60px; font-size: 14px; }

    /* EXPLORE */
    .explore-button { display: block; }
    .explore-button ul {
        flex-wrap: wrap;
        gap: 8px;
        padding: 0;
        list-style: none;
    }
    .explore-button .label { padding: 8px 14px; font-size: 13px; }

    .explore-grid { grid-template-columns: 1fr; gap: 14px; }

    /* BUSINESS */
    .checklist {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }
    .business-button {
        display: block;
        width: 100%;
        text-align: center;
    }
    .business-section ul { padding: 0; }
    .business-section li { padding: 8px 0; }

    /* ABOUT */
    .about p { text-align: left; }

    /* POPUP */
    .modal {
        padding: 0;
        align-items: flex-end;
    }
    .modal-card {
        width: 100%;
        max-height: 92vh;
        max-height: 92dvh;
        border-radius: 24px 24px 0 0;
    }
    .modal-map { height: 200px; }
    .modal-close { width: 40px; height: 40px; }
    .modal-body { padding: 18px 16px 28px; }
}

/* SMALL PHONE (max 480px) */
@media (max-width: 480px) {

    .content-section h2 { font-size: 22px; }

    .popular-items { flex-wrap: wrap; }
    .tag { margin-left: 40px; }

    .explore-card .tag,
    .modal-body .tag { margin-left: 0; }

    .nearby-list .tag { margin-left: 72px; }

    .floppy { padding: 20px 16px; }
    .floppy p { font-size: 13px; }
}
