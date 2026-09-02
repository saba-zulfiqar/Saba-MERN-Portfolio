/* ============================================================
   SABA ZULFIQAR — ADMIN SCRIPT
   Handles both the login page and the dashboard:
   - Login: POST /api/auth/login -> stores JWT in localStorage
   - Dashboard: verifies the token, then manages Projects,
     About info, and Skills via the REST API.
============================================================ */
(function () {
  'use strict';

  const API_BASE = '';
  const TOKEN_KEY = 'saba_portfolio_token';

  /* ----------------------------------------------------------
     TOKEN HELPERS
  ---------------------------------------------------------- */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  // Standard headers for authenticated JSON requests
  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getToken()
    };
  }

  // Generic fetch wrapper that throws an Error with a readable message
  async function apiRequest(url, options) {
    const res = await fetch(url, options);
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      /* non-JSON body — ignore */
    }
    if (!res.ok) {
      throw new Error((data && data.message) || 'Request failed (' + res.status + ')');
    }
    return data;
  }

  /* ----------------------------------------------------------
     1. LOGIN PAGE
  ---------------------------------------------------------- */
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    // Already logged in? Skip the login page.
    if (getToken()) {
      window.location.href = 'dashboard.html';
    }

    const loginBtn = document.getElementById('login-btn');
    const loginMsg = document.getElementById('login-msg');

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      loginBtn.disabled = true;
      loginBtn.innerHTML = '<span>Signing in...</span>';
      loginMsg.classList.add('hidden');

      try {
        const data = await apiRequest(API_BASE + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        setToken(data.token);
        window.location.href = 'dashboard.html';
      } catch (err) {
        loginMsg.textContent = err.message || 'Login failed.';
        loginMsg.classList.remove('hidden');
        loginMsg.classList.add('error');
      } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Sign In</span> <i class="fas fa-arrow-right"></i>';
      }
    });
  }

  /* ----------------------------------------------------------
     2. DASHBOARD: AUTH GUARD + TAB SWITCHING
  ---------------------------------------------------------- */
  const dashTabs = document.getElementById('dash-tabs');
  if (!dashTabs) return; // not on the dashboard — stop here

  // If there is no saved token, send the user back to the login page
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }

  // Show the tab requested via ?tab=..., defaulting to "projects"
  function showTab(name) {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.panel === name);
    });
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.toggle('hidden', panel.id !== 'panel-' + name);
    });
  }

  dashTabs.addEventListener('click', (event) => {
    const btn = event.target.closest('.tab-btn');
    if (btn) showTab(btn.dataset.panel);
  });

  // Small helper to show a global status/error message
  function setGlobalMsg(message, type) {
    const el = document.getElementById('global-msg');
    el.textContent = message;
    el.className = 'alert ' + (type || '');
  }

  /* ----------------------------------------------------------
     3. PROJECTS CRUD
  ---------------------------------------------------------- */
  const projectForm = document.getElementById('project-form');
  const projectsListEl = document.getElementById('projects-list');
  let editingProjectId = null;

  // add/edit + list management
  async function loadProjects() {
    projectsListEl.innerHTML = '<div class="empty-note">Loading projects...</div>';
    try {
      const projects = await apiRequest(API_BASE + '/api/projects');
      renderProjects(projects);
    } catch (err) {
      projectsListEl.innerHTML = '<div class="empty-note">Could not load projects: ' + err.message + '</div>';
    }
  }

  function renderProjects(projects) {
    if (!projects.length) {
      projectsListEl.innerHTML = '<div class="empty-note">No projects yet. Add your first one above!</div>';
      return;
    }
    projectsListEl.innerHTML = projects
      .map(
        (p) =>
          '<div class="item-row">' +
          '<span class="item-thumb">' +
          (p.image ? '<img class="item-thumb" src="' + esc(p.image) + '" alt="">' : '<i class="fas fa-folder"></i>') +
          '</span>' +
          '<div class="item-info">' +
          '<h4>' + esc(p.title) + '</h4>' +
          '<span class="meta">' + esc((p.techStack || []).join(' · ')) + '</span>' +
          '</div>' +
          '<div class="item-actions">' +
          '<button class="btn btn-ghost btn-sm edit-project" data-id="' + p._id + '"><i class="fas fa-edit"></i> Edit</button>' +
          '<button class="btn btn-danger btn-sm delete-project" data-id="' + p._id + '"><i class="fas fa-trash"></i> Delete</button>' +
          '</div>' +
          '</div>'
      )
      .join('');
  }

  // Fill the "add new" form with an existing project's data to edit it
  function startEditingProject(project) {
    editingProjectId = project._id;
    document.getElementById('project-form-title').textContent = 'Edit Project';
    document.getElementById('editing-project-badge').classList.remove('hidden');
    document.getElementById('project-cancel-btn').classList.remove('hidden');
    document.getElementById('p-title').value = project.title || '';
    document.getElementById('p-desc').value = project.description || '';
    document.getElementById('p-image-url').value = project.image && !project.image.includes('/uploads/') ? project.image : '';
    document.getElementById('p-tech').value = (project.techStack || []).join(', ');
    document.getElementById('p-live').value = project.liveLink || '';
    document.getElementById('p-github').value = project.githubLink || '';
    document.getElementById('p-image-file').value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetProjectForm() {
    editingProjectId = null;
    projectForm.reset();
    document.getElementById('project-form-title').textContent = 'Add New Project';
    document.getElementById('editing-project-badge').classList.add('hidden');
    document.getElementById('project-cancel-btn').classList.add('hidden');
  }

  projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Use FormData so we can optionally send an image file (multipart/form-data)
    const formData = new FormData();
    formData.append('title', document.getElementById('p-title').value.trim());
    formData.append('description', document.getElementById('p-desc').value.trim());
    formData.append('techStack', document.getElementById('p-tech').value);
    formData.append('liveLink', document.getElementById('p-live').value.trim());
    formData.append('githubLink', document.getElementById('p-github').value.trim());

    // URL value or ignored — the server prefers an uploaded file if present
    const imageUrl = document.getElementById('p-image-url').value.trim();
    const imageFile = document.getElementById('p-image-file').files[0];
    if (imageFile) formData.append('image-file', imageFile);
    else formData.append('image', imageUrl);

    const saveBtn = document.getElementById('project-save-btn');
    saveBtn.disabled = true;

    try {
      if (editingProjectId) {
        await apiRequest(API_BASE + '/api/projects/' + editingProjectId, {
          method: 'PUT',
          headers: { Authorization: 'Bearer ' + getToken() },
          body: formData
        });
        setGlobalMsg('Project updated successfully.', 'success');
      } else {
        await apiRequest(API_BASE + '/api/projects', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + getToken() },
          body: formData
        });
        setGlobalMsg('Project added successfully.', 'success');
      }
      resetProjectForm();
      await loadProjects();
    } catch (err) {
      setGlobalMsg(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });

  document.getElementById('project-cancel-btn').addEventListener('click', resetProjectForm);

  // Event delegation for the dynamically-rendered Edit / Delete buttons
  projectsListEl.addEventListener('click', async (event) => {
    const editBtn = event.target.closest('.edit-project');
    const delBtn = event.target.closest('.delete-project');

    if (editBtn) {
      const projects = await apiRequest(API_BASE + '/api/projects');
      const project = projects.find((p) => p._id === editBtn.dataset.id);
      if (project) startEditingProject(project);
      return;
    }

    if (delBtn) {
      if (!confirm('Delete this project permanently?')) return;
      try {
        await apiRequest(API_BASE + '/api/projects/' + delBtn.dataset.id, {
          method: 'DELETE',
          headers: authHeaders()
        });
        setGlobalMsg('Project deleted.', 'success');
        await loadProjects();
      } catch (err) {
        setGlobalMsg(err.message, 'error');
      }
    }
  });

  /* ----------------------------------------------------------
     4. ABOUT CRUD (single document, read + update)
  ---------------------------------------------------------- */
  const aboutForm = document.getElementById('about-form');

  async function loadAbout() {
    try {
      const a = await apiRequest(API_BASE + '/api/about');
      document.getElementById('a-greeting').value = a.greeting || '';
      document.getElementById('a-name').value = a.name || '';
      document.getElementById('a-headline').value = a.headline || '';
      document.getElementById('a-description').value = a.description || '';
      document.getElementById('a-bio-title').value = a.bioTitle || '';
      document.getElementById('a-bio').value = (a.bioParagraphs || []).join('\n\n');
      document.getElementById('c-email').value = (a.contact || {}).email || '';
      document.getElementById('c-phone').value = (a.contact || {}).phone || '';
      document.getElementById('c-github').value = (a.contact || {}).github || '';
      document.getElementById('c-linkedin').value = (a.contact || {}).linkedin || '';
      document.getElementById('c-location').value = (a.contact || {}).location || '';
    } catch (err) {
      setGlobalMsg('Could not load about info: ' + err.message, 'error');
    }
  }

  // We need the current about `_id` OR let the backend upsert it.
  // The PUT endpoint uses an upsert, so no id is needed on the frontend.
  aboutForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const bioText = document.getElementById('a-bio').value;
    const bioParagraphs = bioText
      .split(/\n\s*\n/) // split on blank lines
      .map((p) => p.trim())
      .filter(Boolean);

    const aboutBtn = aboutForm.querySelector('button[type="submit"]');
    aboutBtn.disabled = true;

    try {
      await apiRequest(API_BASE + '/api/about', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          greeting: document.getElementById('a-greeting').value.trim(),
          name: document.getElementById('a-name').value.trim(),
          headline: document.getElementById('a-headline').value.trim(),
          description: document.getElementById('a-description').value.trim(),
          bioTitle: document.getElementById('a-bio-title').value.trim(),
          bioParagraphs,
          contact: {
            email: document.getElementById('c-email').value.trim(),
            phone: document.getElementById('c-phone').value.trim(),
            github: document.getElementById('c-github').value.trim(),
            linkedin: document.getElementById('c-linkedin').value.trim(),
            location: document.getElementById('c-location').value.trim()
          }
        })
      });
      setGlobalMsg('About info saved. Refresh your website to see the changes.', 'success');
    } catch (err) {
      setGlobalMsg(err.message, 'error');
    } finally {
      aboutBtn.disabled = false;
    }
  });

  /* ----------------------------------------------------------
     5. SKILLS CRUD
  ---------------------------------------------------------- */
  const skillForm = document.getElementById('skill-form');
  const skillsListEl = document.getElementById('skills-list');
  let editingSkillId = null;

  async function loadSkills() {
    skillsListEl.innerHTML = '<div class="empty-note">Loading skills...</div>';
    try {
      const skills = await apiRequest(API_BASE + '/api/skills');
      if (!skills.length) {
        skillsListEl.innerHTML = '<div class="empty-note">No skills yet. Add your first one above!</div>';
        return;
      }
      skillsListEl.innerHTML = skills
        .map(
          (s) =>
            '<div class="item-row">' +
            '<span class="item-thumb"><i class="' + esc(s.icon || 'fa-solid fa-code') + '"></i></span>' +
            '<div class="item-info">' +
            '<h4>' + esc(s.name) + '</h4>' +
            '<span class="meta">' + Number(s.percent || 0) + '%</span>' +
            '</div>' +
            '<div class="item-actions">' +
            '<button class="btn btn-ghost btn-sm edit-skill" data-id="' + s._id + '"><i class="fas fa-edit"></i> Edit</button>' +
            '<button class="btn btn-danger btn-sm delete-skill" data-id="' + s._id + '"><i class="fas fa-trash"></i> Delete</button>' +
            '</div>' +
            '</div>'
        )
        .join('');
    } catch (err) {
      skillsListEl.innerHTML = '<div class="empty-note">Could not load skills: ' + err.message + '</div>';
    }
  }

  function startEditingSkill(skill) {
    editingSkillId = skill._id;
    document.getElementById('skill-form-title').textContent = 'Edit Skill';
    document.getElementById('editing-skill-badge').classList.remove('hidden');
    document.getElementById('skill-cancel-btn').classList.remove('hidden');
    document.getElementById('s-name').value = skill.name || '';
    document.getElementById('s-percent').value = skill.percent || '';
    document.getElementById('s-icon').value = skill.icon || '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetSkillForm() {
    editingSkillId = null;
    skillForm.reset();
    document.getElementById('skill-form-title').textContent = 'Add New Skill';
    document.getElementById('editing-skill-badge').classList.add('hidden');
    document.getElementById('skill-cancel-btn').classList.add('hidden');
  }

  // Skill payload builder shared by create & update
  function skillPayload() {
    return JSON.stringify({
      name: document.getElementById('s-name').value.trim(),
      percent: Number(document.getElementById('s-percent').value),
      icon: document.getElementById('s-icon').value.trim()
    });
  }

  skillForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const saveBtn = document.getElementById('skill-save-btn');
    saveBtn.disabled = true;

    try {
      if (editingSkillId) {
        await apiRequest(API_BASE + '/api/skills/' + editingSkillId, {
          method: 'PUT',
          headers: authHeaders(),
          body: skillPayload()
        });
        setGlobalMsg('Skill updated.', 'success');
      } else {
        await apiRequest(API_BASE + '/api/skills', {
          method: 'POST',
          headers: authHeaders(),
          body: skillPayload()
        });
        setGlobalMsg('Skill added.', 'success');
      }
      resetSkillForm();
      await loadSkills();
    } catch (err) {
      setGlobalMsg(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });

  document.getElementById('skill-cancel-btn').addEventListener('click', resetSkillForm);

  skillsListEl.addEventListener('click', async (event) => {
    const editBtn = event.target.closest('.edit-skill');
    const delBtn = event.target.closest('.delete-skill');

    if (editBtn) {
      const skills = await apiRequest(API_BASE + '/api/skills');
      const skill = skills.find((s) => s._id === editBtn.dataset.id);
      if (skill) startEditingSkill(skill);
      return;
    }

    if (delBtn) {
      if (!confirm('Delete this skill?')) return;
      try {
        await apiRequest(API_BASE + '/api/skills/' + delBtn.dataset.id, {
          method: 'DELETE',
          headers: authHeaders()
        });
        setGlobalMsg('Skill deleted.', 'success');
        await loadSkills();
      } catch (err) {
        setGlobalMsg(err.message, 'error');
      }
    }
  });

  /* ----------------------------------------------------------
     6. LOGOUT
  ---------------------------------------------------------- */
  document.getElementById('logout-btn').addEventListener('click', () => {
    if (confirm('Log out of the admin dashboard?')) {
      clearToken();
      window.location.href = 'login.html';
    }
  });

  /* ----------------------------------------------------------
     7. TOKEN VALIDATION + INITIAL LOAD
  ---------------------------------------------------------- */
  async function initDashboard() {
    // First, make sure the saved token is still valid
    try {
      await apiRequest(API_BASE + '/api/auth/verify', { headers: authHeaders() });
      document.getElementById('welcome-text').textContent = 'Signed in';
    } catch (err) {
      clearToken();
      window.location.href = 'login.html';
      return;
    }

    // Switch to the tab requested in the URL (?tab=skills)
    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get('tab') || 'projects';
    showTab(initialTab);

    // Load everything
    await Promise.all([loadProjects(), loadAbout(), loadSkills()]);
  }

  // Escape HTML so stored content can't inject markup into the dashboard
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  initDashboard();

})();