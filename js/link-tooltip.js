(function () {
	'use strict';

	var tip = document.createElement('div');
	tip.className = 'link-tip';
	tip.setAttribute('aria-hidden', 'true');
	document.body.appendChild(tip);

	var currentLink = null;   

	function shouldShow(link) {
		if (!link || !link.href) return false;
		if (link.closest('.mainheader')) return false;                       
		if (link.classList.contains('no-link-tip')) return false;            
		var href = link.getAttribute('href') || '';
		if (href === '' || href.charAt(0) === '#') return false;             
		return true;
	}

	function tipTextOf(link) {
		var hostname = '';
		var pathname = '';
		try {
			var u = new URL(link.href, location.href);
			hostname = u.hostname;
			pathname = u.pathname;
		} catch (e) {
			hostname = link.hostname;
			pathname = link.pathname;
		}
		if (/\.pdf($|[?#])/i.test(pathname)) return 'PDF';  
		return hostname || 'Link';
	}

	function show(link) {
		tip.textContent = tipTextOf(link);
		tip.classList.add('link-tip--show');   

		var r = link.getBoundingClientRect();
		var tw = tip.offsetWidth;
		var th = tip.offsetHeight;
		var scrollY = window.scrollY || window.pageYOffset;
		var scrollX = window.scrollX || window.pageXOffset;

		var left = r.left + r.width / 2 - tw / 2;
		if (left < 4) left = 4;
		if (left + tw > window.innerWidth - 4) left = window.innerWidth - 4 - tw;
		var top = r.top + scrollY - th - 6;
		if (top < scrollY) top = r.top + scrollY + r.height + 6;   

		tip.style.left = Math.round(left + scrollX) + 'px';
		tip.style.top = Math.round(top) + 'px';
		currentLink = link;
	}

	function hide(link) {
		if (link && currentLink !== link) return;   
		tip.classList.remove('link-tip--show');
		currentLink = null;
	}

	document.addEventListener('mouseover', function (e) {
		var link = e.target.closest('a');
		if (link && shouldShow(link)) {
			show(link);
		} else {
			hide(currentLink);
		}
	});

	document.addEventListener('mouseout', function (e) {
		var link = e.target.closest('a');
		if (link) hide(link);
	});

	document.addEventListener('focusin', function (e) {
		var link = e.target.closest('a');
		if (link && shouldShow(link)) show(link);
	});

	document.addEventListener('focusout', function (e) {
		hide(currentLink);
	});

	window.addEventListener('scroll', function () {
		tip.classList.remove('link-tip--show');
		currentLink = null;
	}, { passive: true });
})();
