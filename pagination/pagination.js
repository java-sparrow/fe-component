/**
 * @version 3.0
 * V1.0 Release Date: 2015.3.3
 * V2.0 Release Date: 2015.3.20
 * V3.0 Release Date: 2016.3.21
 * 
 * @constructor Pagination UI component.
 * 			Make a div to be a Pagination UI component.
 * 			Change log: please see it on url: #/example/pagination.
 * @param {string|element|jQueryObject} dom may be a selector(string), dom element or jQueryObject.
 * @return {Pagination} Pagination instance.
 * 			Method: gotoPage, refresh, onPageChange, destory.
 * 			Property: container, pageNumber, pageSize, total,
 * 					lastPage, minPageNumber, navPageNumber.
 * 
 * @example (page url: #/example/pagination)
 * 			example 1(with a ajax):
 * 			HTML: <div id="paginationPanel"></div>
 * 			JS:
 * 			var pagination = new Pagination($("#paginationPanel"));
 * 			function getList(pageNumber, pageSize) {
 * 				$.get("xxx/xxx?id=xxx", function (data) {
 * 					// (leave out)refresh the table list
 * 					
 * 					// update the Pagination
 * 					pagination.gotoPage(pageNumber, data.totalCount, pageSize);
 * 				});
 * 			}
 * 			pagination.onPageChange = function (pageNumber, pageSize) {
 * 				getList(pageNumber, pageSize);
 * 			};
 * 			// init
 * 			getList();
 * 
 * 			example 2(without ajax):
 * 			HTML: <div id="paginationPanelID"></div>
 * 			JS:
 * 			var pagination = new Pagination("#paginationPanelID");
 * 			pagination.gotoPage(3, 500);
 * 			// you may listening onPageChange event to respond click
 * 				// if you want the page change after your click.
 * 			pagination.onPageChange = function (pageNumber, pageSize) {
 * 				pagination.gotoPage(pageNumber, pageSize);
 * 			};
 */
function Pagination(dom) {
	var pageInputClassName = "page-n";
	// TODO: support "Total" and "Go"
	var pagesTemplate = [
		'{{ var isDisabled = (it.lastPage==0) ? true: false; }}',
		'{{ var ableClass = isDisabled ? "disabled": ""; }}',
		
		'<ul style="float:left;">',
			'<li class="{{= ableClass}}">',
				'<a href="javascript:;" style="margin-left:12px;" class="all-records">',
					'Total:', '{{= it.lastPage}}',
				'</a>',
			'</li>',
			'<li class="{{= ableClass}}">',
				'<div class="input-append">',
					'<input class="', pageInputClassName, '" ',
						'{{? isDisabled}}disabled="disabled"{{?}}',
						'style="width:33px; padding:2px 4px;" type="text" />',
					'<a href="javascript:;" class="btn btn-small {{= ableClass}}">Go</a>',
				'</div>',
			'</li>',
		'</ul>'
	].join("");
	var pagesCompile = function (pageObj) {
		// var lastPage = pageObj.lastPage;
		var pageNo = pageObj.pageNo;
		
		var $_pageUl = $("<ul>").addClass("pull-left");
		
		$_pageUl.append([
			'<li class="', ((pageNo <= 1) ? 'disabled' : ''), '">',
				'<a href="javascript:;">Prev</a>',
			'</li>',
		].join(""));
		
		var pageLiHTML = $.map(pageObj.pages, function (currentPage, i) {
			var liHTML = [
				'<li class="', ((pageNo == currentPage) ? 'active' : ''), '">',
					'<a href="javascript:;">', currentPage, '</a>',
				'</li>'
			].join("");
			
			return liHTML;
		});
		
		$_pageUl.append(pageLiHTML.join(""));
		
		$_pageUl.append([
			'<li class="', ((pageNo >= pageObj.lastPage) ? 'disabled' : ''), '">',
				'<a href="javascript:;">Next</a>',
			'</li>'
		].join(""));
		
		return $_pageUl.prop("outerHTML");
	};
	
	
	var that = this;
	var $_container = null;
	var $_pageControl = null;
	
	// will be assign in function:initPagination
	this.container = null;
	// TODO: use private variable
	/**
	 * @property {number=1} pageNumber The default page number for show.
	 */
	this.pageNumber = 1;
	/**
	 * @property {number=20} pageSize The default page size for show.
	 */
	this.pageSize = 20;
	/**
	 * @property {number=0} total The total count.
	 */
	this.total = 0;
	/**
	 * @property {number=0} lastPage The max pageNumber.
	 */
	this.lastPage = 0;
	/**
	 * @property {number=1} minPageNumber The min pageNumber.
	 */
	this.minPageNumber = 1;
	/**
	 * @property {number=10} navPageNumber The count of page number show.
	 */
	this.navPageNumber = 10;
	
	/* ---------------- private method ---------------- */
	var triggerPageChangeHandle = function (newPage, pageSize, oldPage) {
		if ($.isFunction(that.onPageChange)) {
			that.onPageChange(newPage, pageSize, oldPage);
		}
	};
	// pageButton clickHandle
	var toPage = function() {
		var oldPage = parseInt($_pageControl.find(".active").text());
		// navigation page text
		var navPageText = $(this).html();
		
		var newPage = 0;
		
		if ($.isNumeric(navPageText)) {
			newPage = parseInt(navPageText);
		}
		else if (navPageText == "Prev") {
			newPage = oldPage - 1;
		}
		else if (navPageText == "Next") {
			newPage = oldPage + 1;
		}
		else if (navPageText == "Go") {
			newPage = parseInt($_pageControl.find("." + pageInputClassName).val());
		}
		else if ($(this).hasClass("all-records")) {
			newPage = oldPage;
		}
		
		// valid page
		if (isNaN(newPage) || (newPage > that.lastPage) || (newPage <= 0)) {
			return;
		}
		
		// TODO: support boolean switch: isTriggerChangeEvent
		// trigger page change handle
		triggerPageChangeHandle(newPage, that.pageSize, oldPage);
	};
	
	// update the page
	var showPages = function(pageNumber, total, pageSize) {
		// set default value
		if (!$.isNumeric(pageNumber)) {
			pageNumber = that.pageNumber;
		}
		if (!$.isNumeric(total)) {
			total = that.total;
		}
		if (!$.isNumeric(pageSize)) {
			pageSize = that.pageSize;
		}
		
		// defined local variable
		var lastPage = Math.ceil(total / pageSize);
		var start = 1;
		var end = 1;
		var navPageNumber = Number(that.navPageNumber);
		// pageNumber is less than `lastPage` and greater than `minPageNumber`
		pageNumber = Math.max(Math.min(pageNumber, lastPage), that.minPageNumber);
		var pageObj = {
			pageNo: pageNumber,
			lastPage: lastPage,
			pages: []
		};
		
		// process pages
		var halfNavPageNumber = navPageNumber / 2;
		// there are `halfNavPageNumber` pages before `pageNumber`
		start = Math.max(pageNumber - halfNavPageNumber, 1);
		// there are `halfNavPageNumber` pages after `pageNumber`
		end = Math.min(pageNumber + halfNavPageNumber, lastPage);
		
		// if all pages less than navPageNumber, than extend `start` or `end`
		if (end - start !== navPageNumber) {
			// if the pages before `pageNumber` is not enough
			if (pageNumber - start < halfNavPageNumber) {
				end = Math.min(start + navPageNumber, lastPage);
			}
			// if the pages after `pageNumber` is not enough
			else if (end - pageNumber < halfNavPageNumber) {
				start = Math.max(end - navPageNumber, 1);
			}
		}
		
		// if navPageNumber is singular(floor is big+small, ceil is small+big)
		start = Math.ceil(start);
		end = Math.ceil(end);
		
		// create page numbers(whiches are shown)
		for (var ij = start; ij <= end; ij++) {
			pageObj.pages.push(ij);
		}
		
		// update pages
		var pageHTML = pagesCompile(pageObj);
		$_pageControl.html(pageHTML);
		
		// update data
		that.pageNumber = pageNumber;
		that.total = total;
		that.pageSize = pageSize;
		that.lastPage = lastPage;
		
		return {
			pageNumber: pageNumber,
			total: total,
			pageSize: pageSize
		};
	};
	
	// init pagination: show and bind event
	var initPagination = function(_dom) {
		if (typeof _dom == "string") {
			// selector
			$_container = $(_dom);
		}
		else {
			// dom element or jQuery instance
			$_container = $(_dom);
		}
		that.container = $_container;
		
		$_pageControl = $("<div>");
		$_pageControl.addClass("pagination alternate page-control clearfix");
		$_container.html($_pageControl);
		
		// use default pageNumber, total, pageSize
		showPages();
		
		// bind pageButton click event
		$_pageControl.on("click", "a", toPage);
		// bind input keydown event
		$_pageControl.on("keydown", "." + pageInputClassName, function (event) {
			// when press `Enter` on keyboard, it will call toPage()
			if (event.which == 13) {
				toPage.call($(this).next());
				
				$_pageControl.find("." + pageInputClassName).focus();
			}
		});
	};
	
	/* ---------------- public export ---------------- */
	/**
	 * Set page number, it wouldn't trigger custom handle
	 * 
	 * @param {number} pageNumber Target page number to jump.
	 * @param {number} total All records count.
	 * @param {number} pageSize The records count of per page.
	 * @return {Object} A plain object with property: pageNumber,total,pageSize.
	 * 					Only when pageNumber greate than lastPage,
	 * 					the property pageNumber of return value will be changed.
	 */
	this.gotoPage = showPages;
	/**
	 * It will refresh the pages by use the last time property.
	 * 
	 * @param {isTriggerHandle=true} Only `false` will prevent trigger the pageChangeHandle.
	 * 									Otherwise value will trigger the pageChangeHandle.
	 * @return {Object} A plain object with property: pageNumber,total,pageSize.
	 */
	this.refresh = function (isTriggerHandle) {
		var pageConfig = showPages();
		var pageNumber = pageConfig.pageNumber;
		
		if (isTriggerHandle !== false) {
			triggerPageChangeHandle(pageNumber, pageConfig.pageSize, pageNumber);
		}
		
		return pageConfig;
	};
	
	/**
	 * When page change, then will trigger custom handle
	 * 
	 * @param {number} pageNumber When click, it will be a calculated new page number.
	 * @param {number} pageSize The records count of per page.
	 * @param {number} oldPageNumber The page number before click Pagination component.
	 */
	this.onPageChange = function (pageNumber, pageSize, oldPageNumber) {
		// custom handle
	};
	
	/**
	 * Remove event and reference
	 */
	this.destory = function () {
		// remove event and DOM reference
		if ($_pageControl && $_pageControl.off) {
			$_pageControl.off("click", "a", toPage);
			$_pageControl.off("keydown", "." + pageInputClassName);
		}
		if ($_container && $_container.empty) {
			$_container.empty();
		}
		this.container = null;
		
		// remove local variable reference
		pageInputClassName = null;
		pagesTemplate = null;
		pagesCompile = null;
		that = null;
		$_container = null;
		$_pageControl = null;
		// remove local function reference
		triggerPageChangeHandle = null;
		toPage = null;
		showPages = null;
		initPagination = null;
		
		// remove export property
		this.pageNumber = null;
		this.pageSize = null;
		this.total = null;
		this.lastPage = null;
		this.minPageNumber = null;
		this.navPageNumber = null;
		
		// remove export method and event reference
		this.gotoPage = null;
		this.refresh = null;
		this.onPageChange = null;
	};
	
	// TODO: if necessary, then export
	// this.initPagination = initPagination;
	
	/* ---------------- init ---------------- */
	initPagination(dom);
}
