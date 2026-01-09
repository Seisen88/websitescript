// Component Loader - Injects header and footer directly (works with file:// protocol)
document.addEventListener('DOMContentLoaded', function() {
    showConsoleBranding();
    loadHeader();
    loadSidebar();
    loadFooter();
    loadAds();
    updateActiveNavLink();
    initLoadingScreen();
});

function showConsoleBranding() {
    console.log('%c⚡ Seisen Hub %cv2.0', 'color: #10b981; font-weight: bold; font-size: 24px;', 'color: #888; font-size: 12px;');
    console.log('%cPremium Scripts & Tools', 'color: #e5e5e5; font-size: 14px; font-weight: 500;');
    console.log('%cJoin our Discord: https://discord.gg/F4sAf6z8Ph', 'color: #3b82f6; font-size: 12px; margin-top: 5px;');
    console.log('%cDeveloped by Seisen Hub', 'color: #888; font-size: 10px; font-style: italic; margin-top: 5px;');
}

function loadAds() {
    const script = document.createElement('script');
    script.src = 'js/ads.js';
    script.async = true;
    document.body.appendChild(script);
}

function loadHeader() {
    const headerHTML = `
<!-- Loading Screen -->
<div id="loading-screen" class="loading-screen">
    <div class="loading-content">
        <div class="loading-logo">
            <i class="fas fa-bolt"></i>
        </div>
        <h2 class="loading-title">Seisen</h2>
        <div class="loading-bar-container">
            <div class="loading-bar"></div>
        </div>
        <p class="loading-text">Loading...</p>
    </div>
</div>

<div class="page-background-text">Seisen</div>

<!-- Hamburger Menu Button -->
<button class="hamburger-menu" id="hamburgerMenu">
    <i class="fas fa-bars"></i>
</button>

<!-- Sidebar Navigation -->
<nav class="sidebar" id="sidebar">
    <div class="sidebar-content">
        <a href="#" class="sidebar-logo">
            <i class="fas fa-bolt"></i>
        </a>
        <div class="sidebar-links">
            <a href="/" class="sidebar-link" title="Home">
                <i class="fas fa-home"></i>
            </a>
            <a href="#" class="sidebar-link disabled" title="Obfuscator (Coming Soon)" onclick="return false;">
                <i class="fas fa-lock"></i>
            </a>
            <a href="/scripts" class="sidebar-link" title="Scripts">
                <i class="fas fa-code"></i>
            </a>
            <a href="/getkey" class="sidebar-link" title="Get Key">
                <i class="fas fa-key"></i>
            </a>
            <a href="/premium" class="sidebar-link" title="Premium">
                <i class="fas fa-crown"></i>
            </a>
            <a href="/partners" class="sidebar-link" title="Partners">
                <i class="fas fa-handshake"></i>
            </a>
            <a href="/faq" class="sidebar-link" title="FAQ">
                <i class="fas fa-question-circle"></i>
            </a>
            <a href="https://discord.gg/F4sAf6z8Ph" target="_blank" class="sidebar-link" title="Discord">
                <i class="fab fa-discord"></i>
            </a>
            <a href="/videos" class="sidebar-link" title="YouTube">
                <i class="fab fa-youtube"></i>
            </a>
            <a href="/support" class="sidebar-link" title="Support">
                <i class="fas fa-headset"></i>
            </a>
        </div>
        <script>
            // Only show Get Key link on getkey.html
            if (window.location.pathname.includes('getkey.html')) {
                document.getElementById('getKeyLink').style.display = 'flex';
            }
        </script>
    </div>
</nav>

<!-- Theme FAB -->
<button class="theme-fab" id="themeToggle" title="Change Theme">
    <i class="fas fa-palette"></i>
</button>

<!-- Theme Selector Panel -->
<div class="theme-panel" id="themePanel">
    <div class="theme-panel-header">
        <span>SELECT THEME</span>
    </div>
    <div class="theme-panel-options">
        <button class="theme-panel-option" data-theme="default">
            <i class="fas fa-circle"></i>
            <span>Default</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="light">
            <i class="fas fa-sun"></i>
            <span>Light</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="dark">
            <i class="fas fa-moon"></i>
            <span>Dark</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="forest">
            <i class="fas fa-tree"></i>
            <span>Forest</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="ocean">
            <i class="fas fa-water"></i>
            <span>Ocean</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="sunset">
            <i class="fas fa-cloud-sun"></i>
            <span>Sunset</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="purple">
            <i class="fas fa-gem"></i>
            <span>Purple</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="rose">
            <i class="fas fa-heart"></i>
            <span>Rose</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="midnight">
            <i class="fas fa-star"></i>
            <span>Midnight</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="matrix">
            <i class="fas fa-code"></i>
            <span>Matrix</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="nord">
            <i class="fas fa-snowflake"></i>
            <span>Nord</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="dracula">
            <i class="fas fa-moon"></i>
            <span>Dracula</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="monokai">
            <i class="fas fa-palette"></i>
            <span>Monokai</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="cyberpunk">
            <i class="fas fa-robot"></i>
            <span>Cyberpunk</span>
            <i class="fas fa-check theme-check"></i>
        </button>
        <button class="theme-panel-option" data-theme="tokyo-night">
            <i class="fas fa-city"></i>
            <span>Tokyo Night</span>
            <i class="fas fa-check theme-check"></i>
        </button>
    </div>
</div>
    `;
    
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = headerHTML;
        
        // Hamburger Menu Logic
        const hamburgerBtn = document.getElementById('hamburgerMenu');
        const sidebar = document.getElementById('sidebar');
        
        if (hamburgerBtn && sidebar) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('active');
            });
            
            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            });
        }
    }
}

function loadSidebar() {
    // Only inject sidebar if there's a standalone #sidebar div (for pages without header-container)
    const sidebarDiv = document.getElementById('sidebar');
    const headerContainer = document.getElementById('header-container');
    
    // Only inject if sidebar div exists and header-container doesn't (to avoid duplication)
    if (sidebarDiv && !headerContainer) {
        const sidebarHTML = `
<div class="page-background-text">Seisen</div>

<!-- Hamburger Menu Button -->
<button class="hamburger-menu" id="hamburgerMenu">
    <i class="fas fa-bars"></i>
</button>

<!-- Sidebar Navigation -->
<nav class="sidebar" id="sidebar-nav">
    <div class="sidebar-content">
        <a href="#" class="sidebar-logo">
            <i class="fas fa-bolt"></i>
        </a>
        <div class="sidebar-links">
            <a href="/" class="sidebar-link" title="Home">
                <i class="fas fa-home"></i>
            </a>
            <a href="#" class="sidebar-link disabled" title="Obfuscator (Coming Soon)" onclick="return false;">
                <i class="fas fa-lock"></i>
            </a>
            <a href="/scripts" class="sidebar-link" title="Scripts">
                <i class="fas fa-code"></i>
            </a>
            <a href="/getkey" class="sidebar-link" title="Get Key">
                <i class="fas fa-key"></i>
            </a>
            <a href="/premium" class="sidebar-link" title="Premium">
                <i class="fas fa-crown"></i>
            </a>
            <a href="/partners" class="sidebar-link" title="Partners">
                <i class="fas fa-handshake"></i>
            </a>
            <a href="/faq" class="sidebar-link" title="FAQ">
                <i class="fas fa-question-circle"></i>
            </a>
            <a href="https://discord.gg/F4sAf6z8Ph" target="_blank" class="sidebar-link" title="Discord">
                <i class="fab fa-discord"></i>
            </a>
            <a href="/videos" class="sidebar-link" title="YouTube">
                <i class="fab fa-youtube"></i>
            </a>
            <a href="/support" class="sidebar-link" title="Support">
                <i class="fas fa-headset"></i>
            </a>
        </div>
    </div>
</nav>
        `;
        
        sidebarDiv.innerHTML = sidebarHTML;
        
        // Initialize hamburger menu
        const hamburgerBtn = document.getElementById('hamburgerMenu');
        const sidebar = document.getElementById('sidebar-nav');
        
        if (hamburgerBtn && sidebar) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('active');
            });
            
            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            });
        }
    }
}

function loadFooter() {
    const footerHTML = `
<footer class="footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-section">
                <h3><i class="fas fa-bolt" style="color: #10b981;"></i> Seisen</h3>
                <p class="footer-carousel-text">Premium scripts and tools for enhanced gaming experiences.</p>
                <div class="visitor-counter" style="margin-top: 0.5rem; font-size: 0.65rem; color: var(--text-muted);">
                    <i class="fas fa-eye"></i> <span id="visitor-count">Loading...</span> visitors
                </div>
            </div>
            <div class="footer-section">
                <h4>Products</h4>
                <ul class="footer-links footer-links-columns">
                    <li><a href="obfuscator">Lua Obfuscator</a></li>
                    <li><a href="scripts">Script Hub</a></li>
                    <li><a href="videos">Tutorials</a></li>
                    <li><a href="premium">Premium Access</a></li>
                    <li><a href="getkey">Get Key</a></li>
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
                    <li><a href="legal#terms">Terms of Service</a></li>
                    <li><a href="legal#privacy">Privacy Policy</a></li>
                    <li><a href="legal#license">License (AGPL v3.0)</a></li>
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
        initVisitorCounter();
        initFooterCarousel();
    }
}

// Visitor Counter
async function initVisitorCounter() {
    const VISITOR_KEY = 'seisen_visitor_count';
    const SESSION_VISITOR_KEY = 'seisen_session_visitor';
    
    // Determine API Base URL
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000' 
        : 'https://seisen-backend.onrender.com';

    // Check if this session has already been counted
    let hasVisitedThisSession = sessionStorage.getItem(SESSION_VISITOR_KEY);
    
    try {
        let count;
        
        if (!hasVisitedThisSession) {
            // New session - call increment endpoint
            const response = await fetch(`${API_BASE}/api/visitors`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                count = data.count;
                sessionStorage.setItem(SESSION_VISITOR_KEY, 'true');
            }
        } else {
            // Existing session - just get current count
            const response = await fetch(`${API_BASE}/api/visitors`);
            if (response.ok) {
                const data = await response.json();
                count = data.count;
            }
        }
        
        // Update display if we got a valid count
        if (count !== undefined) {
             const counterElement = document.getElementById('visitor-count');
             if (counterElement) {
                 counterElement.textContent = count.toLocaleString();
             }
             // Also update local storage as a fallback/cache
             localStorage.setItem(VISITOR_KEY, count.toString());
        } else {
            // Fallback to local storage if API fails
            const localCount = parseInt(localStorage.getItem(VISITOR_KEY) || '0', 10);
            const counterElement = document.getElementById('visitor-count');
            if (counterElement) {
                counterElement.textContent = localCount.toLocaleString();
            }
        }
        
    } catch (error) {
        console.error('Error updating visitor count:', error);
        // Fallback display
        const localCount = parseInt(localStorage.getItem(VISITOR_KEY) || '0', 10);
        const counterElement = document.getElementById('visitor-count');
        if (counterElement) {
            counterElement.textContent = localCount.toLocaleString();
        }
    }
}

// Footer Carousel
function initFooterCarousel() {
    const descriptions = [
        "Premium scripts and tools for enhanced gaming experiences.",
        "Advanced obfuscation and script protection solutions.",
        "Your trusted hub for Roblox scripting excellence.",
        "Powerful tools for developers and gamers alike."
    ];
    
    let currentIndex = 0;
    const carouselElement = document.querySelector('.footer-carousel-text');
    
    if (!carouselElement) return;
    
    setInterval(() => {
        currentIndex = (currentIndex + 1) % descriptions.length;
        carouselElement.style.opacity = '0';
        
        setTimeout(() => {
            carouselElement.textContent = descriptions[currentIndex];
            carouselElement.style.opacity = '1';
        }, 300);
    }, 4000);
}

// Loading Screen Initialization
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return;
    
    // Check if user has already seen loading screen in this session
    const hasSeenLoading = sessionStorage.getItem('seisen_loading_shown');
    
    if (hasSeenLoading) {
        // Skip loading screen, hide immediately
        loadingScreen.style.display = 'none';
        return;
    }
    
    // Mark that loading screen has been shown
    sessionStorage.setItem('seisen_loading_shown', 'true');
    
    let progress = 0;
    const loadingBar = document.querySelector('.loading-bar');
    const loadingText = document.querySelector('.loading-text');
    
    const messages = [
        'Loading...',
        'Initializing...',
        'Almost ready...',
        'Welcome!'
    ];
    
    let messageIndex = 0;
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
        progress += Math.random() * 30;
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            
            // Hide loading screen after completion
            setTimeout(() => {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 300);
        }
        
        if (loadingBar) {
            loadingBar.style.width = progress + '%';
        }
        
        // Update loading text
        if (progress > 25 && messageIndex === 0) {
            messageIndex = 1;
            if (loadingText) loadingText.textContent = messages[1];
        } else if (progress > 60 && messageIndex === 1) {
            messageIndex = 2;
            if (loadingText) loadingText.textContent = messages[2];
        } else if (progress >= 90 && messageIndex === 2) {
            messageIndex = 3;
            if (loadingText) loadingText.textContent = messages[3];
        }
    }, 200);
}

function updateActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".sidebar-link");

  navLinks.forEach((link) => {
    link.classList.remove("active");
    const linkHref = link.getAttribute("href");
    if (
      linkHref === currentPage ||
      (currentPage === "index.html" && linkHref === "index.html")
    ) {
      link.classList.add("active");
    }
  });
}

// Theme Management
function initTheme() {
  // Load saved theme or use default
  const savedTheme = localStorage.getItem('selectedTheme') || 'default';
  applyTheme(savedTheme);
  
  // Set up event listeners after DOM is loaded
  setTimeout(() => {
    const themeToggle = document.getElementById('themeToggle');
    const themePanel = document.getElementById('themePanel');
    const themeOptions = document.querySelectorAll('.theme-panel-option');
    
    if (themeToggle && themePanel) {
      // Toggle theme panel
      themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        themePanel.classList.toggle('active');
      });
      
      // Close panel when clicking outside
      document.addEventListener('click', (e) => {
        if (!themePanel.contains(e.target) && !themeToggle.contains(e.target)) {
          themePanel.classList.remove('active');
        }
      });
      
      // Theme option selection
      themeOptions.forEach(option => {
        option.addEventListener('click', () => {
          const theme = option.getAttribute('data-theme');
          applyTheme(theme);
          localStorage.setItem('selectedTheme', theme);
          
          // Update active state
          themeOptions.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
        });
        
        // Set active theme
        if (option.getAttribute('data-theme') === savedTheme) {
          option.classList.add('active');
        }
      });
    }
  }, 100);
}

function applyTheme(theme) {
  const root = document.documentElement;
  
  // Theme color definitions
  const themes = {
    default: {
      primary: '#10b981',
      bg: '#0a0a0a',
      bgSecondary: '#141414',
      bgTertiary: '#1a1a1a',
      text: '#e5e5e5',
      textSecondary: '#888'
    },
    light: {
      primary: '#10b981',
      bg: '#ffffff',
      bgSecondary: '#f8f9fa',
      bgTertiary: '#e9ecef',
      text: '#1a1f2e',
      textSecondary: '#6c757d'
    },
    dark: {
      primary: '#10b981',
      bg: '#0a0a0a',
      bgSecondary: '#1a1a1a',
      bgTertiary: '#2a2a2a',
      text: '#e6e6e6',
      textSecondary: '#999999'
    },
    forest: {
      primary: '#34d399',
      bg: '#0a1f0f',
      bgSecondary: '#1a2f1e',
      bgTertiary: '#2a3f2e',
      text: '#d1fae5',
      textSecondary: '#86efac'
    },
    ocean: {
      primary: '#22d3ee',
      bg: '#083344',
      bgSecondary: '#164e63',
      bgTertiary: '#155e75',
      text: '#cffafe',
      textSecondary: '#67e8f9'
    },
    sunset: {
      primary: '#fb923c',
      bg: '#1f1108',
      bgSecondary: '#2f2118',
      bgTertiary: '#3f3128',
      text: '#fed7aa',
      textSecondary: '#fdba74'
    },
    purple: {
      primary: '#a78bfa',
      bg: '#1e1b4b',
      bgSecondary: '#312e81',
      bgTertiary: '#4c1d95',
      text: '#e9d5ff',
      textSecondary: '#c4b5fd'
    },
    rose: {
      primary: '#f43f5e',
      bg: '#1f0510',
      bgSecondary: '#2f1520',
      bgTertiary: '#3f2530',
      text: '#fecdd3',
      textSecondary: '#fda4af'
    },
    midnight: {
      primary: '#60a5fa',
      bg: '#0c0a1f',
      bgSecondary: '#1e1b3e',
      bgTertiary: '#2e2b5e',
      text: '#dbeafe',
      textSecondary: '#93c5fd'
    },
    matrix: {
      primary: '#00ff41',
      bg: '#0d0208',
      bgSecondary: '#1a1a1a',
      bgTertiary: '#2a2a2a',
      text: '#00ff41',
      textSecondary: '#00cc33'
    },
    nord: {
      primary: '#88c0d0',
      bg: '#2e3440',
      bgSecondary: '#3b4252',
      bgTertiary: '#434c5e',
      text: '#eceff4',
      textSecondary: '#d8dee9'
    },
    dracula: {
      primary: '#bd93f9',
      bg: '#282a36',
      bgSecondary: '#44475a',
      bgTertiary: '#6272a4',
      text: '#f8f8f2',
      textSecondary: '#8be9fd'
    },
    monokai: {
      primary: '#a6e22e',
      bg: '#272822',
      bgSecondary: '#3e3d32',
      bgTertiary: '#49483e',
      text: '#f8f8f2',
      textSecondary: '#f92672'
    },
    cyberpunk: {
      primary: '#ff00ff',
      bg: '#0a0e27',
      bgSecondary: '#16213e',
      bgTertiary: '#1f2d5c',
      text: '#00ffff',
      textSecondary: '#ff00aa'
    },
    'tokyo-night': {
      primary: '#7aa2f7',
      bg: '#1a1b26',
      bgSecondary: '#24283b',
      bgTertiary: '#414868',
      text: '#c0caf5',
      textSecondary: '#9aa5ce'
    }
  };
  
  const selectedTheme = themes[theme] || themes.default;
  
  // Apply CSS variables
  root.style.setProperty('--color-primary', selectedTheme.primary);
  root.style.setProperty('--bg-primary', selectedTheme.bg);
  root.style.setProperty('--bg-secondary', selectedTheme.bgSecondary);
  root.style.setProperty('--bg-tertiary', selectedTheme.bgTertiary);
  root.style.setProperty('--bg-card', selectedTheme.bgSecondary);
  root.style.setProperty('--bg-card-hover', selectedTheme.bgTertiary);
  root.style.setProperty('--text-primary', selectedTheme.text);
  root.style.setProperty('--text-secondary', selectedTheme.textSecondary);
  
  // Update document attribute for theme-specific styles
  document.documentElement.setAttribute('data-theme', theme);
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
});
