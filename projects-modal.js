// projects-modal.js — Filterable, searchable modal of all completed projects.

const CATEGORY_RULES = [
    { tag: 'AI/ML',   css: 'cat-aiml',    matches: ['kaggle','nlp','emotions','sp500','credit-scoring','linear-stats','guess-it','stats'] },
    { tag: 'Web',     css: 'cat-web',     matches: ['ascii-art-web','forum','groupie','shop','netfix','graphql','social-network','stock-exchange','real-time','make-your-game','mini-framework'] },
    { tag: 'Systems', css: 'cat-systems', matches: ['wget','system-monitor','my-ls','net-cat','atm','push-swap','lem-in','git','ascii-art-web-dockerize'] },
    { tag: 'Games',   css: 'cat-games',   matches: ['bomberman','tetris','make-your-game','guess-it'] },
    { tag: 'Go/Algo', css: 'cat-goalgo',  matches: ['go-reloaded','ascii-art','math-skills','linear'] },
];

function getCategory(name) {
    for (const rule of CATEGORY_RULES) {
        if (rule.matches.some(m => name.includes(m))) return rule;
    }
    return { tag: 'Other', css: 'cat-other' };
}

function gradeDisplay(grade) {
    if (grade === null || grade === undefined) return { label: 'N/A',              cls: 'grade-na' };
    if (grade >= 2.5) return { label: '\u2605 ' + grade.toFixed(2), cls: 'grade-exceptional' };
    if (grade >= 1.8) return { label: '\u25b2 ' + grade.toFixed(2), cls: 'grade-excellent' };
    if (grade >= 1.0) return { label: '\u2714 ' + grade.toFixed(2), cls: 'grade-pass' };
    return               { label: '\u2718 ' + grade.toFixed(2), cls: 'grade-fail' };
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Deduplicate by project id, keep entry with highest grade
function deduplicateProjects(results) {
    const map = new Map();
    for (const p of results) {
        if (!p.isDone || p.object?.type !== 'project') continue;
        const id = p.object.id;
        if (!map.has(id) || (p.grade ?? 0) > (map.get(id).grade ?? 0)) map.set(id, p);
    }
    return [...map.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function buildCard(p) {
    const cat = getCategory(p.object.name);
    const gd  = gradeDisplay(p.grade);
    return `
        <div class="proj-card" data-category="${cat.tag}">
            <div class="proj-card-top">
                <span class="proj-name" title="${p.object.name}">${p.object.name}</span>
                <span class="proj-grade ${gd.cls}">${gd.label}</span>
            </div>
            <div class="proj-meta">
                <span class="proj-date"><i class="fas fa-calendar-alt"></i> ${formatDate(p.createdAt)}</span>
                <span class="proj-category-tag ${cat.css}">${cat.tag}</span>
            </div>
        </div>`;
}

function renderGrid(projects, activeFilter, query) {
    let filtered = projects;
    if (activeFilter !== 'All') {
        filtered = filtered.filter(p => getCategory(p.object.name).tag === activeFilter);
    }
    if (query) {
        filtered = filtered.filter(p => p.object.name.toLowerCase().includes(query));
    }
    if (filtered.length === 0) {
        return '<p class="no-results">No projects match your search.</p>';
    }
    return '<div class="projects-grid">' + filtered.map(buildCard).join('') + '</div>';
}

// Inject modal DOM (once)
function initProjectsModal() {
    if (document.getElementById('projects-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'projects-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-label="Completed Projects">

            <div class="modal-header">
                <div>
                    <h2>COMPLETED <span>PROJECTS</span></h2>
                    <p class="modal-subtitle" id="modal-subtitle"></p>
                </div>
                <button class="modal-close" id="modal-close-btn" aria-label="Close">&#x2715;</button>
            </div>

            <div class="grade-legend">
                <span class="grade-exceptional">&#x2605; &ge;2.5 Exceptional</span>
                <span class="grade-excellent">&#x25b2; &ge;1.8 Excellent</span>
                <span class="grade-pass">&#x2714; &ge;1.0 Pass</span>
                <span class="grade-fail">&#x2718; &lt;1.0 Fail</span>
            </div>

            <div class="modal-summary" id="modal-summary"></div>

            <div class="modal-controls">
                <div class="modal-search-wrap">
                    <i class="fas fa-search"></i>
                    <input id="modal-search" type="text" placeholder="Search projects..." autocomplete="off">
                </div>
                <select id="modal-sort" class="cyber-select">
                    <option value="date-desc">Latest first</option>
                    <option value="date-asc">Oldest first</option>
                    <option value="grade-desc">Highest grade</option>
                    <option value="grade-asc">Lowest grade</option>
                    <option value="name-asc">A to Z</option>
                </select>
            </div>

            <div class="modal-filters" id="modal-filters"></div>
            <div class="modal-body" id="modal-body"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

// Open and populate
function openModal() {
    const overlay = document.getElementById('projects-modal-overlay');
    if (!overlay) return;

    const allProjects = deduplicateProjects(window.userData?.results || []);

    let activeFilter = 'All';
    let query = '';
    let sortOrder = 'date-desc';

    // Summary stats
    const avg = (allProjects.reduce((s, p) => s + (p.grade ?? 0), 0) / allProjects.length).toFixed(2);
    const top = allProjects.reduce((best, p) => (p.grade ?? 0) > (best.grade ?? 0) ? p : best, allProjects[0]);
    const exceptional = allProjects.filter(p => (p.grade ?? 0) >= 2.5).length;

    document.getElementById('modal-subtitle').textContent =
        allProjects.length + ' projects  \u00b7  Zone01 Kisumu';

    document.getElementById('modal-summary').innerHTML = `
        <div class="modal-summary-stat">
            <span class="val">${allProjects.length}</span><span class="lbl">Completed</span>
        </div>
        <div class="modal-summary-stat">
            <span class="val">${avg}</span><span class="lbl">Avg Grade</span>
        </div>
        <div class="modal-summary-stat">
            <span class="val grade-exceptional">${top.grade?.toFixed(2) ?? 'N/A'}</span><span class="lbl">Best Grade</span>
        </div>
        <div class="modal-summary-stat">
            <span class="val">${exceptional}</span><span class="lbl">Exceptional &#x2605;</span>
        </div>
        <div class="modal-summary-stat top-project-stat">
            <span class="val" style="font-size:.85rem">${top.object.name}</span><span class="lbl">Top Project</span>
        </div>
    `;

    // Category filter pills
    const categoryCounts = { All: allProjects.length };
    for (const p of allProjects) {
        const tag = getCategory(p.object.name).tag;
        categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
    }
    const filterOrder = ['All', 'Web', 'Systems', 'AI/ML', 'Go/Algo', 'Games', 'Other'];
    document.getElementById('modal-filters').innerHTML = filterOrder
        .filter(f => categoryCounts[f])
        .map(f => `
            <button class="filter-btn ${f === 'All' ? 'active' : ''}" data-filter="${f}">
                ${f} <span class="filter-count">${categoryCounts[f]}</span>
            </button>
        `).join('');

    function sortProjects(list) {
        return [...list].sort((a, b) => {
            switch (sortOrder) {
                case 'date-asc':   return new Date(a.createdAt) - new Date(b.createdAt);
                case 'date-desc':  return new Date(b.createdAt) - new Date(a.createdAt);
                case 'grade-desc': return (b.grade ?? -1) - (a.grade ?? -1);
                case 'grade-asc':  return (a.grade ?? 99) - (b.grade ?? 99);
                case 'name-asc':   return a.object.name.localeCompare(b.object.name);
                default:           return 0;
            }
        });
    }

    function refresh() {
        document.getElementById('modal-body').innerHTML =
            renderGrid(sortProjects(allProjects), activeFilter, query);
    }

    document.getElementById('modal-filters').addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        activeFilter = btn.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        refresh();
    });

    document.getElementById('modal-search').addEventListener('input', e => {
        query = e.target.value.toLowerCase();
        refresh();
    });

    document.getElementById('modal-sort').addEventListener('change', e => {
        sortOrder = e.target.value;
        refresh();
    });

    document.getElementById('modal-search').value = '';
    refresh();

    requestAnimationFrame(() => overlay.classList.add('open'));
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('modal-search').focus(), 300);
}

function closeModal() {
    const overlay = document.getElementById('projects-modal-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

export { initProjectsModal, openModal, closeModal };