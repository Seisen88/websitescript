// FAQ Page JavaScript - Handle accordion, search, and category filtering

document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');
    const searchInput = document.getElementById('faq-search-input');
    const categoryBtns = document.querySelectorAll('.faq-category-btn');
    let currentCategory = 'all';

    // FAQ Accordion Toggle
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Category Filtering
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Get selected category
            currentCategory = this.getAttribute('data-category');
            
            // Filter items
            filterFAQs();
        });
    });

    // Search Functionality
    searchInput.addEventListener('input', function() {
        filterFAQs();
    });

    function filterFAQs() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question h3').textContent.toLowerCase();
            const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
            const category = item.getAttribute('data-category');
            
            // Check category match
            const categoryMatch = currentCategory === 'all' || category === currentCategory;
            
            // Check search match
            const searchMatch = searchTerm === '' || 
                                question.includes(searchTerm) || 
                                answer.includes(searchTerm);
            
            // Show or hide item
            if (categoryMatch && searchMatch) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
                item.classList.remove('active');
            }
        });
        
        // Show "no results" message if needed
        const visibleItems = Array.from(faqItems).filter(item => item.style.display !== 'none');
        
        // Remove any existing "no results" message
        const existingMessage = document.querySelector('.no-results-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        if (visibleItems.length === 0) {
            const noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results-message';
            noResultsMsg.innerHTML = `
                <i class="fas fa-search"></i>
                <h3>No results found</h3>
                <p>Try adjusting your search or browse a different category</p>
            `;
            document.querySelector('.faq-container').appendChild(noResultsMsg);
        }
    }
});
