// One page at a time, chosen by the URL hash (#work, #about, …). A hash can also point inside a page
// (#epic is a project on the Work page): that page shows and scrolls to it. Without JavaScript every
// section simply shows, one after another, and the links still jump to them.
(() => {
    const pages = [...document.querySelectorAll('.page')];
    if (!pages.length) {
        return;
    }

    document.documentElement.classList.add('js');
    // show() decides where each page starts; the browser's restored positions belong to other pages.
    history.scrollRestoration = 'manual';
    const baseTitle = document.title;
    let current = null;

    function show(id, moveFocus) {
        const target = id ? document.getElementById(id) : null;
        const next = pages.find((page) => page === target) ?? target?.closest('.page') ?? pages[0];

        if (next !== current) {
            for (const page of pages) {
                page.hidden = page !== next;
            }
            current = next;
            document.title = next.dataset.title ? `${next.dataset.title} · ${baseTitle}` : baseTitle;
        }

        // Move focus to the new heading so screen readers hear the change.
        const inside = target && target !== next;
        if (inside) {
            target.scrollIntoView();
        } else {
            window.scrollTo(0, 0);
        }
        if (moveFocus) {
            (inside ? target : next).querySelector('[tabindex="-1"]')?.focus({ preventScroll: true });
        }
    }

    const hashId = () => decodeURIComponent(location.hash.slice(1));

    // Handle in-page links here rather than letting the browser jump: its jump runs while the target page
    // is still hidden and can race with ours, landing in the wrong place.
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]');
        if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const id = decodeURIComponent(link.getAttribute('href').slice(1));
        if (!document.getElementById(id)) {
            return;
        }

        event.preventDefault();
        if (hashId() !== id) {
            history.pushState(null, '', `#${id}`);
        }
        show(id, true);
    });

    // Back/forward and hand-edited URLs.
    window.addEventListener('hashchange', () => show(hashId(), true));

    show(hashId(), false);
})();

// Screenshot lightbox. Without JavaScript (or <dialog> support) the links open the full image instead.
(() => {
    const dialog = document.querySelector('.lightbox');
    const image = dialog?.querySelector('img');
    const caption = dialog?.querySelector('.lightbox-caption');
    let opener = null;

    if (!dialog || !image || !caption || typeof dialog.showModal !== 'function') {
        return;
    }

    document.addEventListener('click', (event) => {
        const link = event.target.closest('.shot a');
        if (!link || event.metaKey || event.ctrlKey || event.shiftKey) {
            return;
        }

        event.preventDefault();
        opener = link;
        image.src = link.href;
        image.alt = link.querySelector('img')?.alt ?? '';
        caption.textContent = link.closest('.shot')?.querySelector('figcaption')?.textContent ?? '';
        dialog.showModal();
    });

    // Clicking the dark area around the image closes it.
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });

    dialog.addEventListener('close', () => {
        image.removeAttribute('src');
        opener?.focus();
    });
})();
