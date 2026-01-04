// Home Page JavaScript - Handle button clicks and interactions

document.addEventListener('DOMContentLoaded', function() {
    // Handle all buttons with href="#"
    document.querySelectorAll('a.btn[href="#"]').forEach(btn => {
        const spanText = btn.querySelector('span')?.textContent.trim() || btn.textContent.trim();
        
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get Free Key button
            if (spanText === 'Get Free Key') {
                window.location.href = 'getkey.html';
            }
            // Upgrade Now button
            else if (spanText === 'Upgrade Now') {
                window.location.href = 'premium.html';
            }
            // Learn More button (in partnerships section)
            else if (spanText === 'Learn More') {
                window.location.href = 'https://discord.gg/F4sAf6z8Ph';
            }
        });
    });

    // Handle buttons with href="#access-options"
    document.querySelectorAll('a.btn[href="#access-options"]').forEach(btn => {
        const spanText = btn.querySelector('span')?.textContent.trim() || btn.textContent.trim();
        
        btn.addEventListener('click', function(e) {
            // Get Access Key and Go Premium buttons in hero section
            if (spanText === 'Get Access Key') {
                e.preventDefault();
                window.location.href = 'getkey.html';
            } else if (spanText === 'Go Premium') {
                e.preventDefault();
                window.location.href = 'premium.html';
            } else if (spanText === 'Learn More') {
                // Let it scroll to #access-options (default behavior)
                e.preventDefault();
                const target = document.querySelector('#access-options');
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (href && href !== '#' && href.length > 1) {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        }
    });
});
