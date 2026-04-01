/**
 * CRAS Car Gallery - Interactive Image Gallery with Animations
 * Handles thumbnail click → main image swap with smooth transitions,
 * hover effects, keyboard navigation, and fullscreen lightbox.
 */

(function () {
    'use strict';

    // ─── State ───────────────────────────────────────────────────
    let currentIndex = 0;
    let thumbnails = [];
    let mainImage = null;
    let isAnimating = false;
    let lightboxOpen = false;

    // ─── Init on DOM ready ───────────────────────────────────────
    document.addEventListener('DOMContentLoaded', initGallery);

    function initGallery() {
        mainImage = document.getElementById('mainImage');
        if (!mainImage) return; // not a gallery page

        const gallery = document.querySelector('.thumbnail-gallery');
        if (!gallery) return;

        thumbnails = Array.from(gallery.querySelectorAll('.thumbnail'));
        if (thumbnails.length === 0) return;

        // ── Inject enhanced CSS animations ──
        injectGalleryStyles();

        // ── Build the lightbox overlay ──
        buildLightbox();

        // ── Add image counter badge ──
        addImageCounter();

        // ── Add entrance animations to thumbnails ──
        thumbnails.forEach((thumb, i) => {
            // Stagger entrance
            thumb.style.opacity = '0';
            thumb.style.transform = 'translateY(20px) scale(0.95)';
            setTimeout(() => {
                thumb.style.transition = 'opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1)';
                thumb.style.opacity = '1';
                thumb.style.transform = 'translateY(0) scale(1)';
            }, 100 + i * 80);

            // Remove inline onclick and use event delegation
            thumb.removeAttribute('onclick');
            thumb.addEventListener('click', () => selectThumbnail(i));
        });

        // ── Main image click → fullscreen ──
        const mainImageContainer = document.querySelector('.main-image');
        if (mainImageContainer) {
            mainImageContainer.style.cursor = 'zoom-in';
            mainImageContainer.addEventListener('click', openLightbox);
        }

        // ── Main image entrance animation ──
        mainImage.style.opacity = '0';
        mainImage.style.transform = 'scale(1.03)';
        setTimeout(() => {
            mainImage.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            mainImage.style.opacity = '1';
            mainImage.style.transform = 'scale(1)';
        }, 50);

        // ── Keyboard navigation ──
        document.addEventListener('keydown', handleKeyboard);

        // ── Set initial active state ──
        updateActiveState(0);
        updateCounter();
    }

    // ─── Core: select thumbnail & swap main image ────────────────
    function selectThumbnail(index) {
        if (isAnimating || index === currentIndex) return;
        isAnimating = true;

        const thumb = thumbnails[index];
        const thumbImg = thumb.querySelector('img');
        if (!thumbImg) { isAnimating = false; return; }

        const newSrc = thumbImg.getAttribute('src');
        const newAlt = thumbImg.getAttribute('alt');

        // Determine slide direction
        const direction = index > currentIndex ? 1 : -1;

        // ── Animate out ──
        mainImage.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        mainImage.style.opacity = '0';
        mainImage.style.transform = `scale(0.97) translateX(${-30 * direction}px)`;

        setTimeout(() => {
            // Swap image
            mainImage.src = newSrc;
            mainImage.alt = newAlt || '';

            // ── Animate in from opposite direction ──
            mainImage.style.transform = `scale(0.97) translateX(${30 * direction}px)`;

            // Wait for image load then reveal
            const reveal = () => {
                requestAnimationFrame(() => {
                    mainImage.style.transition = 'opacity 0.45s cubic-bezier(0.4,0,0.2,1), transform 0.45s cubic-bezier(0.4,0,0.2,1)';
                    mainImage.style.opacity = '1';
                    mainImage.style.transform = 'scale(1) translateX(0)';

                    setTimeout(() => { isAnimating = false; }, 450);
                });
            };

            if (mainImage.complete) {
                reveal();
            } else {
                mainImage.onload = reveal;
                mainImage.onerror = reveal;
            }

            // Update state
            currentIndex = index;
            updateActiveState(index);
            updateCounter();

            // Update lightbox if open
            if (lightboxOpen) {
                const lbImg = document.getElementById('lightboxImage');
                if (lbImg) lbImg.src = newSrc;
            }
        }, 350);
    }

    // ─── Update active thumbnail ─────────────────────────────────
    function updateActiveState(activeIndex) {
        thumbnails.forEach((thumb, i) => {
            if (i === activeIndex) {
                thumb.classList.add('active');
                // Subtle pop animation
                thumb.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s ease, box-shadow 0.3s ease';
                thumb.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    thumb.style.transform = 'scale(1)';
                }, 300);
            } else {
                thumb.classList.remove('active');
            }
        });
    }

    // ─── Image Counter Badge ─────────────────────────────────────
    function addImageCounter() {
        const mainContainer = document.querySelector('.main-image');
        if (!mainContainer) return;

        mainContainer.style.position = 'relative';

        const counter = document.createElement('div');
        counter.id = 'galleryCounter';
        counter.className = 'gallery-counter';
        mainContainer.appendChild(counter);
    }

    function updateCounter() {
        const counter = document.getElementById('galleryCounter');
        if (counter) {
            counter.textContent = `${currentIndex + 1} / ${thumbnails.length}`;
        }
    }

    // ─── Keyboard Navigation ─────────────────────────────────────
    function handleKeyboard(e) {
        if (!mainImage) return;

        if (lightboxOpen) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') navigateNext();
            if (e.key === 'ArrowLeft') navigatePrev();
            return;
        }

        // Only handle arrows when gallery is in viewport
        const gallery = document.querySelector('.gallery-section');
        if (!gallery) return;
        const rect = gallery.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (!inView) return;

        if (e.key === 'ArrowRight') { e.preventDefault(); navigateNext(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); navigatePrev(); }
    }

    function navigateNext() {
        const next = (currentIndex + 1) % thumbnails.length;
        selectThumbnail(next);
    }

    function navigatePrev() {
        const prev = (currentIndex - 1 + thumbnails.length) % thumbnails.length;
        selectThumbnail(prev);
    }

    // ─── Fullscreen Lightbox ─────────────────────────────────────
    function buildLightbox() {
        const overlay = document.createElement('div');
        overlay.id = 'galleryLightbox';
        overlay.className = 'gallery-lightbox';
        overlay.innerHTML = `
            <div class="lightbox-backdrop"></div>
            <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
            <button class="lightbox-nav lightbox-prev" aria-label="Previous image">&#8249;</button>
            <button class="lightbox-nav lightbox-next" aria-label="Next image">&#8250;</button>
            <div class="lightbox-img-wrapper">
                <img id="lightboxImage" src="" alt="Car view">
            </div>
            <div class="lightbox-counter" id="lightboxCounter"></div>
        `;
        document.body.appendChild(overlay);

        // Events
        overlay.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
        overlay.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
        overlay.querySelector('.lightbox-prev').addEventListener('click', (e) => { e.stopPropagation(); navigatePrev(); updateLightboxImage(); });
        overlay.querySelector('.lightbox-next').addEventListener('click', (e) => { e.stopPropagation(); navigateNext(); updateLightboxImage(); });
    }

    function openLightbox() {
        const overlay = document.getElementById('galleryLightbox');
        const lbImg = document.getElementById('lightboxImage');
        if (!overlay || !lbImg) return;

        lbImg.src = mainImage.src;
        lightboxOpen = true;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateLightboxCounter();
    }

    function closeLightbox() {
        const overlay = document.getElementById('galleryLightbox');
        if (!overlay) return;

        lightboxOpen = false;
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function updateLightboxImage() {
        const lbImg = document.getElementById('lightboxImage');
        if (!lbImg) return;
        const thumbImg = thumbnails[currentIndex]?.querySelector('img');
        if (thumbImg) lbImg.src = thumbImg.src;
        updateLightboxCounter();
    }

    function updateLightboxCounter() {
        const lbCounter = document.getElementById('lightboxCounter');
        if (lbCounter) {
            lbCounter.textContent = `${currentIndex + 1} / ${thumbnails.length}`;
        }
    }

    // ─── Global changeImage function (backward compatibility) ────
    window.changeImage = function (src) {
        // Find the thumbnail whose img src matches
        const matchIndex = thumbnails.findIndex(thumb => {
            const img = thumb.querySelector('img');
            return img && img.getAttribute('src') === src;
        });
        if (matchIndex >= 0) {
            selectThumbnail(matchIndex);
        }
    };

    // ─── Inject Gallery CSS (animations & effects) ───────────────
    function injectGalleryStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* ═══════════════════════════════════════════════════════
               CRAS Gallery — Enhanced Animations & Hover Effects
               ═══════════════════════════════════════════════════════ */

            /* ── Main Image Container ── */
            .main-image {
                position: relative;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 
                    0 20px 60px rgba(0, 0, 0, 0.5),
                    0 0 0 1px rgba(255, 85, 51, 0.1);
                transition: box-shadow 0.4s ease;
            }

            .main-image:hover {
                box-shadow: 
                    0 25px 70px rgba(0, 0, 0, 0.6),
                    0 0 0 1px rgba(255, 85, 51, 0.25),
                    0 0 40px rgba(255, 85, 51, 0.08);
            }

            /* Zoom-in cursor hint overlay */
            .main-image::after {
                content: '🔍 Click to enlarge';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 15px;
                background: linear-gradient(transparent, rgba(0,0,0,0.7));
                color: rgba(255,255,255,0.7);
                font-size: 0.85rem;
                text-align: center;
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.3s ease, transform 0.3s ease;
                pointer-events: none;
                letter-spacing: 1px;
            }

            .main-image:hover::after {
                opacity: 1;
                transform: translateY(0);
            }

            .main-image img {
                width: 100%;
                height: 500px;
                object-fit: cover;
                transition: transform 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease;
                will-change: transform, opacity;
            }

            .main-image:hover img {
                transform: scale(1.03);
            }

            /* ── Image Counter Badge ── */
            .gallery-counter {
                position: absolute;
                top: 16px;
                right: 16px;
                background: rgba(0, 0, 0, 0.65);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                color: #fff;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                letter-spacing: 1.5px;
                z-index: 5;
                border: 1px solid rgba(255, 255, 255, 0.15);
                pointer-events: none;
            }

            /* ── Thumbnail Gallery ── */
            .thumbnail-gallery {
                display: flex;
                gap: 15px;
                padding-top: 25px;
                overflow-x: auto;
                scroll-behavior: smooth;
                -ms-overflow-style: none;
                scrollbar-width: none;
                padding-bottom: 5px;
            }

            .thumbnail-gallery::-webkit-scrollbar {
                display: none;
            }

            /* ── Individual Thumbnails ── */
            .thumbnail {
                flex-shrink: 0;
                border-radius: 14px;
                overflow: hidden;
                cursor: pointer;
                position: relative;
                border: 2.5px solid transparent;
                transition: 
                    transform 0.35s cubic-bezier(0.34,1.56,0.64,1),
                    border-color 0.3s ease,
                    box-shadow 0.3s ease;
                will-change: transform;
            }

            /* Hover glow ring */
            .thumbnail::before {
                content: '';
                position: absolute;
                inset: -3px;
                border-radius: 16px;
                background: linear-gradient(135deg, #ff5533, #ff8f4a, #ff5533);
                z-index: -1;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .thumbnail:hover::before {
                opacity: 0.5;
            }

            .thumbnail.active::before {
                opacity: 1;
            }

            /* Dark overlay on hover */
            .thumbnail::after {
                content: '';
                position: absolute;
                inset: 0;
                background: rgba(255, 85, 51, 0.15);
                opacity: 0;
                transition: opacity 0.3s ease;
                border-radius: 12px;
                pointer-events: none;
                z-index: 2;
            }

            .thumbnail:hover::after {
                opacity: 1;
            }

            .thumbnail.active::after {
                opacity: 0;
            }

            .thumbnail:hover {
                transform: scale(1.08) translateY(-4px);
                border-color: rgba(255, 85, 51, 0.6);
                box-shadow: 
                    0 12px 28px rgba(0, 0, 0, 0.3),
                    0 0 20px rgba(255, 85, 51, 0.15);
            }

            .thumbnail.active {
                border-color: #ff5533;
                box-shadow: 
                    0 8px 25px rgba(255, 85, 51, 0.3),
                    0 0 15px rgba(255, 85, 51, 0.1);
                transform: scale(1);
            }

            .thumbnail img {
                width: 100%;
                height: 120px;
                object-fit: cover;
                transition: transform 0.4s ease, filter 0.3s ease;
                display: block;
            }

            .thumbnail:hover img {
                transform: scale(1.1);
                filter: brightness(1.1);
            }

            .thumbnail.active img {
                filter: brightness(1.05);
            }

            /* ═══════════════════════════════════════════════════════
               Fullscreen Lightbox
               ═══════════════════════════════════════════════════════ */
            .gallery-lightbox {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.4s ease, visibility 0.4s ease;
            }

            .gallery-lightbox.active {
                opacity: 1;
                visibility: visible;
            }

            .lightbox-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.92);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
            }

            .lightbox-img-wrapper {
                position: relative;
                z-index: 2;
                max-width: 90vw;
                max-height: 85vh;
            }

            .gallery-lightbox.active .lightbox-img-wrapper {
                animation: lightboxZoomIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
            }

            @keyframes lightboxZoomIn {
                from { transform: scale(0.85); opacity: 0; }
                to   { transform: scale(1); opacity: 1; }
            }

            .lightbox-img-wrapper img {
                max-width: 90vw;
                max-height: 85vh;
                border-radius: 16px;
                object-fit: contain;
                box-shadow: 0 30px 80px rgba(0,0,0,0.6);
            }

            .lightbox-close {
                position: absolute;
                top: 20px;
                right: 25px;
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.2);
                color: #fff;
                font-size: 2rem;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                cursor: pointer;
                z-index: 5;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                line-height: 1;
            }

            .lightbox-close:hover {
                background: rgba(255, 85, 51, 0.5);
                transform: rotate(90deg) scale(1.1);
            }

            .lightbox-nav {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255,255,255,0.08);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.15);
                color: #fff;
                font-size: 2.5rem;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                cursor: pointer;
                z-index: 5;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                line-height: 1;
            }

            .lightbox-prev { left: 20px; }
            .lightbox-next { right: 20px; }

            .lightbox-nav:hover {
                background: rgba(255, 85, 51, 0.4);
                transform: translateY(-50%) scale(1.1);
                border-color: rgba(255, 85, 51, 0.5);
            }

            .lightbox-counter {
                position: absolute;
                bottom: 25px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(8px);
                color: #fff;
                padding: 8px 20px;
                border-radius: 25px;
                font-size: 0.9rem;
                font-weight: 600;
                letter-spacing: 2px;
                z-index: 5;
                border: 1px solid rgba(255,255,255,0.1);
            }

            /* ═══════════════════════════════════════════════════════
               Gallery Section Scroll-Reveal
               ═══════════════════════════════════════════════════════ */
            .gallery-section .gallery-container {
                opacity: 0;
                transform: translateY(30px);
                animation: galleryReveal 0.8s ease 0.3s forwards;
            }

            @keyframes galleryReveal {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* ═══════════════════════════════════════════════════════
               Responsive
               ═══════════════════════════════════════════════════════ */
            @media (max-width: 768px) {
                .main-image img {
                    height: 300px;
                }
                .thumbnail img {
                    height: 90px;
                }
                .lightbox-nav {
                    width: 44px;
                    height: 44px;
                    font-size: 1.8rem;
                }
                .lightbox-close {
                    width: 42px;
                    height: 42px;
                    font-size: 1.5rem;
                }
                .main-image::after {
                    display: none;
                }
            }

            @media (max-width: 480px) {
                .main-image img {
                    height: 250px;
                }
                .thumbnail img {
                    height: 70px;
                }
                .thumbnail-gallery {
                    gap: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }
})();
