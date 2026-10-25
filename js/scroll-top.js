/* ============================================================
   js/scroll-top.js —— 刷新（F5 / Ctrl+R / 工具栏刷新）后回到页面顶部

   浏览器默认行为：刷新时会记住并恢复刷新前的滚动位置。这个脚本把该行为关掉，
   使刷新总是从页面顶部开始。

   实现要点
   1) history.scrollRestoration = 'manual'
      关闭浏览器的「自动恢复滚动位置」。这里无条件设置，不依赖导航类型判断，
      以免个别页面 / 个别浏览器上类型判断失效。由此带来的副作用——前进/后退
      也不再自动恢复——由下面的手动存档 / 还原补回来。

   2) 立即置顶 + 持续压制
      在 <head> 里解析到此脚本时立刻 scrollTo(0,0)，并在接下来约 800ms 内
      反复确认仍是 0（每次间隔 60ms）。这样做的原因是：某些情况下浏览器会在
      页面渲染完成后「晚一拍」再把滚动位置写回去，只在 load 时置顶一次会被
      它覆盖掉。一旦检测到用户有滚轮 / 触摸 / 按键 / 点击操作就立刻停止压制，
      绝不会干扰阅读。

   3) 前进 / 后退仍回到离开时的位置
      滚动时把位置节流写入 sessionStorage，导航类型为 back_forward 时还原，
      替代浏览器原生恢复行为。

   4) 带 #锚点 的 URL（如 Back to top 的 #top）不强制置顶，保留锚点跳转语义。

   用法：放在 <head> 里同步加载，位置尽量靠前。
   ============================================================ */
(function () {
	/* ---------- 关闭浏览器原生的滚动位置恢复 ---------- */
	if ('scrollRestoration' in history) {
		history.scrollRestoration = 'manual';
	}

	/* ---------- 判断本次导航类型 ---------- */
	function navType() {
		if (!window.performance) return '';
		var entries = performance.getEntriesByType && performance.getEntriesByType('navigation');
		if (entries && entries.length && entries[0].type) {
			return entries[0].type;                     /* 'navigate' | 'reload' | 'back_forward' */
		}
		if (performance.navigation) {
			return ['navigate', 'reload', 'back_forward'][performance.navigation.type] || '';
		}
		return '';
	}

	/* ---------- sessionStorage 存档 / 读取（按下标键：路径 + 查询串） ---------- */
	var KEY = 'scrollTop:' + location.pathname + location.search;
	function save() {
		try {
			sessionStorage.setItem(KEY, String(
				window.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || 0));
		} catch (e) { /* 隐私模式等不可用时静默忽略 */ }
	}
	function readSaved() {
		try { return parseInt(sessionStorage.getItem(KEY) || '0', 10) || 0; }
		catch (e) { return 0; }
	}

	/* ---------- 置顶 ---------- */
	function jumpTop() {
		if (location.hash) return;                      /* 带锚点时交给浏览器按锚点处理 */
		try { window.scrollTo(0, 0); } catch (e) { }
		if (document.documentElement) document.documentElement.scrollTop = 0;
		if (document.body) document.body.scrollTop = 0;
	}

	/* ---------- 在用户接管之前，反复压制可能的滚动位置回写 ---------- */
	function holdTop(durationMs) {
		var stopped = false;
		function stop() { stopped = true; }
		['wheel', 'touchstart', 'mousedown', 'keydown'].forEach(function (ev) {
			window.addEventListener(ev, stop, { once: true, passive: true });
		});
		var deadline = Date.now() + durationMs;
		(function run() {
			if (stopped) return;                        /* 用户已开始操作，立即交还控制权 */
			jumpTop();
			if (Date.now() < deadline) setTimeout(run, 60);
		})();
	}

	/* ---------- 主流程 ---------- */
	var type = navType();

	if (type === 'back_forward') {
		/* 前进 / 后退：还原离开时的滚动位置 */
		var y = readSaved();
		function restore() {
			if (location.hash) return;
			window.scrollTo(0, y);
		}
		jumpTop();                                      /* 先归零，避免先跳到别处再回来 */
		window.addEventListener('load', restore);
		setTimeout(restore, 120);                       /* 内容撑开后再还原一次 */
		setTimeout(restore, 400);
	} else {
		/* 刷新（F5 / Ctrl+R）与首次打开：一律回到顶部 */
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

	/* ---------- 持续记录滚动位置，供前进/后退还原 ---------- */
	var timer = null;
	window.addEventListener('scroll', function () {
		if (timer) return;
		timer = setTimeout(function () { timer = null; save(); }, 150);
	}, { passive: true });
	window.addEventListener('pagehide', save);
})();
