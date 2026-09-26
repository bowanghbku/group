/* ==========================================================
   链接域名悬停提示框（模仿 Chrome 原生链接预览气泡的效果）
   - 悬停/键盘聚焦正文链接时，在链接上方显示黑底白字小气泡，
     内容为链接目标域名（如 ihq.mit.edu）。
   - 排除：顶部导航栏（.mainheader）、Read PDF» 等小字链接
     （a > span[style*="font-size:small"]）、空链接与页内锚点。
   - 无障碍：气泡 aria-hidden（纯视觉装饰，屏幕阅读器仍可
     通过链接自身文本获知目标）；键盘聚焦时同样显示。
   ========================================================== */
(function () {
	'use strict';

	/* 创建共享气泡元素（整页只建一次） */
	var tip = document.createElement('div');
	tip.className = 'link-tip';
	tip.setAttribute('aria-hidden', 'true');
	document.body.appendChild(tip);

	var currentLink = null;   /* 当前正在显示的链接，用于隐藏判断 */

	/* 判断链接是否应显示气泡（排除导航栏 / 小字链接 / 锚点） */
	function shouldShow(link) {
		if (!link || !link.href) return false;
		if (link.closest('.mainheader')) return false;                       /* 顶部导航栏 */
		if (link.querySelector('span[style*="font-size:small"]')) return false;  /* Read PDF» 等小字链接 */
		var href = link.getAttribute('href') || '';
		if (href === '' || href.charAt(0) === '#') return false;             /* 空链接 / 页内锚点 */
		return true;
	}

	/* 提取目标域名（https://ihq.mit.edu/path → ihq.mit.edu） */
	function domainOf(link) {
		try {
			return new URL(link.href, location.href).hostname;
		} catch (e) {
			return link.hostname;
		}
	}

	/* 在链接上方显示气泡（左右不超出视口） */
	function show(link) {
		tip.textContent = domainOf(link);
		tip.classList.add('link-tip--show');   /* 先显示以便测量尺寸 */

		var r = link.getBoundingClientRect();
		var tw = tip.offsetWidth;
		var th = tip.offsetHeight;
		var scrollY = window.scrollY || window.pageYOffset;
		var scrollX = window.scrollX || window.pageXOffset;

		/* 默认位于链接上方居中，距链接 6px；水平方向夹在视口内 */
		var left = r.left + r.width / 2 - tw / 2;
		if (left < 4) left = 4;
		if (left + tw > window.innerWidth - 4) left = window.innerWidth - 4 - tw;
		var top = r.top + scrollY - th - 6;
		if (top < scrollY) top = r.top + scrollY + r.height + 6;   /* 顶部空间不足时放到链接下方 */

		tip.style.left = Math.round(left + scrollX) + 'px';
		tip.style.top = Math.round(top) + 'px';
		currentLink = link;
	}

	function hide(link) {
		if (link && currentLink !== link) return;   /* 移动到子元素（如 span）时不闪烁 */
		tip.classList.remove('link-tip--show');
		currentLink = null;
	}

	/* 事件委托：mouseover / mouseout / focusin / focusout 一次性覆盖所有链接 */
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

	/* 滚动/窗口变化时隐藏（气泡不跟随长距离滚动，避免错位） */
	window.addEventListener('scroll', function () {
		tip.classList.remove('link-tip--show');
		currentLink = null;
	}, { passive: true });
})();
