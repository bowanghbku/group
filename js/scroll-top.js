(function () {
	if ('scrollRestoration' in history) {
		history.scrollRestoration = 'manual';
	}

	function navType() {
		if (!window.performance) return '';
		var entries = performance.getEntriesByType && performance.getEntriesByType('navigation');
		if (entries && entries.length && entries[0].type) {
			return entries[0].type;                     
		}
		if (performance.navigation) {
			return ['navigate', 'reload', 'back_forward'][performance.navigation.type] || '';
		}
		return '';
	}

	var KEY = 'scrollTop:' + location.pathname + location.search;
	function save() {
		try {
			sessionStorage.setItem(KEY, String(
				window.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || 0));
		} catch (e) {  }
	}
	function readSaved() {
		try { return parseInt(sessionStorage.getItem(KEY) || '0', 10) || 0; }
		catch (e) { return 0; }
	}

	function jumpTop() {
		if (location.hash) return;                      
		try { window.scrollTo(0, 0); } catch (e) { }
		if (document.documentElement) document.documentElement.scrollTop = 0;
		if (document.body) document.body.scrollTop = 0;
	}

	function holdTop(durationMs) {
		var stopped = false;
		function stop() { stopped = true; }
		['wheel', 'touchstart', 'mousedown', 'keydown'].forEach(function (ev) {
			window.addEventListener(ev, stop, { once: true, passive: true });
		});
		var deadline = Date.now() + durationMs;
		(function run() {
			if (stopped) return;                        
			jumpTop();
			if (Date.now() < deadline) setTimeout(run, 60);
		})();
	}

	var type = navType();

	if (type === 'back_forward') {
		var y = readSaved();
		function restore() {
			if (location.hash) return;
			window.scrollTo(0, y);
		}
		jumpTop();                                      
		window.addEventListener('load', restore);
		setTimeout(restore, 120);                       
		setTimeout(restore, 400);
	} else {
		jumpTop();
		holdTop(800);
		window.addEventListener('load', function () {
			jumpTop();
			holdTop(600);
		});
		window.addEventListener('pageshow', function (e) {
			if (e.persisted) { jumpTop(); holdTop(400); }
		});
	}

	var timer = null;
	window.addEventListener('scroll', function () {
		if (timer) return;
		timer = setTimeout(function () { timer = null; save(); }, 150);
	}, { passive: true });
	window.addEventListener('pagehide', save);
})();
