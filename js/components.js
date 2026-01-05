// Component Loader - Injects header and footer directly (works with file:// protocol)
document.addEventListener('DOMContentLoaded', function() {
    loadHeader();
    loadFooter();
    updateActiveNavLink();
});

function loadHeader() {
    const headerHTML = `
<div class="page-background-text">Seisen</div>

<!-- Sidebar Navigation -->
<nav class="sidebar">
    <div class="sidebar-content">
        <a href="#" class="sidebar-logo">
            <i class="fas fa-bolt"></i>
        </a>
        <div class="sidebar-links">
            <a href="index.html" class="sidebar-link" title="Home">
                <i class="fas fa-home"></i>
            </a>
            <a href="obfuscator.html" class="sidebar-link" title="Obfuscator">
                <i class="fas fa-lock"></i>
            </a>
            <a href="scripts.html" class="sidebar-link" title="Scripts">
                <i class="fas fa-code"></i>
            </a>
            <a href="getkey.html" class="sidebar-link" title="Get Key">
                <i class="fas fa-key"></i>
            </a>
            <a href="premium.html" class="sidebar-link" title="Premium">
                <i class="fas fa-crown"></i>
            </a>
            <a href="#" class="sidebar-link" title="Partners">
                <i class="fas fa-handshake"></i>
            </a>
            <a href="faq.html" class="sidebar-link" title="FAQ">
                <i class="fas fa-question-circle"></i>
            </a>
            <a href="https://discord.gg/F4sAf6z8Ph" target="_blank" class="sidebar-link" title="Discord">
                <i class="fab fa-discord"></i>
            </a>
            <a href="videos.html" class="sidebar-link" title="YouTube">
                <i class="fab fa-youtube"></i>
            </a>
        </div>
        <div class="sidebar-footer-actions">
            <div class="theme-selector-container">
                <button class="sidebar-link theme-toggle-btn" title="Change Theme" onclick="toggleThemeMenu()">
                    <i class="fas fa-paint-brush"></i>
                </button>
                <div class="theme-menu" id="theme-menu">
                    <div class="theme-menu-header">Select Theme</div>
                    <div class="theme-options">
                        <button class="theme-option" onclick="setTheme('default')">
                            <i class="fas fa-moon"></i> Default
                        </button>
                        <button class="theme-option" onclick="setTheme('light')">
                            <i class="fas fa-sun"></i> Light
                        </button>
                        <button class="theme-option" onclick="setTheme('forest')">
                            <i class="fas fa-tree"></i> Forest
                        </button>
                        <button class="theme-option" onclick="setTheme('purple')">
                            <i class="fas fa-ghost"></i> Purple
                        </button>
                        <button class="theme-option" onclick="setTheme('midnight')">
                            <i class="fas fa-star"></i> Midnight
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</nav>
    `;
    
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = headerHTML;
    }

    // Initialize Theme
    initializeTheme();
}

/* ========================================
   THEME MANAGER
   ======================================== */
const THEMES = {
    default: {
        '--bg-primary': '#0f1419',
        '--bg-secondary': '#1a1f2e',
        '--bg-tertiary': '#252b3b',
        '--bg-card': '#1e2433',
        '--bg-card-hover': '#252b3d',
        '--text-primary': '#ffffff',
        '--text-secondary': '#9ca3af',
        '--border-color': '#2d3748',
        '--border-color-light': '#374151'
    },
    light: {
        '--bg-primary': '#f3f4f6',
        '--bg-secondary': '#ffffff',
        '--bg-tertiary': '#e5e7eb',
        '--bg-card': '#ffffff',
        '--bg-card-hover': '#f9fafb',
        '--text-primary': '#111827',
        '--text-secondary': '#4b5563',
        '--border-color': '#e5e7eb',
        '--border-color-light': '#d1d5db'
    },
    forest: {
        '--bg-primary': '#051a14',
        '--bg-secondary': '#0a231b',
        '--bg-tertiary': '#0f2e24',
        '--bg-card': '#0d2820',
        '--bg-card-hover': '#13352b',
        '--text-primary': '#e2e8f0',
        '--text-secondary': '#94a3b8',
        '--border-color': '#163e30',
        '--border-color-light': '#1e5240'
    },
    purple: {
        '--bg-primary': '#130f1a',
        '--bg-secondary': '#1e1628',
        '--bg-tertiary': '#2a1f38',
        '--bg-card': '#231a2f',
        '--bg-card-hover': '#2d213d',
        '--text-primary': '#e9d5ff',
        '--text-secondary': '#a855f7',
        '--border-color': '#3b2a4f',
        '--border-color-light': '#4c3666'
    },
    midnight: {
        '--bg-primary': '#02040a',
        '--bg-secondary': '#0d1117',
        '--bg-tertiary': '#161b22',
        '--bg-card': '#161b22',
        '--bg-card-hover': '#21262d',
        '--text-primary': '#c9d1d9',
        '--text-secondary': '#8b949e',
        '--border-color': '#30363d',
        '--border-color-light': '#484f58'
    }
};

function toggleThemeMenu() {
    const menu = document.getElementById('theme-menu');
    menu.classList.toggle('active');
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!e.target.closest('.theme-selector-container')) {
            menu.classList.remove('active');
            document.removeEventListener('click', closeMenu);
        }
    });

    // Prevent button click from closing immediately
    event.stopPropagation();
}

function setTheme(themeName) {
    const theme = THEMES[themeName];
    if (!theme) return;

    // Apply CSS variables
    const root = document.documentElement;
    for (const [property, value] of Object.entries(theme)) {
        root.style.setProperty(property, value);
    }

    // Save preference
    localStorage.setItem('seisen-theme', themeName);

    // Update active state in menu (optional visual feedback)
    // Close menu
    document.getElementById('theme-menu').classList.remove('active');
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('seisen-theme') || 'default';
    setTheme(savedTheme);
}

function loadFooter() {
    const footerHTML = `
<footer class="footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-section">
                <h3><i class="fas fa-bolt" style="color: #10b981;"></i> Seisen</h3>
                <p>The ultimate hub for Roblox scripting. From advanced obfuscation to premium scripts and in-depth tutorials, we provide the tools you need to succeed.</p>
            </div>
            <div class="footer-section">
                <h4>Products</h4>
                <ul class="footer-links">
                    <li><a href="obfuscator.html">Lua Obfuscator</a></li>
                    <li><a href="scripts.html">Script Hub</a></li>
                    <li><a href="videos.html">Tutorials</a></li>
                    <li><a href="premium.html">Premium Access</a></li>
                    <li><a href="getkey.html">Get Key</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>Community</h4>
                <ul class="footer-links">
                    <li><a href="https://discord.gg/F4sAf6z8Ph" target="_blank"><i class="fab fa-discord"></i> Discord Server</a></li>
                    <li><a href="https://www.youtube.com/@SeisenHub" target="_blank"><i class="fab fa-youtube"></i> YouTube Channel</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>Legal</h4>
                <ul class="footer-links">
                    <li><a href="legal.html#terms">Terms of Service</a></li>
                    <li><a href="legal.html#privacy">Privacy Policy</a></li>
                    <li><a href="legal.html#license">License (AGPL v3.0)</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 Seisen. All rights reserved.</p>
        </div>
    </div>
</footer>
    `;
    
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        footerContainer.innerHTML = footerHTML;
    }
}

function updateActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "obfuscator.html";
  const navLinks = document.querySelectorAll(".sidebar-link");

  navLinks.forEach((link) => {
    link.classList.remove("active");
    const linkHref = link.getAttribute("href");
    if (
      linkHref === currentPage ||
      (currentPage === "" && linkHref === "obfuscator.html")
    ) {
      link.classList.add("active");
    }
  });
}
