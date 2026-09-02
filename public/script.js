/* ============================================================
   SABA ZULFIQAR — PORTFOLIO SCRIPT
   Typing animation, sticky navbar, scroll reveal, skill bar
   fill, mobile menu, form handling — plus dynamic data loading
   from the MongoDB backend (with offline fallback demo data).
============================================================ */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     API SETUP
     The site is served by the Express backend, so "" (same
     origin) works. If you host index.html somewhere else and
     the API elsewhere, change this to the API's base URL.
  ---------------------------------------------------------- */
  const API_BASE = '';

  /* ----------------------------------------------------------
     FALLBACK DEMO DATA
     Used only when the backend is not running (e.g. opening
     index.html directly from the filesystem) so the page still
     looks complete. The backend (via Mongo) is the source of
     truth when it is available.
  ---------------------------------------------------------- */
  const FALLBACK = {
    about: {
      greeting: "Hi, I'm",
      name: 'Saba Zulfiqar',
      headline: 'MERN Stack Developer | Building Modern Web Applications',
      description:
        'I craft fast, scalable, and beautiful full-stack applications with the MERN stack. Turning ideas into digital products.',
      bioTitle: 'A curious mind, a builder\'s heart.',
      bioParagraphs: [
        "I'm Saba Zulfiqar — a BS Sociology student who found a passion for technology and transitioned into the world of web development.",
        'What started as curiosity became a career path: I now build full-stack applications using MongoDB, Express.js, React.js, and Node.js. I love solving real problems with clean, maintainable code.',
        'With a sociology background I bring an empathy-first perspective to product development — understanding people and how technology shapes human interaction.'
      ],
      contact: {
        email: 'sabazulfiqar926@gmail.com',
        phone: '03075834975',
        github: 'https://github.com/saba-zulfiqar',
        linkedin: 'https://www.linkedin.com/in/saba-rana-015059356/',
        location: 'Pakistan'
      }
    },
    skills: [
      { name: 'HTML', icon: 'fa-brands fa-html5', percent: 95 },
      { name: 'CSS', icon: 'fa-brands fa-css3-alt', percent: 90 },
      { name: 'JavaScript', icon: 'fa-brands fa-js-square', percent: 85 },
      { name: 'React.js', icon: 'fa-brands fa-react', percent: 80 },
      { name: 'Node.js', icon: 'fa-brands fa-node-js', percent: 75 },
      { name: 'Express.js', icon: 'fa-solid fa-server', percent: 75 },
      { name: 'MongoDB', icon: 'fa-solid fa-database', percent: 70 },
      { name: 'Git / GitHub', icon: 'fa-brands fa-git-alt', percent: 80 }
    ],
    projects: [
      {
        title: 'Portfolio Website with Admin Dashboard',
        description:
          'A full-stack portfolio platform where the owner can log into a secure admin dashboard to update projects, skills, and messages — built with the MERN stack.',
        techStack: ['React.js', 'Node.js', 'Express.js', 'MongoDB'],
        liveLink: '#',
        githubLink: 'https://github.com/saba-zulfiqar'
      },
      {
        title: 'TaskFlow — Task Management App',
        description:
          'A Kanban-style task management application with drag-and-drop boards, real-time updates, authentication, and team collaboration features.',
        techStack: ['React.js', 'Node.js', 'Socket.io', 'MongoDB'],
        liveLink: '#',
        githubLink: 'https://github.com/saba-zulfiqar'
      },
      {
        title: 'ShopSphere — E-Commerce Store',
        description:
          'A full-fledged e-commerce platform featuring product catalog, cart, payment integration, order management, and an admin panel.',
        techStack: ['React.js', 'Redux', 'Express.js', 'MongoDB'],
        liveLink: '#',
        githubLink: 'https://github.com/saba-zulfiqar'
      }
    ]
  };

  /* ----------------------------------------------------------
     STATE — start with fallback so pages render instantly,
     then get overwritten by live data when the API responds.
  ---------------------------------------------------------- */
  let about = FALLBACK.about;
  let skills = FALLBACK.skills;
  let projects = FALLBACK.projects;

  /* ----------------------------------------------------------
     SMALL HELPERS
  ---------------------------------------------------------- */
  // Fetch JSON from the API and throw if the response is an error
  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Request failed: ' + res.status);
    return res.json();
  }

  // Render an inline loading error message into a container
  function showLoadError(container, what) {
    container.innerHTML =
      '<p class="load-error">Could not load ' + what +
      ' from the server. Showing saved demo content instead.</p>';
  }

  // Build a project image URL, falling back to a seeded placeholder
  function projectImage(project) {
    if (project.image) return project.image;
    const seed = (project.title || 'project').toLowerCase().replace(/\s+/g, '-');
    return 'https://picsum.photos/seed/' + seed + '/600/400';
  }

  // Display a URL without the https:// prefix (friendlier-looking)
  function prettyURL(url) {
    return (url || '').replace(/^https?:\/\//, '');
  }

  /* ----------------------------------------------------------
     RENDERING — About / Hero / Contact / Footer
  ---------------------------------------------------------- */
  function renderAbout() {
    // Hero section
    document.getElementById('hero-greeting').textContent = about.greeting || "Hi, I'm";
    document.getElementById('hero-name').textContent = about.name || 'Saba Zulfiqar';
    document.getElementById('hero-description').textContent = about.description || '';

    // Navbar logo: "Saba Zulfiqar" with the last word highlighted
    const name = about.name || 'Saba Zulfiqar';
    const parts = name.trim().split(/\s+/);
    const first = parts[0] || '';
    const rest = parts.slice(1).join(' ');
    document.getElementById('logo-name').innerHTML =
      first + '<span>' + (rest ? ' ' + rest : '') + '</span>';

    // About: title + paragraphs
    document.getElementById('bio-title').textContent = about.bioTitle || '';
    document.getElementById('bio-paragraphs').innerHTML = (about.bioParagraphs || [])
      .map((p) => '<p>' + esc(p) + '</p>')
      .join('');

    // About mini info block (email + location)
    document.getElementById('about-info').innerHTML = [
      buildInfoItem('fa-envelope', 'Email', about.contact && about.contact.email),
      buildInfoItem('fa-map-marker-alt', 'Location', about.contact && about.contact.location)
    ].join('');
  }

  // One small "label / value" block used inside the About section
  function buildInfoItem(icon, label, value) {
    if (!value) return '';
    return (
      '<div class="info-item">' +
      '<span class="info-label"><i class="fas ' + icon + '"></i> ' + label + '</span>' +
      '<span class="info-value">' + esc(value) + '</span>' +
      '</div>'
    );
  }

  // Social links rendered into the hero AND the footer (one function,
  // so this single fix applies in both places).
  // Only GitHub and LinkedIn are shown here. Email/Phone still appear
  // in the contact section as info cards, but not as social icons.
  function renderSocials() {
    const c = about.contact || {};
    const links = [];
    if (c.github) links.push({ icon: 'fa-github', url: c.github, label: 'GitHub' });
    if (c.linkedin) links.push({ icon: 'fa-linkedin', url: c.linkedin, label: 'LinkedIn' });

    const markup = links
      .map((l) =>
        // noopener + noreferrer keeps new-tab links isolated & secure
        '<a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(l.label) + '">' +
        '<i class="fab ' + esc(l.icon) + '"></i></a>'
      )
      .join('');

    const hero = document.getElementById('hero-socials');
    const footer = document.getElementById('footer-socials');
    if (hero) hero.innerHTML = markup;
    if (footer) footer.innerHTML = markup;
  }

  // Contact section: email, phone, GitHub, LinkedIn cards.
  // Each icon now carries the correct Font Awesome style prefix so
  // nothing renders as an empty box:
  //   fas = solid (email, phone)  |  fab = brands (github, linkedin)
  function renderContactDetails() {
    const c = about.contact || {};
    const container = document.getElementById('contact-details');
    const items = [
      { icon: 'fa-envelope', prefix: 'fas', label: 'Email', value: c.email, href: c.email ? 'mailto:' + c.email : '' },
      { icon: 'fa-phone-alt', prefix: 'fas', label: 'Phone', value: c.phone, href: c.phone ? 'tel:' + c.phone : '' },
      { icon: 'fa-github', prefix: 'fab', label: 'GitHub', value: prettyURL(c.github), href: c.github },
      { icon: 'fa-linkedin-in', prefix: 'fab', label: 'LinkedIn', value: prettyURL(c.linkedin), href: c.linkedin }
    ];

    container.innerHTML = items
      .filter((i) => i.value)
      .map(
        (i) =>
          '<div class="contact-item">' +
          '<div class="contact-icon"><i class="' + i.prefix + ' ' + i.icon + '"></i></div>' +
          '<div><h4>' + i.label + '</h4>' +
          '<a href="' + esc(i.href) + '"' + (i.href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
          esc(i.value) + '</a></div>' +
          '</div>'
      )
      .join('');
  }

  /* ----------------------------------------------------------
     RENDERING — Skills (with animated, fill-on-scroll bars)
  ---------------------------------------------------------- */
  function renderSkills() {
    const grid = document.getElementById('skills-list');
    grid.innerHTML = skills
      .map(
        (s, i) =>
          '<div class="skill reveal" style="--delay: ' + (i % 4) * 0.1 + 's">' +
          '<div class="skill-header">' +
          '<i class="' + esc(s.icon || 'fa-solid fa-code') + ' skill-icon"></i>' +
          '<span class="skill-name">' + esc(s.name) + '</span>' +
          '<span class="skill-percent">' + Number(s.percent || 0) + '%</span>' +
          '</div>' +
          '<div class="skill-bar">' +
          '<div class="skill-progress" data-progress="' + Number(s.percent || 0) + '"></div>' +
          '</div>' +
          '</div>'
      )
      .join('');

    // Watch the newly-created bars so they fill when scrolled into view
    grid.querySelectorAll('.skill-progress').forEach((bar) => skillObserver.observe(bar));

    // Let the reveal animation re-run for our dynamic cards
    grid.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
  }

  /* ----------------------------------------------------------
     RENDERING — Projects (hover cards)
  ---------------------------------------------------------- */
  function renderProjects() {
    const grid = document.getElementById('projects-list');

    if (!projects.length) {
      grid.innerHTML = '<p class="load-error">No projects published yet — check back soon!</p>';
      return;
    }

    grid.innerHTML = projects
      .map(
        (p, i) =>
          '<article class="project-card reveal" style="--delay: ' + (i % 3) * 0.1 + 's">' +
          '<div class="project-thumb">' +
          '<img src="' + esc(projectImage(p)) + '" alt="' + esc(p.title) + '" loading="lazy">' +
          '<div class="project-overlay"><div class="project-links">' +
          (p.liveLink
            ? '<a href="' + esc(p.liveLink) + '" target="_blank" rel="noopener" aria-label="Live demo"><i class="fas fa-external-link-alt"></i></a>'
            : '') +
          (p.githubLink
            ? '<a href="' + esc(p.githubLink) + '" target="_blank" rel="noopener" aria-label="Repository"><i class="fab fa-github"></i></a>'
            : '') +
          '</div></div></div>' +
          '<div class="project-body">' +
          '<h3 class="project-title">' + esc(p.title) + '</h3>' +
          '<p class="project-desc">' + esc(p.description) + '</p>' +
          '<div class="project-tags">' +
          (p.techStack || []).map((t) => '<span>' + esc(t) + '</span>').join('') +
          '</div>' +
          '</div></article>'
      )
      .join('');

    grid.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
  }

  // Escape HTML so user-controlled text can't inject markup
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ----------------------------------------------------------
     DATA LOADING — fetch from the backend (fallback if offline)
  ---------------------------------------------------------- */
  async function loadData() {
    // Load all three independently so one failure doesn't block the others
    await Promise.allSettled([loadAbout(), loadSkills(), loadProjects()]);
  }

  async function loadAbout() {
    try {
      const data = await fetchJSON(API_BASE + '/api/about');
      if (data && data.name) about = { ...FALLBACK.about, ...data, contact: data.contact || {} };
    } catch (err) {
      console.warn('API fetch for /api/about failed — using demo content.', err);
    }
    renderAbout();
    renderSocials();
    renderContactDetails();
    updateTypingPhrases();
    document.getElementById('footer-name').textContent = about.name || 'Saba Zulfiqar';
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  async function loadSkills() {
    try {
      const data = await fetchJSON(API_BASE + '/api/skills');
      if (Array.isArray(data) && data.length) skills = data;
    } catch (err) {
      console.warn('API fetch for /api/skills failed — using demo content.', err);
    }
    renderSkills();
  }

  async function loadProjects() {
    try {
      const data = await fetchJSON(API_BASE + '/api/projects');
      if (Array.isArray(data)) projects = data;
    } catch (err) {
      console.warn('API fetch for /api/projects failed — using demo content.', err);
    }
    renderProjects();
  }

  /* ----------------------------------------------------------
     1. HERO TYPING TEXT ANIMATION
     Phrases are driven by the "headline" from the backend,
     split on " | " so you can add more phrases in the admin.
  ---------------------------------------------------------- */
  const typingEl = document.getElementById('typing-text');
  let phrases = ['MERN Stack Developer', 'Building Modern Web Applications', 'React.js Enthusiast', 'Full-Stack Problem Solver'];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  // Build typing phrases from the backend headline (fallback = demo)
  function updateTypingPhrases() {
    const headline = (about && about.headline) || '';
    const list = headline
      .split('|')
      .map((p) => p.trim())
      .filter(Boolean);
    if (list.length) phrases = list;
  }

  function type() {
    const current = phrases[phraseIndex];
    const typed = current.substring(0, charIndex);
    typingEl.textContent = typed;

    let typeSpeed = isDeleting ? 45 : 85;

    if (!isDeleting && charIndex === current.length) {
      typeSpeed = 1800; // pause at the end before deleting
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeSpeed = 400;
    }

    charIndex += isDeleting ? -1 : 1;
    setTimeout(type, typeSpeed);
  }

  if (typingEl) type();

  /* ----------------------------------------------------------
     2. STICKY NAVBAR WITH SCROLL BG + ACTIVE LINK + TO-TOP
  ---------------------------------------------------------- */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  const toTopBtn = document.createElement('button');
  toTopBtn.className = 'to-top';
  toTopBtn.setAttribute('aria-label', 'Back to top');
  toTopBtn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
  document.body.appendChild(toTopBtn);

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    toTopBtn.classList.toggle('show', window.scrollY > 500);

    const scrollPos = window.scrollY + 120;
    sections.forEach((section) => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) {
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + section.id);
        });
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  toTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ----------------------------------------------------------
     3. MOBILE HAMBURGER MENU
  ---------------------------------------------------------- */
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  function closeMenu() {
    navMenu.classList.remove('open');
    navToggle.classList.remove('open');
  }

  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    navToggle.classList.toggle('open');
  });

  navMenu.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (event) => {
    if (!navMenu.classList.contains('open')) return;
    if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  /* ----------------------------------------------------------
     4. SCROLL REVEAL — FADE IN & SLIDE UP
  ---------------------------------------------------------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* ----------------------------------------------------------
     5. SKILL BARS — FILL FROM 0% WHEN SCROLLED INTO VIEW
     (used by renderSkills for dynamically created bars too)
  ---------------------------------------------------------- */
  const skillObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.width = entry.target.getAttribute('data-progress') + '%';
          entry.target.classList.add('filled');
          skillObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  /* ----------------------------------------------------------
     6. CONTACT FORM HANDLING
     On submit we POST the form data to /api/contact, which
     emails it to sabazulfiqar926@gmail.com via Nodemailer.
  ---------------------------------------------------------- */
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const submitBtn = contactForm && contactForm.querySelector('button[type="submit"]');

  if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = contactForm.name.value.trim();
      const email = contactForm.email.value.trim();
      const message = contactForm.message.value.trim();

      // Client-side validation (the server validates again too)
      if (!name || !email || !message) {
        formStatus.textContent = 'Please fill in all fields.';
        formStatus.className = 'form-status error';
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        formStatus.textContent = 'Please enter a valid email address.';
        formStatus.className = 'form-status error';
        return;
      }

      // Disable the button while the request is in flight
      // (prevents people double-clicking / duplicate emails)
      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = 'Sending...';
      submitBtn.querySelector('i').className = 'fas fa-circle-notch fa-spin';

      try {
        const res = await fetch(API_BASE + '/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error((data && data.message) || 'Something went wrong.');
        }

        // Success — tell the visitor and clear the form
        formStatus.textContent = data.message || 'Message sent successfully! I\'ll get back to you soon.';
        formStatus.className = 'form-status success';
        contactForm.reset();

        setTimeout(() => {
          formStatus.textContent = '';
          formStatus.className = 'form-status';
        }, 7000);
      } catch (err) {
        formStatus.textContent =
          err.message || 'Could not send your message. Please try again later.';
        formStatus.className = 'form-status error';
      } finally {
        // Re-enable the button whatever happened
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Send Message';
        submitBtn.querySelector('i').className = 'fas fa-paper-plane';
      }
    });

    contactForm.querySelectorAll('.form-input').forEach((input) => {
      input.addEventListener('input', () => {
        formStatus.textContent = '';
        formStatus.className = 'form-status';
      });
    });
  }

  /* ----------------------------------------------------------
     7. KICK OFF — render fallback immediately, then load real
     data from the backend when it is available.
  ---------------------------------------------------------- */
  loadData();

})();