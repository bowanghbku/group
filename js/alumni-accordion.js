/* ============================================================
   js/alumni-accordion.js —— Alumni 名单的「手风琴」行为 + 展开后自动带入视口

   <details> 的原生行为是彼此独立的：点开几条就会同时展开几条，
   名单越点越长。这里补上常见的一次只展开一条的规则，并把展开出来的
   整条简介（照片 + 生平）滚到看得见的位置——不用再手动往下拖一点。

   实现要点
   1) 用 toggle 事件而不是 click
      toggle 在「开 / 关状态真正改变之后」触发，覆盖鼠标点击、
      键盘回车 / 空格，以及任何脚本改动，比监听 click 更可靠。
      toggle 事件**不冒泡**，所以必须在捕获阶段监听（第三个参数 true）。

   2) 只在「展开」时处理
      收起时不做任何事，否则会把别人一起关掉，永远打不开第二条。

   3) 滚动补偿（瞬时）
      被收起的条目通常在刚点开那条的上方，收起后页面内容整体上移，
      刚点开的那条会"跳走"。这里测量它收起前后的视口位置差，
      把差值补回滚动位置，让它停在原地。
      补偿必须瞬时完成——页面开了 scroll-behavior: smooth，
      直接 scrollBy 会变成动画，所以临时把根元素的 scroll-behavior 置为 auto。

   4) 展开后带入视口（平滑）
      补偿之后，如果整条简介还露在视口外面，就再滚一次：
      - 条目能整体放下 → 做最小滚动，把超出视口的那部分带进来；
      - 条目比视口还高（长简介 + 大照片）→ 顶端对齐视口顶部，从头看起；
      - 已经完整可见 → 一动不动。
      放在补偿之后，顺序是"先稳住位置、再平滑挪一点"，不会出现跳一下再滑的问题。

   5) 脚本只在 group.html 加载；选择器 .alumni-item 也是本页独有，
      不会误伤其它页面。浏览器不支持时降级为原生行为（可同时展开多条、不自动滚动）。

   用法：放在 </body> 之前。
   ============================================================ */
(function () {
	'use strict';

	var PAD = 16;                                    /* 条目与视口上/下缘留出的呼吸空间 */

	function maxScroll() {
		var de = document.documentElement;
		return Math.max(0, (de.scrollHeight || document.body.scrollHeight) - window.innerHeight);
	}

	/* 瞬时滚动（绕过页面的 scroll-behavior: smooth） */
	function scrollInstant(delta) {
		if (!delta) return;
		var root = document.documentElement;
		var prev = root.style.scrollBehavior;
		root.style.scrollBehavior = 'auto';
		window.scrollBy(0, delta);
		root.style.scrollBehavior = prev;
	}

	/* 把整条条目滚进视口；已经完整可见时不做任何滚动 */
	function reveal(el) {
		var vh = window.innerHeight;
		var r = el.getBoundingClientRect();
		var sy = window.scrollY;
		var target = null;

		if (r.height + PAD * 2 > vh) {
			/* 比视口还高：顶端对齐，能看到标题 + 尽量多的简介 */
			if (Math.abs(r.top - PAD) > 4) target = sy + r.top - PAD;
		} else if (r.bottom > vh - PAD) {
			target = sy + r.bottom - vh + PAD;       /* 下方露出：往下滚一点 */
		} else if (r.top < PAD) {
			target = sy + r.top - PAD;               /* 上方露出：往上滚一点 */
		}

		if (target === null) return;
		target = Math.max(0, Math.min(target, maxScroll()));
		var dist = target - sy;
		if (Math.abs(dist) < 2) return;

		/* 距离超过一屏半就瞬时跳过去：平滑滚动这么长的距离要一秒多，反而难受。
		   正常点击时条目就在眼前，位移只有几十~几百像素，走的还是平滑滚动。 */
		if (Math.abs(dist) > vh * 1.5) scrollInstant(dist);
		else window.scrollTo(0, target);             /* CSS scroll-behavior: smooth → 平滑滚动 */
	}

	/* 图片还没有固有尺寸（Alumni 照片未写 width/height），首次访问时会在加载完成后
	   把内容往下顶，前面算好的滚动位置就偏了。这里等照片加载完再校正一次；
	   照片早已缓存时 pending === 0，不会有任何额外动作。 */
	function revealAfterImages(el) {
		var imgs = el.querySelectorAll('img');
		var pending = 0;

		function done() {
			if (--pending > 0) return;
			if (el.open) reveal(el);                 /* 仍展开着才校正（用户可能已经收起了） */
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

		/* 只处理 Alumni 条目，且只处理「展开」这一次（收起时直接返回） */
		if (!opened || !opened.classList || !opened.classList.contains('alumni-item')) return;
		if (!opened.open) return;

		var before = opened.getBoundingClientRect().top;

		var others = document.querySelectorAll('.alumni-item[open]');
		for (var i = 0; i < others.length; i++) {
			if (others[i] !== opened) {
				others[i].open = false;              /* 这会再次触发 toggle，但 open 为 false，上面已返回 */
			}
		}

		/* 1) 收起上方条目造成的位移：瞬时补回，条目停在原地 */
		scrollInstant(opened.getBoundingClientRect().top - before);

		/* 2) 展开出来的整条简介：需要的话再平滑滚进视口 */
		reveal(opened);
		revealAfterImages(opened);                   /* 照片加载完后校正一次 */
	}, true);                                        /* 捕获阶段：toggle 不冒泡 */
})();
