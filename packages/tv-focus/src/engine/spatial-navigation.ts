/*
 * A javascript-based implementation of Spatial Navigation.
 *
 * Original work: Copyright (c) 2022 Luke Chang.
 * https://github.com/luke-chang/js-spatial-navigation
 *
 * Modifications: fork 进 @shell/core/focus，TS 化、移除 jQuery 集成。
 * 详见 ATTRIBUTION.md。
 *
 * Licensed under the MPL 2.0.
 */
// @ts-nocheck
/* eslint-disable */

// jQuery 集成已移除；保留 $ 作为常量 null，使原代码中 `if ($)` / `$ && ...` 分支天然短路
var $: any = null;

  /************************/
  /* Global Configuration */
  /************************/
  // Note: an <extSelector> can be one of following types:
  // - a valid selector string for "querySelectorAll" or jQuery (if it exists)
  // - a NodeList or an array containing DOM elements
  // - a single DOM element
  // - a jQuery object
  // - a string "@<sectionId>" to indicate the specified section
  // - a string "@" to indicate the default section
  var GlobalConfig = {
    selector: '',           // can be a valid <extSelector> except "@" syntax.
    straightOnly: false,
    straightOverlapThreshold: 0.5,
    rememberSource: false,
    disabled: false,
    defaultElement: '',     // <extSelector> except "@" syntax.
    enterTo: '',            // '', 'last-focused', 'default-element'
    leaveFor: null,         // {left: <extSelector>, right: <extSelector>,
                            //  up: <extSelector>, down: <extSelector>}
    restrict: 'self-first', // 'self-first', 'self-only', 'none'
    tabIndexIgnoreList:
      'a, input, select, textarea, button, iframe, [contentEditable=true]',
    navigableFilter: null
  };

  /*********************/
  /* Constant Variable */
  /*********************/
  var KEYMAPPING = {
    '37': 'left',
    '38': 'up',
    '39': 'right',
    '40': 'down'
  };

  var REVERSE = {
    'left': 'right',
    'up': 'down',
    'right': 'left',
    'down': 'up'
  };

  var EVENT_PREFIX = 'sn:';
  var ID_POOL_PREFIX = 'section-';

  /********************/
  /* Private Variable */
  /********************/
  var _idPool = 0;
  var _ready = false;
  var _pause = false;
  var _sections = {};
  var _sectionCount = 0;
  var _defaultSectionId = '';
  var _lastSectionId = '';
  var _duringFocusChange = false;

  /************/
  /* Polyfill */
  /************/
  var elementMatchesSelector =
    Element.prototype.matches ||
    Element.prototype.matchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.webkitMatchesSelector ||
    Element.prototype.msMatchesSelector ||
    Element.prototype.oMatchesSelector ||
    function (selector) {
      var matchedNodes =
        (this.parentNode || this.document).querySelectorAll(selector);
      return [].slice.call(matchedNodes).indexOf(this) >= 0;
    };

  /*****************/
  /* Core Function */
  /*****************/
  function getRect(elem) {
    var cr = elem.getBoundingClientRect();
    var rect = {
        left: cr.left,
        top: cr.top,
        right: cr.right,
        bottom: cr.bottom,
        width: cr.width,
        height: cr.height
    };
    rect.element = elem;
    rect.center = {
      x: rect.left + Math.floor(rect.width / 2),
      y: rect.top + Math.floor(rect.height / 2)
    };
    rect.center.left = rect.center.right = rect.center.x;
    rect.center.top = rect.center.bottom = rect.center.y;
    return rect;
  }

  /*****************************************/
  /* Android FocusFinder 加权距离模型（ES5）*/
  /*****************************************/
  // 移植自 android.view.FocusFinder：候选先过 isCandidate 方向门，
  // 再两两 isBetterCandidate 比较（beam 内优先 + 13*major²+minor² 加权距离）。
  // direction 用字符串 'left'|'right'|'up'|'down'；rect 用 getRect 结构（含 center）。

  function snMajorAxisDistanceRaw(direction, source, dest) {
    switch (direction) {
      case 'left':  return source.left - dest.right;
      case 'right': return dest.left - source.right;
      case 'up':    return source.top - dest.bottom;
      case 'down':  return dest.top - source.bottom;
      default:      return 0;
    }
  }
  function snMajorAxisDistance(direction, source, dest) {
    return Math.max(0, snMajorAxisDistanceRaw(direction, source, dest));
  }
  function snMajorAxisDistanceToFarEdgeRaw(direction, source, dest) {
    switch (direction) {
      case 'left':  return source.left - dest.left;
      case 'right': return dest.right - source.right;
      case 'up':    return source.top - dest.top;
      case 'down':  return dest.bottom - source.bottom;
      default:      return 0;
    }
  }
  function snMajorAxisDistanceToFarEdge(direction, source, dest) {
    return Math.max(1, snMajorAxisDistanceToFarEdgeRaw(direction, source, dest));
  }
  function snMinorAxisDistance(direction, source, dest) {
    // 引擎 center.x/y 已是中心点，等价 Android 的 top+height/2 / left+width/2
    switch (direction) {
      case 'left':
      case 'right':
        return Math.abs(source.center.y - dest.center.y); // 垂直中心偏移
      case 'up':
      case 'down':
        return Math.abs(source.center.x - dest.center.x); // 水平中心偏移
      default:
        return 0;
    }
  }
  function snGetWeightedDistanceFor(major, minor) {
    return 13 * major * major + minor * minor;
  }

  // dest 是否完全在 source 的 direction 方向（边界版，Android isToDirectionOf）
  function snIsToDirectionOf(direction, source, dest) {
    switch (direction) {
      case 'left':  return source.left >= dest.right;
      case 'right': return source.right <= dest.left;
      case 'up':    return source.top >= dest.bottom;
      case 'down':  return source.bottom <= dest.top;
      default:      return false;
    }
  }

  // dest 是否至少部分在 source 的 direction 方向（Android isCandidate）
  function snIsCandidate(source, dest, direction) {
    switch (direction) {
      case 'left':
        return (source.right > dest.right || source.left >= dest.right) &&
               source.left > dest.left;
      case 'right':
        return (source.left < dest.left || source.right <= dest.left) &&
               source.right < dest.right;
      case 'up':
        return (source.bottom > dest.bottom || source.top >= dest.bottom) &&
               source.top > dest.top;
      case 'down':
        return (source.top < dest.top || source.bottom <= dest.top) &&
               source.bottom < dest.bottom;
      default:
        return false;
    }
  }

  // 次轴投影是否重叠（Android beamsOverlap）
  function snBeamsOverlap(direction, rect1, rect2) {
    switch (direction) {
      case 'left':
      case 'right':
        return (rect2.bottom >= rect1.top) && (rect2.top <= rect1.bottom);
      case 'up':
      case 'down':
        return (rect2.right >= rect1.left) && (rect2.left <= rect1.right);
      default:
        return false;
    }
  }

  // rect1 是否凭「beam 内」胜出 rect2（Android beamBeats）
  function snBeamBeats(direction, source, rect1, rect2) {
    var r1In = snBeamsOverlap(direction, source, rect1);
    var r2In = snBeamsOverlap(direction, source, rect2);
    if (r2In || !r1In) {
      return false;
    }
    if (!snIsToDirectionOf(direction, source, rect2)) {
      return true;
    }
    if (direction === 'left' || direction === 'right') {
      return true;
    }
    return snMajorAxisDistance(direction, source, rect1) <
           snMajorAxisDistanceToFarEdge(direction, source, rect2);
  }

  // rect1 是否比 rect2 更优（Android isBetterCandidate）
  function snIsBetterCandidate(direction, source, rect1, rect2) {
    if (!snIsCandidate(source, rect1, direction)) {
      return false;
    }
    if (!snIsCandidate(source, rect2, direction)) {
      return true;
    }
    if (snBeamBeats(direction, source, rect1, rect2)) {
      return true;
    }
    if (snBeamBeats(direction, source, rect2, rect1)) {
      return false;
    }
    return snGetWeightedDistanceFor(
             snMajorAxisDistance(direction, source, rect1),
             snMinorAxisDistance(direction, source, rect1)) <
           snGetWeightedDistanceFor(
             snMajorAxisDistance(direction, source, rect2),
             snMinorAxisDistance(direction, source, rect2));
  }

  // preferNearest 入参保留以兼容现有调用（navigateWithinScrollScope 仍传 true），
  // Android 模型下不再控制打分分层，仅占位。
  function navigate(target, direction, candidates, config, preferNearest) {
    if (!target || !direction || !candidates || !candidates.length) {
      return null;
    }
    var targetRect = getRect(target);
    if (!targetRect) {
      return null;
    }

    // 1) 转 rect + 过 isCandidate 方向门（straightOnly 时额外要求 beam 内）
    var rects = [];
    for (var i = 0; i < candidates.length; i++) {
      var r = getRect(candidates[i]);
      if (!r) {
        continue;
      }
      if (!snIsCandidate(targetRect, r, direction)) {
        continue;
      }
      if (config.straightOnly && !snBeamsOverlap(direction, targetRect, r)) {
        continue;
      }
      rects.push(r);
    }
    if (!rects.length) {
      return null;
    }

    // 2) 两两 isBetterCandidate 维护当前最优
    var best = rects[0];
    for (var k = 1; k < rects.length; k++) {
      if (snIsBetterCandidate(direction, targetRect, rects[k], best)) {
        best = rects[k];
      }
    }




    // 3) rememberSource：previous.target 仍是合法候选且不被 best 严格击败 → 复焦，
    //    保留「左右往返不抖动」语义（Android 原生无此机制，此处嫁接）。
    if (config.rememberSource &&
        config.previous &&
        config.previous.destination === target &&
        config.previous.reverse === direction) {
      for (var j = 0; j < rects.length; j++) {
        if (rects[j].element === config.previous.target) {
          if (!snIsBetterCandidate(direction, targetRect, best, rects[j])) {
            return rects[j].element;
          }
          break;
        }
      }
    }

    return best.element;
  }

  /********************/
  /* Private Function */
  /********************/
  function generateId() {
    var id;
    while(true) {
      id = ID_POOL_PREFIX + String(++_idPool);
      if (!_sections[id]) {
        break;
      }
    }
    return id;
  }

  function parseSelector(selector) {
    var result = [];
    try {
      if (selector) {
        if ($) {
          result = $(selector).get();
        } else if (typeof selector === 'string') {
          result = [].slice.call(document.querySelectorAll(selector));
        } else if (typeof selector === 'object' && selector.length) {
          result = [].slice.call(selector);
        } else if (typeof selector === 'object' && selector.nodeType === 1) {
          result = [selector];
        }
      }
    } catch (err) {
      console.error(err);
    }
    return result;
  }

  function matchSelector(elem, selector) {
    if ($) {
      return $(elem).is(selector);
    } else if (typeof selector === 'string') {
      return elementMatchesSelector.call(elem, selector);
    } else if (typeof selector === 'object' && selector.length) {
      return selector.indexOf(elem) >= 0;
    } else if (typeof selector === 'object' && selector.nodeType === 1) {
      return elem === selector;
    }
    return false;
  }

  function getCurrentFocusedElement() {
    var activeElement = document.activeElement;
    if (activeElement && activeElement !== document.body) {
      return activeElement;
    }
  }

  function extend(out) {
    out = out || {};
    for (var i = 1; i < arguments.length; i++) {
      if (!arguments[i]) {
        continue;
      }
      for (var key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key) &&
            arguments[i][key] !== undefined) {
          out[key] = arguments[i][key];
        }
      }
    }
    return out;
  }

  function exclude(elemList, excludedElem) {
    if (!Array.isArray(excludedElem)) {
      excludedElem = [excludedElem];
    }
    for (var i = 0, index; i < excludedElem.length; i++) {
      index = elemList.indexOf(excludedElem[i]);
      if (index >= 0) {
        elemList.splice(index, 1);
      }
    }
    return elemList;
  }

  function isNavigable(elem, sectionId, verifySectionSelector) {
    if (! elem || !sectionId ||
        !_sections[sectionId] || _sections[sectionId].disabled) {
      return false;
    }
    if ((elem.offsetWidth <= 0 && elem.offsetHeight <= 0) ||
        elem.hasAttribute('disabled')) {
      return false;
    }
    if (verifySectionSelector &&
        !matchSelector(elem, _sections[sectionId].selector)) {
      return false;
    }
    if (typeof _sections[sectionId].navigableFilter === 'function') {
      if (_sections[sectionId].navigableFilter(elem, sectionId) === false) {
        return false;
      }
    } else if (typeof GlobalConfig.navigableFilter === 'function') {
      if (GlobalConfig.navigableFilter(elem, sectionId) === false) {
        return false;
      }
    }
    return true;
  }

  function getSectionId(elem) {
    for (var id in _sections) {
      if (!_sections[id].disabled &&
          matchSelector(elem, _sections[id].selector)) {
        return id;
      }
    }
  }

  function getSectionNavigableElements(sectionId) {
    return parseSelector(_sections[sectionId].selector).filter(function(elem) {
      return isNavigable(elem, sectionId);
    });
  }

  function getSectionDefaultElement(sectionId) {
    var defaultElement = parseSelector(_sections[sectionId].defaultElement).find(function(elem) {
      return isNavigable(elem, sectionId, true);
    });
    if (!defaultElement) {
      return null;
    }
    return defaultElement;
  }

  function getSectionLastFocusedElement(sectionId) {
    var lastFocusedElement = _sections[sectionId].lastFocusedElement;
    if (!isNavigable(lastFocusedElement, sectionId, true)) {
      return null;
    }
    return lastFocusedElement;
  }

  function fireEvent(elem, type, details, cancelable) {
    if (arguments.length < 4) {
      cancelable = true;
    }
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(EVENT_PREFIX + type, true, cancelable, details);
    return elem.dispatchEvent(evt);
  }

  function focusElement(elem, sectionId, direction) {
    if (!elem) {
      return false;
    }

    var currentFocusedElement = getCurrentFocusedElement();

    var silentFocus = function() {
      if (currentFocusedElement) {
        currentFocusedElement.blur();
      }
      elem.focus();
      focusChanged(elem, sectionId);
    };

    if (_duringFocusChange) {
      silentFocus();
      return true;
    }

    _duringFocusChange = true;

    if (_pause) {
      silentFocus();
      _duringFocusChange = false;
      return true;
    }

    if (currentFocusedElement) {
      var unfocusProperties = {
        nextElement: elem,
        nextSectionId: sectionId,
        direction: direction,
        native: false
      };
      if (!fireEvent(currentFocusedElement, 'willunfocus', unfocusProperties)) {
        _duringFocusChange = false;
        return false;
      }
      currentFocusedElement.blur();
      fireEvent(currentFocusedElement, 'unfocused', unfocusProperties, false);
    }

    var focusProperties = {
      previousElement: currentFocusedElement,
      sectionId: sectionId,
      direction: direction,
      native: false
    };
    if (!fireEvent(elem, 'willfocus', focusProperties)) {
      _duringFocusChange = false;
      return false;
    }
    elem.focus();
    fireEvent(elem, 'focused', focusProperties, false);

    _duringFocusChange = false;

    focusChanged(elem, sectionId);
    return true;
  }

  function focusChanged(elem, sectionId) {
    if (!sectionId) {
      sectionId = getSectionId(elem);
    }
    if (sectionId) {
      _sections[sectionId].lastFocusedElement = elem;
      _lastSectionId = sectionId;
    }
  }

  function focusExtendedSelector(selector, direction) {
    if (selector.charAt(0) == '@') {
      if (selector.length == 1) {
        return focusSection();
      } else {
        var sectionId = selector.substr(1);
        return focusSection(sectionId);
      }
    } else {
      var next = parseSelector(selector)[0];
      if (next) {
        var nextSectionId = getSectionId(next);
        if (isNavigable(next, nextSectionId)) {
          return focusElement(next, nextSectionId, direction);
        }
      }
    }
    return false;
  }

  function focusSection(sectionId) {
    var range = [];
    var addRange = function(id) {
      if (id && range.indexOf(id) < 0 &&
          _sections[id] && !_sections[id].disabled) {
        range.push(id);
      }
    };

    if (sectionId) {
      addRange(sectionId);
    } else {
      addRange(_defaultSectionId);
      addRange(_lastSectionId);
      Object.keys(_sections).map(addRange);
    }

    for (var i = 0; i < range.length; i++) {
      var id = range[i];
      var next;

      if (_sections[id].enterTo == 'last-focused') {
        next = getSectionLastFocusedElement(id) ||
               getSectionDefaultElement(id) ||
               getSectionNavigableElements(id)[0];
      } else {
        next = getSectionDefaultElement(id) ||
               getSectionLastFocusedElement(id) ||
               getSectionNavigableElements(id)[0];
      }

      if (next) {
        return focusElement(next, id);
      }
    }

    return false;
  }

  function fireNavigatefailed(elem, direction) {
    fireEvent(elem, 'navigatefailed', {
      direction: direction
    }, false);
  }

  function gotoLeaveFor(sectionId, direction) {
    if (_sections[sectionId].leaveFor &&
        _sections[sectionId].leaveFor[direction] !== undefined) {
      var next = _sections[sectionId].leaveFor[direction];

      if (typeof next === 'string') {
        if (next === '') {
          return null;
        }
        return focusExtendedSelector(next, direction);
      }

      if ($ && next instanceof $) {
        next = next.get(0);
      }

      var nextSectionId = getSectionId(next);
      if (isNavigable(next, nextSectionId)) {
        return focusElement(next, nextSectionId, direction);
      }
    }
    return false;
  }

  // 元素 → 其最近「滚动/裁剪祖先」的缓存。容器关系在元素生命周期内稳定，
  // 低端盒子上每次按键都 walk + getComputedStyle 太贵，故 WeakMap 缓存（元素销毁自动回收）。
  var _scrollScopeCache = new WeakMap();

  // 从元素向上找第一个 overflow 非 visible 的祖先（auto/scroll/hidden/clip）。
  // 判断的是祖先而非元素/section 本身：5 个不可滚的子 section 会收敛到共同的可滚父/爷；
  // 容器外的固定页头（如返回）则落到别的祖先。无裁剪祖先时返回 null（全页同一平面）。
  function getScrollScope(elem) {
    if (_scrollScopeCache.has(elem)) {
      return _scrollScopeCache.get(elem);
    }
    var scope = null;
    var node = elem.parentElement;
    while (node && node !== document.documentElement) {
      var style = window.getComputedStyle(node);
      var ox = style.overflowX;
      var oy = style.overflowY;
      if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip' ||
          oy === 'auto' || oy === 'scroll' || oy === 'hidden' || oy === 'clip') {
        scope = node;
        break;
      }
      node = node.parentElement;
    }
    _scrollScopeCache.set(elem, scope);
    return scope;
  }

  // 就近原则的「层级」延伸：跨 section 查找时，先只在与当前焦点同一滚动/裁剪容器内找
  // （哪怕候选已滚出视口），同容器该方向确实没有候选时，才允许跳到容器外的元素（如固定页头）。
  function navigateWithinScrollScope(target, direction, candidates, config, preferNearest) {
    if (!candidates || candidates.length < 2) {
      return navigate(target, direction, candidates, config, preferNearest);
    }
    var targetScope = getScrollScope(target);
    var inScope = [];
    var outScope = [];
    for (var i = 0; i < candidates.length; i++) {
      if (getScrollScope(candidates[i]) === targetScope) {
        inScope.push(candidates[i]);
      } else {
        outScope.push(candidates[i]);
      }
    }
    if (inScope.length && outScope.length) {
      return navigate(target, direction, inScope, config, preferNearest) ||
             navigate(target, direction, outScope, config, preferNearest);
    }
    return navigate(target, direction, candidates, config, preferNearest);
  }

  // section 级方向剪枝：跨区收集候选前，按「该 section 所有项的 union 包围盒」
  // 过 Android isCandidate 方向门，只剪掉「纯反方向」section（如按左时整个在右侧的）。
  // beam 内/外不在此区分，留给项级 snBeamBeats。容器/空 section 天然跳过。
  // sectionNavMap：focusNext 已构造的 { sectionId: navigableElements[] }，复用不重查。
  function filterCandidatesByDirection(source, direction, sectionNavMap, excludeSectionId) {
    var srcRect = getRect(source);
    var kept = [];
    for (var id in sectionNavMap) {
      if (id === excludeSectionId) {
        continue;
      }
      var elems = sectionNavMap[id];
      if (!elems || !elems.length) {
        continue; // 容器 section / 空 section 跳过
      }
      var left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      var rects = [];
      for (var i = 0; i < elems.length; i++) {
        var r = getRect(elems[i]);
        if (!r) {
          continue;
        }
        rects.push(r);
        if (r.left < left) { left = r.left; }
        if (r.top < top) { top = r.top; }
        if (r.right > right) { right = r.right; }
        if (r.bottom > bottom) { bottom = r.bottom; }
      }
      if (!rects.length) {
        continue;
      }
      var unionRect = {
        left: left, top: top, right: right, bottom: bottom,
        width: right - left, height: bottom - top
      };
      if (snIsCandidate(srcRect, unionRect, direction)) {
        for (var j = 0; j < rects.length; j++) {
          kept.push(rects[j].element);
        }
      }
    }
    return kept;
  }

  function focusNext(direction, currentFocusedElement, currentSectionId) {
    var extSelector =
      currentFocusedElement.getAttribute('data-sn-' + direction);
    if (typeof extSelector === 'string') {
      if (extSelector === '' ||
          !focusExtendedSelector(extSelector, direction)) {
        fireNavigatefailed(currentFocusedElement, direction);
        return false;
      }
      return true;
    }

    var sectionNavigableElements = {};
    var allNavigableElements = [];
    for (var id in _sections) {
      sectionNavigableElements[id] = getSectionNavigableElements(id);
      allNavigableElements =
        allNavigableElements.concat(sectionNavigableElements[id]);
    }

    var config = extend({}, GlobalConfig, _sections[currentSectionId]);
    var next;

    if (config.restrict == 'self-only' || config.restrict == 'self-first') {
      var currentSectionNavigableElements =
        sectionNavigableElements[currentSectionId];

      next = navigate(
        currentFocusedElement,
        direction,
        exclude(currentSectionNavigableElements, currentFocusedElement),
        config
      );

      if (!next && config.restrict == 'self-first') {
        // 离开本 section 跨区查找：先做 section 级方向剪枝（剪掉纯反方向 section），
        // 再走滚动容器感知 + 项级 Android 打分。
        // 剪光（该方向无任何 section 的 union 盒过门）即视为该方向无候选，next 保持 null，
        // 由 focusNext 末尾 fireNavigatefailed 让焦点原地不动——不再回退全量，
        // 避免把「右上方斜向」的项捞回项级打分导致跨行斜跳。
        var prunedCandidates = filterCandidatesByDirection(
          currentFocusedElement,
          direction,
          sectionNavigableElements,
          currentSectionId
        );
        if (prunedCandidates.length) {
          next = navigateWithinScrollScope(
            currentFocusedElement,
            direction,
            prunedCandidates,
            config,
            true
          );
        }
      }
    } else {
      // restrict:'none'：全局单平面，保留上游分层（直线优先），仅叠加滚动容器感知
      next = navigateWithinScrollScope(
        currentFocusedElement,
        direction,
        exclude(allNavigableElements, currentFocusedElement),
        config,
        false
      );
    }

    if (next) {
      _sections[currentSectionId].previous = {
        target: currentFocusedElement,
        destination: next,
        reverse: REVERSE[direction]
      };

      var nextSectionId = getSectionId(next);

      if (currentSectionId != nextSectionId) {
        var result = gotoLeaveFor(currentSectionId, direction);
        if (result) {
          return true;
        } else if (result === null) {
          fireNavigatefailed(currentFocusedElement, direction);
          return false;
        }

        var enterToElement;
        switch (_sections[nextSectionId].enterTo) {
          case 'last-focused':
            enterToElement = getSectionLastFocusedElement(nextSectionId) ||
                             getSectionDefaultElement(nextSectionId);
            break;
          case 'default-element':
            enterToElement = getSectionDefaultElement(nextSectionId);
            break;
        }
        if (enterToElement) {
          next = enterToElement;
        }
      }

      return focusElement(next, nextSectionId, direction);
    } else if (gotoLeaveFor(currentSectionId, direction)) {
      return true;
    }

    fireNavigatefailed(currentFocusedElement, direction);
    return false;
  }

  function onKeyDown(evt) {
    if (!_sectionCount || _pause ||
        evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey) {
      return;
    }

    var currentFocusedElement;
    var preventDefault = function() {
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    };

    var direction = KEYMAPPING[evt.keyCode];
    if (!direction) {
      if (evt.keyCode == 13) {
        currentFocusedElement = getCurrentFocusedElement();
        if (currentFocusedElement && getSectionId(currentFocusedElement)) {
          if (!fireEvent(currentFocusedElement, 'enter-down')) {
            return preventDefault();
          }
        }
      }
      return;
    }

    currentFocusedElement = getCurrentFocusedElement();

    if (!currentFocusedElement) {
      if (_lastSectionId) {
        currentFocusedElement = getSectionLastFocusedElement(_lastSectionId);
      }
      if (!currentFocusedElement) {
        focusSection();
        return preventDefault();
      }
    }

    var currentSectionId = getSectionId(currentFocusedElement);
    if (!currentSectionId) {
      return;
    }

    var willmoveProperties = {
      direction: direction,
      sectionId: currentSectionId,
      cause: 'keydown'
    };

    if (fireEvent(currentFocusedElement, 'willmove', willmoveProperties)) {
      focusNext(direction, currentFocusedElement, currentSectionId);
    }

    return preventDefault();
  }

  function onKeyUp(evt) {
    if (evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey) {
      return;
    }
    if (!_pause && _sectionCount && evt.keyCode == 13) {
      var currentFocusedElement = getCurrentFocusedElement();
      if (currentFocusedElement && getSectionId(currentFocusedElement)) {
        if (!fireEvent(currentFocusedElement, 'enter-up')) {
          evt.preventDefault();
          evt.stopPropagation();
        }
      }
    }
  }

  function onFocus(evt) {
    var target = evt.target;
    if (target !== window && target !== document &&
        _sectionCount && !_duringFocusChange) {
      var sectionId = getSectionId(target);
      if (sectionId) {
        if (_pause) {
          focusChanged(target, sectionId);
          return;
        }

        var focusProperties = {
          sectionId: sectionId,
          native: true
        };

        if (!fireEvent(target, 'willfocus', focusProperties)) {
          _duringFocusChange = true;
          target.blur();
          _duringFocusChange = false;
        } else {
          fireEvent(target, 'focused', focusProperties, false);
          focusChanged(target, sectionId);
        }
      }
    }
  }

  function onBlur(evt) {
    var target = evt.target;
    if (target !== window && target !== document && !_pause &&
        _sectionCount && !_duringFocusChange && getSectionId(target)) {
      var unfocusProperties = {
        native: true
      };
      if (!fireEvent(target, 'willunfocus', unfocusProperties)) {
        _duringFocusChange = true;
        setTimeout(function() {
          target.focus();
          _duringFocusChange = false;
        });
      } else {
        fireEvent(target, 'unfocused', unfocusProperties, false);
      }
    }
  }

  /*******************/
  /* Public Function */
  /*******************/
  var SpatialNavigation = {
    init: function() {
      if (!_ready) {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('focus', onFocus, true);
        window.addEventListener('blur', onBlur, true);
        _ready = true;
      }
    },

    uninit: function() {
      window.removeEventListener('blur', onBlur, true);
      window.removeEventListener('focus', onFocus, true);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onKeyDown);
      SpatialNavigation.clear();
      _idPool = 0;
      _ready = false;
    },

    clear: function() {
      _sections = {};
      _sectionCount = 0;
      _defaultSectionId = '';
      _lastSectionId = '';
      _duringFocusChange = false;
    },

    // set(<config>);
    // set(<sectionId>, <config>);
    set: function() {
      var sectionId, config;

      if (typeof arguments[0] === 'object') {
        config = arguments[0];
      } else if (typeof arguments[0] === 'string' &&
                 typeof arguments[1] === 'object') {
        sectionId = arguments[0];
        config = arguments[1];
        if (!_sections[sectionId]) {
          throw new Error('Section "' + sectionId + '" doesn\'t exist!');
        }
      } else {
        return;
      }

      for (var key in config) {
        if (GlobalConfig[key] !== undefined) {
          if (sectionId) {
            _sections[sectionId][key] = config[key];
          } else if (config[key] !== undefined) {
            GlobalConfig[key] = config[key];
          }
        }
      }

      if (sectionId) {
        // remove "undefined" items
        _sections[sectionId] = extend({}, _sections[sectionId]);
      }
    },

    // add(<config>);
    // add(<sectionId>, <config>);
    add: function() {
      var sectionId;
      var config = {};

      if (typeof arguments[0] === 'object') {
        config = arguments[0];
      } else if (typeof arguments[0] === 'string' &&
                 typeof arguments[1] === 'object') {
        sectionId = arguments[0];
        config = arguments[1];
      }

      if (!sectionId) {
        sectionId = (typeof config.id === 'string') ? config.id : generateId();
      }

      if (_sections[sectionId]) {
        throw new Error('Section "' + sectionId + '" has already existed!');
      }

      _sections[sectionId] = {};
      _sectionCount++;

      SpatialNavigation.set(sectionId, config);

      return sectionId;
    },

    remove: function(sectionId) {
      if (!sectionId || typeof sectionId !== 'string') {
        throw new Error('Please assign the "sectionId"!');
      }
      if (_sections[sectionId]) {
        _sections[sectionId] = undefined;
        _sections = extend({}, _sections);
        _sectionCount--;
        if (_lastSectionId === sectionId) {
          _lastSectionId = '';
        }
        return true;
      }
      return false;
    },

    disable: function(sectionId) {
      if (_sections[sectionId]) {
        _sections[sectionId].disabled = true;
        return true;
      }
      return false;
    },

    enable: function(sectionId) {
      if (_sections[sectionId]) {
        _sections[sectionId].disabled = false;
        return true;
      }
      return false;
    },

    pause: function() {
      _pause = true;
    },

    resume: function() {
      _pause = false;
    },

    // focus([silent])
    // focus(<sectionId>, [silent])
    // focus(<extSelector>, [silent])
    // Note: "silent" is optional and default to false
    focus: function(elem, silent) {
      var result = false;

      if (silent === undefined && typeof elem === 'boolean') {
        silent = elem;
        elem = undefined;
      }

      var autoPause = !_pause && silent;

      if (autoPause) {
        SpatialNavigation.pause();
      }

      if (!elem) {
        result  = focusSection();
      } else {
        if (typeof elem === 'string') {
          if (_sections[elem]) {
            result = focusSection(elem);
          } else {
            result = focusExtendedSelector(elem);
          }
        } else {
          if ($ && elem instanceof $) {
            elem = elem.get(0);
          }

          var nextSectionId = getSectionId(elem);
          if (isNavigable(elem, nextSectionId)) {
            result = focusElement(elem, nextSectionId);
          }
        }
      }

      if (autoPause) {
        SpatialNavigation.resume();
      }

      return result;
    },

    // move(<direction>)
    // move(<direction>, <selector>)
    move: function(direction, selector) {
      direction = direction.toLowerCase();
      if (!REVERSE[direction]) {
        return false;
      }

      var elem = selector ?
        parseSelector(selector)[0] : getCurrentFocusedElement();
      if (!elem) {
        return false;
      }

      var sectionId = getSectionId(elem);
      if (!sectionId) {
        return false;
      }

      var willmoveProperties = {
        direction: direction,
        sectionId: sectionId,
        cause: 'api'
      };

      if (!fireEvent(elem, 'willmove', willmoveProperties)) {
        return false;
      }

      return focusNext(direction, elem, sectionId);
    },

    // makeFocusable()
    // makeFocusable(<sectionId>)
    makeFocusable: function(sectionId) {
      var doMakeFocusable = function(section) {
        var tabIndexIgnoreList = section.tabIndexIgnoreList !== undefined ?
          section.tabIndexIgnoreList : GlobalConfig.tabIndexIgnoreList;
        parseSelector(section.selector).forEach(function(elem) {
          if (!matchSelector(elem, tabIndexIgnoreList)) {
            if (!elem.getAttribute('tabindex')) {
              elem.setAttribute('tabindex', '-1');
            }
          }
        });
      };

      if (sectionId) {
        if (_sections[sectionId]) {
          doMakeFocusable(_sections[sectionId]);
        } else {
          throw new Error('Section "' + sectionId + '" doesn\'t exist!');
        }
      } else {
        for (var id in _sections) {
          doMakeFocusable(_sections[id]);
        }
      }
    },

    setDefaultSection: function(sectionId) {
      if (!sectionId) {
        _defaultSectionId = '';
      } else if (!_sections[sectionId]) {
        throw new Error('Section "' + sectionId + '" doesn\'t exist!');
      } else {
        _defaultSectionId = sectionId;
      }
    }
  };

  /**********************/
  /* ESM Export         */
  /**********************/
  // 保留 window 挂载以兼容某些通过全局变量访问的场景
  if (typeof window !== 'undefined') {
    (window as any).SpatialNavigation = SpatialNavigation;
  }

export default SpatialNavigation;
