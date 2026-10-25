(function () {
	'use strict';

	var PAD = 16;                                    

	function maxScroll() {
		var de = document.documentElement;
		return Math.max(0, (de.scrollHeight || document.body.scrollHeight) - window.innerHeight);
	}

	function scrollInstant(delta) {
		if (!delta) return;
		var root = document.documentElement;
		var prev = root.style.scrollBehavior;
		root.style.scrollBehavior = 'auto';
		window.scrollBy(0, delta);
		root.style.scrollBehavior = prev;
	}

	function reveal(el) {
		var vh = window.innerHeight;
		var r = el.getBoundingClientRect();
		var sy = window.scrollY;
		var target = null;

		if (r.height + PAD * 2 > vh) {
			if (Math.abs(r.top - PAD) > 4) target = sy + r.top - PAD;
		} else if (r.bottom > vh - PAD) {
			target = sy + r.bottom - vh + PAD;       
		} else if (r.top < PAD) {
			target = sy + r.top - PAD;               
		}

		if (target === null) return;
		target = Math.max(0, Math.min(target, maxScroll()));
		var dist = target - sy;
		if (Math.abs(dist) < 2) return;

		if (Math.abs(dist) > vh * 1.5) scrollInstant(dist);
		else window.scrollTo(0, target);             
	}

	function revealAfterImages(el) {
		var imgs = el.querySelectorAll('img');
		var pending = 0;

		function done() {
			if (--pending > 0) return;
			if (el.open) reveal(el);                 
		}

		for (var i = 0; i < imgs.length; i++) {
			if (imgs[i].complete) continue;
			pending++;
			imgs[i].addEventListener('load', done, { once: true });
			imgs[i].addEventListener('error', done, { once: true });
		}
	}

	document.addEventListener('toggle', function (e) {
		var opened = e.target;

		if (!opened || !opened.classList || !opened.classList.contains('alumni-item')) return;
		if (!opened.open) return;

		var before = opened.getBoundingClientRect().top;

		var others = document.querySelectorAll('.alumni-item[open]');
		for (var i = 0; i < others.length; i++) {
			if (others[i] !== opened) {
				others[i].open = false;              
			}
		}

		scrollInstant(opened.getBoundingClientRect().top - before);

		reveal(opened);
		revealAfterImages(opened);                   
	}, true);                                        
})();
