let siteData = null;
let currentCategory = 'home';

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    renderSidebar();
    renderContent(currentCategory);
    initSearch();
    initThemeToggle();
    initFeedbackModal();
});

async function loadData() {
    try {
        const response = await fetch('data.json');
        siteData = await response.json();
    } catch (error) {
        console.error('Failed to load data:', error);
        document.querySelector('.content-container').innerHTML = '<p>Failed to load content. Make sure data.json exists.</p>';
    }
}

function renderSidebar() {
    if (!siteData) return;

    const navScroll = document.querySelector('.nav-scroll');
    navScroll.innerHTML = '';

    siteData.sidebar.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.className = 'nav-group';

        groupEl.innerHTML = `<div class="nav-label">${group.group}</div>`;

        group.items.forEach(item => {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-item' + (item.id === currentCategory ? ' active' : '');
            link.dataset.category = item.id;
            link.innerHTML = `<i class="fa-solid ${item.icon}"></i> ${item.label}`;

            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (siteData.categories[item.id]) {
                    currentCategory = item.id;
                    renderContent(item.id);
                    updateActiveNav(item.id);
                }
            });

            groupEl.appendChild(link);
        });

        navScroll.appendChild(groupEl);
    });
}

function updateActiveNav(categoryId) {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.category === categoryId) {
            el.classList.add('active');
        }
    });
}

function renderContent(categoryId) {
    if (!siteData || !siteData.categories[categoryId]) return;

    const cat = siteData.categories[categoryId];
    const container = document.querySelector('.content-container');

    let html = `
        <h1>${cat.title}</h1>
        <p class="subtitle">${cat.subtitle}</p>
        
        <div class="feedback-box">
            <div class="feedback-icon"><i class="fa-solid fa-envelope"></i></div>
            <div class="feedback-text">
                <strong>Got feedback?</strong>
                <span>We'd love to know what you think about this page.</span>
            </div>
            <a href="#" class="feedback-btn">Share Feedback</a>
        </div>
    `;

    cat.sections.forEach(section => {
        html += `<h2 id="${section.id}">${section.title}</h2>`;

        if (section.tip) {
            html += `
                <div class="tip-box">
                    <div class="tip-label"><i class="fa-regular fa-lightbulb"></i> TIP</div>
                    <p>${section.tip.text}</p>
                </div>
            `;
        }

        html += '<ul class="link-list">';
        section.links.forEach(link => {
            const star = link.star ? '⭐ ' : '';
            const desc = link.desc ? ` - ${link.desc}` : '';
            html += `<li>${star}<a href="${link.url}" target="_blank" rel="noopener">${link.text}</a>${desc}</li>`;
        });
        html += '</ul>';
    });

    container.innerHTML = html;

    renderTOC(cat.sections);
}

function renderTOC(sections) {
    const toc = document.querySelector('.toc-sidebar');
    if (!toc) return;

    let html = '<div class="toc-title">On this page</div>';
    sections.forEach(section => {
        html += `<a href="#${section.id}" class="toc-link">${section.title}</a>`;
    });
    toc.innerHTML = html;

    initTOCHighlight();
}

function initTOCHighlight() {
    const headings = document.querySelectorAll('h2[id]');
    const tocLinks = document.querySelectorAll('.toc-link');

    if (headings.length === 0 || tocLinks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                if (!id) return;
                tocLinks.forEach(link => link.classList.remove('active'));
                const activeLink = document.querySelector(`.toc-link[href="#${id}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, { rootMargin: '-10% 0px -70% 0px', threshold: 0 });

    headings.forEach(h => observer.observe(h));
}

function initSearch() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const listItems = document.querySelectorAll('.link-list li');
        const navItems = document.querySelectorAll('.nav-item');

        listItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = (query === '' || text.includes(query)) ? '' : 'none';
        });

        // Dim sidebar items that don't match
        navItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (query === '' || text.includes(query)) {
                item.style.opacity = '1';
            } else {
                item.style.opacity = '0.4';
            }
        });
    });
}

function initThemeToggle() {
    const toggleBtn = document.querySelector('.theme-toggle');
    if (!toggleBtn) return;

    const icon = toggleBtn.querySelector('i');

    // Load saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');

        if (isLight) {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        } else {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        }
    });
}

function initFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    const form = document.querySelector('#feedback-modal form');
    const status = document.getElementById('feedback-status');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.btn-cancel');

    if (!modal) return;

    function openModal(e) {
        e.preventDefault();
        const target = e.target.closest('a') || e.target;
        const isFeedbackBtn = target.matches('.feedback-btn') || target.classList.contains('feedback-btn');
        const isFeedbackLink = target.textContent && target.textContent.trim() === 'Submit Feedback';

        if (isFeedbackBtn || isFeedbackLink) {
            modal.classList.add('show');
            const catField = document.getElementById('feedback-category');
            if (catField) catField.value = currentCategory || 'General';

            if (status) {
                status.textContent = '';
                status.className = '';
            }
            if (form) form.reset();
        }
    }

    document.addEventListener('click', (e) => {
        const target = e.target.closest('a') || e.target;
        if (target.matches('.feedback-btn') || (target.tagName === 'A' && target.textContent.trim() === 'Submit Feedback')) {
            openModal(e);
        }
    });

    function closeModal() {
        modal.classList.remove('show');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            if (status) {
                status.textContent = '';
                status.className = '';
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    if (status) {
                        status.textContent = 'Thank you for your feedback!';
                        status.className = 'success-msg';
                    }
                    form.reset();
                    setTimeout(() => {
                        closeModal();
                        if (status) status.textContent = '';
                    }, 2000);
                } else {
                    throw new Error('Failed to send');
                }
            } catch (error) {
                console.error('Feedback error:', error);
                if (status) {
                    status.textContent = 'Error sending feedback. Please try again later.';
                    status.className = 'error-msg';
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
}
