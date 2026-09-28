/* =========================================================
   SAID MUSTAF AHMED — ENGINEERING PORTFOLIO
   script.js
   ---------------------------------------------------------
   1.  Helpers
   2.  Theme (light / dark)
   3.  Modern view builder (re-uses the book content)
   4.  Book view (StPageFlip)
   5.  View switching + deep links (#anchors)
   6.  Contact forms (Formspree)
   7.  Small extras (nav shadow, reveal, back-to-top …)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =====================================================
       1. HELPERS
       ===================================================== */

    const body = document.body;
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    const store = {
        get(key) {
            try { return localStorage.getItem(key); } catch (e) { return null; }
        },
        set(key, value) {
            try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
        }
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const navbar = $("#navbar");
    const toTop = $("#toTop");


    /* =====================================================
       2. THEME
       ===================================================== */

    const themeToggle = $(".theme-toggle");
    const themeMeta = $('meta[name="theme-color"]');

    const applyTheme = (light) => {
        body.classList.toggle("light-theme", light);

        if (themeMeta) {
            themeMeta.setAttribute("content", light ? "#F6F4EC" : "#0A1421");
        }

        if (themeToggle) {
            const icon = $("i", themeToggle);
            if (icon) {
                icon.classList.toggle("fa-sun", light);
                icon.classList.toggle("fa-moon", !light);
            }
            themeToggle.setAttribute(
                "aria-label",
                light ? "Switch to dark theme" : "Switch to light theme"
            );
        }
    };

    applyTheme(store.get("theme") === "light");

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const goLight = !body.classList.contains("light-theme");
            applyTheme(goLight);
            store.set("theme", goLight ? "light" : "dark");
        });
    }


    /* =====================================================
       3. MODERN VIEW BUILDER
       -----------------------------------------------------
       The modern (scrolling) view is generated from the
       same book pages, so content is edited in ONE place.
       Every book page that carries data-group="…" becomes
       a panel inside that group's section.
       ===================================================== */

    const GROUPS = [
        { id: "about",        tag: "Profile",              title: "About & Expertise" },
        { id: "education",    tag: "Academic Background",  title: "Education" },
        { id: "experience",   tag: "Professional Journey", title: "Experience" },
        { id: "skills",       tag: "Capabilities",         title: "Engineering Skills & Technical Expertise" },
        { id: "software",     tag: "Engineering Tools",    title: "Software & Technical Tools" },

        { id: "civil",        tag: "Selected Work", title: "Civil & Construction", badge: "cat-civil",
          lead: "Medical facilities, elevated water infrastructure, rehabilitation works and building construction." },
        { id: "solar",        tag: "Selected Work", title: "Large-Scale Solar PV Project", badge: "cat-renewable",
          lead: "Civil construction and coordination work for a large-scale solar photovoltaic project in Baidoa, Somalia." },
        { id: "urban",        tag: "Selected Work", title: "X-Control Afgoi Urban Development Plan", badge: "cat-urban",
          lead: "An independent urban planning project covering site analysis, land use, road connectivity, public spaces, 2D planning and 3D visualization." },
        { id: "architectural", tag: "Selected Work", title: "Architectural Design", badge: "cat-architectural",
          lead: "Architectural modelling, technical drawings, 3D visualization and walkthrough development." },
        { id: "structural",   tag: "Selected Work", title: "Structural Engineering", badge: "cat-structural",
          lead: "Structural planning, analysis, reinforced concrete design and detailing for a G+3 residential building." }
    ];

    const PROJECT_IDS = GROUPS.filter(g => g.badge).map(g => g.id);
    const FILTER_LABELS = {
        civil: "Civil",
        solar: "Renewable Energy",
        urban: "Urban Design",
        architectural: "Architectural",
        structural: "Structural"
    };

    const modernRoot = $("#modernSections");
    let modernBuilt = false;

    const buildModern = () => {
        if (!modernRoot || modernBuilt) return;

        const sourcePages = $$("#book .page[data-group]");
        const byGroup = new Map();

        sourcePages.forEach(page => {
            const key = page.dataset.group;
            if (!byGroup.has(key)) byGroup.set(key, []);
            byGroup.get(key).push(page);
        });

        let sectionCount = 0;
        let introAdded = false;

        GROUPS.forEach(group => {
            const pages = byGroup.get(group.id);
            if (!pages) return;

            const isProject = PROJECT_IDS.includes(group.id);

            /* one "Featured Projects" intro (with filter chips) before the project groups */
            if (isProject && !introAdded) {
                introAdded = true;
                modernRoot.appendChild(buildProjectsIntro(sectionCount++));
            }

            const section = document.createElement("section");
            section.className = "m-section" + (isProject ? " m-project-group" : "");
            section.id = group.id;
            section.dataset.category = group.id;
            if (sectionCount++ % 2 === 1) section.classList.add("m-alt");

            const head = document.createElement("header");
            head.className = "m-section-head";
            head.innerHTML =
                (group.badge
                    ? '<span class="category-badge ' + group.badge + '">' + FILTER_LABELS[group.id] + "</span><br>"
                    : '<span class="section-tag">' + group.tag + "</span>") +
                "<h2>" + group.title + "</h2>" +
                (group.lead ? "<p>" + group.lead + "</p>" : "");

            const grid = document.createElement("div");
            grid.className = "m-grid";

            pages.forEach(page => {
                const inner = $(".page-inner", page);
                if (!inner) return;

                const panel = document.createElement("article");
                panel.className = "m-panel";

                /* individual project anchors (#water-tank, #warehouse …) */
                if (page.dataset.anchor && page.dataset.anchor !== group.id) {
                    panel.id = page.dataset.anchor;
                }

                const clone = inner.cloneNode(true);
                while (clone.firstChild) panel.appendChild(clone.firstChild);

                /* media: lazy images, no autoplay, no upfront video download */
                $$("img", panel).forEach(img => {
                    img.loading = "lazy";
                    img.decoding = "async";
                });
                $$("video", panel).forEach(video => {
                    video.removeAttribute("autoplay");
                    video.preload = "none";
                    video.controls = true;
                    video.setAttribute("playsinline", "");
                });
                $$("[data-goto]", panel).forEach(el => el.removeAttribute("data-goto"));

                /* the section header already carries this heading → don't repeat it */
                const norm = t => t.replace(/\s+/g, " ").trim().toLowerCase();
                const panelTitle = $("h2", panel);
                if (panelTitle && norm(panelTitle.textContent).startsWith(norm(group.title))) {
                    panelTitle.remove();
                }
                if (!isProject) {
                    $$(".section-tag", panel).forEach(tag => tag.remove());
                }

                if (
                    pages.length === 1 ||
                    $(".page-card-grid, .software-list, .project-gallery-grid, .architectural-showcase, .project-page-video", panel)
                ) {
                    panel.classList.add("m-panel--wide");
                }

                grid.appendChild(panel);
            });

            const container = document.createElement("div");
            container.className = "container";
            container.append(head, grid);
            section.appendChild(container);
            modernRoot.appendChild(section);
        });

        wireProjectFilter();
        modernBuilt = true;
    };

    function buildProjectsIntro(index) {
        const section = document.createElement("section");
        section.className = "m-section m-projects-intro" + (index % 2 === 1 ? " m-alt" : "");
        section.id = "projects";

        const chips = ['<button type="button" class="filter-tab active" data-filter="all">All Projects</button>']
            .concat(PROJECT_IDS.map(id =>
                '<button type="button" class="filter-tab" data-filter="' + id + '">' + FILTER_LABELS[id] + "</button>"
            )).join("");

        section.innerHTML =
            '<div class="container">' +
                '<header class="m-section-head">' +
                    '<span class="section-tag">Portfolio</span>' +
                    "<h2>Featured Projects</h2>" +
                    "<p>Selected civil engineering, construction, renewable energy, structural, architectural and urban design projects.</p>" +
                "</header>" +
                '<div class="filter-tabs" role="group" aria-label="Filter projects by category">' + chips + "</div>" +
                '<p class="m-projects-more">Want a quick overview? <a href="projects.html">See the project summary page →</a></p>' +
            "</div>";

        return section;
    }

    function wireProjectFilter() {
        const tabs = $$(".filter-tab");
        if (!tabs.length) return;

        tabs.forEach(tab => {
            tab.addEventListener("click", () => setProjectFilter(tab.dataset.filter));
        });
    }

    function setProjectFilter(filter) {
        $$(".filter-tab").forEach(tab => {
            tab.classList.toggle("active", tab.dataset.filter === filter);
        });
        $$(".m-project-group").forEach(section => {
            section.hidden = !(filter === "all" || section.dataset.category === filter);
        });
    }

    buildModern();   // must run BEFORE the book takes ownership of the pages


    /* =====================================================
       4. BOOK VIEW  (StPageFlip)
       ===================================================== */

    const bookEl = $("#book");
    const pageIndicator = $("#pageIndicator");
    let pageFlip = null;
    let bookPages = [];
    let scrollCheckers = [];

    const initBook = () => {
        if (pageFlip) return true;
        if (!bookEl || !window.St || !window.St.PageFlip) return false;

        bookPages = $$("#book .page");
        const total = bookPages.length;
        if (!total) return false;

        const pad = n => String(n).padStart(2, "0");

        bookPages.forEach((page, i) => {
            page.dataset.sheet = pad(i + 1) + " / " + pad(total);
        });

        pageFlip = new window.St.PageFlip(bookEl, {
            width: 600,
            height: 850,
            size: "stretch",
            minWidth: 300,
            maxWidth: 600,
            minHeight: 425,
            maxHeight: 850,
            maxShadowOpacity: 0.5,
            showCover: true,
            mobileScrollSupport: true,   // lets phones/tablets scroll long pages
            flippingTime: 850,
            usePortrait: true
        });

        pageFlip.loadFromHTML(bookPages);

        const updateIndicator = (index) => {
            if (!pageIndicator) return;
            const current = Math.min(Math.max(index + 1, 1), total);
            pageIndicator.textContent = "Sheet " + pad(current) + " / " + pad(total);
        };
        updateIndicator(0);

        /* "scroll for more" hint on pages taller than the sheet */
        scrollCheckers = bookPages.map(page => {
            const inner = $(".page-inner", page);
            if (!inner) return () => {};
            const check = () => {
                const more = inner.scrollHeight - inner.clientHeight - inner.scrollTop > 8;
                page.classList.toggle("has-more", more);
            };
            inner.addEventListener("scroll", check, { passive: true });
            return check;
        });
        const runScrollChecks = () => scrollCheckers.forEach(check => check());

        pageFlip.on("flip", (event) => {
            updateIndicator(event.data);
            setTimeout(runScrollChecks, 60);
        });
        window.addEventListener("resize", () => setTimeout(runScrollChecks, 200));
        setTimeout(runScrollChecks, 300);

        /* arrows */
        const prevBtn = $("#prevPage");
        const nextBtn = $("#nextPage");
        if (prevBtn) prevBtn.addEventListener("click", () => pageFlip.flipPrev());
        if (nextBtn) nextBtn.addEventListener("click", () => pageFlip.flipNext());

        /* keyboard */
        document.addEventListener("keydown", (event) => {
            if (!body.classList.contains("view-book")) return;
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (window.Swal && typeof Swal.isVisible === "function" && Swal.isVisible()) return;

            const active = document.activeElement;
            const typing = active && (
                ["INPUT", "TEXTAREA", "SELECT", "VIDEO"].includes(active.tagName) ||
                active.isContentEditable
            );
            if (typing) return;

            const actions = {
                ArrowLeft: () => pageFlip.flipPrev(),
                ArrowRight: () => pageFlip.flipNext(),
                Home: () => pageFlip.turnToPage(0),
                End: () => pageFlip.turnToPage(total - 1)
            };

            if (actions[event.key]) {
                event.preventDefault();
                actions[event.key]();
            }
        });

        /* table of contents / project index buttons.
           data-goto accepts an anchor name (data-anchor on a page) or a page number */
        $$("#book [data-goto]").forEach(el => {
            el.addEventListener("click", (event) => {
                event.preventDefault();
                goToBookPage(el.getAttribute("data-goto"));
            });
        });

        /* keep form fields and video controls from starting a page drag */
        $$("#book input, #book textarea, #book video").forEach(el => {
            ["mousedown", "touchstart"].forEach(type =>
                el.addEventListener(type, e => e.stopPropagation(), { passive: true })
            );
        });

        bookEl.addEventListener("dragstart", e => e.preventDefault());

        return true;
    };

    function goToBookPage(target) {
        if (!pageFlip) return false;

        let index = bookPages.findIndex(p => p.dataset.anchor === target);
        if (index < 0 && /^\d+$/.test(String(target))) index = parseInt(target, 10);

        if (index >= 0 && index < bookPages.length) {
            pageFlip.turnToPage(index);
            return true;
        }
        return false;
    }


    /* =====================================================
       5. VIEW SWITCHING + DEEP LINKS
       ===================================================== */

    const viewButtons = $$(".view-btn");
    const coverVideo = $(".cover-bg-video");
    let currentView = null;

    const setCoverVideo = (play) => {
        if (!coverVideo) return;
        if (play && !reduceMotion) {
            const p = coverVideo.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
        } else {
            coverVideo.pause();
        }
    };

    const setView = (requested, { persist = true, scrollTop = true } = {}) => {
        let view = requested === "modern" ? "modern" : "book";

        body.classList.toggle("view-book", view === "book");
        body.classList.toggle("view-modern", view === "modern");

        if (view === "book") {
            const ready = initBook();
            if (!ready) {
                /* PageFlip library did not load (offline / blocked) → fall back gracefully */
                view = "modern";
                body.classList.remove("view-book");
                body.classList.add("view-modern");
            } else {
                window.dispatchEvent(new Event("resize"));   // re-measure after being hidden
            }
        }

        currentView = view;

        viewButtons.forEach(btn => {
            btn.setAttribute("aria-pressed", String(btn.dataset.view === view));
        });

        setCoverVideo(view === "book");

        if (persist) store.set("view", view);
        if (scrollTop) window.scrollTo(0, 0);

        updateToTop();
        return view;
    };

    viewButtons.forEach(btn => {
        btn.addEventListener("click", () => setView(btn.dataset.view));
    });

    /* ---- deep links: index.html#solar, #contact, #water-tank … ---- */

    const scrollToId = (id) => {
        let target = document.getElementById(id);
        if (!target) return false;

        if (target.closest("[hidden]")) {
            setProjectFilter("all");
            target = document.getElementById(id);
        }
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        return true;
    };

    const routeToHash = () => {
        const id = decodeURIComponent(location.hash.replace("#", ""));
        if (!id) return;

        if (currentView === "book") {
            goToBookPage(id);
        } else {
            scrollToId(id);
        }
    };

    /* in-page links inside the modern view */
    document.addEventListener("click", (event) => {
        const link = event.target.closest('a[href^="#"]');
        if (!link || currentView !== "modern") return;

        const id = link.getAttribute("href").slice(1);
        if (!id) return;

        event.preventDefault();
        if (scrollToId(id)) {
            try { history.replaceState(null, "", "#" + id); } catch (e) { /* file:// */ }
        }
    });

    window.addEventListener("hashchange", routeToHash);

    /* choose the starting view: ?view=  →  saved choice  →  screen size */
    const params = new URLSearchParams(location.search);
    const wanted = params.get("view");
    const saved = store.get("view");
    const small = window.matchMedia("(max-width: 720px)").matches;

    const startView =
        wanted === "modern" || wanted === "book" ? wanted :
        saved === "modern" || saved === "book" ? saved :
        small ? "modern" : "book";

    setView(startView, { persist: false, scrollTop: false });

    if (location.hash) {
        /* wait one frame so the book has measured itself */
        setTimeout(routeToHash, 120);
    }


    /* =====================================================
       6. CONTACT FORMS (Formspree) — book form + modern form
       ===================================================== */

    const swalTheme = () => {
        const css = getComputedStyle(body);
        return {
            background: css.getPropertyValue("--bg-card").trim() || "#121F30",
            color: css.getPropertyValue("--text-main").trim() || "#F5F3EC",
            confirmButtonColor: "#C2410C"
        };
    };

    const notify = (options, fallbackText) => {
        if (window.Swal) {
            return Swal.fire(Object.assign(swalTheme(), options));
        }
        alert(fallbackText || options.text || options.title);
        return Promise.resolve();
    };

    $$("form.contact-form").forEach(form => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const submit = $('[type="submit"]', form);
            if (submit) submit.disabled = true;

            if (window.Swal) {
                Swal.fire(Object.assign(swalTheme(), {
                    title: "Sending...",
                    text: "Please wait while your message is being sent.",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => Swal.showLoading()
                }));
            }

            try {
                const response = await fetch(form.action, {
                    method: "POST",
                    body: new FormData(form),
                    headers: { Accept: "application/json" }
                });

                if (response.ok) {
                    form.reset();
                    await notify({
                        icon: "success",
                        title: "Message Sent!",
                        text: "Thank you for contacting me. I will reply as soon as possible.",
                        confirmButtonText: "OK"
                    }, "Message sent successfully.");
                } else {
                    let message = "Unable to send your message. Please try again.";
                    try {
                        const data = await response.json();
                        if (data && data.errors && data.errors.length) {
                            message = data.errors.map(e => e.message).join(", ");
                        }
                    } catch (e) { /* keep default */ }

                    await notify({ icon: "error", title: "Message Not Sent", text: message }, message);
                }
            } catch (error) {
                console.error("Contact form error:", error);
                await notify({
                    icon: "error",
                    title: "Network Error",
                    text: "Please check your internet connection and try again."
                });
            } finally {
                if (submit) submit.disabled = false;
            }
        });
    });


    /* =====================================================
       7. SMALL EXTRAS
       ===================================================== */

    /* header shadow on scroll + back-to-top button */
    function updateToTop() {
        if (!toTop) return;
        toTop.classList.toggle("show", currentView === "modern" && window.scrollY > 700);
    }

    const onScroll = () => {
        if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 20);
        updateToTop();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toTop) {
        toTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });
    }

    /* highlight the current section in the modern nav */
    const navLinks = $$(".modern-nav a");
    const linkFor = (id) => {
        const key = PROJECT_IDS.includes(id) ? "projects" : id;
        return navLinks.find(a => a.getAttribute("href") === "#" + key);
    };

    if ("IntersectionObserver" in window && modernRoot) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const active = linkFor(entry.target.id);
                navLinks.forEach(a => a.classList.toggle("active", a === active));
            });
        }, { rootMargin: "-35% 0px -60% 0px" });

        $$("#modern section[id]").forEach(section => spy.observe(section));

        /* gentle reveal for panels and headings */
        const reveal = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                reveal.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

        $$("#modern .m-panel, #modern .m-section-head, #modern .m-stat, #modern .m-form-card").forEach(el => {
            el.classList.add("reveal");
            reveal.observe(el);
        });
    }

    /* links that open a new tab */
    $$('a[target="_blank"]').forEach(link => link.setAttribute("rel", "noopener noreferrer"));

    /* broken images get a neutral placeholder instead of a blank hole */
    $$("img").forEach(img => {
        img.addEventListener("error", () => img.classList.add("image-error"));
    });

    body.classList.add("page-ready");
});
