// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// DOM elements
const getImageBtn = document.getElementById('getImageBtn');
const gallery = document.getElementById('gallery');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');
const modalMedia = document.getElementById('modal-media');
const modalTitle = document.getElementById('modal-title');
const modalDate = document.getElementById('modal-date');
const modalExplanation = document.getElementById('modal-explanation');
const modalCredit = document.getElementById('modal-credit');

let apodItems = [];

// Attach event listeners
getImageBtn.addEventListener('click', () => loadGallery());
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

// Load gallery (fetch data and render)
async function loadGallery() {
	try {
		getImageBtn.disabled = true;
		getImageBtn.textContent = 'Loading...';
		const res = await fetch(apodData);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const items = await res.json();
		if (!Array.isArray(items)) throw new Error('Data is not an array');
		apodItems = items.sort((a, b) => new Date(b.date) - new Date(a.date));
		renderGallery(apodItems);
	} catch (err) {
		console.error('Failed to fetch APOD data', err);
		gallery.innerHTML = `<div class="placeholder"><p>Failed to load gallery. See console for details.</p></div>`;
	} finally {
		getImageBtn.disabled = false;
		getImageBtn.textContent = 'Fetch Space Images';
	}
}

// Render gallery items
function renderGallery(items) {
	// clear existing
	gallery.innerHTML = '';

	items.forEach((item, idx) => {
		const card = document.createElement('article');
		card.className = 'gallery-item';
		card.tabIndex = 0;

		// Media preview: image or video thumbnail
		const media = document.createElement('div');
		media.className = 'media-preview';

		const thumb = document.createElement('img');
		thumb.alt = item.title || item.date || 'APOD item';
		if (item.media_type === 'image') {
			thumb.src = item.url || item.hdurl || '';
		} else if (item.media_type === 'video') {
			// prefer provided thumbnail, otherwise try to build from YouTube url
			thumb.src = item.thumbnail_url || deriveYouTubeThumb(item.url) || '';
		} else {
			thumb.src = item.url || '';
		}
		media.appendChild(thumb);

		const body = document.createElement('div');
		body.className = 'card-body';
		const title = document.createElement('div');
		title.className = 'card-title';
		title.textContent = item.title || 'Untitled';
		const date = document.createElement('div');
		date.className = 'card-date';
		date.textContent = item.date || '';
		body.appendChild(title);
		body.appendChild(date);

		card.appendChild(media);
		card.appendChild(body);

		// Open modal on click / Enter
		card.addEventListener('click', () => openModal(item));
		card.addEventListener('keypress', (e) => { if (e.key === 'Enter') openModal(item); });

		gallery.appendChild(card);
	});
}

// Try to derive a YouTube thumbnail from common URLs
function deriveYouTubeThumb(url) {
	if (!url) return null;
	try {
		// example embed: https://www.youtube.com/embed/VIDEOID
		const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
		if (embedMatch) return `https://img.youtube.com/vi/${embedMatch[1]}/hqdefault.jpg`;
		// watch?v=VIDEOID
		const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
		if (watchMatch) return `https://img.youtube.com/vi/${watchMatch[1]}/hqdefault.jpg`;
		// youtu.be/VIDEOID
		const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
		if (shortMatch) return `https://img.youtube.com/vi/${shortMatch[1]}/hqdefault.jpg`;
	} catch (e) {
		return null;
	}
	return null;
}

// Open modal and populate content
function openModal(item) {
	modalMedia.innerHTML = '';
	if (item.media_type === 'image') {
		const img = document.createElement('img');
		img.src = item.hdurl || item.url || '';
		img.alt = item.title || '';
		modalMedia.appendChild(img);
	} else if (item.media_type === 'video') {
		// if the url is an embed URL, use iframe; else provide thumbnail + link
		if (item.url && item.url.includes('youtube.com/embed')) {
			const iframe = document.createElement('iframe');
			iframe.src = item.url;
			iframe.frameBorder = '0';
			iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
			iframe.allowFullscreen = true;
			modalMedia.appendChild(iframe);
		} else if (item.url && item.url.includes('youtube.com')) {
			// convert watch?v= to embed
			const vid = (item.url.match(/[?&]v=([a-zA-Z0-9_-]+)/) || [])[1];
			if (vid) {
				const iframe = document.createElement('iframe');
				iframe.src = `https://www.youtube.com/embed/${vid}`;
				iframe.frameBorder = '0';
				iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
				iframe.allowFullscreen = true;
				modalMedia.appendChild(iframe);
			} else {
				// fallback to thumbnail + link
				if (item.thumbnail_url) modalMedia.appendChild(createImg(item.thumbnail_url, item.title));
				const a = document.createElement('a');
				a.href = item.url;
				a.target = '_blank';
				a.rel = 'noopener noreferrer';
				a.textContent = 'Open video in new tab';
				modalMedia.appendChild(a);
			}
		} else {
			if (item.thumbnail_url) modalMedia.appendChild(createImg(item.thumbnail_url, item.title));
			if (item.url) {
				const a = document.createElement('a');
				a.href = item.url;
				a.target = '_blank';
				a.rel = 'noopener noreferrer';
				a.textContent = 'Open video';
				modalMedia.appendChild(a);
			} else {
				modalMedia.textContent = 'Video content';
			}
		}
	} else {
		modalMedia.textContent = 'Media not supported.';
	}

	modalTitle.textContent = item.title || '';
	modalDate.textContent = item.date || '';
	modalExplanation.textContent = item.explanation || '';
	modalCredit.textContent = item.copyright ? `Credit: ${item.copyright}` : '';

	modal.classList.remove('hidden');
	modal.setAttribute('aria-hidden', 'false');
}

function createImg(src, alt) {
	const img = document.createElement('img');
	img.src = src;
	img.alt = alt || '';
	return img;
}

function closeModal() {
	modal.classList.add('hidden');
	modal.setAttribute('aria-hidden', 'true');
	modalMedia.innerHTML = '';
}

// Optional: load on start so users see gallery immediately
// loadGallery();