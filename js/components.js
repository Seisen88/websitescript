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
    </div>
</nav>
    `;
    
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = headerHTML;
    }
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
                    <li><a href="#">Terms of Service</a></li>
                    <li><a href="#">Privacy Policy</a></li>
                    <li><a href="#">License (AGPL v3.0)</a></li>
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
