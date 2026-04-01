document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileBtn = document.createElement('button');
    mobileBtn.className = 'mobile-menu-btn';
    mobileBtn.innerHTML = '☰';
    mobileBtn.setAttribute('aria-label', 'Toggle navigation');
    
    const header = document.querySelector('header .container');
    const nav = document.querySelector('nav');
    
    if (header && nav) {
        // Insert the button before the nav
        header.insertBefore(mobileBtn, nav);
        
        mobileBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            mobileBtn.innerHTML = nav.classList.contains('active') ? '✕' : '☰';
        });
    }

    // Header scroll state
    const headerEl = document.querySelector('header');
    const onScrollHeader = () => {
        if (!headerEl) return;
        if (window.scrollY > 50) {
            headerEl.classList.add('scrolled');
        } else {
            headerEl.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', onScrollHeader);
    onScrollHeader();

    // Active Link Highlighting
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        // Get the href attribute
        const href = link.getAttribute('href');
        if (!href) return;

        // Resolve the absolute path of the link
        // This is a simple check, might need refinement for relative paths
        try {
            const linkPath = new URL(href, window.location.origin).pathname;
            if (linkPath === currentPath) {
                link.classList.add('active');
            }
        } catch (e) {}
    });

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    mobileBtn.innerHTML = '☰';
                }
            }
        });
    });

    // Scroll to Top Button
    let scrollToTopBtn = document.getElementById('backToTop');
    if (!scrollToTopBtn) {
        scrollToTopBtn = document.createElement('button');
        scrollToTopBtn.id = 'scrollToTopBtn';
        scrollToTopBtn.innerHTML = '↑';
        scrollToTopBtn.title = 'Go to top';
        document.body.appendChild(scrollToTopBtn);
    }

    window.onscroll = function() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    };

    scrollToTopBtn.addEventListener('click', () => {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    });

    // Form Validation (Generic)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            let isValid = true;
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = 'red';
                } else {
                    input.style.borderColor = ''; // Reset
                }
            });

            if (!isValid) {
                e.preventDefault();
                alert('Please fill in all required fields.');
            }
        });
    });
});
