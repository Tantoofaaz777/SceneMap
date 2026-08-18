// node_modules/sortablejs/modular/sortable.esm.js
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
}
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1;e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t)
        ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1;r < arguments.length; r++) {
    var t = arguments[r] != null ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _objectWithoutProperties(e, t) {
  if (e == null)
    return {};
  var o, r, i = _objectWithoutPropertiesLoose(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0;r < n.length; r++)
      o = n[r], t.indexOf(o) === -1 && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose(r, e) {
  if (r == null)
    return {};
  var t = {};
  for (var n in r)
    if ({}.hasOwnProperty.call(r, n)) {
      if (e.indexOf(n) !== -1)
        continue;
      t[n] = r[n];
    }
  return t;
}
function _toPrimitive(t, r) {
  if (typeof t != "object" || !t)
    return t;
  var e = t[Symbol.toPrimitive];
  if (e !== undefined) {
    var i = e.call(t, r || "default");
    if (typeof i != "object")
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (r === "string" ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return typeof i == "symbol" ? i : i + "";
}
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && typeof Symbol == "function" && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
var version = "1.15.7";
function userAgent(pattern) {
  if (typeof window !== "undefined" && window.navigator) {
    return !!/* @__PURE__ */ navigator.userAgent.match(pattern);
  }
}
var IE11OrLess = userAgent(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i);
var Edge = userAgent(/Edge/i);
var FireFox = userAgent(/firefox/i);
var Safari = userAgent(/safari/i) && !userAgent(/chrome/i) && !userAgent(/android/i);
var IOS = userAgent(/iP(ad|od|hone)/i);
var ChromeForAndroid = userAgent(/chrome/i) && userAgent(/android/i);
var captureMode = {
  capture: false,
  passive: false
};
function on(el, event, fn) {
  el.addEventListener(event, fn, !IE11OrLess && captureMode);
}
function off(el, event, fn) {
  el.removeEventListener(event, fn, !IE11OrLess && captureMode);
}
function matches(el, selector) {
  if (!selector)
    return;
  selector[0] === ">" && (selector = selector.substring(1));
  if (el) {
    try {
      if (el.matches) {
        return el.matches(selector);
      } else if (el.msMatchesSelector) {
        return el.msMatchesSelector(selector);
      } else if (el.webkitMatchesSelector) {
        return el.webkitMatchesSelector(selector);
      }
    } catch (_) {
      return false;
    }
  }
  return false;
}
function getParentOrHost(el) {
  return el.host && el !== document && el.host.nodeType && el.host !== el ? el.host : el.parentNode;
}
function closest(el, selector, ctx, includeCTX) {
  if (el) {
    ctx = ctx || document;
    do {
      if (selector != null && (selector[0] === ">" ? el.parentNode === ctx && matches(el, selector) : matches(el, selector)) || includeCTX && el === ctx) {
        return el;
      }
      if (el === ctx)
        break;
    } while (el = getParentOrHost(el));
  }
  return null;
}
var R_SPACE = /\s+/g;
function toggleClass(el, name, state) {
  if (el && name) {
    if (el.classList) {
      el.classList[state ? "add" : "remove"](name);
    } else {
      var className = (" " + el.className + " ").replace(R_SPACE, " ").replace(" " + name + " ", " ");
      el.className = (className + (state ? " " + name : "")).replace(R_SPACE, " ");
    }
  }
}
function css(el, prop, val) {
  var style = el && el.style;
  if (style) {
    if (val === undefined) {
      if (document.defaultView && document.defaultView.getComputedStyle) {
        val = document.defaultView.getComputedStyle(el, "");
      } else if (el.currentStyle) {
        val = el.currentStyle;
      }
      return prop === undefined ? val : val[prop];
    } else {
      if (!(prop in style) && prop.indexOf("webkit") === -1) {
        prop = "-webkit-" + prop;
      }
      style[prop] = val + (typeof val === "string" ? "" : "px");
    }
  }
}
function matrix(el, selfOnly) {
  var appliedTransforms = "";
  if (typeof el === "string") {
    appliedTransforms = el;
  } else {
    do {
      var transform = css(el, "transform");
      if (transform && transform !== "none") {
        appliedTransforms = transform + " " + appliedTransforms;
      }
    } while (!selfOnly && (el = el.parentNode));
  }
  var matrixFn = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return matrixFn && new matrixFn(appliedTransforms);
}
function find(ctx, tagName, iterator) {
  if (ctx) {
    var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;
    if (iterator) {
      for (;i < n; i++) {
        iterator(list[i], i);
      }
    }
    return list;
  }
  return [];
}
function getWindowScrollingElement() {
  var scrollingElement = document.scrollingElement;
  if (scrollingElement) {
    return scrollingElement;
  } else {
    return document.documentElement;
  }
}
function getRect(el, relativeToContainingBlock, relativeToNonStaticParent, undoScale, container) {
  if (!el.getBoundingClientRect && el !== window)
    return;
  var elRect, top, left, bottom, right, height, width;
  if (el !== window && el.parentNode && el !== getWindowScrollingElement()) {
    elRect = el.getBoundingClientRect();
    top = elRect.top;
    left = elRect.left;
    bottom = elRect.bottom;
    right = elRect.right;
    height = elRect.height;
    width = elRect.width;
  } else {
    top = 0;
    left = 0;
    bottom = window.innerHeight;
    right = window.innerWidth;
    height = window.innerHeight;
    width = window.innerWidth;
  }
  if ((relativeToContainingBlock || relativeToNonStaticParent) && el !== window) {
    container = container || el.parentNode;
    if (!IE11OrLess) {
      do {
        if (container && container.getBoundingClientRect && (css(container, "transform") !== "none" || relativeToNonStaticParent && css(container, "position") !== "static")) {
          var containerRect = container.getBoundingClientRect();
          top -= containerRect.top + parseInt(css(container, "border-top-width"));
          left -= containerRect.left + parseInt(css(container, "border-left-width"));
          bottom = top + elRect.height;
          right = left + elRect.width;
          break;
        }
      } while (container = container.parentNode);
    }
  }
  if (undoScale && el !== window) {
    var elMatrix = matrix(container || el), scaleX = elMatrix && elMatrix.a, scaleY = elMatrix && elMatrix.d;
    if (elMatrix) {
      top /= scaleY;
      left /= scaleX;
      width /= scaleX;
      height /= scaleY;
      bottom = top + height;
      right = left + width;
    }
  }
  return {
    top,
    left,
    bottom,
    right,
    width,
    height
  };
}
function isScrolledPast(el, elSide, parentSide) {
  var parent = getParentAutoScrollElement(el, true), elSideVal = getRect(el)[elSide];
  while (parent) {
    var parentSideVal = getRect(parent)[parentSide], visible = undefined;
    if (parentSide === "top" || parentSide === "left") {
      visible = elSideVal >= parentSideVal;
    } else {
      visible = elSideVal <= parentSideVal;
    }
    if (!visible)
      return parent;
    if (parent === getWindowScrollingElement())
      break;
    parent = getParentAutoScrollElement(parent, false);
  }
  return false;
}
function getChild(el, childNum, options, includeDragEl) {
  var currentChild = 0, i = 0, children = el.children;
  while (i < children.length) {
    if (children[i].style.display !== "none" && children[i] !== Sortable.ghost && (includeDragEl || children[i] !== Sortable.dragged) && closest(children[i], options.draggable, el, false)) {
      if (currentChild === childNum) {
        return children[i];
      }
      currentChild++;
    }
    i++;
  }
  return null;
}
function lastChild(el, selector) {
  var last = el.lastElementChild;
  while (last && (last === Sortable.ghost || css(last, "display") === "none" || selector && !matches(last, selector))) {
    last = last.previousElementSibling;
  }
  return last || null;
}
function index(el, selector) {
  var index2 = 0;
  if (!el || !el.parentNode) {
    return -1;
  }
  while (el = el.previousElementSibling) {
    if (el.nodeName.toUpperCase() !== "TEMPLATE" && el !== Sortable.clone && (!selector || matches(el, selector))) {
      index2++;
    }
  }
  return index2;
}
function getRelativeScrollOffset(el) {
  var offsetLeft = 0, offsetTop = 0, winScroller = getWindowScrollingElement();
  if (el) {
    do {
      var elMatrix = matrix(el), scaleX = elMatrix.a, scaleY = elMatrix.d;
      offsetLeft += el.scrollLeft * scaleX;
      offsetTop += el.scrollTop * scaleY;
    } while (el !== winScroller && (el = el.parentNode));
  }
  return [offsetLeft, offsetTop];
}
function indexOfObject(arr, obj) {
  for (var i in arr) {
    if (!arr.hasOwnProperty(i))
      continue;
    for (var key in obj) {
      if (obj.hasOwnProperty(key) && obj[key] === arr[i][key])
        return Number(i);
    }
  }
  return -1;
}
function getParentAutoScrollElement(el, includeSelf) {
  if (!el || !el.getBoundingClientRect)
    return getWindowScrollingElement();
  var elem = el;
  var gotSelf = false;
  do {
    if (elem.clientWidth < elem.scrollWidth || elem.clientHeight < elem.scrollHeight) {
      var elemCSS = css(elem);
      if (elem.clientWidth < elem.scrollWidth && (elemCSS.overflowX == "auto" || elemCSS.overflowX == "scroll") || elem.clientHeight < elem.scrollHeight && (elemCSS.overflowY == "auto" || elemCSS.overflowY == "scroll")) {
        if (!elem.getBoundingClientRect || elem === document.body)
          return getWindowScrollingElement();
        if (gotSelf || includeSelf)
          return elem;
        gotSelf = true;
      }
    }
  } while (elem = elem.parentNode);
  return getWindowScrollingElement();
}
function extend(dst, src) {
  if (dst && src) {
    for (var key in src) {
      if (src.hasOwnProperty(key)) {
        dst[key] = src[key];
      }
    }
  }
  return dst;
}
function isRectEqual(rect1, rect2) {
  return Math.round(rect1.top) === Math.round(rect2.top) && Math.round(rect1.left) === Math.round(rect2.left) && Math.round(rect1.height) === Math.round(rect2.height) && Math.round(rect1.width) === Math.round(rect2.width);
}
var _throttleTimeout;
function throttle(callback, ms) {
  return function() {
    if (!_throttleTimeout) {
      var args = arguments, _this = this;
      if (args.length === 1) {
        callback.call(_this, args[0]);
      } else {
        callback.apply(_this, args);
      }
      _throttleTimeout = setTimeout(function() {
        _throttleTimeout = undefined;
      }, ms);
    }
  };
}
function cancelThrottle() {
  clearTimeout(_throttleTimeout);
  _throttleTimeout = undefined;
}
function scrollBy(el, x, y) {
  el.scrollLeft += x;
  el.scrollTop += y;
}
function clone(el) {
  var Polymer = window.Polymer;
  var $ = window.jQuery || window.Zepto;
  if (Polymer && Polymer.dom) {
    return Polymer.dom(el).cloneNode(true);
  } else if ($) {
    return $(el).clone(true)[0];
  } else {
    return el.cloneNode(true);
  }
}
function getChildContainingRectFromElement(container, options, ghostEl) {
  var rect = {};
  Array.from(container.children).forEach(function(child) {
    var _rect$left, _rect$top, _rect$right, _rect$bottom;
    if (!closest(child, options.draggable, container, false) || child.animated || child === ghostEl)
      return;
    var childRect = getRect(child);
    rect.left = Math.min((_rect$left = rect.left) !== null && _rect$left !== undefined ? _rect$left : Infinity, childRect.left);
    rect.top = Math.min((_rect$top = rect.top) !== null && _rect$top !== undefined ? _rect$top : Infinity, childRect.top);
    rect.right = Math.max((_rect$right = rect.right) !== null && _rect$right !== undefined ? _rect$right : -Infinity, childRect.right);
    rect.bottom = Math.max((_rect$bottom = rect.bottom) !== null && _rect$bottom !== undefined ? _rect$bottom : -Infinity, childRect.bottom);
  });
  rect.width = rect.right - rect.left;
  rect.height = rect.bottom - rect.top;
  rect.x = rect.left;
  rect.y = rect.top;
  return rect;
}
var expando = "Sortable" + new Date().getTime();
function AnimationStateManager() {
  var animationStates = [], animationCallbackId;
  return {
    captureAnimationState: function captureAnimationState() {
      animationStates = [];
      if (!this.options.animation)
        return;
      var children = [].slice.call(this.el.children);
      children.forEach(function(child) {
        if (css(child, "display") === "none" || child === Sortable.ghost)
          return;
        animationStates.push({
          target: child,
          rect: getRect(child)
        });
        var fromRect = _objectSpread2({}, animationStates[animationStates.length - 1].rect);
        if (child.thisAnimationDuration) {
          var childMatrix = matrix(child, true);
          if (childMatrix) {
            fromRect.top -= childMatrix.f;
            fromRect.left -= childMatrix.e;
          }
        }
        child.fromRect = fromRect;
      });
    },
    addAnimationState: function addAnimationState(state) {
      animationStates.push(state);
    },
    removeAnimationState: function removeAnimationState(target) {
      animationStates.splice(indexOfObject(animationStates, {
        target
      }), 1);
    },
    animateAll: function animateAll(callback) {
      var _this = this;
      if (!this.options.animation) {
        clearTimeout(animationCallbackId);
        if (typeof callback === "function")
          callback();
        return;
      }
      var animating = false, animationTime = 0;
      animationStates.forEach(function(state) {
        var time = 0, target = state.target, fromRect = target.fromRect, toRect = getRect(target), prevFromRect = target.prevFromRect, prevToRect = target.prevToRect, animatingRect = state.rect, targetMatrix = matrix(target, true);
        if (targetMatrix) {
          toRect.top -= targetMatrix.f;
          toRect.left -= targetMatrix.e;
        }
        target.toRect = toRect;
        if (target.thisAnimationDuration) {
          if (isRectEqual(prevFromRect, toRect) && !isRectEqual(fromRect, toRect) && (animatingRect.top - toRect.top) / (animatingRect.left - toRect.left) === (fromRect.top - toRect.top) / (fromRect.left - toRect.left)) {
            time = calculateRealTime(animatingRect, prevFromRect, prevToRect, _this.options);
          }
        }
        if (!isRectEqual(toRect, fromRect)) {
          target.prevFromRect = fromRect;
          target.prevToRect = toRect;
          if (!time) {
            time = _this.options.animation;
          }
          _this.animate(target, animatingRect, toRect, time);
        }
        if (time) {
          animating = true;
          animationTime = Math.max(animationTime, time);
          clearTimeout(target.animationResetTimer);
          target.animationResetTimer = setTimeout(function() {
            target.animationTime = 0;
            target.prevFromRect = null;
            target.fromRect = null;
            target.prevToRect = null;
            target.thisAnimationDuration = null;
          }, time);
          target.thisAnimationDuration = time;
        }
      });
      clearTimeout(animationCallbackId);
      if (!animating) {
        if (typeof callback === "function")
          callback();
      } else {
        animationCallbackId = setTimeout(function() {
          if (typeof callback === "function")
            callback();
        }, animationTime);
      }
      animationStates = [];
    },
    animate: function animate(target, currentRect, toRect, duration) {
      if (duration) {
        css(target, "transition", "");
        css(target, "transform", "");
        var elMatrix = matrix(this.el), scaleX = elMatrix && elMatrix.a, scaleY = elMatrix && elMatrix.d, translateX = (currentRect.left - toRect.left) / (scaleX || 1), translateY = (currentRect.top - toRect.top) / (scaleY || 1);
        target.animatingX = !!translateX;
        target.animatingY = !!translateY;
        css(target, "transform", "translate3d(" + translateX + "px," + translateY + "px,0)");
        this.forRepaintDummy = repaint(target);
        css(target, "transition", "transform " + duration + "ms" + (this.options.easing ? " " + this.options.easing : ""));
        css(target, "transform", "translate3d(0,0,0)");
        typeof target.animated === "number" && clearTimeout(target.animated);
        target.animated = setTimeout(function() {
          css(target, "transition", "");
          css(target, "transform", "");
          target.animated = false;
          target.animatingX = false;
          target.animatingY = false;
        }, duration);
      }
    }
  };
}
function repaint(target) {
  return target.offsetWidth;
}
function calculateRealTime(animatingRect, fromRect, toRect, options) {
  return Math.sqrt(Math.pow(fromRect.top - animatingRect.top, 2) + Math.pow(fromRect.left - animatingRect.left, 2)) / Math.sqrt(Math.pow(fromRect.top - toRect.top, 2) + Math.pow(fromRect.left - toRect.left, 2)) * options.animation;
}
var plugins = [];
var defaults = {
  initializeByDefault: true
};
var PluginManager = {
  mount: function mount(plugin) {
    for (var option in defaults) {
      if (defaults.hasOwnProperty(option) && !(option in plugin)) {
        plugin[option] = defaults[option];
      }
    }
    plugins.forEach(function(p) {
      if (p.pluginName === plugin.pluginName) {
        throw "Sortable: Cannot mount plugin ".concat(plugin.pluginName, " more than once");
      }
    });
    plugins.push(plugin);
  },
  pluginEvent: function pluginEvent(eventName, sortable, evt) {
    var _this = this;
    this.eventCanceled = false;
    evt.cancel = function() {
      _this.eventCanceled = true;
    };
    var eventNameGlobal = eventName + "Global";
    plugins.forEach(function(plugin) {
      if (!sortable[plugin.pluginName])
        return;
      if (sortable[plugin.pluginName][eventNameGlobal]) {
        sortable[plugin.pluginName][eventNameGlobal](_objectSpread2({
          sortable
        }, evt));
      }
      if (sortable.options[plugin.pluginName] && sortable[plugin.pluginName][eventName]) {
        sortable[plugin.pluginName][eventName](_objectSpread2({
          sortable
        }, evt));
      }
    });
  },
  initializePlugins: function initializePlugins(sortable, el, defaults2, options) {
    plugins.forEach(function(plugin) {
      var pluginName = plugin.pluginName;
      if (!sortable.options[pluginName] && !plugin.initializeByDefault)
        return;
      var initialized = new plugin(sortable, el, sortable.options);
      initialized.sortable = sortable;
      initialized.options = sortable.options;
      sortable[pluginName] = initialized;
      _extends(defaults2, initialized.defaults);
    });
    for (var option in sortable.options) {
      if (!sortable.options.hasOwnProperty(option))
        continue;
      var modified = this.modifyOption(sortable, option, sortable.options[option]);
      if (typeof modified !== "undefined") {
        sortable.options[option] = modified;
      }
    }
  },
  getEventProperties: function getEventProperties(name, sortable) {
    var eventProperties = {};
    plugins.forEach(function(plugin) {
      if (typeof plugin.eventProperties !== "function")
        return;
      _extends(eventProperties, plugin.eventProperties.call(sortable[plugin.pluginName], name));
    });
    return eventProperties;
  },
  modifyOption: function modifyOption(sortable, name, value) {
    var modifiedValue;
    plugins.forEach(function(plugin) {
      if (!sortable[plugin.pluginName])
        return;
      if (plugin.optionListeners && typeof plugin.optionListeners[name] === "function") {
        modifiedValue = plugin.optionListeners[name].call(sortable[plugin.pluginName], value);
      }
    });
    return modifiedValue;
  }
};
function dispatchEvent(_ref) {
  var { sortable, rootEl, name, targetEl, cloneEl, toEl, fromEl, oldIndex, newIndex, oldDraggableIndex, newDraggableIndex, originalEvent, putSortable, extraEventProperties } = _ref;
  sortable = sortable || rootEl && rootEl[expando];
  if (!sortable)
    return;
  var evt, options = sortable.options, onName = "on" + name.charAt(0).toUpperCase() + name.substr(1);
  if (window.CustomEvent && !IE11OrLess && !Edge) {
    evt = new CustomEvent(name, {
      bubbles: true,
      cancelable: true
    });
  } else {
    evt = document.createEvent("Event");
    evt.initEvent(name, true, true);
  }
  evt.to = toEl || rootEl;
  evt.from = fromEl || rootEl;
  evt.item = targetEl || rootEl;
  evt.clone = cloneEl;
  evt.oldIndex = oldIndex;
  evt.newIndex = newIndex;
  evt.oldDraggableIndex = oldDraggableIndex;
  evt.newDraggableIndex = newDraggableIndex;
  evt.originalEvent = originalEvent;
  evt.pullMode = putSortable ? putSortable.lastPutMode : undefined;
  var allEventProperties = _objectSpread2(_objectSpread2({}, extraEventProperties), PluginManager.getEventProperties(name, sortable));
  for (var option in allEventProperties) {
    evt[option] = allEventProperties[option];
  }
  if (rootEl) {
    rootEl.dispatchEvent(evt);
  }
  if (options[onName]) {
    options[onName].call(sortable, evt);
  }
}
var _excluded = ["evt"];
var pluginEvent2 = function pluginEvent3(eventName, sortable) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {}, originalEvent = _ref.evt, data = _objectWithoutProperties(_ref, _excluded);
  PluginManager.pluginEvent.bind(Sortable)(eventName, sortable, _objectSpread2({
    dragEl,
    parentEl,
    ghostEl,
    rootEl,
    nextEl,
    lastDownEl,
    cloneEl,
    cloneHidden,
    dragStarted: moved,
    putSortable,
    activeSortable: Sortable.active,
    originalEvent,
    oldIndex,
    oldDraggableIndex,
    newIndex,
    newDraggableIndex,
    hideGhostForTarget: _hideGhostForTarget,
    unhideGhostForTarget: _unhideGhostForTarget,
    cloneNowHidden: function cloneNowHidden() {
      cloneHidden = true;
    },
    cloneNowShown: function cloneNowShown() {
      cloneHidden = false;
    },
    dispatchSortableEvent: function dispatchSortableEvent(name) {
      _dispatchEvent({
        sortable,
        name,
        originalEvent
      });
    }
  }, data));
};
function _dispatchEvent(info) {
  dispatchEvent(_objectSpread2({
    putSortable,
    cloneEl,
    targetEl: dragEl,
    rootEl,
    oldIndex,
    oldDraggableIndex,
    newIndex,
    newDraggableIndex
  }, info));
}
var dragEl;
var parentEl;
var ghostEl;
var rootEl;
var nextEl;
var lastDownEl;
var cloneEl;
var cloneHidden;
var oldIndex;
var newIndex;
var oldDraggableIndex;
var newDraggableIndex;
var activeGroup;
var putSortable;
var awaitingDragStarted = false;
var ignoreNextClick = false;
var sortables = [];
var tapEvt;
var touchEvt;
var lastDx;
var lastDy;
var tapDistanceLeft;
var tapDistanceTop;
var moved;
var lastTarget;
var lastDirection;
var pastFirstInvertThresh = false;
var isCircumstantialInvert = false;
var targetMoveDistance;
var ghostRelativeParent;
var ghostRelativeParentInitialScroll = [];
var _silent = false;
var savedInputChecked = [];
var documentExists = typeof document !== "undefined";
var PositionGhostAbsolutely = IOS;
var CSSFloatProperty = Edge || IE11OrLess ? "cssFloat" : "float";
var supportDraggable = documentExists && !ChromeForAndroid && !IOS && "draggable" in document.createElement("div");
var supportCssPointerEvents = function() {
  if (!documentExists)
    return;
  if (IE11OrLess) {
    return false;
  }
  var el = document.createElement("x");
  el.style.cssText = "pointer-events:auto";
  return el.style.pointerEvents === "auto";
}();
var _detectDirection = function _detectDirection2(el, options) {
  var elCSS = css(el), elWidth = parseInt(elCSS.width) - parseInt(elCSS.paddingLeft) - parseInt(elCSS.paddingRight) - parseInt(elCSS.borderLeftWidth) - parseInt(elCSS.borderRightWidth), child1 = getChild(el, 0, options), child2 = getChild(el, 1, options), firstChildCSS = child1 && css(child1), secondChildCSS = child2 && css(child2), firstChildWidth = firstChildCSS && parseInt(firstChildCSS.marginLeft) + parseInt(firstChildCSS.marginRight) + getRect(child1).width, secondChildWidth = secondChildCSS && parseInt(secondChildCSS.marginLeft) + parseInt(secondChildCSS.marginRight) + getRect(child2).width;
  if (elCSS.display === "flex") {
    return elCSS.flexDirection === "column" || elCSS.flexDirection === "column-reverse" ? "vertical" : "horizontal";
  }
  if (elCSS.display === "grid") {
    return elCSS.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
  }
  if (child1 && firstChildCSS["float"] && firstChildCSS["float"] !== "none") {
    var touchingSideChild2 = firstChildCSS["float"] === "left" ? "left" : "right";
    return child2 && (secondChildCSS.clear === "both" || secondChildCSS.clear === touchingSideChild2) ? "vertical" : "horizontal";
  }
  return child1 && (firstChildCSS.display === "block" || firstChildCSS.display === "flex" || firstChildCSS.display === "table" || firstChildCSS.display === "grid" || firstChildWidth >= elWidth && elCSS[CSSFloatProperty] === "none" || child2 && elCSS[CSSFloatProperty] === "none" && firstChildWidth + secondChildWidth > elWidth) ? "vertical" : "horizontal";
};
var _dragElInRowColumn = function _dragElInRowColumn2(dragRect, targetRect, vertical) {
  var dragElS1Opp = vertical ? dragRect.left : dragRect.top, dragElS2Opp = vertical ? dragRect.right : dragRect.bottom, dragElOppLength = vertical ? dragRect.width : dragRect.height, targetS1Opp = vertical ? targetRect.left : targetRect.top, targetS2Opp = vertical ? targetRect.right : targetRect.bottom, targetOppLength = vertical ? targetRect.width : targetRect.height;
  return dragElS1Opp === targetS1Opp || dragElS2Opp === targetS2Opp || dragElS1Opp + dragElOppLength / 2 === targetS1Opp + targetOppLength / 2;
};
var _detectNearestEmptySortable = function _detectNearestEmptySortable2(x, y) {
  var ret;
  sortables.some(function(sortable) {
    var threshold = sortable[expando].options.emptyInsertThreshold;
    if (!threshold || lastChild(sortable))
      return;
    var rect = getRect(sortable), insideHorizontally = x >= rect.left - threshold && x <= rect.right + threshold, insideVertically = y >= rect.top - threshold && y <= rect.bottom + threshold;
    if (insideHorizontally && insideVertically) {
      return ret = sortable;
    }
  });
  return ret;
};
var _prepareGroup = function _prepareGroup2(options) {
  function toFn(value, pull) {
    return function(to, from, dragEl2, evt) {
      var sameGroup = to.options.group.name && from.options.group.name && to.options.group.name === from.options.group.name;
      if (value == null && (pull || sameGroup)) {
        return true;
      } else if (value == null || value === false) {
        return false;
      } else if (pull && value === "clone") {
        return value;
      } else if (typeof value === "function") {
        return toFn(value(to, from, dragEl2, evt), pull)(to, from, dragEl2, evt);
      } else {
        var otherGroup = (pull ? to : from).options.group.name;
        return value === true || typeof value === "string" && value === otherGroup || value.join && value.indexOf(otherGroup) > -1;
      }
    };
  }
  var group = {};
  var originalGroup = options.group;
  if (!originalGroup || _typeof(originalGroup) != "object") {
    originalGroup = {
      name: originalGroup
    };
  }
  group.name = originalGroup.name;
  group.checkPull = toFn(originalGroup.pull, true);
  group.checkPut = toFn(originalGroup.put);
  group.revertClone = originalGroup.revertClone;
  options.group = group;
};
var _hideGhostForTarget = function _hideGhostForTarget2() {
  if (!supportCssPointerEvents && ghostEl) {
    css(ghostEl, "display", "none");
  }
};
var _unhideGhostForTarget = function _unhideGhostForTarget2() {
  if (!supportCssPointerEvents && ghostEl) {
    css(ghostEl, "display", "");
  }
};
if (documentExists && !ChromeForAndroid) {
  document.addEventListener("click", function(evt) {
    if (ignoreNextClick) {
      evt.preventDefault();
      evt.stopPropagation && evt.stopPropagation();
      evt.stopImmediatePropagation && evt.stopImmediatePropagation();
      ignoreNextClick = false;
      return false;
    }
  }, true);
}
var nearestEmptyInsertDetectEvent = function nearestEmptyInsertDetectEvent2(evt) {
  if (dragEl) {
    evt = evt.touches ? evt.touches[0] : evt;
    var nearest = _detectNearestEmptySortable(evt.clientX, evt.clientY);
    if (nearest) {
      var event = {};
      for (var i in evt) {
        if (evt.hasOwnProperty(i)) {
          event[i] = evt[i];
        }
      }
      event.target = event.rootEl = nearest;
      event.preventDefault = undefined;
      event.stopPropagation = undefined;
      nearest[expando]._onDragOver(event);
    }
  }
};
var _checkOutsideTargetEl = function _checkOutsideTargetEl2(evt) {
  if (dragEl) {
    dragEl.parentNode[expando]._isOutsideThisEl(evt.target);
  }
};
function Sortable(el, options) {
  if (!(el && el.nodeType && el.nodeType === 1)) {
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(el));
  }
  this.el = el;
  this.options = options = _extends({}, options);
  el[expando] = this;
  var defaults2 = {
    group: null,
    sort: true,
    disabled: false,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(el.nodeName) ? ">li" : ">*",
    swapThreshold: 1,
    invertSwap: false,
    invertedSwapThreshold: null,
    removeCloneOnHide: true,
    direction: function direction() {
      return _detectDirection(el, this.options);
    },
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    ignore: "a, img",
    filter: null,
    preventOnFilter: true,
    animation: 0,
    easing: null,
    setData: function setData(dataTransfer, dragEl2) {
      dataTransfer.setData("Text", dragEl2.textContent);
    },
    dropBubble: false,
    dragoverBubble: false,
    dataIdAttr: "data-id",
    delay: 0,
    delayOnTouchOnly: false,
    touchStartThreshold: (Number.parseInt ? Number : window).parseInt(window.devicePixelRatio, 10) || 1,
    forceFallback: false,
    fallbackClass: "sortable-fallback",
    fallbackOnBody: false,
    fallbackTolerance: 0,
    fallbackOffset: {
      x: 0,
      y: 0
    },
    supportPointer: Sortable.supportPointer !== false && "PointerEvent" in window && (!Safari || IOS),
    emptyInsertThreshold: 5
  };
  PluginManager.initializePlugins(this, el, defaults2);
  for (var name in defaults2) {
    !(name in options) && (options[name] = defaults2[name]);
  }
  _prepareGroup(options);
  for (var fn in this) {
    if (fn.charAt(0) === "_" && typeof this[fn] === "function") {
      this[fn] = this[fn].bind(this);
    }
  }
  this.nativeDraggable = options.forceFallback ? false : supportDraggable;
  if (this.nativeDraggable) {
    this.options.touchStartThreshold = 1;
  }
  if (options.supportPointer) {
    on(el, "pointerdown", this._onTapStart);
  } else {
    on(el, "mousedown", this._onTapStart);
    on(el, "touchstart", this._onTapStart);
  }
  if (this.nativeDraggable) {
    on(el, "dragover", this);
    on(el, "dragenter", this);
  }
  sortables.push(this.el);
  options.store && options.store.get && this.sort(options.store.get(this) || []);
  _extends(this, AnimationStateManager());
}
Sortable.prototype = {
  constructor: Sortable,
  _isOutsideThisEl: function _isOutsideThisEl(target) {
    if (!this.el.contains(target) && target !== this.el) {
      lastTarget = null;
    }
  },
  _getDirection: function _getDirection(evt, target) {
    return typeof this.options.direction === "function" ? this.options.direction.call(this, evt, target, dragEl) : this.options.direction;
  },
  _onTapStart: function _onTapStart(evt) {
    if (!evt.cancelable)
      return;
    var _this = this, el = this.el, options = this.options, preventOnFilter = options.preventOnFilter, type = evt.type, touch = evt.touches && evt.touches[0] || evt.pointerType && evt.pointerType === "touch" && evt, target = (touch || evt).target, originalTarget = evt.target.shadowRoot && (evt.path && evt.path[0] || evt.composedPath && evt.composedPath()[0]) || target, filter = options.filter;
    _saveInputCheckedState(el);
    if (dragEl) {
      return;
    }
    if (/mousedown|pointerdown/.test(type) && evt.button !== 0 || options.disabled) {
      return;
    }
    if (originalTarget.isContentEditable) {
      return;
    }
    if (!this.nativeDraggable && Safari && target && target.tagName.toUpperCase() === "SELECT") {
      return;
    }
    target = closest(target, options.draggable, el, false);
    if (target && target.animated) {
      return;
    }
    if (lastDownEl === target) {
      return;
    }
    oldIndex = index(target);
    oldDraggableIndex = index(target, options.draggable);
    if (typeof filter === "function") {
      if (filter.call(this, evt, target, this)) {
        _dispatchEvent({
          sortable: _this,
          rootEl: originalTarget,
          name: "filter",
          targetEl: target,
          toEl: el,
          fromEl: el
        });
        pluginEvent2("filter", _this, {
          evt
        });
        preventOnFilter && evt.preventDefault();
        return;
      }
    } else if (filter) {
      filter = filter.split(",").some(function(criteria) {
        criteria = closest(originalTarget, criteria.trim(), el, false);
        if (criteria) {
          _dispatchEvent({
            sortable: _this,
            rootEl: criteria,
            name: "filter",
            targetEl: target,
            fromEl: el,
            toEl: el
          });
          pluginEvent2("filter", _this, {
            evt
          });
          return true;
        }
      });
      if (filter) {
        preventOnFilter && evt.preventDefault();
        return;
      }
    }
    if (options.handle && !closest(originalTarget, options.handle, el, false)) {
      return;
    }
    this._prepareDragStart(evt, touch, target);
  },
  _prepareDragStart: function _prepareDragStart(evt, touch, target) {
    var _this = this, el = _this.el, options = _this.options, ownerDocument = el.ownerDocument, dragStartFn;
    if (target && !dragEl && target.parentNode === el) {
      var dragRect = getRect(target);
      rootEl = el;
      dragEl = target;
      parentEl = dragEl.parentNode;
      nextEl = dragEl.nextSibling;
      lastDownEl = target;
      activeGroup = options.group;
      Sortable.dragged = dragEl;
      tapEvt = {
        target: dragEl,
        clientX: (touch || evt).clientX,
        clientY: (touch || evt).clientY
      };
      tapDistanceLeft = tapEvt.clientX - dragRect.left;
      tapDistanceTop = tapEvt.clientY - dragRect.top;
      this._lastX = (touch || evt).clientX;
      this._lastY = (touch || evt).clientY;
      dragEl.style["will-change"] = "all";
      dragStartFn = function dragStartFn2() {
        pluginEvent2("delayEnded", _this, {
          evt
        });
        if (Sortable.eventCanceled) {
          _this._onDrop();
          return;
        }
        _this._disableDelayedDragEvents();
        if (!FireFox && _this.nativeDraggable) {
          dragEl.draggable = true;
        }
        _this._triggerDragStart(evt, touch);
        _dispatchEvent({
          sortable: _this,
          name: "choose",
          originalEvent: evt
        });
        toggleClass(dragEl, options.chosenClass, true);
      };
      options.ignore.split(",").forEach(function(criteria) {
        find(dragEl, criteria.trim(), _disableDraggable);
      });
      on(ownerDocument, "dragover", nearestEmptyInsertDetectEvent);
      on(ownerDocument, "mousemove", nearestEmptyInsertDetectEvent);
      on(ownerDocument, "touchmove", nearestEmptyInsertDetectEvent);
      if (options.supportPointer) {
        on(ownerDocument, "pointerup", _this._onDrop);
        !this.nativeDraggable && on(ownerDocument, "pointercancel", _this._onDrop);
      } else {
        on(ownerDocument, "mouseup", _this._onDrop);
        on(ownerDocument, "touchend", _this._onDrop);
        on(ownerDocument, "touchcancel", _this._onDrop);
      }
      if (FireFox && this.nativeDraggable) {
        this.options.touchStartThreshold = 4;
        dragEl.draggable = true;
      }
      pluginEvent2("delayStart", this, {
        evt
      });
      if (options.delay && (!options.delayOnTouchOnly || touch) && (!this.nativeDraggable || !(Edge || IE11OrLess))) {
        if (Sortable.eventCanceled) {
          this._onDrop();
          return;
        }
        if (options.supportPointer) {
          on(ownerDocument, "pointerup", _this._disableDelayedDrag);
          on(ownerDocument, "pointercancel", _this._disableDelayedDrag);
        } else {
          on(ownerDocument, "mouseup", _this._disableDelayedDrag);
          on(ownerDocument, "touchend", _this._disableDelayedDrag);
          on(ownerDocument, "touchcancel", _this._disableDelayedDrag);
        }
        on(ownerDocument, "mousemove", _this._delayedDragTouchMoveHandler);
        on(ownerDocument, "touchmove", _this._delayedDragTouchMoveHandler);
        options.supportPointer && on(ownerDocument, "pointermove", _this._delayedDragTouchMoveHandler);
        _this._dragStartTimer = setTimeout(dragStartFn, options.delay);
      } else {
        dragStartFn();
      }
    }
  },
  _delayedDragTouchMoveHandler: function _delayedDragTouchMoveHandler(e) {
    var touch = e.touches ? e.touches[0] : e;
    if (Math.max(Math.abs(touch.clientX - this._lastX), Math.abs(touch.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1))) {
      this._disableDelayedDrag();
    }
  },
  _disableDelayedDrag: function _disableDelayedDrag() {
    dragEl && _disableDraggable(dragEl);
    clearTimeout(this._dragStartTimer);
    this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function _disableDelayedDragEvents() {
    var ownerDocument = this.el.ownerDocument;
    off(ownerDocument, "mouseup", this._disableDelayedDrag);
    off(ownerDocument, "touchend", this._disableDelayedDrag);
    off(ownerDocument, "touchcancel", this._disableDelayedDrag);
    off(ownerDocument, "pointerup", this._disableDelayedDrag);
    off(ownerDocument, "pointercancel", this._disableDelayedDrag);
    off(ownerDocument, "mousemove", this._delayedDragTouchMoveHandler);
    off(ownerDocument, "touchmove", this._delayedDragTouchMoveHandler);
    off(ownerDocument, "pointermove", this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function _triggerDragStart(evt, touch) {
    touch = touch || evt.pointerType == "touch" && evt;
    if (!this.nativeDraggable || touch) {
      if (this.options.supportPointer) {
        on(document, "pointermove", this._onTouchMove);
      } else if (touch) {
        on(document, "touchmove", this._onTouchMove);
      } else {
        on(document, "mousemove", this._onTouchMove);
      }
    } else {
      on(dragEl, "dragend", this);
      on(rootEl, "dragstart", this._onDragStart);
    }
    try {
      if (document.selection) {
        _nextTick(function() {
          document.selection.empty();
        });
      } else {
        window.getSelection().removeAllRanges();
      }
    } catch (err) {}
  },
  _dragStarted: function _dragStarted(fallback, evt) {
    awaitingDragStarted = false;
    if (rootEl && dragEl) {
      pluginEvent2("dragStarted", this, {
        evt
      });
      if (this.nativeDraggable) {
        on(document, "dragover", _checkOutsideTargetEl);
      }
      var options = this.options;
      !fallback && toggleClass(dragEl, options.dragClass, false);
      toggleClass(dragEl, options.ghostClass, true);
      Sortable.active = this;
      fallback && this._appendGhost();
      _dispatchEvent({
        sortable: this,
        name: "start",
        originalEvent: evt
      });
    } else {
      this._nulling();
    }
  },
  _emulateDragOver: function _emulateDragOver() {
    if (touchEvt) {
      this._lastX = touchEvt.clientX;
      this._lastY = touchEvt.clientY;
      _hideGhostForTarget();
      var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
      var parent = target;
      while (target && target.shadowRoot) {
        target = target.shadowRoot.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
        if (target === parent)
          break;
        parent = target;
      }
      dragEl.parentNode[expando]._isOutsideThisEl(target);
      if (parent) {
        do {
          if (parent[expando]) {
            var inserted = undefined;
            inserted = parent[expando]._onDragOver({
              clientX: touchEvt.clientX,
              clientY: touchEvt.clientY,
              target,
              rootEl: parent
            });
            if (inserted && !this.options.dragoverBubble) {
              break;
            }
          }
          target = parent;
        } while (parent = getParentOrHost(parent));
      }
      _unhideGhostForTarget();
    }
  },
  _onTouchMove: function _onTouchMove(evt) {
    if (tapEvt) {
      var options = this.options, fallbackTolerance = options.fallbackTolerance, fallbackOffset = options.fallbackOffset, touch = evt.touches ? evt.touches[0] : evt, ghostMatrix = ghostEl && matrix(ghostEl, true), scaleX = ghostEl && ghostMatrix && ghostMatrix.a, scaleY = ghostEl && ghostMatrix && ghostMatrix.d, relativeScrollOffset = PositionGhostAbsolutely && ghostRelativeParent && getRelativeScrollOffset(ghostRelativeParent), dx = (touch.clientX - tapEvt.clientX + fallbackOffset.x) / (scaleX || 1) + (relativeScrollOffset ? relativeScrollOffset[0] - ghostRelativeParentInitialScroll[0] : 0) / (scaleX || 1), dy = (touch.clientY - tapEvt.clientY + fallbackOffset.y) / (scaleY || 1) + (relativeScrollOffset ? relativeScrollOffset[1] - ghostRelativeParentInitialScroll[1] : 0) / (scaleY || 1);
      if (!Sortable.active && !awaitingDragStarted) {
        if (fallbackTolerance && Math.max(Math.abs(touch.clientX - this._lastX), Math.abs(touch.clientY - this._lastY)) < fallbackTolerance) {
          return;
        }
        this._onDragStart(evt, true);
      }
      if (ghostEl) {
        if (ghostMatrix) {
          ghostMatrix.e += dx - (lastDx || 0);
          ghostMatrix.f += dy - (lastDy || 0);
        } else {
          ghostMatrix = {
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: dx,
            f: dy
          };
        }
        var cssMatrix = "matrix(".concat(ghostMatrix.a, ",").concat(ghostMatrix.b, ",").concat(ghostMatrix.c, ",").concat(ghostMatrix.d, ",").concat(ghostMatrix.e, ",").concat(ghostMatrix.f, ")");
        css(ghostEl, "webkitTransform", cssMatrix);
        css(ghostEl, "mozTransform", cssMatrix);
        css(ghostEl, "msTransform", cssMatrix);
        css(ghostEl, "transform", cssMatrix);
        lastDx = dx;
        lastDy = dy;
        touchEvt = touch;
      }
      evt.cancelable && evt.preventDefault();
    }
  },
  _appendGhost: function _appendGhost() {
    if (!ghostEl) {
      var container = this.options.fallbackOnBody ? document.body : rootEl, rect = getRect(dragEl, true, PositionGhostAbsolutely, true, container), options = this.options;
      if (PositionGhostAbsolutely) {
        ghostRelativeParent = container;
        while (css(ghostRelativeParent, "position") === "static" && css(ghostRelativeParent, "transform") === "none" && ghostRelativeParent !== document) {
          ghostRelativeParent = ghostRelativeParent.parentNode;
        }
        if (ghostRelativeParent !== document.body && ghostRelativeParent !== document.documentElement) {
          if (ghostRelativeParent === document)
            ghostRelativeParent = getWindowScrollingElement();
          rect.top += ghostRelativeParent.scrollTop;
          rect.left += ghostRelativeParent.scrollLeft;
        } else {
          ghostRelativeParent = getWindowScrollingElement();
        }
        ghostRelativeParentInitialScroll = getRelativeScrollOffset(ghostRelativeParent);
      }
      ghostEl = dragEl.cloneNode(true);
      toggleClass(ghostEl, options.ghostClass, false);
      toggleClass(ghostEl, options.fallbackClass, true);
      toggleClass(ghostEl, options.dragClass, true);
      css(ghostEl, "transition", "");
      css(ghostEl, "transform", "");
      css(ghostEl, "box-sizing", "border-box");
      css(ghostEl, "margin", 0);
      css(ghostEl, "top", rect.top);
      css(ghostEl, "left", rect.left);
      css(ghostEl, "width", rect.width);
      css(ghostEl, "height", rect.height);
      css(ghostEl, "opacity", "0.8");
      css(ghostEl, "position", PositionGhostAbsolutely ? "absolute" : "fixed");
      css(ghostEl, "zIndex", "100000");
      css(ghostEl, "pointerEvents", "none");
      Sortable.ghost = ghostEl;
      container.appendChild(ghostEl);
      css(ghostEl, "transform-origin", tapDistanceLeft / parseInt(ghostEl.style.width) * 100 + "% " + tapDistanceTop / parseInt(ghostEl.style.height) * 100 + "%");
    }
  },
  _onDragStart: function _onDragStart(evt, fallback) {
    var _this = this;
    var dataTransfer = evt.dataTransfer;
    var options = _this.options;
    pluginEvent2("dragStart", this, {
      evt
    });
    if (Sortable.eventCanceled) {
      this._onDrop();
      return;
    }
    pluginEvent2("setupClone", this);
    if (!Sortable.eventCanceled) {
      cloneEl = clone(dragEl);
      cloneEl.removeAttribute("id");
      cloneEl.draggable = false;
      cloneEl.style["will-change"] = "";
      this._hideClone();
      toggleClass(cloneEl, this.options.chosenClass, false);
      Sortable.clone = cloneEl;
    }
    _this.cloneId = _nextTick(function() {
      pluginEvent2("clone", _this);
      if (Sortable.eventCanceled)
        return;
      if (!_this.options.removeCloneOnHide) {
        rootEl.insertBefore(cloneEl, dragEl);
      }
      _this._hideClone();
      _dispatchEvent({
        sortable: _this,
        name: "clone"
      });
    });
    !fallback && toggleClass(dragEl, options.dragClass, true);
    if (fallback) {
      ignoreNextClick = true;
      _this._loopId = setInterval(_this._emulateDragOver, 50);
    } else {
      off(document, "mouseup", _this._onDrop);
      off(document, "touchend", _this._onDrop);
      off(document, "touchcancel", _this._onDrop);
      if (dataTransfer) {
        dataTransfer.effectAllowed = "move";
        options.setData && options.setData.call(_this, dataTransfer, dragEl);
      }
      on(document, "drop", _this);
      css(dragEl, "transform", "translateZ(0)");
    }
    awaitingDragStarted = true;
    _this._dragStartId = _nextTick(_this._dragStarted.bind(_this, fallback, evt));
    on(document, "selectstart", _this);
    moved = true;
    window.getSelection().removeAllRanges();
    if (Safari) {
      css(document.body, "user-select", "none");
    }
  },
  _onDragOver: function _onDragOver(evt) {
    var el = this.el, target = evt.target, dragRect, targetRect, revert, options = this.options, group = options.group, activeSortable = Sortable.active, isOwner = activeGroup === group, canSort = options.sort, fromSortable = putSortable || activeSortable, vertical, _this = this, completedFired = false;
    if (_silent)
      return;
    function dragOverEvent(name, extra) {
      pluginEvent2(name, _this, _objectSpread2({
        evt,
        isOwner,
        axis: vertical ? "vertical" : "horizontal",
        revert,
        dragRect,
        targetRect,
        canSort,
        fromSortable,
        target,
        completed,
        onMove: function onMove(target2, after2) {
          return _onMove(rootEl, el, dragEl, dragRect, target2, getRect(target2), evt, after2);
        },
        changed
      }, extra));
    }
    function capture() {
      dragOverEvent("dragOverAnimationCapture");
      _this.captureAnimationState();
      if (_this !== fromSortable) {
        fromSortable.captureAnimationState();
      }
    }
    function completed(insertion) {
      dragOverEvent("dragOverCompleted", {
        insertion
      });
      if (insertion) {
        if (isOwner) {
          activeSortable._hideClone();
        } else {
          activeSortable._showClone(_this);
        }
        if (_this !== fromSortable) {
          toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : activeSortable.options.ghostClass, false);
          toggleClass(dragEl, options.ghostClass, true);
        }
        if (putSortable !== _this && _this !== Sortable.active) {
          putSortable = _this;
        } else if (_this === Sortable.active && putSortable) {
          putSortable = null;
        }
        if (fromSortable === _this) {
          _this._ignoreWhileAnimating = target;
        }
        _this.animateAll(function() {
          dragOverEvent("dragOverAnimationComplete");
          _this._ignoreWhileAnimating = null;
        });
        if (_this !== fromSortable) {
          fromSortable.animateAll();
          fromSortable._ignoreWhileAnimating = null;
        }
      }
      if (target === dragEl && !dragEl.animated || target === el && !target.animated) {
        lastTarget = null;
      }
      if (!options.dragoverBubble && !evt.rootEl && target !== document) {
        dragEl.parentNode[expando]._isOutsideThisEl(evt.target);
        !insertion && nearestEmptyInsertDetectEvent(evt);
      }
      !options.dragoverBubble && evt.stopPropagation && evt.stopPropagation();
      return completedFired = true;
    }
    function changed() {
      newIndex = index(dragEl);
      newDraggableIndex = index(dragEl, options.draggable);
      _dispatchEvent({
        sortable: _this,
        name: "change",
        toEl: el,
        newIndex,
        newDraggableIndex,
        originalEvent: evt
      });
    }
    if (evt.preventDefault !== undefined) {
      evt.cancelable && evt.preventDefault();
    }
    target = closest(target, options.draggable, el, true);
    dragOverEvent("dragOver");
    if (Sortable.eventCanceled)
      return completedFired;
    if (dragEl.contains(evt.target) || target.animated && target.animatingX && target.animatingY || _this._ignoreWhileAnimating === target) {
      return completed(false);
    }
    ignoreNextClick = false;
    if (activeSortable && !options.disabled && (isOwner ? canSort || (revert = parentEl !== rootEl) : putSortable === this || (this.lastPutMode = activeGroup.checkPull(this, activeSortable, dragEl, evt)) && group.checkPut(this, activeSortable, dragEl, evt))) {
      vertical = this._getDirection(evt, target) === "vertical";
      dragRect = getRect(dragEl);
      dragOverEvent("dragOverValid");
      if (Sortable.eventCanceled)
        return completedFired;
      if (revert) {
        parentEl = rootEl;
        capture();
        this._hideClone();
        dragOverEvent("revert");
        if (!Sortable.eventCanceled) {
          if (nextEl) {
            rootEl.insertBefore(dragEl, nextEl);
          } else {
            rootEl.appendChild(dragEl);
          }
        }
        return completed(true);
      }
      var elLastChild = lastChild(el, options.draggable);
      if (!elLastChild || _ghostIsLast(evt, vertical, this) && !elLastChild.animated) {
        if (elLastChild === dragEl) {
          return completed(false);
        }
        if (elLastChild && el === evt.target) {
          target = elLastChild;
        }
        if (target) {
          targetRect = getRect(target);
        }
        if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, !!target) !== false) {
          capture();
          if (elLastChild && elLastChild.nextSibling) {
            el.insertBefore(dragEl, elLastChild.nextSibling);
          } else {
            el.appendChild(dragEl);
          }
          parentEl = el;
          changed();
          return completed(true);
        }
      } else if (elLastChild && _ghostIsFirst(evt, vertical, this)) {
        var firstChild = getChild(el, 0, options, true);
        if (firstChild === dragEl) {
          return completed(false);
        }
        target = firstChild;
        targetRect = getRect(target);
        if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, false) !== false) {
          capture();
          el.insertBefore(dragEl, firstChild);
          parentEl = el;
          changed();
          return completed(true);
        }
      } else if (target.parentNode === el) {
        targetRect = getRect(target);
        var direction = 0, targetBeforeFirstSwap, differentLevel = dragEl.parentNode !== el, differentRowCol = !_dragElInRowColumn(dragEl.animated && dragEl.toRect || dragRect, target.animated && target.toRect || targetRect, vertical), side1 = vertical ? "top" : "left", scrolledPastTop = isScrolledPast(target, "top", "top") || isScrolledPast(dragEl, "top", "top"), scrollBefore = scrolledPastTop ? scrolledPastTop.scrollTop : undefined;
        if (lastTarget !== target) {
          targetBeforeFirstSwap = targetRect[side1];
          pastFirstInvertThresh = false;
          isCircumstantialInvert = !differentRowCol && options.invertSwap || differentLevel;
        }
        direction = _getSwapDirection(evt, target, targetRect, vertical, differentRowCol ? 1 : options.swapThreshold, options.invertedSwapThreshold == null ? options.swapThreshold : options.invertedSwapThreshold, isCircumstantialInvert, lastTarget === target);
        var sibling;
        if (direction !== 0) {
          var dragIndex = index(dragEl);
          do {
            dragIndex -= direction;
            sibling = parentEl.children[dragIndex];
          } while (sibling && (css(sibling, "display") === "none" || sibling === ghostEl));
        }
        if (direction === 0 || sibling === target) {
          return completed(false);
        }
        lastTarget = target;
        lastDirection = direction;
        var nextSibling = target.nextElementSibling, after = false;
        after = direction === 1;
        var moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, after);
        if (moveVector !== false) {
          if (moveVector === 1 || moveVector === -1) {
            after = moveVector === 1;
          }
          _silent = true;
          setTimeout(_unsilent, 30);
          capture();
          if (after && !nextSibling) {
            el.appendChild(dragEl);
          } else {
            target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
          }
          if (scrolledPastTop) {
            scrollBy(scrolledPastTop, 0, scrollBefore - scrolledPastTop.scrollTop);
          }
          parentEl = dragEl.parentNode;
          if (targetBeforeFirstSwap !== undefined && !isCircumstantialInvert) {
            targetMoveDistance = Math.abs(targetBeforeFirstSwap - getRect(target)[side1]);
          }
          changed();
          return completed(true);
        }
      }
      if (el.contains(dragEl)) {
        return completed(false);
      }
    }
    return false;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function _offMoveEvents() {
    off(document, "mousemove", this._onTouchMove);
    off(document, "touchmove", this._onTouchMove);
    off(document, "pointermove", this._onTouchMove);
    off(document, "dragover", nearestEmptyInsertDetectEvent);
    off(document, "mousemove", nearestEmptyInsertDetectEvent);
    off(document, "touchmove", nearestEmptyInsertDetectEvent);
  },
  _offUpEvents: function _offUpEvents() {
    var ownerDocument = this.el.ownerDocument;
    off(ownerDocument, "mouseup", this._onDrop);
    off(ownerDocument, "touchend", this._onDrop);
    off(ownerDocument, "pointerup", this._onDrop);
    off(ownerDocument, "pointercancel", this._onDrop);
    off(ownerDocument, "touchcancel", this._onDrop);
    off(document, "selectstart", this);
  },
  _onDrop: function _onDrop(evt) {
    var el = this.el, options = this.options;
    newIndex = index(dragEl);
    newDraggableIndex = index(dragEl, options.draggable);
    pluginEvent2("drop", this, {
      evt
    });
    parentEl = dragEl && dragEl.parentNode;
    newIndex = index(dragEl);
    newDraggableIndex = index(dragEl, options.draggable);
    if (Sortable.eventCanceled) {
      this._nulling();
      return;
    }
    awaitingDragStarted = false;
    isCircumstantialInvert = false;
    pastFirstInvertThresh = false;
    clearInterval(this._loopId);
    clearTimeout(this._dragStartTimer);
    _cancelNextTick(this.cloneId);
    _cancelNextTick(this._dragStartId);
    if (this.nativeDraggable) {
      off(document, "drop", this);
      off(el, "dragstart", this._onDragStart);
    }
    this._offMoveEvents();
    this._offUpEvents();
    if (Safari) {
      css(document.body, "user-select", "");
    }
    css(dragEl, "transform", "");
    if (evt) {
      if (moved) {
        evt.cancelable && evt.preventDefault();
        !options.dropBubble && evt.stopPropagation();
      }
      ghostEl && ghostEl.parentNode && ghostEl.parentNode.removeChild(ghostEl);
      if (rootEl === parentEl || putSortable && putSortable.lastPutMode !== "clone") {
        cloneEl && cloneEl.parentNode && cloneEl.parentNode.removeChild(cloneEl);
      }
      if (dragEl) {
        if (this.nativeDraggable) {
          off(dragEl, "dragend", this);
        }
        _disableDraggable(dragEl);
        dragEl.style["will-change"] = "";
        if (moved && !awaitingDragStarted) {
          toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : this.options.ghostClass, false);
        }
        toggleClass(dragEl, this.options.chosenClass, false);
        _dispatchEvent({
          sortable: this,
          name: "unchoose",
          toEl: parentEl,
          newIndex: null,
          newDraggableIndex: null,
          originalEvent: evt
        });
        if (rootEl !== parentEl) {
          if (newIndex >= 0) {
            _dispatchEvent({
              rootEl: parentEl,
              name: "add",
              toEl: parentEl,
              fromEl: rootEl,
              originalEvent: evt
            });
            _dispatchEvent({
              sortable: this,
              name: "remove",
              toEl: parentEl,
              originalEvent: evt
            });
            _dispatchEvent({
              rootEl: parentEl,
              name: "sort",
              toEl: parentEl,
              fromEl: rootEl,
              originalEvent: evt
            });
            _dispatchEvent({
              sortable: this,
              name: "sort",
              toEl: parentEl,
              originalEvent: evt
            });
          }
          putSortable && putSortable.save();
        } else {
          if (newIndex !== oldIndex) {
            if (newIndex >= 0) {
              _dispatchEvent({
                sortable: this,
                name: "update",
                toEl: parentEl,
                originalEvent: evt
              });
              _dispatchEvent({
                sortable: this,
                name: "sort",
                toEl: parentEl,
                originalEvent: evt
              });
            }
          }
        }
        if (Sortable.active) {
          if (newIndex == null || newIndex === -1) {
            newIndex = oldIndex;
            newDraggableIndex = oldDraggableIndex;
          }
          _dispatchEvent({
            sortable: this,
            name: "end",
            toEl: parentEl,
            originalEvent: evt
          });
          this.save();
        }
      }
    }
    this._nulling();
  },
  _nulling: function _nulling() {
    pluginEvent2("nulling", this);
    rootEl = dragEl = parentEl = ghostEl = nextEl = cloneEl = lastDownEl = cloneHidden = tapEvt = touchEvt = moved = newIndex = newDraggableIndex = oldIndex = oldDraggableIndex = lastTarget = lastDirection = putSortable = activeGroup = Sortable.dragged = Sortable.ghost = Sortable.clone = Sortable.active = null;
    var el = this.el;
    savedInputChecked.forEach(function(checkEl) {
      if (el.contains(checkEl)) {
        checkEl.checked = true;
      }
    });
    savedInputChecked.length = lastDx = lastDy = 0;
  },
  handleEvent: function handleEvent(evt) {
    switch (evt.type) {
      case "drop":
      case "dragend":
        this._onDrop(evt);
        break;
      case "dragenter":
      case "dragover":
        if (dragEl) {
          this._onDragOver(evt);
          _globalDragOver(evt);
        }
        break;
      case "selectstart":
        evt.preventDefault();
        break;
    }
  },
  toArray: function toArray() {
    var order = [], el, children = this.el.children, i = 0, n = children.length, options = this.options;
    for (;i < n; i++) {
      el = children[i];
      if (closest(el, options.draggable, this.el, false)) {
        order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
      }
    }
    return order;
  },
  sort: function sort(order, useAnimation) {
    var items = {}, rootEl2 = this.el;
    this.toArray().forEach(function(id, i) {
      var el = rootEl2.children[i];
      if (closest(el, this.options.draggable, rootEl2, false)) {
        items[id] = el;
      }
    }, this);
    useAnimation && this.captureAnimationState();
    order.forEach(function(id) {
      if (items[id]) {
        rootEl2.removeChild(items[id]);
        rootEl2.appendChild(items[id]);
      }
    });
    useAnimation && this.animateAll();
  },
  save: function save() {
    var store = this.options.store;
    store && store.set && store.set(this);
  },
  closest: function closest$1(el, selector) {
    return closest(el, selector || this.options.draggable, this.el, false);
  },
  option: function option(name, value) {
    var options = this.options;
    if (value === undefined) {
      return options[name];
    } else {
      var modifiedValue = PluginManager.modifyOption(this, name, value);
      if (typeof modifiedValue !== "undefined") {
        options[name] = modifiedValue;
      } else {
        options[name] = value;
      }
      if (name === "group") {
        _prepareGroup(options);
      }
    }
  },
  destroy: function destroy() {
    pluginEvent2("destroy", this);
    var el = this.el;
    el[expando] = null;
    off(el, "mousedown", this._onTapStart);
    off(el, "touchstart", this._onTapStart);
    off(el, "pointerdown", this._onTapStart);
    if (this.nativeDraggable) {
      off(el, "dragover", this);
      off(el, "dragenter", this);
    }
    Array.prototype.forEach.call(el.querySelectorAll("[draggable]"), function(el2) {
      el2.removeAttribute("draggable");
    });
    this._onDrop();
    this._disableDelayedDragEvents();
    sortables.splice(sortables.indexOf(this.el), 1);
    this.el = el = null;
  },
  _hideClone: function _hideClone() {
    if (!cloneHidden) {
      pluginEvent2("hideClone", this);
      if (Sortable.eventCanceled)
        return;
      css(cloneEl, "display", "none");
      if (this.options.removeCloneOnHide && cloneEl.parentNode) {
        cloneEl.parentNode.removeChild(cloneEl);
      }
      cloneHidden = true;
    }
  },
  _showClone: function _showClone(putSortable2) {
    if (putSortable2.lastPutMode !== "clone") {
      this._hideClone();
      return;
    }
    if (cloneHidden) {
      pluginEvent2("showClone", this);
      if (Sortable.eventCanceled)
        return;
      if (dragEl.parentNode == rootEl && !this.options.group.revertClone) {
        rootEl.insertBefore(cloneEl, dragEl);
      } else if (nextEl) {
        rootEl.insertBefore(cloneEl, nextEl);
      } else {
        rootEl.appendChild(cloneEl);
      }
      if (this.options.group.revertClone) {
        this.animate(dragEl, cloneEl);
      }
      css(cloneEl, "display", "");
      cloneHidden = false;
    }
  }
};
function _globalDragOver(evt) {
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = "move";
  }
  evt.cancelable && evt.preventDefault();
}
function _onMove(fromEl, toEl, dragEl2, dragRect, targetEl, targetRect, originalEvent, willInsertAfter) {
  var evt, sortable = fromEl[expando], onMoveFn = sortable.options.onMove, retVal;
  if (window.CustomEvent && !IE11OrLess && !Edge) {
    evt = new CustomEvent("move", {
      bubbles: true,
      cancelable: true
    });
  } else {
    evt = document.createEvent("Event");
    evt.initEvent("move", true, true);
  }
  evt.to = toEl;
  evt.from = fromEl;
  evt.dragged = dragEl2;
  evt.draggedRect = dragRect;
  evt.related = targetEl || toEl;
  evt.relatedRect = targetRect || getRect(toEl);
  evt.willInsertAfter = willInsertAfter;
  evt.originalEvent = originalEvent;
  fromEl.dispatchEvent(evt);
  if (onMoveFn) {
    retVal = onMoveFn.call(sortable, evt, originalEvent);
  }
  return retVal;
}
function _disableDraggable(el) {
  el.draggable = false;
}
function _unsilent() {
  _silent = false;
}
function _ghostIsFirst(evt, vertical, sortable) {
  var firstElRect = getRect(getChild(sortable.el, 0, sortable.options, true));
  var childContainingRect = getChildContainingRectFromElement(sortable.el, sortable.options, ghostEl);
  var spacer = 10;
  return vertical ? evt.clientX < childContainingRect.left - spacer || evt.clientY < firstElRect.top && evt.clientX < firstElRect.right : evt.clientY < childContainingRect.top - spacer || evt.clientY < firstElRect.bottom && evt.clientX < firstElRect.left;
}
function _ghostIsLast(evt, vertical, sortable) {
  var lastElRect = getRect(lastChild(sortable.el, sortable.options.draggable));
  var childContainingRect = getChildContainingRectFromElement(sortable.el, sortable.options, ghostEl);
  var spacer = 10;
  return vertical ? evt.clientX > childContainingRect.right + spacer || evt.clientY > lastElRect.bottom && evt.clientX > lastElRect.left : evt.clientY > childContainingRect.bottom + spacer || evt.clientX > lastElRect.right && evt.clientY > lastElRect.top;
}
function _getSwapDirection(evt, target, targetRect, vertical, swapThreshold, invertedSwapThreshold, invertSwap, isLastTarget) {
  var mouseOnAxis = vertical ? evt.clientY : evt.clientX, targetLength = vertical ? targetRect.height : targetRect.width, targetS1 = vertical ? targetRect.top : targetRect.left, targetS2 = vertical ? targetRect.bottom : targetRect.right, invert = false;
  if (!invertSwap) {
    if (isLastTarget && targetMoveDistance < targetLength * swapThreshold) {
      if (!pastFirstInvertThresh && (lastDirection === 1 ? mouseOnAxis > targetS1 + targetLength * invertedSwapThreshold / 2 : mouseOnAxis < targetS2 - targetLength * invertedSwapThreshold / 2)) {
        pastFirstInvertThresh = true;
      }
      if (!pastFirstInvertThresh) {
        if (lastDirection === 1 ? mouseOnAxis < targetS1 + targetMoveDistance : mouseOnAxis > targetS2 - targetMoveDistance) {
          return -lastDirection;
        }
      } else {
        invert = true;
      }
    } else {
      if (mouseOnAxis > targetS1 + targetLength * (1 - swapThreshold) / 2 && mouseOnAxis < targetS2 - targetLength * (1 - swapThreshold) / 2) {
        return _getInsertDirection(target);
      }
    }
  }
  invert = invert || invertSwap;
  if (invert) {
    if (mouseOnAxis < targetS1 + targetLength * invertedSwapThreshold / 2 || mouseOnAxis > targetS2 - targetLength * invertedSwapThreshold / 2) {
      return mouseOnAxis > targetS1 + targetLength / 2 ? 1 : -1;
    }
  }
  return 0;
}
function _getInsertDirection(target) {
  if (index(dragEl) < index(target)) {
    return 1;
  } else {
    return -1;
  }
}
function _generateId(el) {
  var str = el.tagName + el.className + el.src + el.href + el.textContent, i = str.length, sum = 0;
  while (i--) {
    sum += str.charCodeAt(i);
  }
  return sum.toString(36);
}
function _saveInputCheckedState(root) {
  savedInputChecked.length = 0;
  var inputs = root.getElementsByTagName("input");
  var idx = inputs.length;
  while (idx--) {
    var el = inputs[idx];
    el.checked && savedInputChecked.push(el);
  }
}
function _nextTick(fn) {
  return setTimeout(fn, 0);
}
function _cancelNextTick(id) {
  return clearTimeout(id);
}
if (documentExists) {
  on(document, "touchmove", function(evt) {
    if ((Sortable.active || awaitingDragStarted) && evt.cancelable) {
      evt.preventDefault();
    }
  });
}
Sortable.utils = {
  on,
  off,
  css,
  find,
  is: function is(el, selector) {
    return !!closest(el, selector, el, false);
  },
  extend,
  throttle,
  closest,
  toggleClass,
  clone,
  index,
  nextTick: _nextTick,
  cancelNextTick: _cancelNextTick,
  detectDirection: _detectDirection,
  getChild,
  expando
};
Sortable.get = function(element) {
  return element[expando];
};
Sortable.mount = function() {
  for (var _len = arguments.length, plugins2 = new Array(_len), _key = 0;_key < _len; _key++) {
    plugins2[_key] = arguments[_key];
  }
  if (plugins2[0].constructor === Array)
    plugins2 = plugins2[0];
  plugins2.forEach(function(plugin) {
    if (!plugin.prototype || !plugin.prototype.constructor) {
      throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(plugin));
    }
    if (plugin.utils)
      Sortable.utils = _objectSpread2(_objectSpread2({}, Sortable.utils), plugin.utils);
    PluginManager.mount(plugin);
  });
};
Sortable.create = function(el, options) {
  return new Sortable(el, options);
};
Sortable.version = version;
var autoScrolls = [];
var scrollEl;
var scrollRootEl;
var scrolling = false;
var lastAutoScrollX;
var lastAutoScrollY;
var touchEvt$1;
var pointerElemChangedInterval;
function AutoScrollPlugin() {
  function AutoScroll() {
    this.defaults = {
      scroll: true,
      forceAutoScrollFallback: false,
      scrollSensitivity: 30,
      scrollSpeed: 10,
      bubbleScroll: true
    };
    for (var fn in this) {
      if (fn.charAt(0) === "_" && typeof this[fn] === "function") {
        this[fn] = this[fn].bind(this);
      }
    }
  }
  AutoScroll.prototype = {
    dragStarted: function dragStarted(_ref) {
      var originalEvent = _ref.originalEvent;
      if (this.sortable.nativeDraggable) {
        on(document, "dragover", this._handleAutoScroll);
      } else {
        if (this.options.supportPointer) {
          on(document, "pointermove", this._handleFallbackAutoScroll);
        } else if (originalEvent.touches) {
          on(document, "touchmove", this._handleFallbackAutoScroll);
        } else {
          on(document, "mousemove", this._handleFallbackAutoScroll);
        }
      }
    },
    dragOverCompleted: function dragOverCompleted(_ref2) {
      var originalEvent = _ref2.originalEvent;
      if (!this.options.dragOverBubble && !originalEvent.rootEl) {
        this._handleAutoScroll(originalEvent);
      }
    },
    drop: function drop() {
      if (this.sortable.nativeDraggable) {
        off(document, "dragover", this._handleAutoScroll);
      } else {
        off(document, "pointermove", this._handleFallbackAutoScroll);
        off(document, "touchmove", this._handleFallbackAutoScroll);
        off(document, "mousemove", this._handleFallbackAutoScroll);
      }
      clearPointerElemChangedInterval();
      clearAutoScrolls();
      cancelThrottle();
    },
    nulling: function nulling() {
      touchEvt$1 = scrollRootEl = scrollEl = scrolling = pointerElemChangedInterval = lastAutoScrollX = lastAutoScrollY = null;
      autoScrolls.length = 0;
    },
    _handleFallbackAutoScroll: function _handleFallbackAutoScroll(evt) {
      this._handleAutoScroll(evt, true);
    },
    _handleAutoScroll: function _handleAutoScroll(evt, fallback) {
      var _this = this;
      var x = (evt.touches ? evt.touches[0] : evt).clientX, y = (evt.touches ? evt.touches[0] : evt).clientY, elem = document.elementFromPoint(x, y);
      touchEvt$1 = evt;
      if (fallback || this.options.forceAutoScrollFallback || Edge || IE11OrLess || Safari) {
        autoScroll(evt, this.options, elem, fallback);
        var ogElemScroller = getParentAutoScrollElement(elem, true);
        if (scrolling && (!pointerElemChangedInterval || x !== lastAutoScrollX || y !== lastAutoScrollY)) {
          pointerElemChangedInterval && clearPointerElemChangedInterval();
          pointerElemChangedInterval = setInterval(function() {
            var newElem = getParentAutoScrollElement(document.elementFromPoint(x, y), true);
            if (newElem !== ogElemScroller) {
              ogElemScroller = newElem;
              clearAutoScrolls();
            }
            autoScroll(evt, _this.options, newElem, fallback);
          }, 10);
          lastAutoScrollX = x;
          lastAutoScrollY = y;
        }
      } else {
        if (!this.options.bubbleScroll || getParentAutoScrollElement(elem, true) === getWindowScrollingElement()) {
          clearAutoScrolls();
          return;
        }
        autoScroll(evt, this.options, getParentAutoScrollElement(elem, false), false);
      }
    }
  };
  return _extends(AutoScroll, {
    pluginName: "scroll",
    initializeByDefault: true
  });
}
function clearAutoScrolls() {
  autoScrolls.forEach(function(autoScroll) {
    clearInterval(autoScroll.pid);
  });
  autoScrolls = [];
}
function clearPointerElemChangedInterval() {
  clearInterval(pointerElemChangedInterval);
}
var autoScroll = throttle(function(evt, options, rootEl2, isFallback) {
  if (!options.scroll)
    return;
  var x = (evt.touches ? evt.touches[0] : evt).clientX, y = (evt.touches ? evt.touches[0] : evt).clientY, sens = options.scrollSensitivity, speed = options.scrollSpeed, winScroller = getWindowScrollingElement();
  var scrollThisInstance = false, scrollCustomFn;
  if (scrollRootEl !== rootEl2) {
    scrollRootEl = rootEl2;
    clearAutoScrolls();
    scrollEl = options.scroll;
    scrollCustomFn = options.scrollFn;
    if (scrollEl === true) {
      scrollEl = getParentAutoScrollElement(rootEl2, true);
    }
  }
  var layersOut = 0;
  var currentParent = scrollEl;
  do {
    var el = currentParent, rect = getRect(el), top = rect.top, bottom = rect.bottom, left = rect.left, right = rect.right, width = rect.width, height = rect.height, canScrollX = undefined, canScrollY = undefined, scrollWidth = el.scrollWidth, scrollHeight = el.scrollHeight, elCSS = css(el), scrollPosX = el.scrollLeft, scrollPosY = el.scrollTop;
    if (el === winScroller) {
      canScrollX = width < scrollWidth && (elCSS.overflowX === "auto" || elCSS.overflowX === "scroll" || elCSS.overflowX === "visible");
      canScrollY = height < scrollHeight && (elCSS.overflowY === "auto" || elCSS.overflowY === "scroll" || elCSS.overflowY === "visible");
    } else {
      canScrollX = width < scrollWidth && (elCSS.overflowX === "auto" || elCSS.overflowX === "scroll");
      canScrollY = height < scrollHeight && (elCSS.overflowY === "auto" || elCSS.overflowY === "scroll");
    }
    var vx = canScrollX && (Math.abs(right - x) <= sens && scrollPosX + width < scrollWidth) - (Math.abs(left - x) <= sens && !!scrollPosX);
    var vy = canScrollY && (Math.abs(bottom - y) <= sens && scrollPosY + height < scrollHeight) - (Math.abs(top - y) <= sens && !!scrollPosY);
    if (!autoScrolls[layersOut]) {
      for (var i = 0;i <= layersOut; i++) {
        if (!autoScrolls[i]) {
          autoScrolls[i] = {};
        }
      }
    }
    if (autoScrolls[layersOut].vx != vx || autoScrolls[layersOut].vy != vy || autoScrolls[layersOut].el !== el) {
      autoScrolls[layersOut].el = el;
      autoScrolls[layersOut].vx = vx;
      autoScrolls[layersOut].vy = vy;
      clearInterval(autoScrolls[layersOut].pid);
      if (vx != 0 || vy != 0) {
        scrollThisInstance = true;
        autoScrolls[layersOut].pid = setInterval(function() {
          if (isFallback && this.layer === 0) {
            Sortable.active._onTouchMove(touchEvt$1);
          }
          var scrollOffsetY = autoScrolls[this.layer].vy ? autoScrolls[this.layer].vy * speed : 0;
          var scrollOffsetX = autoScrolls[this.layer].vx ? autoScrolls[this.layer].vx * speed : 0;
          if (typeof scrollCustomFn === "function") {
            if (scrollCustomFn.call(Sortable.dragged.parentNode[expando], scrollOffsetX, scrollOffsetY, evt, touchEvt$1, autoScrolls[this.layer].el) !== "continue") {
              return;
            }
          }
          scrollBy(autoScrolls[this.layer].el, scrollOffsetX, scrollOffsetY);
        }.bind({
          layer: layersOut
        }), 24);
      }
    }
    layersOut++;
  } while (options.bubbleScroll && currentParent !== winScroller && (currentParent = getParentAutoScrollElement(currentParent, false)));
  scrolling = scrollThisInstance;
}, 30);
var drop = function drop2(_ref) {
  var { originalEvent, putSortable: putSortable2, dragEl: dragEl2, activeSortable, dispatchSortableEvent, hideGhostForTarget, unhideGhostForTarget } = _ref;
  if (!originalEvent)
    return;
  var toSortable = putSortable2 || activeSortable;
  hideGhostForTarget();
  var touch = originalEvent.changedTouches && originalEvent.changedTouches.length ? originalEvent.changedTouches[0] : originalEvent;
  var target = document.elementFromPoint(touch.clientX, touch.clientY);
  unhideGhostForTarget();
  if (toSortable && !toSortable.el.contains(target)) {
    dispatchSortableEvent("spill");
    this.onSpill({
      dragEl: dragEl2,
      putSortable: putSortable2
    });
  }
};
function Revert() {}
Revert.prototype = {
  startIndex: null,
  dragStart: function dragStart(_ref2) {
    var oldDraggableIndex2 = _ref2.oldDraggableIndex;
    this.startIndex = oldDraggableIndex2;
  },
  onSpill: function onSpill(_ref3) {
    var { dragEl: dragEl2, putSortable: putSortable2 } = _ref3;
    this.sortable.captureAnimationState();
    if (putSortable2) {
      putSortable2.captureAnimationState();
    }
    var nextSibling = getChild(this.sortable.el, this.startIndex, this.options);
    if (nextSibling) {
      this.sortable.el.insertBefore(dragEl2, nextSibling);
    } else {
      this.sortable.el.appendChild(dragEl2);
    }
    this.sortable.animateAll();
    if (putSortable2) {
      putSortable2.animateAll();
    }
  },
  drop
};
_extends(Revert, {
  pluginName: "revertOnSpill"
});
function Remove() {}
Remove.prototype = {
  onSpill: function onSpill2(_ref4) {
    var { dragEl: dragEl2, putSortable: putSortable2 } = _ref4;
    var parentSortable = putSortable2 || this.sortable;
    parentSortable.captureAnimationState();
    dragEl2.parentNode && dragEl2.parentNode.removeChild(dragEl2);
    parentSortable.animateAll();
  },
  drop
};
_extends(Remove, {
  pluginName: "removeOnSpill"
});
Sortable.mount(new AutoScrollPlugin);
Sortable.mount(Remove, Revert);
var sortable_esm_default = Sortable;

// src/prompt-templates.ts
var SCENEMAP_PROMPT_MACROS = [
  { token: "{{scenemap_context}}", description: "Character, persona, scenario and active World Info, with separators." },
  { token: "{{scenemap_character}}", description: "Character description and personality." },
  { token: "{{scenemap_persona}}", description: "Active persona description." },
  { token: "{{scenemap_scenario}}", description: "Character scenario." },
  { token: "{{scenemap_world_info}}", description: "Active World Book entries." },
  { token: "{{scenemap_chat_history::N}}", description: "Last N messages in chronological order, separated by a blank line. Omit ::N for all." },
  { token: "{{scenemap_schema}}", description: "Configured tracker schema." },
  { token: "{{scenemap_response_schema}}", description: "Schema expected for this operation, including partial regeneration." },
  { token: "{{scenemap_previous_tracker}}", description: "Tracker used as the continuity baseline." },
  { token: "{{scenemap_example_response}}", description: "Automatically generated schema example." },
  { token: "{{scenemap_example_section}}", description: "Complete example section, or empty when no valid example is available." },
  { token: "{{scenemap_mode}}", description: 'Current operation: "full" or "partial".' },
  { token: "{{scenemap_selected_fields}}", description: "Fields selected for partial regeneration, otherwise empty." },
  { token: "{{scenemap_feedback}}", description: "Optional user feedback supplied for partial regeneration, otherwise empty." },
  { token: "{{scenemap_partial_task}}", description: "Partial-regeneration contract, otherwise empty." }
];
var LEGACY_SCENEMAP_PROMPT_MACROS = [
  { token: "{{schema}}", description: "Legacy alias for {{scenemap_schema}}." },
  { token: "{{previous_tracker}}", description: "Legacy alias for {{scenemap_previous_tracker}}." },
  { token: "{{example_response}}", description: "Legacy alias for {{scenemap_example_response}}." },
  { token: "{{example_section}}", description: "Legacy alias for {{scenemap_example_section}}." }
];
function chatHistoryMacro(limit) {
  return limit > 0 ? `{{scenemap_chat_history::${Math.floor(limit)}}}` : "{{scenemap_chat_history}}";
}

// src/shared.ts
var DEFAULT_SCHEMA_VALUE = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SceneTracker",
  description: "Schema for tracking roleplay scene details",
  type: "object",
  properties: {
    time: {
      type: "string",
      description: "Format: HH:MM:SS; MM/DD/YYYY (Day Name)"
    },
    location: {
      type: "string",
      description: "Specific scene location with increasing specificity"
    },
    weather: {
      type: "string",
      description: "Current weather conditions and temperature"
    },
    topics: {
      type: "object",
      properties: {
        primaryTopic: {
          type: "string",
          description: "1-2 word main topic of interaction"
        },
        emotionalTone: {
          type: "string",
          description: "Dominant emotional tone of scene"
        },
        interactionTheme: {
          type: "string",
          description: "Type of character interaction"
        }
      },
      required: ["primaryTopic", "emotionalTone", "interactionTheme"]
    },
    charactersPresent: {
      type: "array",
      items: {
        type: "string",
        description: "Character name"
      },
      description: "List of character names present in scene"
    },
    characters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Character name"
          },
          hair: {
            type: "string",
            description: "Hairstyle and condition"
          },
          makeup: {
            type: "string",
            description: "Makeup description or 'None'"
          },
          outfit: {
            type: "string",
            description: "Complete outfit including underwear"
          },
          stateOfDress: {
            type: "string",
            description: "How put-together/disheveled character appears"
          },
          postureAndInteraction: {
            type: "string",
            description: "Character's physical positioning and interaction"
          }
        },
        required: ["name", "hair", "makeup", "outfit", "stateOfDress", "postureAndInteraction"]
      },
      description: "Array of character objects"
    }
  },
  required: ["time", "location", "weather", "topics", "charactersPresent", "characters"]
};
var DEFAULT_DISPLAY_LAYOUT = {
  sections: [
    {
      title: "Scene",
      fields: [
        { path: "location", label: "Location", display: "text" },
        { path: "time", label: "Time", display: "subtle" },
        { path: "weather", label: "Weather", display: "text" }
      ]
    },
    {
      title: "Topics",
      fields: [
        { path: "topics.primaryTopic", label: "Primary Topic", display: "text" },
        { path: "topics.emotionalTone", label: "Emotional Tone", display: "subtle" },
        { path: "topics.interactionTheme", label: "Interaction Theme", display: "subtle" }
      ]
    },
    {
      title: "Present",
      fields: [{ path: "charactersPresent", label: "Characters", display: "chips" }]
    },
    {
      title: "Characters",
      fields: [
        {
          path: "characters",
          label: "Characters",
          display: "character_cards",
          fields: [
            { path: "outfit", label: "Outfit", display: "text" },
            { path: "stateOfDress", label: "State Of Dress", display: "subtle" },
            { path: "postureAndInteraction", label: "Posture And Interaction", display: "mono" },
            { path: "hair", label: "Hair", display: "subtle" },
            { path: "makeup", label: "Makeup", display: "subtle" }
          ]
        }
      ]
    }
  ]
};
var DEFAULT_PROMPT_JSON = `You are a highly specialized AI assistant. Your SOLE purpose is to generate a single, valid JSON object that strictly adheres to the provided JSON schema.

CRITICAL INSTRUCTIONS:
1. You MUST wrap the entire JSON object in a markdown code block (\`\`\`json\\n...\\n\`\`\`).
2. Your response MUST NOT contain explanatory text, comments, or any content outside this single code block.
3. The JSON object inside the code block MUST be valid and conform to the schema.

JSON SCHEMA TO FOLLOW:
\`\`\`json
{{scenemap_response_schema}}
\`\`\`

PREVIOUS TRACKER TO UPDATE:
If this object is not empty, use it as the baseline and update it instead of starting from scratch. Preserve unchanged fields unless recent chat messages clearly changed them.
\`\`\`json
{{scenemap_previous_tracker}}
\`\`\`

{{scenemap_example_section}}`;
var DEFAULT_SYSTEM_PROMPT = "{{scenemap_context}}";
var DEFAULT_USER_PROMPT = `{{scenemap_chat_history}}

>>> Instructions <<<
${DEFAULT_PROMPT_JSON}

{{scenemap_partial_task}}`;
var defaultSettings = {
  version: "1.0.1",
  formatVersion: "F_1.0",
  connectionId: "",
  maxResponseTokens: 16000,
  temperature: null,
  topP: null,
  autoGenerateAiTrackers: false,
  autoGenerateInterval: 1,
  showInputBarButton: true,
  showTopToolbarButton: false,
  trackerPlacement: "dock",
  schemaPreset: "default",
  schemaPresets: {
    default: {
      name: "Default",
      value: DEFAULT_SCHEMA_VALUE,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      userPrompt: DEFAULT_USER_PROMPT
    }
  },
  includeLastXMessages: 0,
  promptJson: DEFAULT_PROMPT_JSON,
  displayLayout: DEFAULT_DISPLAY_LAYOUT
};
function cloneDefaultSettings() {
  return JSON.parse(JSON.stringify(defaultSettings));
}
function mergeSettings(value) {
  const base = cloneDefaultSettings();
  if (!value || typeof value !== "object")
    return base;
  const currentValue = { ...value };
  delete currentValue.showMessageButtons;
  const mergedPresets = {
    ...base.schemaPresets,
    ...currentValue.schemaPresets ?? {}
  };
  const legacyPrompt = typeof currentValue.promptJson === "string" ? currentValue.promptJson : base.promptJson;
  const legacyHistoryLimit = typeof currentValue.includeLastXMessages === "number" && Number.isFinite(currentValue.includeLastXMessages) ? Math.max(0, Math.floor(currentValue.includeLastXMessages)) : base.includeLastXMessages;
  const schemaPresets = Object.fromEntries(Object.entries(mergedPresets).map(([key, preset]) => {
    const presetLegacyPrompt = typeof preset.promptJson === "string" ? preset.promptJson : legacyPrompt;
    return [key, {
      ...preset,
      systemPrompt: typeof preset.systemPrompt === "string" ? preset.systemPrompt : DEFAULT_SYSTEM_PROMPT,
      userPrompt: typeof preset.userPrompt === "string" ? preset.userPrompt : migrateLegacyUserPrompt(presetLegacyPrompt, legacyHistoryLimit)
    }];
  }));
  return {
    ...base,
    ...currentValue,
    autoGenerateInterval: typeof currentValue.autoGenerateInterval === "number" && Number.isFinite(currentValue.autoGenerateInterval) ? Math.max(1, Math.floor(currentValue.autoGenerateInterval)) : base.autoGenerateInterval,
    maxResponseTokens: typeof currentValue.maxResponseTokens === "number" && Number.isFinite(currentValue.maxResponseTokens) ? Math.max(1, Math.floor(currentValue.maxResponseTokens)) : base.maxResponseTokens,
    temperature: typeof currentValue.temperature === "number" && Number.isFinite(currentValue.temperature) ? resolveSamplingParameter(currentValue.temperature, 0, 2) : base.temperature,
    topP: typeof currentValue.topP === "number" && Number.isFinite(currentValue.topP) ? resolveSamplingParameter(currentValue.topP, 0, 1) : base.topP,
    includeLastXMessages: typeof currentValue.includeLastXMessages === "number" && Number.isFinite(currentValue.includeLastXMessages) ? Math.max(0, Math.floor(currentValue.includeLastXMessages)) : base.includeLastXMessages,
    showTopToolbarButton: typeof currentValue.showTopToolbarButton === "boolean" ? currentValue.showTopToolbarButton : base.showTopToolbarButton,
    trackerPlacement: currentValue.trackerPlacement === "drawer" ? "drawer" : "dock",
    schemaPresets,
    displayLayout: currentValue.displayLayout?.sections?.length ? currentValue.displayLayout : base.displayLayout
  };
}
function getPresetPrompt(settings, presetKey = settings.schemaPreset) {
  const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  return typeof preset?.promptJson === "string" ? preset.promptJson : settings.promptJson;
}
function getPresetSystemPrompt(settings, presetKey = settings.schemaPreset) {
  const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  return typeof preset?.systemPrompt === "string" ? preset.systemPrompt : DEFAULT_SYSTEM_PROMPT;
}
function getPresetUserPrompt(settings, presetKey = settings.schemaPreset) {
  const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  if (typeof preset?.userPrompt === "string")
    return preset.userPrompt;
  return migrateLegacyUserPrompt(getPresetPrompt(settings, presetKey), settings.includeLastXMessages);
}
function migrateLegacyUserPrompt(prompt, includeLastXMessages) {
  return `${chatHistoryMacro(includeLastXMessages)}

>>> Instructions <<<
${prompt}

{{scenemap_partial_task}}`;
}
function getPresetLayout(settings, presetKey = settings.schemaPreset) {
  const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  return preset?.displayLayout?.sections?.length ? preset.displayLayout : settings.displayLayout;
}
function resolveSamplingParameter(value, minimum, maximum, fallback = 1) {
  const resolved = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(maximum, Math.max(minimum, resolved));
}
function jsonValuesEqual(left, right) {
  if (Object.is(left, right))
    return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index2) => jsonValuesEqual(value, right[index2]));
  }
  if (!left || !right || typeof left !== "object" || typeof right !== "object")
    return false;
  const leftRecord = left;
  const rightRecord = right;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);
  return leftKeys.length === rightKeys.length && leftKeys.every((key) => Object.prototype.hasOwnProperty.call(rightRecord, key) && jsonValuesEqual(leftRecord[key], rightRecord[key]));
}
function schemaFingerprint(schema) {
  const text = stableJsonStringify(schema);
  let hash = 2166136261;
  for (let index2 = 0;index2 < text.length; index2 += 1) {
    hash ^= text.charCodeAt(index2);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
function stableJsonStringify(value) {
  if (Array.isArray(value))
    return `[${value.map(stableJsonStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, child]) => child !== undefined).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${stableJsonStringify(child)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
function humanizeTrackerKey(key) {
  return key.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim().replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}
function formatPrimitive(value) {
  if (value === null || value === undefined)
    return "";
  if (typeof value === "string")
    return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}

// src/settings-draft.ts
class SettingsDraftTracker {
  currentFingerprint = null;
  savedFingerprint = null;
  pendingSave = null;
  get dirty() {
    return this.currentFingerprint !== null && this.currentFingerprint !== this.savedFingerprint;
  }
  get saving() {
    return this.pendingSave !== null;
  }
  get initialized() {
    return this.currentFingerprint !== null;
  }
  initialize(fingerprint) {
    if (this.initialized)
      return;
    this.currentFingerprint = fingerprint;
    this.savedFingerprint = fingerprint;
  }
  update(fingerprint) {
    this.currentFingerprint = fingerprint;
  }
  synchronize(fingerprint) {
    if (this.pendingSave || this.dirty)
      return;
    this.currentFingerprint = fingerprint;
    this.savedFingerprint = fingerprint;
  }
  beginSave(requestId) {
    if (this.pendingSave)
      return false;
    this.pendingSave = { requestId, fingerprint: this.currentFingerprint };
    return true;
  }
  acknowledge(requestId) {
    if (this.pendingSave?.requestId !== requestId)
      return false;
    if (this.pendingSave.fingerprint !== null)
      this.savedFingerprint = this.pendingSave.fingerprint;
    this.pendingSave = null;
    return true;
  }
  fail(requestId) {
    if (this.pendingSave?.requestId !== requestId)
      return false;
    this.pendingSave = null;
    return true;
  }
  reset() {
    this.currentFingerprint = null;
    this.savedFingerprint = null;
    this.pendingSave = null;
  }
}

// src/automatic-settings-draft.ts
class AutomaticSettingsDraftTracker {
  pending = {};
  inFlight = new Map;
  queue(key, value) {
    this.pending[key] = value;
  }
  begin(requestId) {
    if (Object.keys(this.pending).length === 0)
      return null;
    const patch = this.pending;
    this.pending = {};
    this.inFlight.set(requestId, patch);
    return patch;
  }
  acknowledge(requestId) {
    return this.inFlight.delete(requestId);
  }
  fail(requestId) {
    const patch = this.inFlight.get(requestId);
    if (!patch)
      return false;
    this.inFlight.delete(requestId);
    this.pending = { ...patch, ...this.pending };
    return true;
  }
  overlay(value) {
    let merged = { ...value };
    for (const patch of this.inFlight.values())
      merged = { ...merged, ...patch };
    return { ...merged, ...this.pending };
  }
  reset() {
    this.pending = {};
    this.inFlight.clear();
  }
}

// node_modules/@cfworker/json-schema/dist/deep-compare-strict.js
function deepCompareStrict(a, b) {
  const typeofa = typeof a;
  if (typeofa !== typeof b) {
    return false;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) {
      return false;
    }
    const length = a.length;
    if (length !== b.length) {
      return false;
    }
    for (let i = 0;i < length; i++) {
      if (!deepCompareStrict(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  if (typeofa === "object") {
    if (!a || !b) {
      return a === b;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    const length = aKeys.length;
    if (length !== bKeys.length) {
      return false;
    }
    for (const k of aKeys) {
      if (!deepCompareStrict(a[k], b[k])) {
        return false;
      }
    }
    return true;
  }
  return a === b;
}

// node_modules/@cfworker/json-schema/dist/pointer.js
function encodePointer(p) {
  return encodeURI(escapePointer(p));
}
function escapePointer(p) {
  return p.replace(/~/g, "~0").replace(/\//g, "~1");
}

// node_modules/@cfworker/json-schema/dist/dereference.js
var schemaArrayKeyword = {
  prefixItems: true,
  items: true,
  allOf: true,
  anyOf: true,
  oneOf: true
};
var schemaMapKeyword = {
  $defs: true,
  definitions: true,
  properties: true,
  patternProperties: true,
  dependentSchemas: true
};
var ignoredKeyword = {
  id: true,
  $id: true,
  $ref: true,
  $schema: true,
  $anchor: true,
  $vocabulary: true,
  $comment: true,
  default: true,
  enum: true,
  const: true,
  required: true,
  type: true,
  maximum: true,
  minimum: true,
  exclusiveMaximum: true,
  exclusiveMinimum: true,
  multipleOf: true,
  maxLength: true,
  minLength: true,
  pattern: true,
  format: true,
  maxItems: true,
  minItems: true,
  uniqueItems: true,
  maxProperties: true,
  minProperties: true
};
var initialBaseURI = typeof self !== "undefined" && self.location && self.location.origin !== "null" ? new URL(self.location.origin + self.location.pathname + location.search) : new URL("https://github.com/cfworker");
function dereference(schema, lookup = Object.create(null), baseURI = initialBaseURI, basePointer = "") {
  if (schema && typeof schema === "object" && !Array.isArray(schema)) {
    const id = schema.$id || schema.id;
    if (id) {
      const url = new URL(id, baseURI.href);
      if (url.hash.length > 1) {
        lookup[url.href] = schema;
      } else {
        url.hash = "";
        if (basePointer === "") {
          baseURI = url;
        } else {
          dereference(schema, lookup, baseURI);
        }
      }
    }
  } else if (schema !== true && schema !== false) {
    return lookup;
  }
  const schemaURI = baseURI.href + (basePointer ? "#" + basePointer : "");
  if (lookup[schemaURI] !== undefined) {
    throw new Error(`Duplicate schema URI "${schemaURI}".`);
  }
  lookup[schemaURI] = schema;
  if (schema === true || schema === false) {
    return lookup;
  }
  if (schema.__absolute_uri__ === undefined) {
    Object.defineProperty(schema, "__absolute_uri__", {
      enumerable: false,
      value: schemaURI
    });
  }
  if (schema.$ref && schema.__absolute_ref__ === undefined) {
    const url = new URL(schema.$ref, baseURI.href);
    url.hash = url.hash;
    Object.defineProperty(schema, "__absolute_ref__", {
      enumerable: false,
      value: url.href
    });
  }
  if (schema.$recursiveRef && schema.__absolute_recursive_ref__ === undefined) {
    const url = new URL(schema.$recursiveRef, baseURI.href);
    url.hash = url.hash;
    Object.defineProperty(schema, "__absolute_recursive_ref__", {
      enumerable: false,
      value: url.href
    });
  }
  if (schema.$anchor) {
    const url = new URL("#" + schema.$anchor, baseURI.href);
    lookup[url.href] = schema;
  }
  for (let key in schema) {
    if (ignoredKeyword[key]) {
      continue;
    }
    const keyBase = `${basePointer}/${encodePointer(key)}`;
    const subSchema = schema[key];
    if (Array.isArray(subSchema)) {
      if (schemaArrayKeyword[key]) {
        const length = subSchema.length;
        for (let i = 0;i < length; i++) {
          dereference(subSchema[i], lookup, baseURI, `${keyBase}/${i}`);
        }
      }
    } else if (schemaMapKeyword[key]) {
      for (let subKey in subSchema) {
        dereference(subSchema[subKey], lookup, baseURI, `${keyBase}/${encodePointer(subKey)}`);
      }
    } else {
      dereference(subSchema, lookup, baseURI, keyBase);
    }
  }
  return lookup;
}

// node_modules/@cfworker/json-schema/dist/format.js
var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
var HOSTNAME = /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i;
var URIREF = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
var URITEMPLATE = /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
var URL_ = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u{00a1}-\u{ffff}0-9]+-?)*[a-z\u{00a1}-\u{ffff}0-9]+)(?:\.(?:[a-z\u{00a1}-\u{ffff}0-9]+-?)*[a-z\u{00a1}-\u{ffff}0-9]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;
var UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
var JSON_POINTER = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
var JSON_POINTER_URI_FRAGMENT = /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i;
var RELATIVE_JSON_POINTER = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;
var FASTDATE = /^\d\d\d\d-[0-1]\d-[0-3]\d$/;
var FASTTIME = /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i;
var FASTDATETIME = /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i;
var FASTURIREFERENCE = /^(?:(?:[a-z][a-z0-9+-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i;
var EMAIL = (input) => {
  if (input[0] === '"')
    return false;
  const [name, host, ...rest] = input.split("@");
  if (!name || !host || rest.length !== 0 || name.length > 64 || host.length > 253)
    return false;
  if (name[0] === "." || name.endsWith(".") || name.includes(".."))
    return false;
  if (!/^[a-z0-9.-]+$/i.test(host) || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(name))
    return false;
  return host.split(".").every((part) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(part));
};
var IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
var IPV6 = /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i;
var DURATION = (input) => input.length > 1 && input.length < 80 && (/^P\d+([.,]\d+)?W$/.test(input) || /^P[\dYMDTHS]*(\d[.,]\d+)?[YMDHS]$/.test(input) && /^P([.,\d]+Y)?([.,\d]+M)?([.,\d]+D)?(T([.,\d]+H)?([.,\d]+M)?([.,\d]+S)?)?$/.test(input));
function bind(r) {
  return r.test.bind(r);
}
var fullFormat = {
  date,
  time: time.bind(undefined, false),
  "date-time": date_time,
  duration: DURATION,
  uri,
  "uri-reference": bind(URIREF),
  "uri-template": bind(URITEMPLATE),
  url: bind(URL_),
  email: EMAIL,
  hostname: bind(HOSTNAME),
  ipv4: bind(IPV4),
  ipv6: bind(IPV6),
  regex,
  uuid: bind(UUID),
  "json-pointer": bind(JSON_POINTER),
  "json-pointer-uri-fragment": bind(JSON_POINTER_URI_FRAGMENT),
  "relative-json-pointer": bind(RELATIVE_JSON_POINTER)
};
var fastFormat = {
  ...fullFormat,
  date: bind(FASTDATE),
  time: bind(FASTTIME),
  "date-time": bind(FASTDATETIME),
  "uri-reference": bind(FASTURIREFERENCE)
};
function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function date(str) {
  const matches2 = str.match(DATE);
  if (!matches2)
    return false;
  const year = +matches2[1];
  const month = +matches2[2];
  const day = +matches2[3];
  return month >= 1 && month <= 12 && day >= 1 && day <= (month == 2 && isLeapYear(year) ? 29 : DAYS[month]);
}
function time(full, str) {
  const matches2 = str.match(TIME);
  if (!matches2)
    return false;
  const hour = +matches2[1];
  const minute = +matches2[2];
  const second = +matches2[3];
  const timeZone = !!matches2[5];
  return (hour <= 23 && minute <= 59 && second <= 59 || hour == 23 && minute == 59 && second == 60) && (!full || timeZone);
}
var DATE_TIME_SEPARATOR = /t|\s/i;
function date_time(str) {
  const dateTime = str.split(DATE_TIME_SEPARATOR);
  return dateTime.length == 2 && date(dateTime[0]) && time(true, dateTime[1]);
}
var NOT_URI_FRAGMENT = /\/|:/;
var URI_PATTERN = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
function uri(str) {
  return NOT_URI_FRAGMENT.test(str) && URI_PATTERN.test(str);
}
var Z_ANCHOR = /[^\\]\\Z/;
function regex(str) {
  if (Z_ANCHOR.test(str))
    return false;
  try {
    new RegExp(str, "u");
    return true;
  } catch (e) {
    return false;
  }
}

// node_modules/@cfworker/json-schema/dist/ucs2-length.js
function ucs2length(s) {
  let result = 0;
  let length = s.length;
  let index2 = 0;
  let charCode;
  while (index2 < length) {
    result++;
    charCode = s.charCodeAt(index2++);
    if (charCode >= 55296 && charCode <= 56319 && index2 < length) {
      charCode = s.charCodeAt(index2);
      if ((charCode & 64512) == 56320) {
        index2++;
      }
    }
  }
  return result;
}

// node_modules/@cfworker/json-schema/dist/validate.js
function validate(instance, schema, draft = "2019-09", lookup = dereference(schema), shortCircuit = true, recursiveAnchor = null, instanceLocation = "#", schemaLocation = "#", evaluated = Object.create(null)) {
  if (schema === true) {
    return { valid: true, errors: [] };
  }
  if (schema === false) {
    return {
      valid: false,
      errors: [
        {
          instanceLocation,
          keyword: "false",
          keywordLocation: instanceLocation,
          error: "False boolean schema."
        }
      ]
    };
  }
  const rawInstanceType = typeof instance;
  let instanceType;
  switch (rawInstanceType) {
    case "boolean":
    case "number":
    case "string":
      instanceType = rawInstanceType;
      break;
    case "object":
      if (instance === null) {
        instanceType = "null";
      } else if (Array.isArray(instance)) {
        instanceType = "array";
      } else {
        instanceType = "object";
      }
      break;
    default:
      throw new Error(`Instances of "${rawInstanceType}" type are not supported.`);
  }
  const { $ref, $recursiveRef, $recursiveAnchor, type: $type, const: $const, enum: $enum, required: $required, not: $not, anyOf: $anyOf, allOf: $allOf, oneOf: $oneOf, if: $if, then: $then, else: $else, format: $format, properties: $properties, patternProperties: $patternProperties, additionalProperties: $additionalProperties, unevaluatedProperties: $unevaluatedProperties, minProperties: $minProperties, maxProperties: $maxProperties, propertyNames: $propertyNames, dependentRequired: $dependentRequired, dependentSchemas: $dependentSchemas, dependencies: $dependencies, prefixItems: $prefixItems, items: $items, additionalItems: $additionalItems, unevaluatedItems: $unevaluatedItems, contains: $contains, minContains: $minContains, maxContains: $maxContains, minItems: $minItems, maxItems: $maxItems, uniqueItems: $uniqueItems, minimum: $minimum, maximum: $maximum, exclusiveMinimum: $exclusiveMinimum, exclusiveMaximum: $exclusiveMaximum, multipleOf: $multipleOf, minLength: $minLength, maxLength: $maxLength, pattern: $pattern, __absolute_ref__, __absolute_recursive_ref__ } = schema;
  const errors = [];
  if ($recursiveAnchor === true && recursiveAnchor === null) {
    recursiveAnchor = schema;
  }
  if ($recursiveRef === "#") {
    const refSchema = recursiveAnchor === null ? lookup[__absolute_recursive_ref__] : recursiveAnchor;
    const keywordLocation = `${schemaLocation}/$recursiveRef`;
    const result = validate(instance, recursiveAnchor === null ? schema : recursiveAnchor, draft, lookup, shortCircuit, refSchema, instanceLocation, keywordLocation, evaluated);
    if (!result.valid) {
      errors.push({
        instanceLocation,
        keyword: "$recursiveRef",
        keywordLocation,
        error: "A subschema had errors."
      }, ...result.errors);
    }
  }
  if ($ref !== undefined) {
    const uri2 = __absolute_ref__ || $ref;
    const refSchema = lookup[uri2];
    if (refSchema === undefined) {
      let message = `Unresolved $ref "${$ref}".`;
      if (__absolute_ref__ && __absolute_ref__ !== $ref) {
        message += `  Absolute URI "${__absolute_ref__}".`;
      }
      message += `
Known schemas:
- ${Object.keys(lookup).join(`
- `)}`;
      throw new Error(message);
    }
    const keywordLocation = `${schemaLocation}/$ref`;
    const result = validate(instance, refSchema, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation, evaluated);
    if (!result.valid) {
      errors.push({
        instanceLocation,
        keyword: "$ref",
        keywordLocation,
        error: "A subschema had errors."
      }, ...result.errors);
    }
    if (draft === "4" || draft === "7") {
      return { valid: errors.length === 0, errors };
    }
  }
  if (Array.isArray($type)) {
    let length = $type.length;
    let valid = false;
    for (let i = 0;i < length; i++) {
      if (instanceType === $type[i] || $type[i] === "integer" && instanceType === "number" && instance % 1 === 0 && instance === instance) {
        valid = true;
        break;
      }
    }
    if (!valid) {
      errors.push({
        instanceLocation,
        keyword: "type",
        keywordLocation: `${schemaLocation}/type`,
        error: `Instance type "${instanceType}" is invalid. Expected "${$type.join('", "')}".`
      });
    }
  } else if ($type === "integer") {
    if (instanceType !== "number" || instance % 1 || instance !== instance) {
      errors.push({
        instanceLocation,
        keyword: "type",
        keywordLocation: `${schemaLocation}/type`,
        error: `Instance type "${instanceType}" is invalid. Expected "${$type}".`
      });
    }
  } else if ($type !== undefined && instanceType !== $type) {
    errors.push({
      instanceLocation,
      keyword: "type",
      keywordLocation: `${schemaLocation}/type`,
      error: `Instance type "${instanceType}" is invalid. Expected "${$type}".`
    });
  }
  if ($const !== undefined) {
    if (instanceType === "object" || instanceType === "array") {
      if (!deepCompareStrict(instance, $const)) {
        errors.push({
          instanceLocation,
          keyword: "const",
          keywordLocation: `${schemaLocation}/const`,
          error: `Instance does not match ${JSON.stringify($const)}.`
        });
      }
    } else if (instance !== $const) {
      errors.push({
        instanceLocation,
        keyword: "const",
        keywordLocation: `${schemaLocation}/const`,
        error: `Instance does not match ${JSON.stringify($const)}.`
      });
    }
  }
  if ($enum !== undefined) {
    if (instanceType === "object" || instanceType === "array") {
      if (!$enum.some((value) => deepCompareStrict(instance, value))) {
        errors.push({
          instanceLocation,
          keyword: "enum",
          keywordLocation: `${schemaLocation}/enum`,
          error: `Instance does not match any of ${JSON.stringify($enum)}.`
        });
      }
    } else if (!$enum.some((value) => instance === value)) {
      errors.push({
        instanceLocation,
        keyword: "enum",
        keywordLocation: `${schemaLocation}/enum`,
        error: `Instance does not match any of ${JSON.stringify($enum)}.`
      });
    }
  }
  if ($not !== undefined) {
    const keywordLocation = `${schemaLocation}/not`;
    const result = validate(instance, $not, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation);
    if (result.valid) {
      errors.push({
        instanceLocation,
        keyword: "not",
        keywordLocation,
        error: 'Instance matched "not" schema.'
      });
    }
  }
  let subEvaluateds = [];
  if ($anyOf !== undefined) {
    const keywordLocation = `${schemaLocation}/anyOf`;
    const errorsLength = errors.length;
    let anyValid = false;
    for (let i = 0;i < $anyOf.length; i++) {
      const subSchema = $anyOf[i];
      const subEvaluated = Object.create(evaluated);
      const result = validate(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
      errors.push(...result.errors);
      anyValid = anyValid || result.valid;
      if (result.valid) {
        subEvaluateds.push(subEvaluated);
      }
    }
    if (anyValid) {
      errors.length = errorsLength;
    } else {
      errors.splice(errorsLength, 0, {
        instanceLocation,
        keyword: "anyOf",
        keywordLocation,
        error: "Instance does not match any subschemas."
      });
    }
  }
  if ($allOf !== undefined) {
    const keywordLocation = `${schemaLocation}/allOf`;
    const errorsLength = errors.length;
    let allValid = true;
    for (let i = 0;i < $allOf.length; i++) {
      const subSchema = $allOf[i];
      const subEvaluated = Object.create(evaluated);
      const result = validate(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
      errors.push(...result.errors);
      allValid = allValid && result.valid;
      if (result.valid) {
        subEvaluateds.push(subEvaluated);
      }
    }
    if (allValid) {
      errors.length = errorsLength;
    } else {
      errors.splice(errorsLength, 0, {
        instanceLocation,
        keyword: "allOf",
        keywordLocation,
        error: `Instance does not match every subschema.`
      });
    }
  }
  if ($oneOf !== undefined) {
    const keywordLocation = `${schemaLocation}/oneOf`;
    const errorsLength = errors.length;
    const matches2 = $oneOf.filter((subSchema, i) => {
      const subEvaluated = Object.create(evaluated);
      const result = validate(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
      errors.push(...result.errors);
      if (result.valid) {
        subEvaluateds.push(subEvaluated);
      }
      return result.valid;
    }).length;
    if (matches2 === 1) {
      errors.length = errorsLength;
    } else {
      errors.splice(errorsLength, 0, {
        instanceLocation,
        keyword: "oneOf",
        keywordLocation,
        error: `Instance does not match exactly one subschema (${matches2} matches).`
      });
    }
  }
  if (instanceType === "object" || instanceType === "array") {
    Object.assign(evaluated, ...subEvaluateds);
  }
  if ($if !== undefined) {
    const keywordLocation = `${schemaLocation}/if`;
    const conditionResult = validate(instance, $if, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation, evaluated).valid;
    if (conditionResult) {
      if ($then !== undefined) {
        const thenResult = validate(instance, $then, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${schemaLocation}/then`, evaluated);
        if (!thenResult.valid) {
          errors.push({
            instanceLocation,
            keyword: "if",
            keywordLocation,
            error: `Instance does not match "then" schema.`
          }, ...thenResult.errors);
        }
      }
    } else if ($else !== undefined) {
      const elseResult = validate(instance, $else, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${schemaLocation}/else`, evaluated);
      if (!elseResult.valid) {
        errors.push({
          instanceLocation,
          keyword: "if",
          keywordLocation,
          error: `Instance does not match "else" schema.`
        }, ...elseResult.errors);
      }
    }
  }
  if (instanceType === "object") {
    if ($required !== undefined) {
      for (const key of $required) {
        if (!(key in instance)) {
          errors.push({
            instanceLocation,
            keyword: "required",
            keywordLocation: `${schemaLocation}/required`,
            error: `Instance does not have required property "${key}".`
          });
        }
      }
    }
    const keys = Object.keys(instance);
    if ($minProperties !== undefined && keys.length < $minProperties) {
      errors.push({
        instanceLocation,
        keyword: "minProperties",
        keywordLocation: `${schemaLocation}/minProperties`,
        error: `Instance does not have at least ${$minProperties} properties.`
      });
    }
    if ($maxProperties !== undefined && keys.length > $maxProperties) {
      errors.push({
        instanceLocation,
        keyword: "maxProperties",
        keywordLocation: `${schemaLocation}/maxProperties`,
        error: `Instance does not have at least ${$maxProperties} properties.`
      });
    }
    if ($propertyNames !== undefined) {
      const keywordLocation = `${schemaLocation}/propertyNames`;
      for (const key in instance) {
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate(key, $propertyNames, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
        if (!result.valid) {
          errors.push({
            instanceLocation,
            keyword: "propertyNames",
            keywordLocation,
            error: `Property name "${key}" does not match schema.`
          }, ...result.errors);
        }
      }
    }
    if ($dependentRequired !== undefined) {
      const keywordLocation = `${schemaLocation}/dependantRequired`;
      for (const key in $dependentRequired) {
        if (key in instance) {
          const required = $dependentRequired[key];
          for (const dependantKey of required) {
            if (!(dependantKey in instance)) {
              errors.push({
                instanceLocation,
                keyword: "dependentRequired",
                keywordLocation,
                error: `Instance has "${key}" but does not have "${dependantKey}".`
              });
            }
          }
        }
      }
    }
    if ($dependentSchemas !== undefined) {
      for (const key in $dependentSchemas) {
        const keywordLocation = `${schemaLocation}/dependentSchemas`;
        if (key in instance) {
          const result = validate(instance, $dependentSchemas[key], draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${keywordLocation}/${encodePointer(key)}`, evaluated);
          if (!result.valid) {
            errors.push({
              instanceLocation,
              keyword: "dependentSchemas",
              keywordLocation,
              error: `Instance has "${key}" but does not match dependant schema.`
            }, ...result.errors);
          }
        }
      }
    }
    if ($dependencies !== undefined) {
      const keywordLocation = `${schemaLocation}/dependencies`;
      for (const key in $dependencies) {
        if (key in instance) {
          const propsOrSchema = $dependencies[key];
          if (Array.isArray(propsOrSchema)) {
            for (const dependantKey of propsOrSchema) {
              if (!(dependantKey in instance)) {
                errors.push({
                  instanceLocation,
                  keyword: "dependencies",
                  keywordLocation,
                  error: `Instance has "${key}" but does not have "${dependantKey}".`
                });
              }
            }
          } else {
            const result = validate(instance, propsOrSchema, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${keywordLocation}/${encodePointer(key)}`);
            if (!result.valid) {
              errors.push({
                instanceLocation,
                keyword: "dependencies",
                keywordLocation,
                error: `Instance has "${key}" but does not match dependant schema.`
              }, ...result.errors);
            }
          }
        }
      }
    }
    const thisEvaluated = Object.create(null);
    let stop = false;
    if ($properties !== undefined) {
      const keywordLocation = `${schemaLocation}/properties`;
      for (const key in $properties) {
        if (!(key in instance)) {
          continue;
        }
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate(instance[key], $properties[key], draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, `${keywordLocation}/${encodePointer(key)}`);
        if (result.valid) {
          evaluated[key] = thisEvaluated[key] = true;
        } else {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "properties",
            keywordLocation,
            error: `Property "${key}" does not match schema.`
          }, ...result.errors);
          if (stop)
            break;
        }
      }
    }
    if (!stop && $patternProperties !== undefined) {
      const keywordLocation = `${schemaLocation}/patternProperties`;
      for (const pattern in $patternProperties) {
        const regex2 = new RegExp(pattern, "u");
        const subSchema = $patternProperties[pattern];
        for (const key in instance) {
          if (!regex2.test(key)) {
            continue;
          }
          const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
          const result = validate(instance[key], subSchema, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, `${keywordLocation}/${encodePointer(pattern)}`);
          if (result.valid) {
            evaluated[key] = thisEvaluated[key] = true;
          } else {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "patternProperties",
              keywordLocation,
              error: `Property "${key}" matches pattern "${pattern}" but does not match associated schema.`
            }, ...result.errors);
          }
        }
      }
    }
    if (!stop && $additionalProperties !== undefined) {
      const keywordLocation = `${schemaLocation}/additionalProperties`;
      for (const key in instance) {
        if (thisEvaluated[key]) {
          continue;
        }
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate(instance[key], $additionalProperties, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
        if (result.valid) {
          evaluated[key] = true;
        } else {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "additionalProperties",
            keywordLocation,
            error: `Property "${key}" does not match additional properties schema.`
          }, ...result.errors);
        }
      }
    } else if (!stop && $unevaluatedProperties !== undefined) {
      const keywordLocation = `${schemaLocation}/unevaluatedProperties`;
      for (const key in instance) {
        if (!evaluated[key]) {
          const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
          const result = validate(instance[key], $unevaluatedProperties, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
          if (result.valid) {
            evaluated[key] = true;
          } else {
            errors.push({
              instanceLocation,
              keyword: "unevaluatedProperties",
              keywordLocation,
              error: `Property "${key}" does not match unevaluated properties schema.`
            }, ...result.errors);
          }
        }
      }
    }
  } else if (instanceType === "array") {
    if ($maxItems !== undefined && instance.length > $maxItems) {
      errors.push({
        instanceLocation,
        keyword: "maxItems",
        keywordLocation: `${schemaLocation}/maxItems`,
        error: `Array has too many items (${instance.length} > ${$maxItems}).`
      });
    }
    if ($minItems !== undefined && instance.length < $minItems) {
      errors.push({
        instanceLocation,
        keyword: "minItems",
        keywordLocation: `${schemaLocation}/minItems`,
        error: `Array has too few items (${instance.length} < ${$minItems}).`
      });
    }
    const length = instance.length;
    let i = 0;
    let stop = false;
    if ($prefixItems !== undefined) {
      const keywordLocation = `${schemaLocation}/prefixItems`;
      const length2 = Math.min($prefixItems.length, length);
      for (;i < length2; i++) {
        const result = validate(instance[i], $prefixItems[i], draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, `${keywordLocation}/${i}`);
        evaluated[i] = true;
        if (!result.valid) {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "prefixItems",
            keywordLocation,
            error: `Items did not match schema.`
          }, ...result.errors);
          if (stop)
            break;
        }
      }
    }
    if ($items !== undefined) {
      const keywordLocation = `${schemaLocation}/items`;
      if (Array.isArray($items)) {
        const length2 = Math.min($items.length, length);
        for (;i < length2; i++) {
          const result = validate(instance[i], $items[i], draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, `${keywordLocation}/${i}`);
          evaluated[i] = true;
          if (!result.valid) {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "items",
              keywordLocation,
              error: `Items did not match schema.`
            }, ...result.errors);
            if (stop)
              break;
          }
        }
      } else {
        for (;i < length; i++) {
          const result = validate(instance[i], $items, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation);
          evaluated[i] = true;
          if (!result.valid) {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "items",
              keywordLocation,
              error: `Items did not match schema.`
            }, ...result.errors);
            if (stop)
              break;
          }
        }
      }
      if (!stop && $additionalItems !== undefined) {
        const keywordLocation2 = `${schemaLocation}/additionalItems`;
        for (;i < length; i++) {
          const result = validate(instance[i], $additionalItems, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation2);
          evaluated[i] = true;
          if (!result.valid) {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "additionalItems",
              keywordLocation: keywordLocation2,
              error: `Items did not match additional items schema.`
            }, ...result.errors);
          }
        }
      }
    }
    if ($contains !== undefined) {
      if (length === 0 && $minContains === undefined) {
        errors.push({
          instanceLocation,
          keyword: "contains",
          keywordLocation: `${schemaLocation}/contains`,
          error: `Array is empty. It must contain at least one item matching the schema.`
        });
      } else if ($minContains !== undefined && length < $minContains) {
        errors.push({
          instanceLocation,
          keyword: "minContains",
          keywordLocation: `${schemaLocation}/minContains`,
          error: `Array has less items (${length}) than minContains (${$minContains}).`
        });
      } else {
        const keywordLocation = `${schemaLocation}/contains`;
        const errorsLength = errors.length;
        let contained = 0;
        for (let j = 0;j < length; j++) {
          const result = validate(instance[j], $contains, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${j}`, keywordLocation);
          if (result.valid) {
            evaluated[j] = true;
            contained++;
          } else {
            errors.push(...result.errors);
          }
        }
        if (contained >= ($minContains || 0)) {
          errors.length = errorsLength;
        }
        if ($minContains === undefined && $maxContains === undefined && contained === 0) {
          errors.splice(errorsLength, 0, {
            instanceLocation,
            keyword: "contains",
            keywordLocation,
            error: `Array does not contain item matching schema.`
          });
        } else if ($minContains !== undefined && contained < $minContains) {
          errors.push({
            instanceLocation,
            keyword: "minContains",
            keywordLocation: `${schemaLocation}/minContains`,
            error: `Array must contain at least ${$minContains} items matching schema. Only ${contained} items were found.`
          });
        } else if ($maxContains !== undefined && contained > $maxContains) {
          errors.push({
            instanceLocation,
            keyword: "maxContains",
            keywordLocation: `${schemaLocation}/maxContains`,
            error: `Array may contain at most ${$maxContains} items matching schema. ${contained} items were found.`
          });
        }
      }
    }
    if (!stop && $unevaluatedItems !== undefined) {
      const keywordLocation = `${schemaLocation}/unevaluatedItems`;
      for (i;i < length; i++) {
        if (evaluated[i]) {
          continue;
        }
        const result = validate(instance[i], $unevaluatedItems, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation);
        evaluated[i] = true;
        if (!result.valid) {
          errors.push({
            instanceLocation,
            keyword: "unevaluatedItems",
            keywordLocation,
            error: `Items did not match unevaluated items schema.`
          }, ...result.errors);
        }
      }
    }
    if ($uniqueItems) {
      for (let j = 0;j < length; j++) {
        const a = instance[j];
        const ao = typeof a === "object" && a !== null;
        for (let k = 0;k < length; k++) {
          if (j === k) {
            continue;
          }
          const b = instance[k];
          const bo = typeof b === "object" && b !== null;
          if (a === b || ao && bo && deepCompareStrict(a, b)) {
            errors.push({
              instanceLocation,
              keyword: "uniqueItems",
              keywordLocation: `${schemaLocation}/uniqueItems`,
              error: `Duplicate items at indexes ${j} and ${k}.`
            });
            j = Number.MAX_SAFE_INTEGER;
            k = Number.MAX_SAFE_INTEGER;
          }
        }
      }
    }
  } else if (instanceType === "number") {
    if (draft === "4") {
      if ($minimum !== undefined && ($exclusiveMinimum === true && instance <= $minimum || instance < $minimum)) {
        errors.push({
          instanceLocation,
          keyword: "minimum",
          keywordLocation: `${schemaLocation}/minimum`,
          error: `${instance} is less than ${$exclusiveMinimum ? "or equal to " : ""} ${$minimum}.`
        });
      }
      if ($maximum !== undefined && ($exclusiveMaximum === true && instance >= $maximum || instance > $maximum)) {
        errors.push({
          instanceLocation,
          keyword: "maximum",
          keywordLocation: `${schemaLocation}/maximum`,
          error: `${instance} is greater than ${$exclusiveMaximum ? "or equal to " : ""} ${$maximum}.`
        });
      }
    } else {
      if ($minimum !== undefined && instance < $minimum) {
        errors.push({
          instanceLocation,
          keyword: "minimum",
          keywordLocation: `${schemaLocation}/minimum`,
          error: `${instance} is less than ${$minimum}.`
        });
      }
      if ($maximum !== undefined && instance > $maximum) {
        errors.push({
          instanceLocation,
          keyword: "maximum",
          keywordLocation: `${schemaLocation}/maximum`,
          error: `${instance} is greater than ${$maximum}.`
        });
      }
      if ($exclusiveMinimum !== undefined && instance <= $exclusiveMinimum) {
        errors.push({
          instanceLocation,
          keyword: "exclusiveMinimum",
          keywordLocation: `${schemaLocation}/exclusiveMinimum`,
          error: `${instance} is less than ${$exclusiveMinimum}.`
        });
      }
      if ($exclusiveMaximum !== undefined && instance >= $exclusiveMaximum) {
        errors.push({
          instanceLocation,
          keyword: "exclusiveMaximum",
          keywordLocation: `${schemaLocation}/exclusiveMaximum`,
          error: `${instance} is greater than or equal to ${$exclusiveMaximum}.`
        });
      }
    }
    if ($multipleOf !== undefined) {
      const remainder = instance % $multipleOf;
      if (Math.abs(0 - remainder) >= 0.00000011920929 && Math.abs($multipleOf - remainder) >= 0.00000011920929) {
        errors.push({
          instanceLocation,
          keyword: "multipleOf",
          keywordLocation: `${schemaLocation}/multipleOf`,
          error: `${instance} is not a multiple of ${$multipleOf}.`
        });
      }
    }
  } else if (instanceType === "string") {
    const length = $minLength === undefined && $maxLength === undefined ? 0 : ucs2length(instance);
    if ($minLength !== undefined && length < $minLength) {
      errors.push({
        instanceLocation,
        keyword: "minLength",
        keywordLocation: `${schemaLocation}/minLength`,
        error: `String is too short (${length} < ${$minLength}).`
      });
    }
    if ($maxLength !== undefined && length > $maxLength) {
      errors.push({
        instanceLocation,
        keyword: "maxLength",
        keywordLocation: `${schemaLocation}/maxLength`,
        error: `String is too long (${length} > ${$maxLength}).`
      });
    }
    if ($pattern !== undefined && !new RegExp($pattern, "u").test(instance)) {
      errors.push({
        instanceLocation,
        keyword: "pattern",
        keywordLocation: `${schemaLocation}/pattern`,
        error: `String does not match pattern.`
      });
    }
    if ($format !== undefined && fastFormat[$format] && !fastFormat[$format](instance)) {
      errors.push({
        instanceLocation,
        keyword: "format",
        keywordLocation: `${schemaLocation}/format`,
        error: `String does not match format "${$format}".`
      });
    }
  }
  return { valid: errors.length === 0, errors };
}

// node_modules/@cfworker/json-schema/dist/validator.js
class Validator {
  constructor(schema, draft = "2019-09", shortCircuit = true) {
    this.schema = schema;
    this.draft = draft;
    this.shortCircuit = shortCircuit;
    this.lookup = dereference(schema);
  }
  validate(instance) {
    return validate(instance, this.schema, this.draft, this.lookup, this.shortCircuit);
  }
  addSchema(schema, id) {
    if (id) {
      schema = { ...schema, $id: id };
    }
    dereference(schema, this.lookup);
  }
}

// src/schema-validator.ts
var validTypes = new Set(["array", "boolean", "integer", "null", "number", "object", "string"]);
function validateSchemaDefinition(schema) {
  try {
    createValidator(schema).validate({});
  } catch (error) {
    throw new Error(`SceneMap schema is invalid: ${error.message}`);
  }
}
function validateTrackerData(data, schema, source = "Tracker data") {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${source} must be a JSON object.`);
  }
  let result;
  try {
    result = createValidator(schema).validate(data);
  } catch (error) {
    throw new Error(`SceneMap schema is invalid: ${error.message}`);
  }
  if (!result.valid) {
    throw new Error(`${source} does not match the SceneMap schema: ${formatSchemaErrors(result.errors)}`);
  }
  return data;
}
function createValidator(schema) {
  assertSchemaWellFormed(schema);
  return new Validator(schema, detectDraft(schema), false);
}
function detectDraft(schema) {
  const declaration = typeof schema.$schema === "string" ? schema.$schema : "";
  if (/draft-?0?4/i.test(declaration))
    return "4";
  if (/2019-09/i.test(declaration))
    return "2019-09";
  if (/2020-12/i.test(declaration))
    return "2020-12";
  return "7";
}
function assertSchemaWellFormed(schema, path = "#", seen = new WeakSet) {
  if (typeof schema === "boolean")
    return;
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    throw new Error(`${path} must be a schema object or boolean.`);
  }
  if (seen.has(schema))
    return;
  seen.add(schema);
  const record = schema;
  const types = Array.isArray(record.type) ? record.type : record.type === undefined ? [] : [record.type];
  if (types.some((type) => typeof type !== "string" || !validTypes.has(type))) {
    throw new Error(`${path}/type contains an unsupported JSON Schema type.`);
  }
  if (record.required !== undefined && (!Array.isArray(record.required) || record.required.some((key) => typeof key !== "string"))) {
    throw new Error(`${path}/required must be an array of strings.`);
  }
  if (record.enum !== undefined && (!Array.isArray(record.enum) || record.enum.length === 0)) {
    throw new Error(`${path}/enum must be a non-empty array.`);
  }
  if (record.pattern !== undefined) {
    if (typeof record.pattern !== "string")
      throw new Error(`${path}/pattern must be a string.`);
    try {
      new RegExp(record.pattern);
    } catch {
      throw new Error(`${path}/pattern is not a valid regular expression.`);
    }
  }
  for (const keyword of ["properties", "patternProperties", "$defs", "definitions", "dependentSchemas"]) {
    const children = record[keyword];
    if (children === undefined)
      continue;
    if (!children || typeof children !== "object" || Array.isArray(children)) {
      throw new Error(`${path}/${keyword} must be an object.`);
    }
    for (const [key, child] of Object.entries(children)) {
      assertSchemaWellFormed(child, `${path}/${keyword}/${escapeJsonPointerToken(key)}`, seen);
    }
  }
  for (const keyword of ["allOf", "anyOf", "oneOf"]) {
    const children = record[keyword];
    if (children === undefined)
      continue;
    if (!Array.isArray(children) || children.length === 0)
      throw new Error(`${path}/${keyword} must be a non-empty array.`);
    children.forEach((child, index2) => assertSchemaWellFormed(child, `${path}/${keyword}/${index2}`, seen));
  }
  for (const keyword of ["items", "additionalItems", "contains", "additionalProperties", "propertyNames", "not", "if", "then", "else"]) {
    const child = record[keyword];
    if (child === undefined)
      continue;
    if (keyword === "items" && Array.isArray(child)) {
      child.forEach((item, index2) => assertSchemaWellFormed(item, `${path}/items/${index2}`, seen));
    } else {
      assertSchemaWellFormed(child, `${path}/${keyword}`, seen);
    }
  }
}
function formatSchemaErrors(errors) {
  const meaningful = errors.filter((error) => !["properties", "items"].includes(error.keyword));
  const selected = (meaningful.length > 0 ? meaningful : errors).slice(0, 6);
  const messages = selected.map((error) => {
    let path = error.instanceLocation === "#" ? "" : error.instanceLocation.replace(/^#/, "");
    let message = error.error;
    if (error.keyword === "required") {
      const match = message.match(/required property "([^"]+)"/i);
      if (match)
        path = `${path}/${escapeJsonPointerToken(match[1])}`;
    }
    if (error.keyword === "type") {
      const match = message.match(/Expected "([^"]+)"/i);
      if (match)
        message = `must be ${match[1]}`;
    }
    if (error.keyword === "format") {
      const match = message.match(/format "([^"]+)"/i);
      if (match)
        message = `must match format "${match[1]}"`;
    }
    return `${path || "/"} ${message}`;
  });
  if (errors.length > selected.length)
    messages.push(`and ${errors.length - selected.length} more`);
  return messages.join("; ");
}
function escapeJsonPointerToken(value) {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

// src/generation-action.ts
function getGenerationButtonCommand(generationActive, requestPending) {
  return generationActive || requestPending ? "cancel_generation" : "generate_tracker";
}

// src/partial-regeneration.ts
var forbiddenPathSegments = new Set(["__proto__", "prototype", "constructor"]);
function collectRegeneratableFields(value) {
  const fields = [];
  collectFields(value, [], [], "", fields);
  return fields;
}
function collectFields(value, path, groups, label, fields) {
  const record = getRecord(value);
  if (record && Object.keys(record).length > 0) {
    const nextGroups = label ? [...groups, label] : groups;
    for (const [key, child] of Object.entries(record)) {
      collectFields(child, [...path, key], nextGroups, humanizeTrackerKey(key), fields);
    }
    return;
  }
  if (Array.isArray(value) && value.length > 0 && value.every((item) => getRecord(item) !== null)) {
    const nextGroups = label ? [...groups, label] : groups;
    value.forEach((item, index2) => {
      const name = compactLabel(getRecord(item)?.name) || `Item ${index2 + 1}`;
      collectFields(item, [...path, index2], [...nextGroups, name], "", fields);
    });
    return;
  }
  if (path.length === 0)
    return;
  fields.push({
    path,
    label: label || humanizeTrackerKey(String(path.at(-1) ?? "Field")),
    groups,
    currentValue: value
  });
}
function getRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function compactLabel(value) {
  return typeof value === "string" ? value.trim() : "";
}

// src/top-toolbar-status.ts
function getTopToolbarStatus(state, requestPending = false) {
  if (state.generationActive || requestPending) {
    return { tone: "generating", text: "Mapping this scene" };
  }
  if (!state.chatId || !state.activeMessageId) {
    return { tone: "neutral", text: "Open a chat with an assistant reply" };
  }
  if (!state.latest) {
    return { tone: "warning", text: "SceneMap has not been generated" };
  }
  if (!state.latest.schemaMatchesCurrent) {
    return { tone: "warning", text: "SceneMap uses another or outdated schema" };
  }
  if (state.messagesBehind > 0) {
    return {
      tone: "warning",
      text: `SceneMap is ${state.messagesBehind} message${state.messagesBehind === 1 ? "" : "s"} behind`
    };
  }
  if (state.latest.messageId !== state.activeMessageId || state.latest.swipeId !== state.activeSwipeId) {
    return { tone: "warning", text: "SceneMap is out of date for the active swipe" };
  }
  return { tone: "success", text: "SceneMap is updated" };
}

// src/tracker-inline-edit.ts
var blockedPathKeys = new Set(["__proto__", "prototype", "constructor"]);
function getRecord2(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function decodeRefToken(token) {
  return token.replaceAll("~1", "/").replaceAll("~0", "~");
}
function resolveLocalRef(rootSchema, ref) {
  if (!ref.startsWith("#/"))
    return null;
  let current = rootSchema;
  for (const token of ref.slice(2).split("/")) {
    if (!current || typeof current !== "object" || Array.isArray(current))
      return null;
    current = current[decodeRefToken(token)];
  }
  return current;
}
function mergeSchemas(left, right) {
  const leftProperties = getRecord2(left.properties);
  const rightProperties = getRecord2(right.properties);
  return {
    ...left,
    ...right,
    ...Object.keys(leftProperties).length || Object.keys(rightProperties).length ? { properties: { ...leftProperties, ...rightProperties } } : {}
  };
}
function normalizeSchema(schema, rootSchema, seenRefs = new Set) {
  const source = getRecord2(schema);
  let normalized = { ...source };
  const ref = typeof source.$ref === "string" ? source.$ref : null;
  if (ref?.startsWith("#/") && !seenRefs.has(ref)) {
    const resolved = resolveLocalRef(rootSchema, ref);
    if (resolved) {
      const nextRefs = new Set(seenRefs).add(ref);
      normalized = mergeSchemas(normalizeSchema(resolved, rootSchema, nextRefs), normalized);
    }
  }
  for (const keyword of ["allOf", "oneOf", "anyOf"]) {
    const variants = source[keyword];
    if (!Array.isArray(variants))
      continue;
    for (const variant of variants) {
      normalized = mergeSchemas(normalized, normalizeSchema(variant, rootSchema, seenRefs));
    }
  }
  return normalized;
}
function schemaType(schema) {
  if (typeof schema.type === "string")
    return schema.type;
  if (Array.isArray(schema.type)) {
    return schema.type.find((type) => typeof type === "string" && type !== "null") ?? null;
  }
  return null;
}
function getTrackerSchemaAtPath(rootSchema, path) {
  let current = rootSchema;
  for (const segment of path) {
    const normalized = normalizeSchema(current, rootSchema);
    if (typeof segment === "number") {
      current = normalized.items;
      continue;
    }
    current = getRecord2(normalized.properties)[segment];
  }
  return normalizeSchema(current, rootSchema);
}
function getTrackerEditControlKind(schema, value) {
  if (Array.isArray(schema.enum) && schema.enum.length > 0)
    return "enum";
  const type = schemaType(schema);
  if (type === "boolean" || typeof value === "boolean")
    return "boolean";
  if (type === "integer")
    return "integer";
  if (type === "number" || typeof value === "number")
    return "number";
  if (type === "array" || Array.isArray(value)) {
    const itemSchema = normalizeSchema(schema.items, schema);
    const itemType = schemaType(itemSchema);
    if (itemType === "integer")
      return "integer_array";
    if (itemType === "number")
      return "number_array";
    const sample = Array.isArray(value) ? value.find((item) => item !== null && item !== undefined) : undefined;
    if (typeof sample === "number")
      return Number.isInteger(sample) ? "integer_array" : "number_array";
    return "string_array";
  }
  return "string";
}
function parseNumericValue(raw, integer) {
  if (raw.trim() === "")
    return "";
  const value = Number(raw);
  if (!Number.isFinite(value) || integer && !Number.isInteger(value))
    return raw;
  return value;
}
function parseTrackerEditValue(kind, raw, schema) {
  if (kind === "enum") {
    const index2 = Number(raw);
    return Number.isSafeInteger(index2) && Array.isArray(schema.enum) && index2 >= 0 && index2 < schema.enum.length ? structuredClone(schema.enum[index2]) : raw;
  }
  if (kind === "boolean")
    return raw === "true";
  if (kind === "number")
    return parseNumericValue(raw, false);
  if (kind === "integer")
    return parseNumericValue(raw, true);
  if (kind.endsWith("_array")) {
    const values = raw.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    if (kind === "number_array")
      return values.map((item) => parseNumericValue(item, false));
    if (kind === "integer_array")
      return values.map((item) => parseNumericValue(item, true));
    return values;
  }
  return raw;
}
function setTrackerValueAtPath(root, path, value) {
  if (!root || typeof root !== "object" || path.length === 0)
    return false;
  let current = root;
  for (let index2 = 0;index2 < path.length - 1; index2 += 1) {
    const segment = path[index2];
    if (typeof segment === "string" && blockedPathKeys.has(segment))
      return false;
    const nextSegment = path[index2 + 1];
    let next = current[segment];
    if (!next || typeof next !== "object") {
      next = typeof nextSegment === "number" ? [] : {};
      current[segment] = next;
    }
    current = next;
  }
  const finalSegment = path[path.length - 1];
  if (typeof finalSegment === "string" && blockedPathKeys.has(finalSegment))
    return false;
  current[finalSegment] = value;
  return true;
}
function removeTrackerArrayItem(root, path, index2) {
  const value = getTrackerValueAtPath(root, path);
  if (!Array.isArray(value) || index2 < 0 || index2 >= value.length)
    return false;
  value.splice(index2, 1);
  return true;
}
function appendTrackerArrayItem(root, path, value) {
  const current = getTrackerValueAtPath(root, path);
  if (!Array.isArray(current))
    return setTrackerValueAtPath(root, path, [value]);
  current.push(value);
  return true;
}
function getTrackerValueAtPath(root, path) {
  let current = root;
  for (const segment of path) {
    if (!current || typeof current !== "object")
      return;
    current = current[segment];
  }
  return current;
}
function cloneTrackerEditValue(value) {
  return structuredClone(value);
}
function createTrackerEditDefaultValue(schema, depth = 0) {
  if (Object.prototype.hasOwnProperty.call(schema, "default"))
    return structuredClone(schema.default);
  if (Object.prototype.hasOwnProperty.call(schema, "const"))
    return structuredClone(schema.const);
  if (Array.isArray(schema.enum) && schema.enum.length > 0)
    return structuredClone(schema.enum[0]);
  if (depth >= 12)
    return null;
  const type = schemaType(schema);
  if (type === "object" || schema.properties) {
    const properties = getRecord2(schema.properties);
    const required = Array.isArray(schema.required) ? schema.required.filter((key) => typeof key === "string" && !blockedPathKeys.has(key)) : [];
    return Object.fromEntries(required.map((key) => [
      key,
      createTrackerEditDefaultValue(getRecord2(properties[key]), depth + 1)
    ]));
  }
  if (type === "array")
    return [];
  if (type === "boolean")
    return false;
  if (type === "number" || type === "integer") {
    return typeof schema.minimum === "number" ? schema.minimum : 0;
  }
  return "";
}

// src/frontend.ts
var state = {
  settings: defaultSettings,
  chatId: null,
  effectivePresetKey: defaultSettings.schemaPreset,
  latest: null,
  messagesBehind: 0,
  autoGenerateMessagesRemaining: null,
  activeMessageId: null,
  activeSwipeId: null,
  generationActive: false,
  generatingMessageId: null,
  connections: []
};
var ctxRef = null;
var rootRef = null;
var dockRootRef = null;
var toolbarRootRef = null;
var topToolbarRootRef = null;
var topToolbarTapTimer = null;
var topToolbarOpenTimer = null;
var topToolbarSuppressClickUntil = Number.NEGATIVE_INFINITY;
var tabHandle = null;
var dockPanelHandle = null;
var dockPanelError = null;
var settingsRuntimeError = null;
var trackerRuntimeError = null;
var isGenerationRequestPending = false;
var generationRequestWatchdog = null;
var editorRequestSeq = 0;
var trackerEditRequestSeq = 0;
var settingsSaveRequestSeq = 0;
var automaticSaveRequestSeq = 0;
var drawerSelectHandles = [];
var automaticSaveTimer = null;
var drawerScrollRestoreFrame = null;
var drawerView = "settings";
var appliedTrackerPlacement = null;
var hasReceivedInitialState = false;
var regenerationModalHandle = null;
var trackerEditSession = null;
var presetEditorDrafts = new Map;
var pendingTextEditors = new Map;
var settingsDraft = new SettingsDraftTracker;
var automaticSettingsDraft = new AutomaticSettingsDraftTracker;
var GENERATION_REQUEST_TIMEOUT_MS = 1e4;
var TOP_TOOLBAR_DOUBLE_CLICK_MS = 280;
var TOP_TOOLBAR_DOUBLE_TOUCH_MS = 440;
var iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"/><path d="M9 3v15"/><path d="M15 6v15"/></svg>`;
var copySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/></svg>`;
var checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>`;
function setup(ctx) {
  hasReceivedInitialState = false;
  trackerEditSession = null;
  settingsDraft.reset();
  automaticSettingsDraft.reset();
  presetEditorDrafts.clear();
  pendingTextEditors.clear();
  settingsDraft.initialize(presetSettingsFingerprint(state.settings));
  if (automaticSaveTimer)
    clearTimeout(automaticSaveTimer);
  automaticSaveTimer = null;
  if (drawerScrollRestoreFrame !== null)
    cancelAnimationFrame(drawerScrollRestoreFrame);
  drawerScrollRestoreFrame = null;
  settingsRuntimeError = null;
  trackerRuntimeError = null;
  clearGenerationRequestPending();
  ctxRef = ctx;
  const removeStyle = ctx.dom.addStyle(styles);
  const tab = ctx.ui.registerDrawerTab({
    id: "scenemap",
    title: "SceneMap",
    shortName: "Map",
    headerTitle: "SceneMap",
    description: "View the SceneMap tracker, settings, and macro reference",
    keywords: ["tracker", "scene", "map", "json", "settings", "macros"],
    iconSvg
  });
  tabHandle = tab;
  rootRef = tab.root;
  rootRef.classList.add("scenemap-lv", "scenemap-drawer-root");
  syncTrackerPlacement();
  const offTabActivate = tab.onActivate(() => {
    syncTrackerPlacement();
    renderDrawerContent();
  });
  const mountHostPoint = ctx.ui.mount;
  const toolbarRoot = mountHostPoint("chat_actions");
  const topToolbarRoot = mountHostPoint("chat_top_dock");
  toolbarRootRef = toolbarRoot;
  topToolbarRootRef = topToolbarRoot;
  toolbarRoot.classList.add("scenemap-chat-toolbar-root");
  topToolbarRoot.classList.add("scenemap-top-toolbar-host");
  topToolbarRoot.addEventListener("click", handleTopToolbarClick);
  topToolbarRoot.addEventListener("pointerup", handleTopToolbarPointerUp);
  topToolbarRoot.addEventListener("keydown", handleTopToolbarKeydown);
  render();
  const offBackend = ctx.onBackendMessage((payload) => {
    if (payload?.type === "state") {
      const preserveActiveSettings = settingsSurfaceHasActiveInteraction();
      const previousState = state;
      const incomingState = payload.state;
      hasReceivedInitialState = true;
      reconcileTrackerEditSession(incomingState, payload);
      if (!settingsDraft.initialized)
        settingsDraft.initialize(presetSettingsFingerprint(incomingState.settings));
      if (typeof payload.automaticSettingsSaveRequestId === "string") {
        automaticSettingsDraft.acknowledge(payload.automaticSettingsSaveRequestId);
        clearSettingsRuntimeError();
      }
      if (typeof payload.settingsSaveRequestId === "string") {
        const acknowledged = settingsDraft.acknowledge(payload.settingsSaveRequestId);
        clearSettingsRuntimeError();
        if (acknowledged && !settingsDraft.dirty)
          presetEditorDrafts.clear();
      }
      const baseSettings = settingsDraft.dirty ? state.settings : incomingState.settings;
      const nextState = {
        ...incomingState,
        settings: automaticSettingsDraft.overlay(baseSettings)
      };
      state = nextState;
      if (!settingsDraft.dirty && !settingsDraft.saving) {
        settingsDraft.synchronize(presetSettingsFingerprint(nextState.settings));
      }
      syncSettingsDraftUi();
      render({
        preserveSettingsSurface: preserveActiveSettings && settingsSurfaceStructureMatches(previousState, nextState)
      });
      return;
    }
    if (payload?.type === "generation_status") {
      clearGenerationRequestPending();
      const active = payload.active === true;
      state = {
        ...state,
        generationActive: active,
        generatingMessageId: active && typeof payload.messageId === "string" ? payload.messageId : null
      };
      renderTrackerSurfaces();
      renderChatToolbar();
      renderTopToolbarButton();
      return;
    }
    if (payload?.type === "error") {
      const saveFailed = typeof payload.requestId === "string" && settingsDraft.fail(payload.requestId);
      const automaticSaveFailed = typeof payload.requestId === "string" && automaticSettingsDraft.fail(payload.requestId);
      const pendingEditor = typeof payload.requestId === "string" ? takePendingTextEditor(payload.requestId) : null;
      const trackerEditFailed = typeof payload.requestId === "string" && trackerEditSession?.requestId === payload.requestId;
      if (trackerEditFailed && trackerEditSession)
        trackerEditSession.requestId = null;
      if (!saveFailed && !automaticSaveFailed && !pendingEditor && !trackerEditFailed)
        clearGenerationRequestPending();
      syncSettingsDraftUi();
      renderChatToolbar();
      renderTopToolbarButton();
      if (saveFailed || automaticSaveFailed) {
        tabHandle?.activate();
        showSettingsError(payload.message);
      } else if (pendingEditor?.surface === "settings") {
        showSettingsError(payload.message);
      } else {
        showTrackerError(payload.message);
      }
    }
    if (payload?.type === "text_editor_result") {
      handleTextEditorResult(payload);
    }
  });
  const offEvents = [
    ctx.events.on("CHAT_SWITCHED", () => requestState()),
    ctx.events.on("MESSAGE_EDITED", () => requestState()),
    ctx.events.on("MESSAGE_DELETED", () => requestState()),
    ctx.events.on("MESSAGE_SWIPED", () => requestState()),
    ctx.events.on("SWIPE_EDITED", () => requestState()),
    ctx.events.on("GENERATION_ENDED", () => requestState())
  ];
  rootRef.addEventListener("click", handleClick);
  rootRef.addEventListener("change", handleChange);
  rootRef.addEventListener("input", handleInput);
  rootRef.addEventListener("keydown", handleRootKeydown);
  toolbarRoot.addEventListener("click", handleClick);
  requestState();
  return () => {
    flushAutomaticSettingsSave();
    closeRegenerationModal();
    destroyTopToolbarButton();
    rootRef?.removeEventListener("click", handleClick);
    rootRef?.removeEventListener("change", handleChange);
    rootRef?.removeEventListener("input", handleInput);
    rootRef?.removeEventListener("keydown", handleRootKeydown);
    dockRootRef?.removeEventListener("click", handleClick);
    toolbarRoot.removeEventListener("click", handleClick);
    topToolbarRoot.removeEventListener("click", handleTopToolbarClick);
    topToolbarRoot.removeEventListener("pointerup", handleTopToolbarPointerUp);
    topToolbarRoot.removeEventListener("keydown", handleTopToolbarKeydown);
    offBackend();
    for (const off2 of offEvents)
      off2();
    offTabActivate();
    destroySelectHandles(drawerSelectHandles);
    drawerSelectHandles = [];
    if (drawerScrollRestoreFrame !== null)
      cancelAnimationFrame(drawerScrollRestoreFrame);
    drawerScrollRestoreFrame = null;
    tab.destroy();
    destroyDockPanel();
    removeStyle();
    ctx.dom.cleanup();
    ctxRef = null;
    rootRef = null;
    dockRootRef = null;
    toolbarRootRef = null;
    topToolbarRootRef = null;
    tabHandle = null;
    appliedTrackerPlacement = null;
    hasReceivedInitialState = false;
    drawerView = "settings";
    clearGenerationRequestPending();
    settingsRuntimeError = null;
    trackerRuntimeError = null;
    trackerEditSession = null;
    settingsDraft.reset();
    presetEditorDrafts.clear();
    automaticSettingsDraft.reset();
    pendingTextEditors.clear();
  };
}
function ensureDockPanel() {
  const ctx = ctxRef;
  if (!ctx || mergeSettings(state.settings).trackerPlacement !== "dock")
    return;
  if (dockRootRef && dockPanelHandle)
    return;
  dockRootRef?.removeEventListener("click", handleClick);
  dockRootRef?.removeEventListener("change", handleChange);
  dockRootRef?.removeEventListener("input", handleInput);
  dockPanelHandle?.destroy();
  let panel;
  try {
    const mobile = isMobileDockViewport();
    const options = {
      edge: "right",
      title: "SceneMap",
      size: 380,
      minSize: 300,
      maxSize: 620,
      resizable: true,
      startCollapsed: false,
      persistGeometry: mobile ? "tracker-mobile" : "tracker-desktop"
    };
    panel = ctx.ui.requestDockPanel(options);
  } catch (error) {
    dockPanelHandle = null;
    dockRootRef = null;
    dockPanelError = `Could not open the SceneMap panel: ${error.message}`;
    return;
  }
  dockPanelHandle = panel;
  dockPanelError = null;
  dockRootRef = panel.root;
  dockRootRef.classList.add("scenemap-lv", "scenemap-dock-root");
  dockRootRef.addEventListener("click", handleClick);
  dockRootRef.addEventListener("change", handleChange);
  dockRootRef.addEventListener("input", handleInput);
  renderDockPanel();
}
function destroyDockPanel() {
  dockRootRef?.removeEventListener("click", handleClick);
  dockRootRef?.removeEventListener("change", handleChange);
  dockRootRef?.removeEventListener("input", handleInput);
  dockPanelHandle?.destroy();
  dockRootRef = null;
  dockPanelHandle = null;
  dockPanelError = null;
}
function syncTrackerPlacement() {
  if (!hasReceivedInitialState) {
    destroyDockPanel();
    return;
  }
  const placement = mergeSettings(state.settings).trackerPlacement;
  if (placement !== appliedTrackerPlacement) {
    drawerView = placement === "drawer" ? "tracker" : "settings";
    appliedTrackerPlacement = placement;
  }
  if (placement === "drawer")
    destroyDockPanel();
  else
    ensureDockPanel();
}
function isMobileDockViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches;
}
function send(payload) {
  ctxRef?.sendToBackend(payload);
}
function requestState() {
  send({ type: "get_state" });
}
function clearGenerationRequestPending() {
  isGenerationRequestPending = false;
  if (generationRequestWatchdog)
    clearTimeout(generationRequestWatchdog);
  generationRequestWatchdog = null;
}
function beginGenerationRequest() {
  isGenerationRequestPending = true;
  if (generationRequestWatchdog)
    clearTimeout(generationRequestWatchdog);
  generationRequestWatchdog = setTimeout(() => {
    generationRequestWatchdog = null;
    if (!isGenerationRequestPending)
      return;
    trackerRuntimeError = "SceneMap did not receive a generation response. Use Cancel to safely reset it.";
    renderTrackerSurfaces();
    renderChatToolbar();
    renderTopToolbarButton();
    requestState();
  }, GENERATION_REQUEST_TIMEOUT_MS);
}
function settingsSurfaceHasActiveInteraction() {
  if (!rootRef)
    return false;
  const settingsVisible = mergeSettings(state.settings).trackerPlacement === "dock" || drawerView === "settings";
  if (!settingsVisible)
    return false;
  const activeElement = document.activeElement;
  return activeElement instanceof Element && rootRef.contains(activeElement) || rootRef.querySelector('[aria-expanded="true"]') !== null;
}
function settingsSurfaceStructureMatches(previous, next) {
  return jsonValuesEqual(previous.settings, next.settings) && jsonValuesEqual(previous.connections, next.connections);
}
function render(options = {}) {
  syncTrackerPlacement();
  renderDockPanel();
  if (!options.preserveSettingsSurface)
    renderDrawerContent();
  renderChatToolbar();
  renderTopToolbarButton();
  tabHandle?.setBadge(state.messagesBehind > 0 ? String(state.messagesBehind) : null);
}
function renderTrackerSurfaces() {
  renderDockPanel();
  if (mergeSettings(state.settings).trackerPlacement === "drawer" && drawerView === "tracker") {
    renderDrawerContent();
  }
}
function renderChatToolbar() {
  if (!toolbarRootRef)
    return;
  if (!hasReceivedInitialState) {
    toolbarRootRef.innerHTML = "";
    return;
  }
  if (!state.settings.showInputBarButton) {
    toolbarRootRef.innerHTML = "";
    return;
  }
  const isGenerating = Boolean(state.generationActive || isGenerationRequestPending);
  const isEditing = Boolean(getCurrentTrackerEditSession());
  const label = isEditing ? "Save or cancel the tracker edit first" : isGenerating ? "Cancel SceneMap generation" : state.latest ? "Regenerate SceneMap" : "Generate SceneMap";
  const isBehind = !state.latest || state.messagesBehind > 0;
  toolbarRootRef.innerHTML = `
    <button
      type="button"
      class="scenemap-chat-toolbar-btn ${isBehind ? "is-attention" : ""} ${isGenerating ? "is-generating" : ""}"
      data-action="generate"
      title="${escapeAttr(label)}"
      aria-label="${escapeAttr(label)}"
      ${state.activeMessageId && !isEditing ? "" : "disabled"}
    >
      ${isGenerating ? refreshSvg() : iconSvg}
    </button>
  `;
}
function renderDockPanel() {
  if (!dockRootRef)
    return;
  dockRootRef.innerHTML = trackerPanelMarkup();
}
function renderDrawerContent() {
  if (!rootRef)
    return;
  if (!hasReceivedInitialState) {
    destroySelectHandles(drawerSelectHandles);
    drawerSelectHandles = [];
    rootRef.innerHTML = "";
    return;
  }
  if (drawerScrollRestoreFrame !== null)
    cancelAnimationFrame(drawerScrollRestoreFrame);
  drawerScrollRestoreFrame = null;
  if (mergeSettings(state.settings).trackerPlacement === "drawer" && drawerView === "tracker") {
    destroySelectHandles(drawerSelectHandles);
    drawerSelectHandles = [];
    renderDrawerPage(trackerPanelMarkup());
    return;
  }
  if (drawerView === "macros") {
    destroySelectHandles(drawerSelectHandles);
    drawerSelectHandles = [];
    renderDrawerPage(macrosPanelMarkup());
    return;
  }
  renderDrawerSettings();
}
function renderDrawerPage(content) {
  if (!rootRef)
    return;
  let page = rootRef.firstElementChild;
  const viewSignature = availableDrawerViews().join(",");
  if (!(page instanceof HTMLElement) || !page.classList.contains("scenemap-drawer-scroll") || page.dataset.scenemapViews !== viewSignature) {
    rootRef.innerHTML = drawerPageMarkup("");
    page = rootRef.firstElementChild;
  }
  if (!(page instanceof HTMLElement))
    return;
  for (const viewName of availableDrawerViews()) {
    const active = drawerView === viewName;
    const tab = page.querySelector(`[data-action="show-${viewName}"]`);
    tab?.classList.toggle("is-active", active);
    tab?.setAttribute("aria-selected", String(active));
    tab?.setAttribute("tabindex", active ? "0" : "-1");
  }
  const view = page.querySelector(".scenemap-drawer-view");
  if (view) {
    view.setAttribute("aria-labelledby", `scenemap-tab-${drawerView}`);
    view.innerHTML = content;
  }
}
function drawerPageMarkup(content) {
  const tabs = availableDrawerViews().map((viewName) => {
    const active = drawerView === viewName;
    const label = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    return `<button type="button" id="scenemap-tab-${viewName}" role="tab" data-action="show-${viewName}" aria-controls="scenemap-tabpanel" aria-selected="${active}" tabindex="${active ? "0" : "-1"}" class="${active ? "is-active" : ""}">${label}</button>`;
  }).join("");
  return `
    <div class="scenemap-drawer-scroll" data-scenemap-views="${availableDrawerViews().join(",")}">
      <nav class="scenemap-view-tabs" role="tablist" aria-label="SceneMap sections">
        ${tabs}
      </nav>
      <div class="scenemap-drawer-view" id="scenemap-tabpanel" role="tabpanel" aria-labelledby="scenemap-tab-${drawerView}">${content}</div>
    </div>
  `;
}
function availableDrawerViews() {
  return mergeSettings(state.settings).trackerPlacement === "drawer" ? ["tracker", "settings", "macros"] : ["settings", "macros"];
}
function macrosPanelMarkup() {
  const roleplayMacros = [{
    token: "{{scenemap}}",
    description: "Latest SceneMap tracker formatted as plain text for the roleplay prompt."
  }];
  return `
    <div class="scenemap-shell scenemap-macros-shell">
      <section class="scenemap-macros-scroll">
        <header class="scenemap-reference-header">
          <span>Reference</span>
          <h2>Macros</h2>
        </header>
        ${macroReferenceSectionMarkup("Roleplay prompt", "Place this in the prompt sent to your roleplay model.", roleplayMacros)}
        ${macroReferenceSectionMarkup("SceneMap generation prompts", "Use these inside the System and User prompt templates of a SceneMap preset. Native Lumiverse macros such as {{char}} and {{user}} also work there.", SCENEMAP_PROMPT_MACROS)}
        ${macroReferenceSectionMarkup("Legacy aliases", "Older presets can keep using these aliases, but the namespaced forms above are recommended for new prompts.", LEGACY_SCENEMAP_PROMPT_MACROS)}
      </section>
    </div>
  `;
}
function macroReferenceSectionMarkup(title, help, macros) {
  return `
    <section class="scenemap-macro-section">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(help)}</p>
      <div class="scenemap-macro-list">
        ${macros.map((macro) => `
          <article class="scenemap-macro-row">
            <div class="scenemap-macro-details">
              <code>${escapeHtml(macro.token)}</code>
              <span>${escapeHtml(macro.description)}</span>
            </div>
            <button type="button" class="scenemap-icon-btn scenemap-macro-copy" data-action="copy-macro" data-copy-macro="${escapeAttr(macro.token)}" title="Copy ${escapeAttr(macro.token)}" aria-label="Copy ${escapeAttr(macro.token)}">
              ${copySvg}
            </button>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}
function trackerPanelMarkup() {
  const settings = mergeSettings(state.settings);
  const latest = state.latest;
  const schemaMatches = trackerMatchesEffectiveSchema(latest, settings);
  const editSession = getCurrentTrackerEditSession();
  const trackerValue = editSession?.draft ?? latest?.displayData ?? latest?.data;
  const trackerSchema = editSession ? getEffectiveTrackerSchema(settings) : null;
  const layout = latest && !schemaMatches ? createTrackerDataLayout(trackerValue) : getPresetLayout(settings, state.effectivePresetKey);
  return `
    <div class="scenemap-shell">
      <header class="scenemap-header">
        ${editSession ? `
          <button class="scenemap-pill-action scenemap-tracker-action scenemap-primary" data-action="save-tracker-edit" ${editSession.requestId ? "disabled" : ""}>${editSession.requestId ? "Saving..." : "Save"}</button>
          <button class="scenemap-pill-action scenemap-tracker-action" data-action="cancel-tracker-edit" ${editSession.requestId ? "disabled" : ""}>Cancel</button>
        ` : `
          <button class="scenemap-pill-action scenemap-tracker-action scenemap-primary" data-action="${latest && !state.generationActive && !isGenerationRequestPending ? "choose-regeneration" : "generate"}" ${state.activeMessageId ? "" : "disabled"}>
            ${state.generationActive || isGenerationRequestPending ? "Cancel" : latest ? "Regenerate" : "Generate"}
          </button>
          <button class="scenemap-pill-action scenemap-tracker-action" data-action="edit" ${schemaMatches && !state.generationActive && !isGenerationRequestPending ? "" : "disabled"}>Edit</button>
          <button class="scenemap-pill-action scenemap-tracker-action scenemap-danger" data-action="delete" ${latest ? "" : "disabled"}>Delete</button>
        `}
      </header>

      ${trackerRuntimeError ? `<div class="scenemap-runtime-error" role="alert" data-tracker-runtime-error>${escapeHtml(trackerRuntimeError)}</div>` : ""}

      <p class="scenemap-status is-${statusTone()}" role="status" aria-live="polite">${statusMarkup()}</p>

      <section class="scenemap-card scenemap-board ${editSession ? "is-editing" : ""}">
        ${latest ? renderTracker(trackerValue, layout, trackerSchema) : `<div class="scenemap-empty">Generate a SceneMap for this swipe</div>`}
      </section>
    </div>
  `;
}
function getEffectiveTrackerSchema(settings = mergeSettings(state.settings)) {
  return settings.schemaPresets[state.effectivePresetKey]?.value ?? settings.schemaPresets[settings.schemaPreset]?.value ?? settings.schemaPresets.default.value;
}
function trackerMatchesEffectiveSchema(latest = state.latest, settings = mergeSettings(state.settings)) {
  return Boolean(latest?.schemaHash && latest.schemaHash === schemaFingerprint(getEffectiveTrackerSchema(settings)));
}
function getCurrentTrackerEditSession() {
  const latest = state.latest;
  if (!trackerEditSession || !latest || state.chatId !== trackerEditSession.chatId || latest.messageId !== trackerEditSession.messageId || latest.swipeId !== trackerEditSession.swipeId || !trackerMatchesEffectiveSchema(latest)) {
    trackerEditSession = null;
    return null;
  }
  return trackerEditSession;
}
function renderDrawerSettings() {
  if (!rootRef)
    return;
  if (drawerScrollRestoreFrame !== null)
    cancelAnimationFrame(drawerScrollRestoreFrame);
  drawerScrollRestoreFrame = null;
  const scrollSnapshot = captureScrollPositions(rootRef);
  destroySelectHandles(drawerSelectHandles);
  drawerSelectHandles = [];
  const settings = mergeSettings(state.settings);
  const presetKeys = Object.keys(settings.schemaPresets);
  const canDeletePreset = settings.schemaPreset !== "default" && presetKeys.length > 1;
  const activePreset = settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  const presetDraft = getPresetEditorDraft(settings, settings.schemaPreset);
  const settingsMarkup = `
    <div class="scenemap-shell scenemap-settings-shell">
      <section class="scenemap-settings-scroll">
        ${dockPanelError ? `<div class="scenemap-runtime-error" role="alert">${escapeHtml(dockPanelError)}</div>` : ""}
        ${settingsRuntimeError ? `<div class="scenemap-runtime-error" role="alert" data-settings-runtime-error>${escapeHtml(settingsRuntimeError)}</div>` : ""}
        <div class="scenemap-settings-group">
          <h3>Generation</h3>
      <label>
        <span>Connection</span>
        <div class="scenemap-native-select" data-native-setting="connectionId"></div>
      </label>
      <div class="scenemap-auto-row">
        <label class="scenemap-switch-row">
          <span>Auto-generate after assistant replies</span>
          <input type="checkbox" data-setting="autoGenerateAiTrackers" ${settings.autoGenerateAiTrackers ? "checked" : ""}>
          <span class="scenemap-switch" aria-hidden="true"></span>
        </label>
        <label class="scenemap-interval-field" ${settings.autoGenerateAiTrackers ? "" : "hidden"}>
          <span>Interval</span>
          <input type="number" min="1" step="1" data-setting="autoGenerateInterval" value="${settings.autoGenerateInterval > 1 ? settings.autoGenerateInterval : ""}" placeholder="Empty = 1 = every assistant message">
        </label>
      </div>
      <label>
        <span>Max response tokens</span>
        <input type="number" min="1" step="1" data-setting="maxResponseTokens" value="${settings.maxResponseTokens}">
      </label>
      <div class="scenemap-sampler-row">
        <label>
          <span>Temperature</span>
          <input type="number" min="0" max="2" step="0.05" data-setting="temperature" value="${settings.temperature ?? ""}" placeholder="1">
        </label>
        <label>
          <span>Top P</span>
          <input type="number" min="0" max="1" step="0.05" data-setting="topP" value="${settings.topP ?? ""}" placeholder="1">
        </label>
      </div>
        </div>
        <div class="scenemap-settings-group">
          <h3>Interface</h3>
          <label>
            <span>Tracker location</span>
            <div class="scenemap-native-select" data-native-setting="trackerPlacement"></div>
          </label>
          <div class="scenemap-interface-switches">
            <label class="scenemap-switch-row">
              <span>Show top toolbar button</span>
              <input type="checkbox" data-setting="showTopToolbarButton" ${settings.showTopToolbarButton ? "checked" : ""}>
              <span class="scenemap-switch" aria-hidden="true"></span>
            </label>
            <label class="scenemap-switch-row">
              <span>Show input bar button</span>
              <input type="checkbox" data-setting="showInputBarButton" ${settings.showInputBarButton ? "checked" : ""}>
              <span class="scenemap-switch" aria-hidden="true"></span>
            </label>
          </div>
        </div>
        <div class="scenemap-settings-group scenemap-settings-preset-row">
          <div class="scenemap-settings-group-heading">
            <h3>Presets</h3>
            <p class="scenemap-settings-dirty ${settingsDraft.dirty ? "is-visible" : ""}" data-settings-dirty aria-hidden="${!settingsDraft.dirty}">Unsaved preset changes</p>
          </div>
          <div class="scenemap-preset-toolbar">
            <label class="scenemap-preset-select">
              <span>Global preset</span>
              <div class="scenemap-native-select" data-native-setting="schemaPreset"></div>
            </label>
            <div class="scenemap-settings-preset-actions">
              <button class="scenemap-pill-action" data-action="create-preset">New</button>
              <button class="scenemap-pill-action" data-action="rename-preset">Rename</button>
              <button class="scenemap-pill-action" data-action="import-preset">Import</button>
              <button class="scenemap-pill-action" data-action="export-preset">Export</button>
              <button class="scenemap-pill-action scenemap-danger" data-action="delete-preset" ${canDeletePreset ? "" : "disabled"}>Delete</button>
            </div>
          </div>
          <div class="scenemap-preset-editor">
            <label>
              <span>Schema (JSON)</span>
              <div class="scenemap-expandable-textarea">
                <textarea data-preset-editor="schema" spellcheck="false" aria-label="Schema JSON for ${escapeAttr(activePreset.name)}">${escapeHtml(presetDraft.schemaText)}</textarea>
                ${expandEditorButton("schema")}
              </div>
            </label>
            <div class="scenemap-inline-error scenemap-preset-schema-error" role="alert" data-preset-schema-error ${presetDraft.schemaError ? "" : "hidden"}>${escapeHtml(presetDraft.schemaError ?? "")}</div>
            <label>
              <span>System prompt</span>
              <div class="scenemap-expandable-textarea">
                <textarea data-preset-editor="systemPrompt" aria-label="System prompt for ${escapeAttr(activePreset.name)}" placeholder="System instructions and reference context.">${escapeHtml(presetDraft.systemPromptText)}</textarea>
                ${expandEditorButton("systemPrompt")}
              </div>
            </label>
            <label>
              <span>User prompt</span>
              <div class="scenemap-expandable-textarea">
                <textarea data-preset-editor="userPrompt" aria-label="User prompt for ${escapeAttr(activePreset.name)}" placeholder="Chat history and tracker instructions.">${escapeHtml(presetDraft.userPromptText)}</textarea>
                ${expandEditorButton("userPrompt")}
              </div>
            </label>
            <div class="scenemap-preset-layout-row">
              <button class="scenemap-pill-action" data-action="edit-layout">Layout</button>
              <button class="scenemap-pill-action scenemap-primary" data-action="save-preset" data-save-preset ${settingsDraft.saving || !settingsDraft.dirty ? "disabled" : ""}>${settingsDraft.saving ? "Saving..." : "Save preset"}</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
  renderDrawerPage(settingsMarkup);
  mountSettingsSelects(settings);
  restoreScrollPositions(scrollSnapshot);
  drawerScrollRestoreFrame = requestAnimationFrame(() => {
    drawerScrollRestoreFrame = null;
    restoreScrollPositions(scrollSnapshot);
  });
}
function mountSettingsSelects(settings) {
  if (!ctxRef || !rootRef)
    return;
  const mount2 = (key, options, value, extra = {}) => {
    const target = rootRef?.querySelector(`[data-native-setting="${key}"]`);
    if (!target || !ctxRef)
      return;
    drawerSelectHandles.push(ctxRef.components.mountSelect(target, {
      options,
      value,
      portal: true,
      triggerClassName: "scenemap-secondary-control",
      ariaLabel: key === "connectionId" ? "Connection" : key === "schemaPreset" ? "Global preset" : "Tracker location",
      onChange: (nextValue) => updateNativeSetting(key, nextValue),
      ...extra
    }));
  };
  mount2("connectionId", state.connections.map((connection) => ({
    value: connection.id,
    label: connection.name,
    sublabel: `${connection.model || connection.provider}${connection.is_default ? " · default" : ""}`
  })), settings.connectionId, {
    placeholder: "Default active connection",
    clearable: true,
    clearLabel: "Default active connection",
    searchPlaceholder: "Search connections..."
  });
  mount2("trackerPlacement", [
    { value: "dock", label: "Dock panel" },
    { value: "drawer", label: "Drawer" }
  ], settings.trackerPlacement, { searchThreshold: Number.MAX_SAFE_INTEGER });
  mount2("schemaPreset", presetSelectOptions(settings), settings.schemaPreset, { searchPlaceholder: "Search presets..." });
}
function presetSelectOptions(settings) {
  const nameCounts = new Map;
  for (const preset of Object.values(settings.schemaPresets)) {
    const name = preset.name.trim().toLocaleLowerCase();
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }
  return Object.entries(settings.schemaPresets).map(([key, preset]) => ({
    value: key,
    label: preset.name,
    sublabel: (nameCounts.get(preset.name.trim().toLocaleLowerCase()) ?? 0) > 1 ? key : undefined
  }));
}
function updateNativeSetting(key, value) {
  const settings = mergeSettings(state.settings);
  if (key === "trackerPlacement")
    settings.trackerPlacement = value === "drawer" ? "drawer" : "dock";
  else
    settings[key] = value;
  if (key === "schemaPreset") {
    updateSettingsDraft(settings);
    queueMicrotask(() => render());
    return;
  }
  state = { ...state, settings };
  queueAutomaticSettingsSave(settings, key, true);
  if (key === "trackerPlacement")
    queueMicrotask(() => render());
}
function queueAutomaticSettingsSave(settings, key, immediate) {
  automaticSettingsDraft.queue(key, settings[key]);
  if (automaticSaveTimer)
    clearTimeout(automaticSaveTimer);
  automaticSaveTimer = null;
  if (immediate) {
    flushAutomaticSettingsSave();
    return;
  }
  automaticSaveTimer = setTimeout(flushAutomaticSettingsSave, 450);
}
function flushAutomaticSettingsSave() {
  if (automaticSaveTimer)
    clearTimeout(automaticSaveTimer);
  automaticSaveTimer = null;
  const requestId = `automatic-settings-${Date.now()}-${++automaticSaveRequestSeq}`;
  const settings = automaticSettingsDraft.begin(requestId);
  if (!settings)
    return;
  send({ type: "save_automatic_settings", requestId, settings });
}
function destroySelectHandles(handles) {
  for (const handle of handles)
    handle.destroy();
}
function captureScrollPositions(root) {
  const snapshots = [];
  for (let element = root;element; element = element.parentElement) {
    snapshots.push({ element, top: element.scrollTop, left: element.scrollLeft });
  }
  return snapshots;
}
function restoreScrollPositions(snapshots) {
  for (const snapshot of snapshots) {
    if (!snapshot.element.isConnected)
      continue;
    snapshot.element.scrollTo({ top: snapshot.top, left: snapshot.left, behavior: "instant" });
  }
}
function statusText() {
  if (!state.chatId)
    return "Open a chat to start tracking";
  if (isMappingScene())
    return "Mapping this scene";
  if (getCurrentTrackerEditSession())
    return "Editing tracker — save or cancel your changes";
  if (state.latest && !state.latest.schemaMatchesCurrent)
    return "Schema changed — regenerate to update";
  const autoText = autoGenerateStatusText();
  if (autoText)
    return autoText;
  if (!state.latest)
    return "This scene is unmapped";
  if (state.messagesBehind > 0)
    return `SceneMap is ${state.messagesBehind} message${state.messagesBehind === 1 ? "" : "s"} behind`;
  return "SceneMap is updated";
}
function autoGenerateStatusText() {
  if (!state.settings.autoGenerateAiTrackers || state.autoGenerateMessagesRemaining == null)
    return null;
  if (state.autoGenerateMessagesRemaining <= 0)
    return "Auto-generation is due";
  if (state.autoGenerateMessagesRemaining === 1)
    return "Auto-generates on next assistant message";
  return `Auto-generates in ${state.autoGenerateMessagesRemaining} assistant messages`;
}
function isMappingScene() {
  return Boolean(state.generationActive || state.generatingMessageId || isGenerationRequestPending);
}
function statusTone() {
  if (!state.chatId)
    return "neutral";
  if (isMappingScene())
    return "generating";
  if (getCurrentTrackerEditSession())
    return "info";
  if (state.latest && !state.latest.schemaMatchesCurrent)
    return "warning";
  if (state.settings.autoGenerateAiTrackers && state.autoGenerateMessagesRemaining != null) {
    return state.autoGenerateMessagesRemaining <= 0 ? "warning" : "info";
  }
  if (!state.latest)
    return "neutral";
  if (state.messagesBehind > 0)
    return "warning";
  return "success";
}
function statusMarkup() {
  const indicator = `<span class="scenemap-status-indicator" aria-hidden="true"></span>`;
  if (!isMappingScene())
    return `${indicator}<span>${escapeHtml(statusText())}</span>`;
  return `${indicator}<span>Mapping this scene<span class="scenemap-loading-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span></span>`;
}
function handleClick(event) {
  const target = event.target;
  const button = target.closest("[data-action]");
  if (!button)
    return;
  const action = button.dataset.action;
  if (action === "show-tracker" && mergeSettings(state.settings).trackerPlacement === "drawer") {
    activateDrawerView("tracker");
  }
  if (action === "show-settings")
    activateDrawerView("settings");
  if (action === "show-macros")
    activateDrawerView("macros");
  if (action === "copy-macro")
    copyMacroReference(button);
  if (action === "expand-preset-editor") {
    event.preventDefault();
    const editor = button.dataset.editor;
    if (editor === "schema" || editor === "systemPrompt" || editor === "userPrompt") {
      openPresetExpandedEditor(editor);
    }
  }
  if (action === "generate") {
    const command = getGenerationButtonCommand(state.generationActive, isGenerationRequestPending);
    dispatchGeneration({ type: command });
  }
  if (action === "choose-regeneration")
    openRegenerationModal();
  if (action === "edit")
    startTrackerEdit();
  if (action === "save-tracker-edit")
    saveTrackerEdit();
  if (action === "cancel-tracker-edit")
    cancelTrackerEdit();
  if (action === "add-tracker-card")
    addTrackerEditCard(button);
  if (action === "remove-tracker-card")
    removeTrackerEditCard(button);
  if (action === "add-tracker-chip")
    addTrackerEditChip(button);
  if (action === "remove-tracker-chip")
    removeTrackerEditChip(button);
  if (action === "delete" && state.latest)
    confirmDeleteTracker();
  if (action === "create-preset" && ensureActivePresetEditorValid() && ensureCurrentPresetLayoutValid())
    createPreset();
  if (action === "rename-preset")
    renamePreset();
  if (action === "import-preset")
    importPreset();
  if (action === "export-preset" && ensureActivePresetEditorValid() && ensureCurrentPresetLayoutValid())
    exportPreset();
  if (action === "delete-preset")
    deletePreset();
  if (action === "edit-layout" && ensureActivePresetEditorValid())
    editLayout();
  if (action === "save-preset") {
    flushAutomaticSettingsSave();
    if (!preparePresetDraftsForSave())
      return;
    const requestId = `settings-${Date.now()}-${++settingsSaveRequestSeq}`;
    if (!settingsDraft.beginSave(requestId))
      return;
    renderDrawerSettings();
    send({ type: "save_preset_settings", requestId, settings: state.settings });
  }
}
function startTrackerEdit() {
  const latest = state.latest;
  const chatId = state.chatId;
  if (!latest || !trackerMatchesEffectiveSchema(latest) || !chatId || state.generationActive || isGenerationRequestPending)
    return;
  clearTrackerRuntimeError();
  trackerEditSession = {
    chatId,
    messageId: latest.messageId,
    swipeId: latest.swipeId,
    baseline: cloneTrackerEditValue(latest.data),
    draft: cloneTrackerEditValue(latest.data),
    requestId: null
  };
  renderTrackerEditSurface({ focusFirstControl: true });
  renderChatToolbar();
  renderTopToolbarButton();
}
function saveTrackerEdit() {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId)
    return;
  clearTrackerRuntimeError();
  try {
    const validated = validateTrackerData(session.draft, getEffectiveTrackerSchema(), "Edited tracker");
    session.draft = cloneTrackerEditValue(validated);
  } catch (error) {
    showTrackerError(error.message);
    return;
  }
  const requestId = `tracker-edit-${Date.now()}-${++trackerEditRequestSeq}`;
  session.requestId = requestId;
  renderTrackerEditSurface();
  send({
    type: "edit_tracker",
    requestId,
    chatId: session.chatId,
    messageId: session.messageId,
    swipeId: session.swipeId,
    expectedData: session.baseline,
    data: session.draft
  });
}
function cancelTrackerEdit() {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId)
    return;
  trackerEditSession = null;
  clearTrackerRuntimeError();
  renderTrackerEditSurface();
  renderChatToolbar();
  renderTopToolbarButton();
}
function addTrackerEditCard(button) {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId)
    return;
  const path = readTrackerEditPath(button.dataset.editPath);
  const itemSchema = path ? getTrackerSchemaAtPath(getEffectiveTrackerSchema(), [...path, 0]) : null;
  if (!path || !itemSchema || !appendTrackerArrayItem(session.draft, path, createTrackerEditDefaultValue(itemSchema)))
    return;
  renderTrackerEditSurface({ focusLastCardName: true });
}
function removeTrackerEditCard(button) {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId)
    return;
  const path = readTrackerEditPath(button.dataset.editPath);
  const index2 = Number(button.dataset.editIndex);
  if (!path || !Number.isSafeInteger(index2) || !removeTrackerArrayItem(session.draft, path, index2))
    return;
  renderTrackerEditSurface();
}
function addTrackerEditChip(button) {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId)
    return;
  const path = readTrackerEditPath(button.dataset.editPath);
  const itemSchema = path ? getTrackerSchemaAtPath(getEffectiveTrackerSchema(), [...path, 0]) : null;
  if (!path || !itemSchema || !appendTrackerArrayItem(session.draft, path, createTrackerEditDefaultValue(itemSchema)))
    return;
  renderTrackerEditSurface({ focusLastChip: true });
}
function removeTrackerEditChip(button) {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId)
    return;
  const path = readTrackerEditPath(button.dataset.editPath);
  const index2 = Number(button.dataset.editIndex);
  if (!path || !Number.isSafeInteger(index2) || !removeTrackerArrayItem(session.draft, path, index2))
    return;
  renderTrackerEditSurface();
}
function renderTrackerEditSurface(options = {}) {
  const root = mergeSettings(state.settings).trackerPlacement === "drawer" ? rootRef : dockRootRef;
  const scrollSnapshot = root ? captureScrollPositions(root) : [];
  if (drawerScrollRestoreFrame !== null)
    cancelAnimationFrame(drawerScrollRestoreFrame);
  drawerScrollRestoreFrame = null;
  renderTrackerSurfaces();
  restoreScrollPositions(scrollSnapshot);
  drawerScrollRestoreFrame = requestAnimationFrame(() => {
    drawerScrollRestoreFrame = null;
    restoreScrollPositions(scrollSnapshot);
    const currentRoot = mergeSettings(state.settings).trackerPlacement === "drawer" ? rootRef : dockRootRef;
    if (options.focusFirstControl) {
      currentRoot?.querySelector("[data-tracker-edit-control]")?.focus();
    } else if (options.focusLastCardName) {
      const names = currentRoot?.querySelectorAll(".scenemap-character-name-edit [data-tracker-edit-control]");
      names?.item(names.length - 1)?.focus();
    } else if (options.focusLastChip) {
      const chips = currentRoot?.querySelectorAll("[data-tracker-edit-chip]");
      chips?.item(chips.length - 1)?.focus();
    }
  });
}
function reconcileTrackerEditSession(incomingState, payload) {
  const session = trackerEditSession;
  if (!session)
    return;
  if (typeof payload?.trackerEditRequestId === "string" && payload.trackerEditRequestId === session.requestId) {
    trackerEditSession = null;
    trackerRuntimeError = null;
    return;
  }
  const latest = incomingState.latest;
  if (incomingState.chatId !== session.chatId || !latest || latest.messageId !== session.messageId || latest.swipeId !== session.swipeId || !latest.schemaMatchesCurrent) {
    trackerEditSession = null;
    return;
  }
  if (!jsonValuesEqual(latest.data, session.baseline)) {
    trackerEditSession = null;
    trackerRuntimeError = "This tracker changed while it was being edited. Open Edit again to use the newest values.";
  }
}
function dispatchGeneration(payload) {
  clearTrackerRuntimeError();
  beginGenerationRequest();
  renderTrackerSurfaces();
  renderChatToolbar();
  send(payload);
}
function openRegenerationModal() {
  const ctx = ctxRef;
  const latest = state.latest;
  if (!ctx || !latest || state.generationActive || isGenerationRequestPending)
    return;
  closeRegenerationModal();
  const snapshot = {
    messageId: latest.messageId,
    swipeId: latest.swipeId,
    data: latest.data,
    schemaMatchesCurrent: latest.schemaMatchesCurrent
  };
  const fields = snapshot.schemaMatchesCurrent ? collectRegeneratableFields(snapshot.data) : [];
  let modal;
  try {
    modal = ctx.ui.showModal({
      title: "Regenerate SceneMap",
      width: 560,
      maxHeight: 680
    });
  } catch (error) {
    showTrackerError(error.message);
    return;
  }
  regenerationModalHandle = modal;
  const root = modal.root;
  root.classList.add("scenemap-editor", "scenemap-regeneration-modal");
  const modeName = `scenemap-regeneration-mode-${modal.modalId}`;
  const fieldMarkup = renderRegenerationFieldChoices(fields);
  root.innerHTML = `
    <div class="scenemap-regeneration-options">
      <label class="scenemap-regeneration-mode is-entire">
        <input type="radio" name="${escapeAttr(modeName)}" value="entire" checked>
        <span>
          <strong>Entire tracker</strong>
          <small>Regenerate everything and advance the tracker to the latest assistant reply.</small>
        </span>
      </label>
      <label class="scenemap-regeneration-mode">
        <input type="radio" name="${escapeAttr(modeName)}" value="fields" ${fields.length > 0 ? "" : "disabled"}>
        <span>
          <strong>Selected fields</strong>
          <small>Replace only the checked values in this tracker.</small>
        </span>
      </label>
      ${snapshot.schemaMatchesCurrent ? `<div class="scenemap-regeneration-fields">${fieldMarkup || `<p class="scenemap-regeneration-note">This tracker has no individual values to select.</p>`}</div>` : `<p class="scenemap-regeneration-note is-warning">This tracker uses another or unknown schema. Regenerate the entire tracker before updating individual fields.</p>`}
      <label class="scenemap-regeneration-feedback" hidden>
        <span>Feedback for the AI <small>Optional</small></span>
        <textarea data-regeneration-feedback maxlength="4000" rows="3" placeholder="Explain what is wrong and how this field should be corrected."></textarea>
      </label>
    </div>
    <div class="scenemap-inline-error" role="alert" data-regeneration-error hidden></div>
    <div class="scenemap-modal-actions">
      <span class="scenemap-modal-spacer"></span>
      <button type="button" class="scenemap-pill-action" data-regeneration-action="cancel">Cancel</button>
      <button type="button" class="scenemap-pill-action scenemap-primary" data-regeneration-action="submit">Regenerate</button>
    </div>
  `;
  const syncControls = () => {
    const mode = root.querySelector(`input[name="${CSS.escape(modeName)}"]:checked`)?.value ?? "entire";
    const selectedCount = root.querySelectorAll("[data-regeneration-field]:checked").length;
    root.classList.toggle("is-selecting-fields", mode === "fields");
    const feedbackField = root.querySelector(".scenemap-regeneration-feedback");
    const feedbackInput = root.querySelector("[data-regeneration-feedback]");
    if (feedbackField)
      feedbackField.hidden = mode !== "fields";
    if (feedbackInput)
      feedbackInput.disabled = mode !== "fields";
    const submit = root.querySelector('[data-regeneration-action="submit"]');
    if (submit) {
      submit.disabled = mode === "fields" && selectedCount === 0;
      submit.textContent = mode === "fields" ? selectedCount > 0 ? `Regenerate selected (${selectedCount})` : "Regenerate selected" : "Regenerate";
    }
  };
  const handleChange = (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement))
      return;
    if (input.matches("[data-regeneration-field]")) {
      const fieldsMode = root.querySelector(`input[name="${CSS.escape(modeName)}"][value="fields"]`);
      if (fieldsMode && !fieldsMode.disabled)
        fieldsMode.checked = true;
    }
    syncControls();
  };
  const handleModalClick = (event) => {
    const button = event.target.closest("[data-regeneration-action]");
    if (!button)
      return;
    if (button.dataset.regenerationAction === "cancel") {
      modal.dismiss();
      return;
    }
    if (button.dataset.regenerationAction !== "submit")
      return;
    const currentLatest = state.latest;
    const errorNode = root.querySelector("[data-regeneration-error]");
    if (!currentLatest || currentLatest.messageId !== snapshot.messageId || currentLatest.swipeId !== snapshot.swipeId) {
      if (errorNode) {
        errorNode.textContent = "The active tracker changed while this window was open. Close it and choose the fields again.";
        errorNode.hidden = false;
      }
      return;
    }
    const mode = root.querySelector(`input[name="${CSS.escape(modeName)}"]:checked`)?.value ?? "entire";
    if (mode === "entire") {
      modal.dismiss();
      dispatchGeneration({ type: "generate_tracker" });
      return;
    }
    const paths = Array.from(root.querySelectorAll("[data-regeneration-field]:checked")).map((input) => Number(input.dataset.regenerationField)).filter((index2) => Number.isSafeInteger(index2) && fields[index2]).map((index2) => fields[index2].path);
    const feedback = root.querySelector("[data-regeneration-feedback]")?.value ?? "";
    if (paths.length === 0) {
      syncControls();
      return;
    }
    modal.dismiss();
    dispatchGeneration({
      type: "regenerate_fields",
      messageId: snapshot.messageId,
      swipeId: snapshot.swipeId,
      paths,
      feedback
    });
  };
  root.addEventListener("change", handleChange);
  root.addEventListener("click", handleModalClick);
  modal.onDismiss(() => {
    root.removeEventListener("change", handleChange);
    root.removeEventListener("click", handleModalClick);
    if (regenerationModalHandle === modal)
      regenerationModalHandle = null;
  });
  syncControls();
}
function renderRegenerationFieldChoices(fields) {
  const groups = new Map;
  fields.forEach((field, index2) => {
    const labels = field.groups.length > 0 ? field.groups : ["Tracker"];
    const key = JSON.stringify(labels);
    const group = groups.get(key) ?? { labels, fields: [] };
    group.fields.push({ field, index: index2 });
    groups.set(key, group);
  });
  return Array.from(groups.values()).map((group) => `
    <section class="scenemap-regeneration-group">
      <h3>${escapeHtml(group.labels.join(" › "))}</h3>
      ${group.fields.map(({ field, index: index2 }) => `
        <label class="scenemap-regeneration-field">
          <input type="checkbox" data-regeneration-field="${index2}">
          <span>
            <strong>${escapeHtml(field.label)}</strong>
            <small>${escapeHtml(regenerationValuePreview(field.currentValue))}</small>
          </span>
        </label>
      `).join("")}
    </section>
  `).join("");
}
function regenerationValuePreview(value) {
  const formatted = formatDisplayValue(value).replace(/\s+/g, " ").trim();
  if (!formatted)
    return "Empty";
  return formatted.length > 140 ? `${formatted.slice(0, 137)}...` : formatted;
}
function closeRegenerationModal() {
  const modal = regenerationModalHandle;
  regenerationModalHandle = null;
  modal?.dismiss();
}
function activateDrawerView(view, focusTab = false) {
  drawerView = view;
  renderDrawerContent();
  if (focusTab) {
    queueMicrotask(() => rootRef?.querySelector(`[data-action="show-${view}"]`)?.focus());
  }
}
function handleRootKeydown(event) {
  const tab = event.target.closest('.scenemap-view-tabs [role="tab"]');
  if (!tab)
    return;
  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
  if (!keys.includes(event.key))
    return;
  event.preventDefault();
  const views = availableDrawerViews();
  const currentView = tab.dataset.action?.replace(/^show-/, "");
  const currentIndex = currentView ? views.indexOf(currentView) : -1;
  if (currentIndex < 0)
    return;
  const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? views.length - 1 : event.key === "ArrowLeft" ? (currentIndex - 1 + views.length) % views.length : (currentIndex + 1) % views.length;
  const nextView = views[nextIndex];
  activateDrawerView(nextView, true);
}
async function copyMacroReference(button) {
  const value = button.dataset.copyMacro;
  if (!value || !(button instanceof HTMLButtonElement))
    return;
  button.disabled = true;
  const originalTitle = `Copy ${value}`;
  try {
    await copyTextToClipboard(value);
    button.innerHTML = checkSvg;
    button.classList.add("is-copied");
    button.title = `Copied ${value}`;
    button.setAttribute("aria-label", button.title);
    window.setTimeout(() => {
      if (!button.isConnected)
        return;
      button.innerHTML = copySvg;
      button.classList.remove("is-copied");
      button.title = originalTitle;
      button.setAttribute("aria-label", originalTitle);
    }, 1500);
  } catch {
    button.title = "Could not copy macro";
    button.setAttribute("aria-label", button.title);
  } finally {
    button.disabled = false;
  }
}
async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  try {
    if (!document.execCommand("copy"))
      throw new Error("The browser refused the copy command.");
  } finally {
    textarea.remove();
  }
}
async function confirmDeleteTracker() {
  const chatId = state.chatId;
  const messageId = state.latest?.messageId;
  if (!chatId || !messageId)
    return;
  const result = await ctxRef?.ui.showConfirm({
    title: "Delete SceneMap",
    message: "Delete the tracker for this scene? You can generate it again later.",
    variant: "danger",
    confirmLabel: "Delete"
  });
  if (!result?.confirmed || state.chatId !== chatId || state.latest?.messageId !== messageId)
    return;
  clearTrackerRuntimeError();
  send({ type: "delete_tracker", messageId });
}
function updateSettingsDraft(settings) {
  clearSettingsRuntimeError();
  state = { ...state, settings };
  settingsDraft.update(presetSettingsFingerprint(settings));
  syncSettingsDraftUi();
}
function presetSettingsFingerprint(settings) {
  const invalidSchemaDrafts = Object.fromEntries(Array.from(presetEditorDrafts.entries()).filter(([, draft]) => draft.schemaError !== null).sort(([left], [right]) => left.localeCompare(right)).map(([key, draft]) => [key, draft.schemaText]));
  return schemaFingerprint({
    schemaPreset: settings.schemaPreset,
    schemaPresets: settings.schemaPresets,
    invalidSchemaDrafts
  });
}
function refreshSettingsDraftFingerprint(settings = state.settings) {
  clearSettingsRuntimeError();
  settingsDraft.update(presetSettingsFingerprint(settings));
  syncSettingsDraftUi();
}
function syncSettingsDraftUi() {
  const indicator = rootRef?.querySelector("[data-settings-dirty]");
  indicator?.classList.toggle("is-visible", settingsDraft.dirty);
  indicator?.setAttribute("aria-hidden", String(!settingsDraft.dirty));
  const saveButton = rootRef?.querySelector("[data-save-preset]");
  if (saveButton) {
    saveButton.disabled = settingsDraft.saving || !settingsDraft.dirty;
    saveButton.textContent = settingsDraft.saving ? "Saving..." : "Save preset";
  }
}
function getPresetEditorDraft(settings, key) {
  const existing = presetEditorDrafts.get(key);
  if (existing)
    return existing;
  const preset = settings.schemaPresets[key] ?? settings.schemaPresets.default;
  const draft = {
    schemaText: JSON.stringify(preset.value, null, 2),
    systemPromptText: getPresetSystemPrompt(settings, key),
    userPromptText: getPresetUserPrompt(settings, key),
    schemaError: null
  };
  presetEditorDrafts.set(key, draft);
  return draft;
}
function parseSchemaEditorText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Schema JSON must be an object.");
  }
  const schema = parsed;
  validateSchemaDefinition(schema);
  return schema;
}
function updatePresetEditorControl(target) {
  const editor = target.dataset.presetEditor;
  if (editor !== "schema" && editor !== "systemPrompt" && editor !== "userPrompt")
    return;
  updatePresetEditorValue(editor, target.value);
}
function updatePresetEditorValue(editor, value) {
  const settings = mergeSettings(state.settings);
  const key = settings.schemaPreset;
  const preset = settings.schemaPresets[key] ?? settings.schemaPresets.default;
  const draft = getPresetEditorDraft(settings, key);
  if (editor === "systemPrompt" || editor === "userPrompt") {
    const isSystem = editor === "systemPrompt";
    const nextPrompt = value;
    if (isSystem)
      draft.systemPromptText = value;
    else
      draft.userPromptText = value;
    const currentPrompt = isSystem ? getPresetSystemPrompt(settings, key) : getPresetUserPrompt(settings, key);
    if (nextPrompt !== currentPrompt) {
      settings.schemaPresets[key] = isSystem ? { ...preset, systemPrompt: nextPrompt } : { ...preset, userPrompt: nextPrompt };
      updateSettingsDraft(settings);
    } else {
      refreshSettingsDraftFingerprint(settings);
    }
    return;
  }
  draft.schemaText = value;
  try {
    const schema = parseSchemaEditorText(value);
    setPresetSchemaError(draft, null);
    if (!jsonValuesEqual(schema, preset.value)) {
      settings.schemaPresets[key] = { ...preset, value: schema };
      updateSettingsDraft(settings);
    } else {
      refreshSettingsDraftFingerprint(settings);
    }
  } catch (error) {
    setPresetSchemaError(draft, error.message);
    refreshSettingsDraftFingerprint(settings);
  }
}
function expandEditorButton(editor) {
  const label = editor === "schema" ? "Schema JSON" : editor === "systemPrompt" ? "System prompt" : "User prompt";
  return `
    <button
      type="button"
      class="scenemap-expand-editor-btn"
      data-action="expand-preset-editor"
      data-editor="${editor}"
      title="Expand editor"
      aria-label="Expand ${label} editor"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/>
      </svg>
    </button>
  `;
}
function openPresetExpandedEditor(editor) {
  const settings = mergeSettings(state.settings);
  const draft = getPresetEditorDraft(settings, settings.schemaPreset);
  const title = editor === "schema" ? "SceneMap Schema JSON" : editor === "systemPrompt" ? "SceneMap System Prompt" : "SceneMap User Prompt";
  const value = editor === "schema" ? draft.schemaText : editor === "systemPrompt" ? draft.systemPromptText : draft.userPromptText;
  openTextEditor(title, value, (nextValue) => {
    updatePresetEditorValue(editor, nextValue);
    renderDrawerSettings();
  }, "settings");
}
function setPresetSchemaError(draft, message) {
  draft.schemaError = message;
  const error = rootRef?.querySelector("[data-preset-schema-error]");
  if (!error)
    return;
  error.hidden = !message;
  error.textContent = message ?? "";
}
function applyPresetEditorDraft(settings, key) {
  const draft = presetEditorDrafts.get(key);
  const preset = settings.schemaPresets[key];
  if (!draft || !preset)
    return;
  try {
    const schema = parseSchemaEditorText(draft.schemaText);
    draft.schemaError = null;
    settings.schemaPresets[key] = {
      ...preset,
      value: schema,
      systemPrompt: draft.systemPromptText,
      userPrompt: draft.userPromptText
    };
  } catch (error) {
    draft.schemaError = error.message;
    throw error;
  }
}
function ensureActivePresetEditorValid() {
  const settings = mergeSettings(state.settings);
  const key = settings.schemaPreset;
  try {
    applyPresetEditorDraft(settings, key);
    state = { ...state, settings };
    const draft = presetEditorDrafts.get(key);
    if (draft)
      setPresetSchemaError(draft, null);
    return true;
  } catch {
    const draft = presetEditorDrafts.get(key);
    if (draft)
      setPresetSchemaError(draft, draft.schemaError);
    return false;
  }
}
function preparePresetDraftsForSave() {
  const settings = mergeSettings(state.settings);
  for (const key of presetEditorDrafts.keys()) {
    if (!settings.schemaPresets[key])
      continue;
    try {
      applyPresetEditorDraft(settings, key);
    } catch {
      settings.schemaPreset = key;
      state = { ...state, settings };
      renderDrawerSettings();
      return false;
    }
  }
  state = { ...state, settings };
  for (const key of Object.keys(settings.schemaPresets)) {
    try {
      validatePresetLayout(settings, key);
    } catch (error) {
      const presetName = settings.schemaPresets[key]?.name ?? key;
      showSettingsError(`Layout for preset "${presetName}" needs attention: ${error.message}`);
      return false;
    }
  }
  return true;
}
function validatePresetLayout(settings, key) {
  const preset = settings.schemaPresets[key] ?? settings.schemaPresets.default;
  const layout = cloneLayout(getPresetLayout(settings, key));
  validateLayout(layout, extractSchemaFieldOptions(preset.value));
}
function ensureCurrentPresetLayoutValid() {
  const settings = mergeSettings(state.settings);
  try {
    validatePresetLayout(settings, settings.schemaPreset);
    return true;
  } catch (error) {
    showSettingsError(`Layout needs attention: ${error.message}`);
    return false;
  }
}
function handleChange(event) {
  const target = event.target;
  if (target.dataset.trackerEditControl) {
    updateTrackerEditControl(target);
    return;
  }
  const key = target.dataset.setting;
  if (!isAutomaticallySavedSetting(key))
    return;
  updateSettingFromControl(target, key, true);
}
function handleInput(event) {
  const target = event.target;
  if (target.dataset.trackerEditControl) {
    updateTrackerEditControl(target);
    return;
  }
  if (target.dataset.presetEditor) {
    updatePresetEditorControl(target);
    return;
  }
  const key = target.dataset.setting;
  if (!isAutomaticallySavedSetting(key) || target.type === "checkbox")
    return;
  updateSettingFromControl(target, key, false);
}
function updateTrackerEditControl(target) {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId)
    return;
  const path = readTrackerEditPath(target.dataset.editPath);
  const kind = target.dataset.editKind;
  if (!path || !kind)
    return;
  const schema = getTrackerSchemaAtPath(getEffectiveTrackerSchema(), path);
  const value = parseTrackerEditValue(kind, target.value, schema);
  if (!setTrackerValueAtPath(session.draft, path, value)) {
    showTrackerError("This field cannot be edited safely.");
  }
}
function readTrackerEditPath(value) {
  if (!value)
    return null;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed))
      return null;
    return parsed.every((part) => typeof part === "string" || Number.isSafeInteger(part) && part >= 0) ? parsed : null;
  } catch {
    return null;
  }
}
function trackerEditPathAttr(path) {
  return escapeAttr(JSON.stringify(path));
}
function isAutomaticallySavedSetting(key) {
  return key === "connectionId" || key === "autoGenerateAiTrackers" || key === "autoGenerateInterval" || key === "maxResponseTokens" || key === "temperature" || key === "topP" || key === "showInputBarButton" || key === "showTopToolbarButton" || key === "trackerPlacement";
}
function updateSettingFromControl(target, key, immediate) {
  const settings = mergeSettings(state.settings);
  clearSettingsRuntimeError();
  if (key === "autoGenerateAiTrackers") {
    settings.autoGenerateAiTrackers = target.checked;
  } else if (key === "showInputBarButton") {
    settings.showInputBarButton = target.checked;
  } else if (key === "showTopToolbarButton") {
    settings.showTopToolbarButton = target.checked;
  } else if (key === "trackerPlacement") {
    settings.trackerPlacement = target.value === "drawer" ? "drawer" : "dock";
  } else if (key === "autoGenerateInterval") {
    settings.autoGenerateInterval = Math.max(1, Math.floor(Number(target.value) || 1));
  } else if (key === "temperature" || key === "topP") {
    const value = target.value.trim();
    const parsed = Number(value);
    const maximum = key === "temperature" ? 2 : 1;
    const normalized = value === "" || !Number.isFinite(parsed) ? null : Math.max(0, Math.min(maximum, parsed));
    settings[key] = normalized;
    if (normalized !== null && normalized !== parsed)
      target.value = String(normalized);
  } else if (key === "maxResponseTokens") {
    const value = target.value.trim();
    if (value === "" && !immediate)
      return;
    const normalized = value === "" ? defaultSettings.maxResponseTokens : Math.max(1, Math.floor(Number(value) || 1));
    settings.maxResponseTokens = normalized;
    if (value === "" || Number(value) !== normalized)
      target.value = String(normalized);
  } else {
    settings[key] = target.value;
  }
  state = { ...state, settings };
  queueAutomaticSettingsSave(settings, key, immediate);
  if (key === "autoGenerateAiTrackers") {
    const intervalField = rootRef?.querySelector(".scenemap-interval-field");
    if (intervalField)
      intervalField.hidden = !settings.autoGenerateAiTrackers;
  }
  if (key === "showInputBarButton")
    renderChatToolbar();
  if (key === "showTopToolbarButton")
    renderTopToolbarButton();
  if (key === "trackerPlacement")
    render();
}
function createPreset() {
  const settings = mergeSettings(state.settings);
  const activePreset = settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  openNameEditor("New Preset", "", "Create preset", (name) => {
    ensureUniquePresetName(settings, name);
    const key = uniquePresetKey(slugifyPresetName(name), settings.schemaPresets);
    settings.schemaPresets[key] = {
      name,
      value: JSON.parse(JSON.stringify(activePreset.value)),
      systemPrompt: getPresetSystemPrompt(settings),
      userPrompt: getPresetUserPrompt(settings),
      displayLayout: cloneLayout(getPresetLayout(settings))
    };
    updateSettingsDraft({ ...settings, schemaPreset: key });
    render();
  });
}
function renamePreset() {
  const settings = mergeSettings(state.settings);
  const key = settings.schemaPreset;
  const preset = settings.schemaPresets[key] ?? settings.schemaPresets.default;
  openNameEditor("Rename Preset", preset.name, "Save", (name) => {
    if (name === preset.name)
      return;
    ensureUniquePresetName(settings, name, key);
    settings.schemaPresets[key] = { ...preset, name };
    updateSettingsDraft(settings);
    render();
  });
}
async function deletePreset() {
  const settings = mergeSettings(state.settings);
  const key = settings.schemaPreset;
  if (key === "default")
    return;
  const preset = settings.schemaPresets[key];
  if (!preset || Object.keys(settings.schemaPresets).length <= 1)
    return;
  const result = await ctxRef?.ui.showConfirm({
    title: "Delete Preset",
    message: `Delete "${preset.name}"?`,
    variant: "danger",
    confirmLabel: "Delete"
  });
  if (!result?.confirmed)
    return;
  delete settings.schemaPresets[key];
  presetEditorDrafts.delete(key);
  const fallbackKey = settings.schemaPresets.default ? "default" : Object.keys(settings.schemaPresets)[0];
  updateSettingsDraft({ ...settings, schemaPreset: fallbackKey });
  render();
}
function exportPreset() {
  const settings = mergeSettings(state.settings);
  const preset = settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  const data = {
    type: "scenemap-preset",
    version: 2,
    name: preset.name,
    schema: preset.value,
    systemPrompt: getPresetSystemPrompt(settings),
    userPrompt: getPresetUserPrompt(settings),
    layout: getPresetLayout(settings)
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugifyPresetName(preset.name)}.scenemap-preset.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
async function importPreset() {
  const ctx = ctxRef;
  if (!ctx)
    return;
  try {
    const files = await ctx.uploads.pickFile({
      accept: [".json", "application/json"],
      multiple: false,
      maxSizeBytes: 512000
    });
    const file = files?.[0];
    if (!file)
      return;
    const text = new TextDecoder().decode(file.bytes);
    const imported = parsePresetImport(JSON.parse(text), file.name);
    openNameEditor("Import Preset", imported.name, "Import", (name) => {
      const settings = mergeSettings(state.settings);
      ensureUniquePresetName(settings, name);
      const key = uniquePresetKey(slugifyPresetName(name), settings.schemaPresets);
      settings.schemaPresets[key] = {
        name,
        value: imported.schema,
        systemPrompt: imported.systemPrompt,
        userPrompt: imported.userPrompt,
        displayLayout: imported.layout
      };
      settings.schemaPreset = key;
      updateSettingsDraft(settings);
      render();
    });
  } catch (err) {
    showSettingsError(err.message || "Could not import preset.");
  }
}
function parsePresetImport(value, filename) {
  const record = getRecord3(value);
  if (record.type !== "scenemap-preset")
    throw new Error("This is not a SceneMap preset file.");
  const schema = getRecord3(record.schema);
  if (Object.keys(schema).length === 0)
    throw new Error("Preset file is missing a schema object.");
  validateSchemaDefinition(schema);
  const isVersionTwo = Number(record.version) >= 2;
  if (isVersionTwo && (typeof record.systemPrompt !== "string" || typeof record.userPrompt !== "string")) {
    throw new Error("Preset file is missing its System or User prompt.");
  }
  if (!isVersionTwo && typeof record.prompt !== "string") {
    throw new Error("Preset file is missing a prompt string.");
  }
  const layout = normalizeImportedLayout(record.layout);
  validateLayout(layout, extractSchemaFieldOptions(schema));
  return {
    name: typeof record.name === "string" && record.name.trim() ? record.name.trim() : filename.replace(/\.json$/i, "").replace(/\.scenemap-preset$/i, ""),
    schema,
    systemPrompt: isVersionTwo ? record.systemPrompt : DEFAULT_SYSTEM_PROMPT,
    userPrompt: isVersionTwo ? record.userPrompt : migrateLegacyUserPrompt(record.prompt, 0),
    layout
  };
}
function normalizeImportedLayout(value) {
  const record = getRecord3(value);
  if (!Array.isArray(record.sections))
    throw new Error("Preset file is missing a layout sections array.");
  return {
    sections: record.sections.map((section) => {
      const sectionRecord = getRecord3(section);
      if (!Array.isArray(sectionRecord.fields))
        throw new Error("Every layout section must include a fields array.");
      return {
        title: typeof sectionRecord.title === "string" ? sectionRecord.title : "",
        fields: sectionRecord.fields.map(normalizeImportedField)
      };
    })
  };
}
function normalizeImportedField(value) {
  const record = getRecord3(value);
  const display = typeof record.display === "string" && isTrackerFieldDisplay(record.display) ? record.display : "text";
  return {
    path: typeof record.path === "string" ? record.path : "",
    label: typeof record.label === "string" ? record.label : undefined,
    display,
    center: record.center === true,
    fields: Array.isArray(record.fields) ? record.fields.map(normalizeImportedField) : undefined
  };
}
function isTrackerFieldDisplay(value) {
  return ["text", "subtle", "mono", "chips", "progress", "character_cards"].includes(value);
}
function openNameEditor(title, initialValue, submitLabel, onSave) {
  const ctx = ctxRef;
  if (!ctx)
    return;
  const modal = ctx.ui.showModal({ title, width: 420, maxHeight: 260 });
  modal.root.innerHTML = `
    <div class="scenemap-name-editor">
      <label>
        <span>Name</span>
        <input data-name-input value="${escapeAttr(initialValue)}" placeholder="Preset name">
      </label>
      <div class="scenemap-modal-actions">
        <button class="scenemap-pill-action" data-modal-action="cancel">Cancel</button>
        <button class="scenemap-pill-action scenemap-primary" data-modal-action="save">${escapeHtml(submitLabel)}</button>
      </div>
      <div class="scenemap-inline-error" role="alert" hidden></div>
    </div>
  `;
  const input = modal.root.querySelector("[data-name-input]");
  const error = modal.root.querySelector(".scenemap-inline-error");
  input.focus();
  input.select();
  const save2 = () => {
    const name = input.value.trim();
    if (!name)
      throw new Error("Preset name is required.");
    onSave(name);
    modal.dismiss();
  };
  modal.root.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing)
      return;
    const target = event.target;
    if (target !== input && !target.closest('[data-modal-action="save"]'))
      return;
    event.preventDefault();
    try {
      save2();
    } catch (err) {
      error.hidden = false;
      error.textContent = err.message;
    }
  });
  modal.root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-modal-action]");
    if (!button)
      return;
    if (button.dataset.modalAction === "cancel") {
      modal.dismiss();
      return;
    }
    try {
      save2();
    } catch (err) {
      error.hidden = false;
      error.textContent = err.message;
    }
  });
}
function slugifyPresetName(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return slug || "preset";
}
function uniquePresetKey(base, presets) {
  let key = base;
  let index2 = 2;
  while (Object.prototype.hasOwnProperty.call(presets, key)) {
    key = `${base}_${index2}`;
    index2 += 1;
  }
  return key;
}
function ensureUniquePresetName(settings, name, ignoredKey) {
  const normalizedName = name.trim().toLocaleLowerCase();
  const duplicate = Object.entries(settings.schemaPresets).some(([key, preset]) => key !== ignoredKey && preset.name.trim().toLocaleLowerCase() === normalizedName);
  if (duplicate)
    throw new Error(`A preset named "${name.trim()}" already exists.`);
}
function editLayout() {
  const settings = mergeSettings(state.settings);
  const key = settings.schemaPreset;
  const preset = settings.schemaPresets[key] ?? settings.schemaPresets.default;
  const fieldOptions = extractSchemaFieldOptions(preset.value);
  const originalLayout = cloneLayout(getPresetLayout(settings, key));
  const workingLayout = cloneLayout(originalLayout);
  const ctx = ctxRef;
  if (!ctx)
    return;
  const modal = ctx.ui.showModal({ title: "SceneMap Layout", width: 860, maxHeight: 760 });
  const modalScroller = modal.root.parentElement;
  const previousOverflowAnchor = modalScroller?.style.overflowAnchor ?? "";
  if (modalScroller)
    modalScroller.style.overflowAnchor = "none";
  let layoutSelectHandles = [];
  let layoutSortables = [];
  let scrollRestoreFrame = null;
  const draw = (preserveScroll = true) => {
    const scroller = modal.root.querySelector(".scenemap-layout-sections");
    const scrollTop = preserveScroll ? scroller?.scrollTop ?? 0 : 0;
    const modalScrollTop = preserveScroll ? modalScroller?.scrollTop ?? 0 : 0;
    const modalScrollLeft = preserveScroll ? modalScroller?.scrollLeft ?? 0 : 0;
    if (scrollRestoreFrame !== null) {
      cancelAnimationFrame(scrollRestoreFrame);
      scrollRestoreFrame = null;
    }
    destroyLayoutSortables(layoutSortables);
    layoutSortables = [];
    destroySelectHandles(layoutSelectHandles);
    layoutSelectHandles = [];
    modal.root.innerHTML = renderLayoutEditor(workingLayout, fieldOptions);
    const nextScroller = modal.root.querySelector(".scenemap-layout-sections");
    if (nextScroller)
      nextScroller.scrollTop = scrollTop;
    layoutSelectHandles = mountLayoutSelects(modal.root, workingLayout, fieldOptions, draw);
    layoutSortables = mountLayoutSortables(modal.root, workingLayout, draw);
    if (preserveScroll && modalScroller) {
      modalScroller.scrollTo({ top: modalScrollTop, left: modalScrollLeft, behavior: "instant" });
      scrollRestoreFrame = requestAnimationFrame(() => {
        scrollRestoreFrame = null;
        if (!modal.root.isConnected)
          return;
        modalScroller.scrollTo({ top: modalScrollTop, left: modalScrollLeft, behavior: "instant" });
        if (nextScroller)
          nextScroller.scrollTop = scrollTop;
      });
    }
  };
  modal.onDismiss(() => {
    if (modalScroller)
      modalScroller.style.overflowAnchor = previousOverflowAnchor;
    if (scrollRestoreFrame !== null)
      cancelAnimationFrame(scrollRestoreFrame);
    scrollRestoreFrame = null;
    destroyLayoutSortables(layoutSortables);
    layoutSortables = [];
    destroySelectHandles(layoutSelectHandles);
    layoutSelectHandles = [];
  });
  draw(false);
  modal.root.addEventListener("input", (event) => {
    const target = event.target;
    const sectionIndex = readIndex(target.dataset.section);
    const fieldIndex = readIndex(target.dataset.field);
    const childIndex = readIndex(target.dataset.child);
    if (target.dataset.layoutInput === "section-title" && sectionIndex !== null) {
      workingLayout.sections[sectionIndex].title = target.value;
    }
    if (target.dataset.layoutInput === "field-label" && sectionIndex !== null && fieldIndex !== null) {
      workingLayout.sections[sectionIndex].fields[fieldIndex].label = target.value;
    }
    if (target.dataset.layoutInput === "child-label" && sectionIndex !== null && fieldIndex !== null && childIndex !== null) {
      const field = workingLayout.sections[sectionIndex].fields[fieldIndex];
      if (field.fields?.[childIndex])
        field.fields[childIndex].label = target.value;
    }
  });
  modal.root.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown")
      return;
    const handle = event.target.closest("[data-layout-drag]");
    if (!handle)
      return;
    const kind = handle.dataset.layoutDrag;
    if (!kind)
      return;
    const sectionIndex = readIndex(handle.dataset.section);
    const fieldIndex = readIndex(handle.dataset.field);
    const childIndex = readIndex(handle.dataset.child);
    const currentIndex = kind === "section" ? sectionIndex : kind === "field" ? fieldIndex : childIndex;
    if (currentIndex === null)
      return;
    event.preventDefault();
    const nextIndex = currentIndex + (event.key === "ArrowUp" ? -1 : 1);
    const itemCount = getLayoutItemCount(workingLayout, kind, sectionIndex, fieldIndex);
    if (!reorderLayoutItem(workingLayout, kind, currentIndex, nextIndex, sectionIndex, fieldIndex)) {
      announceLayoutReorder(modal.root, kind, currentIndex, itemCount, true);
      return;
    }
    draw();
    focusLayoutDragHandle(modal.root, kind, nextIndex, sectionIndex, fieldIndex);
    queueMicrotask(() => announceLayoutReorder(modal.root, kind, nextIndex, itemCount));
  });
  modal.root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-layout-action]");
    if (!button)
      return;
    const sectionIndex = readIndex(button.dataset.section);
    const fieldIndex = readIndex(button.dataset.field);
    const childIndex = readIndex(button.dataset.child);
    const action = button.dataset.layoutAction;
    try {
      if (action === "add-section")
        workingLayout.sections.push({ title: "New Section", fields: [] });
      if (action === "remove-section" && sectionIndex !== null)
        workingLayout.sections.splice(sectionIndex, 1);
      if (action === "add-field" && sectionIndex !== null) {
        workingLayout.sections[sectionIndex].fields.push(createFieldFromOption(getAvailableFieldOptions(workingLayout, fieldOptions)[0]));
      }
      if (action === "remove-field" && sectionIndex !== null && fieldIndex !== null) {
        workingLayout.sections[sectionIndex].fields.splice(fieldIndex, 1);
      }
      if (action === "add-child" && sectionIndex !== null && fieldIndex !== null) {
        const field = workingLayout.sections[sectionIndex].fields[fieldIndex];
        const parentOption = findFieldOption(fieldOptions, field.path);
        field.fields = field.fields ?? [];
        field.fields.push(createFieldFromOption(getAvailableChildOptions(field, parentOption?.children ?? [])[0]));
      }
      if (action === "remove-child" && sectionIndex !== null && fieldIndex !== null && childIndex !== null) {
        workingLayout.sections[sectionIndex].fields[fieldIndex].fields?.splice(childIndex, 1);
      }
      if (action === "cancel") {
        modal.dismiss();
        return;
      }
      if (action === "save-layout") {
        validateLayout(workingLayout, fieldOptions);
        if (jsonValuesEqual(workingLayout, originalLayout)) {
          modal.dismiss();
          return;
        }
        settings.schemaPresets[key] = { ...preset, displayLayout: cloneLayout(workingLayout) };
        updateSettingsDraft(settings);
        render();
        modal.dismiss();
        return;
      }
      draw();
    } catch (err) {
      const error = modal.root.querySelector(".scenemap-inline-error");
      if (error) {
        error.hidden = false;
        error.textContent = err.message;
      }
    }
  });
}
function renderLayoutEditor(layout, options) {
  const hasAvailableFields = getAvailableFieldOptions(layout, options).length > 0;
  return `
    <div class="scenemap-layout-editor">
      <div class="scenemap-layout-intro">
        <button type="button" class="scenemap-layout-add-btn" data-layout-action="add-section" ${hasAvailableFields ? "" : "disabled"}>${layoutIcon("plus")}<span>Add section</span></button>
      </div>
      <div class="scenemap-layout-sections" data-layout-sortable="section">
        ${layout.sections.map((section, sectionIndex) => renderLayoutSection(section, sectionIndex, layout, options)).join("")}
      </div>
      <div class="scenemap-modal-actions">
        <span class="scenemap-modal-spacer"></span>
        <button type="button" class="scenemap-pill-action" data-layout-action="cancel">Cancel</button>
        <button type="button" class="scenemap-pill-action scenemap-primary" data-layout-action="save-layout">Save</button>
      </div>
      <div class="scenemap-inline-error" role="alert" hidden></div>
      <p class="scenemap-sr-only" aria-live="polite" data-layout-announcer></p>
    </div>
  `;
}
function renderLayoutSection(section, sectionIndex, layout, options) {
  const hasAvailableFields = getAvailableFieldOptions(layout, options).length > 0;
  return `
    <section class="scenemap-layout-section" data-layout-section-item>
      <header class="scenemap-layout-section-header">
        <label>
          <span>Section name</span>
          <input data-layout-input="section-title" data-section="${sectionIndex}" value="${escapeAttr(section.title)}">
        </label>
        <div class="scenemap-layout-actions">
          ${iconButton("remove-section", "Remove section", "trash", { section: sectionIndex })}
          ${layoutDragHandle("section", "Drag to reorder section", { section: sectionIndex })}
        </div>
      </header>
      <div class="scenemap-layout-fields" data-layout-sortable="field" data-section="${sectionIndex}">
        ${section.fields.map((field, fieldIndex) => renderLayoutField(field, sectionIndex, fieldIndex, options)).join("")}
      </div>
      <button type="button" class="scenemap-layout-add-btn" data-layout-action="add-field" data-section="${sectionIndex}" ${hasAvailableFields ? "" : "disabled"}>${layoutIcon("plus")}<span>Add field</span></button>
    </section>
  `;
}
function renderLayoutField(field, sectionIndex, fieldIndex, options) {
  const option2 = findFieldOption(options, field.path);
  const missingFromSchema = !option2;
  const childEditor = field.display === "character_cards" ? renderChildFieldEditor(field, option2?.children ?? [], sectionIndex, fieldIndex) : "";
  return `
    <article class="scenemap-layout-field ${missingFromSchema ? "is-missing-schema-field" : ""}" data-layout-field-item>
      <div class="scenemap-layout-field-row ${field.display === "chips" ? "has-chip-center" : ""}">
        ${layoutDragHandle("field", "Drag to reorder field", { section: sectionIndex, field: fieldIndex })}
        <div class="scenemap-native-select" data-layout-select="field-path" data-section="${sectionIndex}" data-field="${fieldIndex}"></div>
        <input aria-label="Label" data-layout-input="field-label" data-section="${sectionIndex}" data-field="${fieldIndex}" value="${escapeAttr(field.label ?? option2?.label ?? "")}" placeholder="Label">
        <div class="scenemap-layout-display-controls ${field.display === "chips" ? "has-center-select" : ""}">
          <div class="scenemap-native-select" data-layout-select="field-display" data-section="${sectionIndex}" data-field="${fieldIndex}"></div>
          ${field.display === "chips" ? `<div class="scenemap-native-select" data-layout-select="field-center" data-section="${sectionIndex}" data-field="${fieldIndex}"></div>` : ""}
        </div>
        ${iconButton("remove-field", "Remove field", "trash", { section: sectionIndex, field: fieldIndex })}
      </div>
      ${missingFromSchema ? `<div class="scenemap-layout-schema-warning" role="status">Field “${escapeHtml(field.path)}” no longer exists in this schema.</div>` : ""}
      ${childEditor}
    </article>
  `;
}
function renderChildFieldEditor(field, options, sectionIndex, fieldIndex) {
  const children = field.fields ?? [];
  const hasAvailableChildren = getAvailableChildOptions(field, options).length > 0;
  return `
    <div class="scenemap-layout-child-box">
      <div class="scenemap-layout-child-header">
        <strong>Card fields</strong>
        <button type="button" class="scenemap-layout-add-btn" data-layout-action="add-child" data-section="${sectionIndex}" data-field="${fieldIndex}" ${hasAvailableChildren ? "" : "disabled"}>${layoutIcon("plus")}<span>Add card field</span></button>
      </div>
      <div class="scenemap-layout-child-list" data-layout-sortable="child" data-section="${sectionIndex}" data-field="${fieldIndex}">
        ${children.map((child, childIndex) => renderChildField(child, childIndex, sectionIndex, fieldIndex, options)).join("")}
      </div>
    </div>
  `;
}
function renderChildField(child, childIndex, sectionIndex, fieldIndex, options) {
  const missingFromSchema = !findFieldOption(options, child.path);
  return `
    <div class="scenemap-layout-child ${missingFromSchema ? "is-missing-schema-field" : ""}" data-layout-child-item>
      <div class="scenemap-layout-child-row ${child.display === "chips" ? "has-chip-center" : ""}">
        ${layoutDragHandle("child", "Drag to reorder card field", { section: sectionIndex, field: fieldIndex, child: childIndex })}
        <div class="scenemap-native-select" data-layout-select="child-path" data-section="${sectionIndex}" data-field="${fieldIndex}" data-child="${childIndex}"></div>
        <input aria-label="Card field label" data-layout-input="child-label" data-section="${sectionIndex}" data-field="${fieldIndex}" data-child="${childIndex}" value="${escapeAttr(child.label ?? "")}" placeholder="Label">
        <div class="scenemap-layout-display-controls ${child.display === "chips" ? "has-center-select" : ""}">
          <div class="scenemap-native-select" data-layout-select="child-display" data-section="${sectionIndex}" data-field="${fieldIndex}" data-child="${childIndex}"></div>
          ${child.display === "chips" ? `<div class="scenemap-native-select" data-layout-select="child-center" data-section="${sectionIndex}" data-field="${fieldIndex}" data-child="${childIndex}"></div>` : ""}
        </div>
        ${iconButton("remove-child", "Remove card field", "trash", { section: sectionIndex, field: fieldIndex, child: childIndex })}
      </div>
      ${missingFromSchema ? `<div class="scenemap-layout-schema-warning" role="status">Card field “${escapeHtml(child.path)}” no longer exists in this schema.</div>` : ""}
    </div>
  `;
}
function renderTopToolbarButton() {
  const root = topToolbarRootRef;
  if (!root)
    return;
  if (!hasReceivedInitialState || !state.settings.showTopToolbarButton) {
    resetTopToolbarTapState();
    root.replaceChildren();
    return;
  }
  const isGenerating = Boolean(state.generationActive || isGenerationRequestPending);
  const isEditing = Boolean(getCurrentTrackerEditSession());
  const status = getTopToolbarStatus(state, isGenerationRequestPending);
  const actionLabel = isEditing ? "Save or cancel the tracker edit first" : isGenerating ? "Cancel SceneMap generation" : state.latest ? "Regenerate SceneMap" : "Generate SceneMap";
  const accessibleLabel = `${actionLabel} — ${status.text}`;
  root.innerHTML = `
    <button
      type="button"
      class="scenemap-top-toolbar-btn is-${status.tone} ${isGenerating ? "is-generating" : ""}"
      data-scenemap-top-toolbar-button
      title="${escapeAttr(`${accessibleLabel} — Double-click to open tracker`)}"
      aria-label="${escapeAttr(accessibleLabel)}"
      ${isEditing || !state.activeMessageId && !isGenerating ? "disabled" : ""}
    >
      <span class="scenemap-top-toolbar-dot" aria-hidden="true"></span>
      <span class="scenemap-top-toolbar-icon" aria-hidden="true">${isGenerating ? refreshSvg() : iconSvg}</span>
    </button>
  `;
}
function handleTopToolbarPointerUp(event) {
  const pointerEvent = event;
  const button = event.target.closest("[data-scenemap-top-toolbar-button]");
  if (!button || button.disabled || !pointerEvent.isPrimary || pointerEvent.button !== 0)
    return;
  topToolbarSuppressClickUntil = performance.now() + 800;
  const delay = pointerEvent.pointerType === "touch" || pointerEvent.pointerType === "pen" ? TOP_TOOLBAR_DOUBLE_TOUCH_MS : TOP_TOOLBAR_DOUBLE_CLICK_MS;
  scheduleTopToolbarTap(delay);
}
function handleTopToolbarClick(event) {
  const button = event.target.closest("[data-scenemap-top-toolbar-button]");
  if (!button || button.disabled)
    return;
  if (performance.now() < topToolbarSuppressClickUntil) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  scheduleTopToolbarTap(TOP_TOOLBAR_DOUBLE_CLICK_MS);
}
function handleTopToolbarKeydown(event) {
  const keyboardEvent = event;
  const button = event.target.closest("[data-scenemap-top-toolbar-button]");
  if (!button || button.disabled || keyboardEvent.key !== "Enter" && keyboardEvent.key !== " ")
    return;
  event.preventDefault();
  topToolbarSuppressClickUntil = performance.now() + 800;
  if (topToolbarTapTimer)
    clearTimeout(topToolbarTapTimer);
  topToolbarTapTimer = null;
  runTopToolbarPrimaryAction();
}
function scheduleTopToolbarTap(delay) {
  if (topToolbarTapTimer) {
    clearTimeout(topToolbarTapTimer);
    topToolbarTapTimer = null;
    if (topToolbarOpenTimer)
      clearTimeout(topToolbarOpenTimer);
    topToolbarOpenTimer = setTimeout(() => {
      topToolbarOpenTimer = null;
      openTrackerSurface();
    }, 0);
    return;
  }
  topToolbarTapTimer = setTimeout(() => {
    topToolbarTapTimer = null;
    runTopToolbarPrimaryAction();
  }, delay);
}
function runTopToolbarPrimaryAction() {
  const button = topToolbarRootRef?.querySelector("[data-scenemap-top-toolbar-button]");
  if (!button || button.disabled)
    return;
  const command = getGenerationButtonCommand(state.generationActive, isGenerationRequestPending);
  dispatchGeneration({ type: command });
}
function openTrackerSurface() {
  if (mergeSettings(state.settings).trackerPlacement === "drawer") {
    drawerView = "tracker";
    tabHandle?.activate();
    renderDrawerContent();
    return;
  }
  ensureDockPanel();
  dockPanelHandle?.expand();
  renderDockPanel();
}
function resetTopToolbarTapState() {
  if (topToolbarTapTimer)
    clearTimeout(topToolbarTapTimer);
  topToolbarTapTimer = null;
  if (topToolbarOpenTimer)
    clearTimeout(topToolbarOpenTimer);
  topToolbarOpenTimer = null;
  topToolbarSuppressClickUntil = Number.NEGATIVE_INFINITY;
}
function destroyTopToolbarButton() {
  resetTopToolbarTapState();
  topToolbarRootRef?.replaceChildren();
}
function getDisplayOptions(allowCards) {
  const displays = [
    { value: "text", label: "Text" },
    { value: "subtle", label: "Subtle" },
    { value: "mono", label: "Mono" },
    { value: "chips", label: "Chips" },
    { value: "progress", label: "Progress" }
  ];
  if (allowCards)
    displays.push({ value: "character_cards", label: "Cards" });
  return displays;
}
function mountLayoutSelects(root, layout, options, redraw) {
  const ctx = ctxRef;
  if (!ctx)
    return [];
  const handles = [];
  for (const target of root.querySelectorAll("[data-layout-select]")) {
    const kind = target.dataset.layoutSelect;
    const sectionIndex = readIndex(target.dataset.section);
    const fieldIndex = readIndex(target.dataset.field);
    const childIndex = readIndex(target.dataset.child);
    if (sectionIndex === null || fieldIndex === null)
      continue;
    const field = layout.sections[sectionIndex]?.fields[fieldIndex];
    if (!field)
      continue;
    let value = "";
    let selectOptions = [];
    let ariaLabel = "Layout option";
    let searchable = false;
    if (kind === "field-path") {
      value = field.path;
      ariaLabel = "Field";
      searchable = true;
      selectOptions = getAvailableFieldOptions(layout, options, field.path).map((option2) => ({
        value: option2.path,
        label: option2.label,
        sublabel: option2.path
      }));
    } else if (kind === "field-display") {
      const option2 = findFieldOption(options, field.path);
      value = field.display ?? option2?.display ?? "text";
      ariaLabel = "Display";
      selectOptions = getDisplayOptions(!!option2?.children?.length);
    } else if (kind === "field-center") {
      value = field.center === true ? "yes" : "no";
      ariaLabel = "Center chips";
      selectOptions = getChipCenterOptions();
    } else if (kind === "child-path" && childIndex !== null) {
      const child = field.fields?.[childIndex];
      if (!child)
        continue;
      const parentOption = findFieldOption(options, field.path);
      value = child.path;
      ariaLabel = "Card field";
      searchable = true;
      selectOptions = getAvailableChildOptions(field, parentOption?.children ?? [], child.path).map((option2) => ({
        value: option2.path,
        label: option2.label,
        sublabel: option2.path
      }));
    } else if (kind === "child-display" && childIndex !== null) {
      const child = field.fields?.[childIndex];
      if (!child)
        continue;
      value = child.display ?? "text";
      ariaLabel = "Card field display";
      selectOptions = getDisplayOptions(false);
    } else if (kind === "child-center" && childIndex !== null) {
      const child = field.fields?.[childIndex];
      if (!child)
        continue;
      value = child.center === true ? "yes" : "no";
      ariaLabel = "Center card field chips";
      selectOptions = getChipCenterOptions();
    } else {
      continue;
    }
    handles.push(ctx.components.mountSelect(target, {
      options: selectOptions,
      value,
      portal: true,
      triggerClassName: "scenemap-secondary-control",
      ariaLabel,
      searchThreshold: searchable ? 8 : Number.MAX_SAFE_INTEGER,
      searchPlaceholder: searchable ? "Search fields..." : undefined,
      onChange: (nextValue) => {
        if (kind === "field-path") {
          const option2 = findFieldOption(options, nextValue);
          field.path = nextValue;
          field.label = option2?.label ?? humanizeTrackerKey(nextValue.split(".").pop() || nextValue);
          field.display = option2?.display ?? "text";
          field.fields = option2?.children?.slice(0, 4).map((child) => ({
            path: child.path,
            label: child.label,
            display: child.display === "character_cards" ? "text" : child.display
          }));
        } else if (kind === "field-display") {
          field.display = nextValue;
        } else if (kind === "field-center") {
          field.center = nextValue === "yes";
          return;
        } else if (kind === "child-path" && childIndex !== null && field.fields?.[childIndex]) {
          const parentOption = findFieldOption(options, field.path);
          const option2 = parentOption?.children?.find((child) => child.path === nextValue);
          field.fields[childIndex].path = nextValue;
          field.fields[childIndex].label = option2?.label ?? humanizeTrackerKey(nextValue.split(".").pop() || nextValue);
          field.fields[childIndex].display = option2?.display === "character_cards" ? "text" : option2?.display ?? "text";
        } else if (kind === "child-display" && childIndex !== null && field.fields?.[childIndex]) {
          field.fields[childIndex].display = nextValue;
        } else if (kind === "child-center" && childIndex !== null && field.fields?.[childIndex]) {
          field.fields[childIndex].center = nextValue === "yes";
          return;
        }
        queueMicrotask(() => redraw());
      }
    }));
  }
  return handles;
}
function getChipCenterOptions() {
  return [
    { value: "yes", label: "Center - Yes" },
    { value: "no", label: "Center - No" }
  ];
}
function mountLayoutSortables(root, layout, redraw) {
  const instances = [];
  const scrollContainer = root.querySelector(".scenemap-layout-sections");
  for (const container of root.querySelectorAll("[data-layout-sortable]")) {
    const kind = container.dataset.layoutSortable;
    if (!kind)
      continue;
    const draggable = kind === "section" ? "> [data-layout-section-item]" : kind === "field" ? "> [data-layout-field-item]" : "> [data-layout-child-item]";
    instances.push(sortable_esm_default.create(container, {
      draggable,
      handle: `.scenemap-layout-drag-handle[data-layout-drag="${kind}"]`,
      direction: "vertical",
      animation: prefersReducedMotion() ? 0 : 170,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
      delay: 200,
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      fallbackTolerance: 4,
      forceFallback: true,
      fallbackOnBody: true,
      scroll: scrollContainer ?? true,
      bubbleScroll: false,
      scrollSensitivity: 24,
      scrollSpeed: 8,
      ghostClass: "scenemap-layout-drag-ghost",
      chosenClass: "scenemap-layout-drag-chosen",
      dragClass: "scenemap-layout-drag-active",
      fallbackClass: "scenemap-layout-drag-fallback",
      onStart: (event) => {
        document.body.classList.add("scenemap-layout-is-dragging");
        event.item.querySelector(".scenemap-layout-drag-handle")?.setAttribute("aria-grabbed", "true");
      },
      onEnd: (event) => {
        document.body.classList.remove("scenemap-layout-is-dragging");
        event.item.querySelector(".scenemap-layout-drag-handle")?.setAttribute("aria-grabbed", "false");
        if (event.oldIndex === undefined || event.newIndex === undefined || event.oldIndex === event.newIndex)
          return;
        const sectionIndex = readIndex(container.dataset.section);
        const fieldIndex = readIndex(container.dataset.field);
        if (!reorderLayoutItem(layout, kind, event.oldIndex, event.newIndex, sectionIndex, fieldIndex)) {
          queueMicrotask(() => redraw());
          return;
        }
        queueMicrotask(() => {
          reindexLayoutEditor(root);
          announceLayoutReorder(root, kind, event.newIndex, getLayoutItemCount(layout, kind, sectionIndex, fieldIndex));
        });
      },
      onUnchoose: () => {
        document.body.classList.remove("scenemap-layout-is-dragging");
      }
    }));
  }
  return instances;
}
function reindexLayoutEditor(root) {
  const sectionsContainer = root.querySelector('[data-layout-sortable="section"]');
  if (!sectionsContainer)
    return;
  const sections = getDirectLayoutItems(sectionsContainer, "data-layout-section-item");
  sections.forEach((section, sectionIndex) => {
    setLayoutDataIndex(section, "section", sectionIndex);
    const fieldsContainer = section.querySelector(':scope > [data-layout-sortable="field"]');
    if (!fieldsContainer)
      return;
    const fields = getDirectLayoutItems(fieldsContainer, "data-layout-field-item");
    fields.forEach((field, fieldIndex) => {
      setLayoutDataIndex(field, "field", fieldIndex);
      const childrenContainer = field.querySelector('[data-layout-sortable="child"]');
      if (!childrenContainer)
        return;
      const children = getDirectLayoutItems(childrenContainer, "data-layout-child-item");
      children.forEach((child, childIndex) => setLayoutDataIndex(child, "child", childIndex));
    });
  });
}
function getDirectLayoutItems(container, attribute) {
  return Array.from(container.children).filter((element) => element instanceof HTMLElement && element.hasAttribute(attribute));
}
function setLayoutDataIndex(root, key, index2) {
  const attribute = `data-${key}`;
  if (root.hasAttribute(attribute))
    root.dataset[key] = String(index2);
  for (const element of root.querySelectorAll(`[${attribute}]`)) {
    element.dataset[key] = String(index2);
  }
}
function destroyLayoutSortables(instances) {
  document.body.classList.remove("scenemap-layout-is-dragging");
  for (const instance of instances)
    instance.destroy();
}
function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getLayoutItemCount(layout, kind, sectionIndex, fieldIndex) {
  if (kind === "section")
    return layout.sections.length;
  if (sectionIndex === null)
    return 0;
  const section = layout.sections[sectionIndex];
  if (!section)
    return 0;
  if (kind === "field")
    return section.fields.length;
  if (fieldIndex === null)
    return 0;
  return section.fields[fieldIndex]?.fields?.length ?? 0;
}
function announceLayoutReorder(root, kind, index2, count, boundary = false) {
  const announcer = root.querySelector("[data-layout-announcer]");
  if (!announcer)
    return;
  const item = kind === "section" ? "Section" : kind === "field" ? "Field" : "Card field";
  announcer.textContent = boundary ? `${item} is already at the ${index2 === 0 ? "first" : "last"} position.` : `${item} moved to position ${index2 + 1} of ${count}.`;
}
function reorderLayoutItem(layout, kind, from, to, sectionIndex, fieldIndex) {
  if (kind === "section")
    return moveItem(layout.sections, from, to);
  if (sectionIndex === null)
    return false;
  const section = layout.sections[sectionIndex];
  if (!section)
    return false;
  if (kind === "field")
    return moveItem(section.fields, from, to);
  if (fieldIndex === null)
    return false;
  const children = section.fields[fieldIndex]?.fields;
  return children ? moveItem(children, from, to) : false;
}
function focusLayoutDragHandle(root, kind, itemIndex, sectionIndex, fieldIndex) {
  const selector = kind === "section" ? `[data-layout-drag="section"][data-section="${itemIndex}"]` : kind === "field" && sectionIndex !== null ? `[data-layout-drag="field"][data-section="${sectionIndex}"][data-field="${itemIndex}"]` : kind === "child" && sectionIndex !== null && fieldIndex !== null ? `[data-layout-drag="child"][data-section="${sectionIndex}"][data-field="${fieldIndex}"][data-child="${itemIndex}"]` : "";
  if (selector)
    queueMicrotask(() => root.querySelector(selector)?.focus());
}
function extractSchemaFieldOptions(schema) {
  const normalized = normalizeSchemaForLayout(schema, schema);
  const properties = getSchemaProperties(normalized);
  if (!properties)
    return [];
  return Object.entries(properties).flatMap(([key, value]) => schemaToOptions(value, key, key, schema));
}
var MAX_LAYOUT_SCHEMA_DEPTH = 20;
function schemaToOptions(schema, path, labelSeed, rootSchema, seenRefs = new Set, depth = 0) {
  const source = getRecord3(schema);
  const ref = typeof source.$ref === "string" && source.$ref.startsWith("#/") ? source.$ref : null;
  if (depth >= MAX_LAYOUT_SCHEMA_DEPTH || ref && seenRefs.has(ref)) {
    return [{ path, label: schemaLabel(source, labelSeed), display: defaultDisplayForSchema(source, path) }];
  }
  const nextSeenRefs = ref ? new Set(seenRefs).add(ref) : seenRefs;
  const record = normalizeSchemaForLayout(schema, rootSchema, seenRefs);
  const type = record.type;
  if (type === "array") {
    const itemSource = getRecord3(record.items);
    const itemRef = typeof itemSource.$ref === "string" && itemSource.$ref.startsWith("#/") ? itemSource.$ref : null;
    if (itemRef && nextSeenRefs.has(itemRef)) {
      return [{ path, label: schemaLabel(record, labelSeed), display: "chips" }];
    }
    const itemSeenRefs = itemRef ? new Set(nextSeenRefs).add(itemRef) : nextSeenRefs;
    const items = normalizeSchemaForLayout(record.items, rootSchema, nextSeenRefs);
    const itemProperties = getSchemaProperties(items);
    if (itemProperties) {
      return [{
        path,
        label: schemaLabel(record, labelSeed),
        display: "character_cards",
        children: Object.entries(itemProperties).flatMap(([key, value]) => schemaToOptions(value, key, key, rootSchema, itemSeenRefs, depth + 1))
      }];
    }
    return [{ path, label: schemaLabel(record, labelSeed), display: "chips" }];
  }
  const properties = getSchemaProperties(record);
  if (properties) {
    return Object.entries(properties).flatMap(([key, value]) => schemaToOptions(value, `${path}.${key}`, key, rootSchema, nextSeenRefs, depth + 1));
  }
  return [{ path, label: schemaLabel(record, labelSeed), display: defaultDisplayForSchema(record, path) }];
}
function normalizeSchemaForLayout(schema, rootSchema, seenRefs = new Set) {
  const source = getRecord3(schema);
  let normalized = { ...source };
  const ref = typeof source.$ref === "string" ? source.$ref : null;
  if (ref?.startsWith("#/") && !seenRefs.has(ref)) {
    const resolved = resolveLocalLayoutRef(rootSchema, ref);
    if (resolved) {
      const nextSeen = new Set(seenRefs).add(ref);
      normalized = mergeLayoutSchemas(normalizeSchemaForLayout(resolved, rootSchema, nextSeen), normalized);
    }
  }
  for (const keyword of ["allOf", "oneOf", "anyOf"]) {
    const variants = source[keyword];
    if (!Array.isArray(variants))
      continue;
    for (const variant of variants) {
      normalized = mergeLayoutSchemas(normalized, normalizeSchemaForLayout(variant, rootSchema, seenRefs));
    }
  }
  return normalized;
}
function mergeLayoutSchemas(left, right) {
  const leftProperties = getSchemaProperties(left);
  const rightProperties = getSchemaProperties(right);
  return {
    ...left,
    ...right,
    ...leftProperties || rightProperties ? { properties: { ...leftProperties ?? {}, ...rightProperties ?? {} } } : {}
  };
}
function resolveLocalLayoutRef(rootSchema, ref) {
  let current = rootSchema;
  for (const token of ref.slice(2).split("/")) {
    if (!current || typeof current !== "object" || Array.isArray(current))
      return null;
    const key = token.replaceAll("~1", "/").replaceAll("~0", "~");
    current = current[key];
  }
  return current;
}
function getSchemaProperties(schema) {
  const record = getRecord3(schema);
  return record.properties && typeof record.properties === "object" && !Array.isArray(record.properties) ? record.properties : null;
}
function schemaLabel(schema, fallback) {
  return typeof schema.title === "string" && schema.title.trim() ? schema.title.trim() : humanizeTrackerKey(fallback.split(".").pop() || fallback);
}
function defaultDisplayForSchema(schema, path) {
  if (schema.type === "array")
    return "chips";
  if (/posture|interaction|notes?|description/i.test(path))
    return "mono";
  if (/tone|time|state|hair|makeup/i.test(path))
    return "subtle";
  return "text";
}
function findFieldOption(options, path) {
  return options.find((option2) => option2.path === path);
}
function getAvailableFieldOptions(layout, options, currentPath) {
  const used = new Set;
  for (const section of layout.sections) {
    for (const field of section.fields) {
      if (field.path && field.path !== currentPath)
        used.add(field.path);
    }
  }
  const available = options.filter((option2) => !used.has(option2.path));
  if (currentPath && !available.some((option2) => option2.path === currentPath)) {
    available.unshift({ path: currentPath, label: `${humanizeTrackerKey(currentPath.split(".").pop() || currentPath)} (missing from schema)`, display: "text" });
  }
  return available;
}
function getAvailableChildOptions(parent, options, currentPath) {
  const used = new Set((parent.fields ?? []).map((field) => field.path).filter((path) => path && path !== currentPath));
  const available = options.filter((option2) => !used.has(option2.path));
  if (currentPath && !available.some((option2) => option2.path === currentPath)) {
    available.unshift({ path: currentPath, label: `${humanizeTrackerKey(currentPath.split(".").pop() || currentPath)} (missing from schema)`, display: "text" });
  }
  return available;
}
function createFieldFromOption(option2, maxChildren = 4) {
  if (!option2)
    return { path: "", label: "", display: "text" };
  return {
    path: option2.path,
    label: option2.label,
    display: option2.display,
    fields: option2.display === "character_cards" ? option2.children?.slice(0, maxChildren).map((child) => ({ path: child.path, label: child.label, display: child.display === "character_cards" ? "text" : child.display })) : undefined
  };
}
function createSchemaDefaultLayout(schema) {
  if (JSON.stringify(schema) === JSON.stringify(DEFAULT_SCHEMA_VALUE))
    return cloneLayout(DEFAULT_DISPLAY_LAYOUT);
  const options = extractSchemaFieldOptions(schema);
  const title = typeof schema.title === "string" && schema.title.trim() ? schema.title.trim() : "Scene";
  return {
    sections: [{
      title,
      fields: options.map((option2) => createFieldFromOption(option2, Number.POSITIVE_INFINITY))
    }]
  };
}
function cloneLayout(layout) {
  return JSON.parse(JSON.stringify(layout));
}
function moveItem(items, from, to) {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to)
    return false;
  const [item] = items.splice(from, 1);
  items.splice(to, 0, item);
  return true;
}
function readIndex(value) {
  if (value === undefined)
    return null;
  const index2 = Number(value);
  return Number.isInteger(index2) && index2 >= 0 ? index2 : null;
}
function validateLayout(layout, options) {
  if (!layout.sections.length)
    throw new Error("Add at least one section.");
  for (const section of layout.sections) {
    section.title = section.title.trim();
    section.fields = section.fields.filter((field) => field.path.trim());
    for (const field of section.fields) {
      field.path = field.path.trim();
      const option2 = findFieldOption(options, field.path);
      if (!option2)
        throw new Error(`Field "${field.path}" no longer exists in the current schema.`);
      if (Object.prototype.hasOwnProperty.call(field, "label"))
        field.label = field.label?.trim() ?? "";
      field.fields = field.fields?.filter((child) => child.path.trim()).map((child) => ({
        ...child,
        path: child.path.trim(),
        label: Object.prototype.hasOwnProperty.call(child, "label") ? child.label?.trim() ?? "" : undefined,
        center: child.display === "chips" ? child.center === true : undefined
      }));
      for (const child of field.fields ?? []) {
        if (!findFieldOption(option2.children ?? [], child.path)) {
          throw new Error(`Card field "${child.path}" no longer exists under "${field.path}" in the current schema.`);
        }
      }
      field.center = field.display === "chips" ? field.center === true : undefined;
    }
  }
}
function layoutDragHandle(kind, label, indexes) {
  const data = [
    `data-layout-drag="${kind}"`,
    `data-section="${indexes.section}"`,
    indexes.field !== undefined ? `data-field="${indexes.field}"` : "",
    indexes.child !== undefined ? `data-child="${indexes.child}"` : ""
  ].filter(Boolean).join(" ");
  return `<button type="button" class="scenemap-layout-drag-handle" title="${escapeAttr(label)}" aria-label="${escapeAttr(`${label}. Use arrow keys to reorder.`)}" aria-grabbed="false" ${data}>${layoutIcon(kind === "section" ? "grip-horizontal" : "grip")}</button>`;
}
function iconButton(action, label, icon, options) {
  const data = [
    `data-layout-action="${action}"`,
    options.section !== undefined ? `data-section="${options.section}"` : "",
    options.field !== undefined ? `data-field="${options.field}"` : "",
    options.child !== undefined ? `data-child="${options.child}"` : ""
  ].filter(Boolean).join(" ");
  return `<button type="button" class="scenemap-layout-icon-btn" title="${escapeAttr(label)}" aria-label="${escapeAttr(label)}" ${data}>${layoutIcon(icon)}</button>`;
}
function layoutIcon(name) {
  const paths = {
    plus: `<path d="M12 5v14"/><path d="M5 12h14"/>`,
    grip: `<circle cx="9" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="19" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="19" r="1" fill="currentColor" stroke="none"/>`,
    "grip-horizontal": `<circle cx="5" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="15" r="1" fill="currentColor" stroke="none"/>`,
    trash: `<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v5"/><path d="M14 11v5"/>`
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
function openTextEditor(title, value, onSave, surface = "tracker") {
  if (Array.from(pendingTextEditors.values()).some((pending) => pending.title === title)) {
    const message = `${title} is already open.`;
    if (surface === "settings")
      showSettingsError(message);
    else
      showTrackerError(message);
    return;
  }
  const requestId = `editor-${Date.now()}-${++editorRequestSeq}`;
  pendingTextEditors.set(requestId, {
    title,
    surface,
    onSave
  });
  send({
    type: "open_text_editor",
    requestId,
    title,
    value,
    placeholder: ""
  });
}
function handleTextEditorResult(payload) {
  const requestId = typeof payload.requestId === "string" ? payload.requestId : "";
  const pending = takePendingTextEditor(requestId);
  if (!pending)
    return;
  if (payload.cancelled)
    return;
  const text = typeof payload.text === "string" ? payload.text : "";
  try {
    pending.onSave(text);
  } catch (err) {
    if (pending.surface === "settings")
      showSettingsError(err.message);
    else
      showTrackerError(err.message);
    openTextEditor(pending.title, text, pending.onSave, pending.surface);
  }
}
function clearSettingsRuntimeError() {
  settingsRuntimeError = null;
  rootRef?.querySelector("[data-settings-runtime-error]")?.remove();
}
function mountSettingsRuntimeError(message) {
  const container = rootRef?.querySelector(".scenemap-settings-scroll");
  if (!container)
    return false;
  container.querySelector("[data-settings-runtime-error]")?.remove();
  const node = document.createElement("div");
  node.className = "scenemap-runtime-error";
  node.dataset.settingsRuntimeError = "";
  node.setAttribute("role", "alert");
  node.textContent = message;
  container.prepend(node);
  return true;
}
function clearTrackerRuntimeError() {
  trackerRuntimeError = null;
  rootRef?.querySelector("[data-tracker-runtime-error]")?.remove();
  dockRootRef?.querySelector("[data-tracker-runtime-error]")?.remove();
}
function showTrackerError(message) {
  trackerRuntimeError = message;
  if (mergeSettings(state.settings).trackerPlacement === "drawer") {
    drawerView = "tracker";
    tabHandle?.activate();
    renderDrawerContent();
  } else {
    renderDockPanel();
  }
}
function takePendingTextEditor(requestId) {
  const pending = pendingTextEditors.get(requestId) ?? null;
  if (pending)
    pendingTextEditors.delete(requestId);
  return pending;
}
function showSettingsError(message) {
  const preserveActiveSettings = settingsSurfaceHasActiveInteraction();
  settingsRuntimeError = message;
  drawerView = "settings";
  tabHandle?.activate();
  if (!preserveActiveSettings || !mountSettingsRuntimeError(message))
    renderDrawerSettings();
}
function renderTracker(value, layout, editSchema = null) {
  const record = getRecord3(value);
  if (Object.keys(record).length === 0)
    return `<div class="scenemap-empty">Tracker data is empty.</div>`;
  const sections = layout?.sections?.length ? layout.sections : DEFAULT_DISPLAY_LAYOUT.sections;
  const html = sections.map((section) => {
    const fields = section.fields.map((field) => editSchema ? renderEditableField(field, record, editSchema, []) : renderField(field, record)).filter(Boolean).join("");
    if (!fields)
      return "";
    const title = section.title?.trim();
    return `<section class="scenemap-section ${title ? "" : "scenemap-section--untitled"}">${title ? `<h3>${escapeHtml(title)}</h3>` : ""}<div>${fields}</div></section>`;
  }).filter(Boolean).join("");
  return html || `<div class="scenemap-empty">Tracker data is empty.</div>`;
}
function renderEditableField(field, draft, rootSchema, basePath) {
  const path = [...basePath, ...field.path.split(".").filter(Boolean)];
  const value = getTrackerValueAtPath(draft, path);
  const label = getFieldLabel(field);
  const display = field.display || "text";
  if (display === "chips" && Array.isArray(value)) {
    return renderEditableChips(path, label, value, rootSchema, field.center === true);
  }
  if (display === "character_cards") {
    const cards = Array.isArray(value) ? value : [];
    return `
      <div class="scenemap-edit-card-list">
        <div class="scenemap-character-grid">
          ${cards.map((_, index2) => renderEditableCharacterCard(draft, index2, field, path, rootSchema)).join("")}
        </div>
        <button type="button" class="scenemap-edit-add-card" data-action="add-tracker-card" data-edit-path="${trackerEditPathAttr(path)}">+ Add item</button>
      </div>
    `;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return `<div class="scenemap-field">${label ? `<span>${escapeHtml(label)}</span>` : ""}<p>${escapeHtml(formatDisplayValue(value))}</p></div>`;
  }
  return renderTrackerEditControl(path, label, display, value, rootSchema);
}
function renderEditableChips(path, label, values, rootSchema, centered) {
  const labelMarkup = label ? `<span>${escapeHtml(label)}</span>` : "";
  const chips = values.map((value, index2) => {
    const itemPath = [...path, index2];
    const schema = getTrackerSchemaAtPath(rootSchema, itemPath);
    const kind = getTrackerEditControlKind(schema, value);
    const common = `data-tracker-edit-control="true" data-tracker-edit-chip="true" data-edit-path="${trackerEditPathAttr(itemPath)}" data-edit-kind="${kind}" aria-label="${escapeAttr(`${label || "Item"} ${index2 + 1}`)}"`;
    let control;
    if (kind === "enum") {
      const options = Array.isArray(schema.enum) ? schema.enum : [];
      control = `<select ${common}>${options.map((option2, optionIndex) => `<option value="${optionIndex}" ${jsonValuesEqual(option2, value) ? "selected" : ""}>${escapeHtml(formatDisplayValue(option2))}</option>`).join("")}</select>`;
    } else if (kind === "boolean") {
      control = `<select ${common}><option value="true" ${value === true ? "selected" : ""}>Yes</option><option value="false" ${value !== true ? "selected" : ""}>No</option></select>`;
    } else {
      const inputType = kind === "number" || kind === "integer" ? "number" : "text";
      const size = Math.max(4, Math.min(24, formatDisplayValue(value).length + 1));
      control = `<input type="${inputType}" ${common} size="${size}" ${kind === "integer" ? 'step="1"' : kind === "number" ? 'step="any"' : ""} value="${escapeAttr(value ?? "")}">`;
    }
    return `<span class="scenemap-edit-chip">${control}<button type="button" data-action="remove-tracker-chip" data-edit-path="${trackerEditPathAttr(path)}" data-edit-index="${index2}" title="Remove item" aria-label="Remove ${escapeAttr(formatDisplayValue(value) || `item ${index2 + 1}`)}">×</button></span>`;
  }).join("");
  return `
    <div class="scenemap-field scenemap-edit-chip-field">
      ${labelMarkup}
      <div class="scenemap-edit-chips ${centered ? "is-centered" : ""}">
        ${chips}
        <button type="button" class="scenemap-edit-chip-add" data-action="add-tracker-chip" data-edit-path="${trackerEditPathAttr(path)}" aria-label="Add item">+</button>
      </div>
    </div>
  `;
}
function renderEditableCharacterCard(draft, index2, parentField, parentPath, rootSchema) {
  const itemPath = [...parentPath, index2];
  const record = getRecord3(getTrackerValueAtPath(draft, itemPath));
  const namePath = [...itemPath, "name"];
  const nameSchema = getTrackerSchemaAtPath(rootSchema, namePath);
  const hasEditableName = Object.keys(nameSchema).length > 0 || Object.prototype.hasOwnProperty.call(record, "name");
  const fallbackFields = Object.keys(record).filter((key) => key !== "name").map((key) => ({
    path: key,
    label: humanizeTrackerKey(key),
    display: key === "postureAndInteraction" ? "mono" : "text"
  }));
  const fields = ((parentField.fields?.length) ? parentField.fields : fallbackFields).filter((field) => !(hasEditableName && field.path === "name"));
  return `
    <article class="scenemap-character scenemap-character-edit">
      <div class="scenemap-character-edit-header">
        ${hasEditableName ? renderTrackerEditControl(namePath, "Character name", "text", record.name, rootSchema, true) : `<h4>${escapeHtml(`Item ${index2 + 1}`)}</h4>`}
        <button type="button" class="scenemap-icon-btn scenemap-edit-remove-card" data-action="remove-tracker-card" data-edit-path="${trackerEditPathAttr(parentPath)}" data-edit-index="${index2}" title="Remove item" aria-label="Remove item">${layoutIcon("trash")}</button>
      </div>
      ${fields.map((field) => renderEditableField(field, draft, rootSchema, itemPath)).join("")}
    </article>
  `;
}
function renderTrackerEditControl(path, label, display, value, rootSchema, characterName = false) {
  const schema = getTrackerSchemaAtPath(rootSchema, path);
  const kind = getTrackerEditControlKind(schema, value);
  const labelMarkup = label ? `<span>${escapeHtml(label)}</span>` : "";
  const common = `data-tracker-edit-control="true" data-edit-path="${trackerEditPathAttr(path)}" data-edit-kind="${kind}" aria-label="${escapeAttr(label || humanizeTrackerKey(String(path.at(-1) ?? "Value")))}"`;
  let control;
  if (kind === "enum") {
    const options = Array.isArray(schema.enum) ? schema.enum : [];
    control = `<select ${common}>${options.map((option2, index2) => `<option value="${index2}" ${jsonValuesEqual(option2, value) ? "selected" : ""}>${escapeHtml(formatDisplayValue(option2))}</option>`).join("")}</select>`;
  } else if (kind === "boolean") {
    control = `<select ${common}><option value="true" ${value === true ? "selected" : ""}>Yes</option><option value="false" ${value !== true ? "selected" : ""}>No</option></select>`;
  } else if (kind === "number" || kind === "integer") {
    const minimum = typeof schema.minimum === "number" ? ` min="${schema.minimum}"` : "";
    const maximum = typeof schema.maximum === "number" ? ` max="${schema.maximum}"` : "";
    control = `<input type="number" ${common}${minimum}${maximum} step="${kind === "integer" ? "1" : "any"}" value="${escapeAttr(value ?? "")}">`;
  } else if (kind.endsWith("_array")) {
    const lines = Array.isArray(value) ? value.map(formatDisplayValue).join(`
`) : "";
    control = `<textarea ${common} rows="${Math.max(2, Math.min(5, Array.isArray(value) ? value.length : 2))}" placeholder="One item per line">${escapeHtml(lines)}</textarea>`;
  } else if (display === "mono" || typeof value === "string" && (value.length > 38 || value.includes(`
`))) {
    const rows = typeof value === "string" && value.length > 220 ? 4 : typeof value === "string" && value.length > 110 ? 3 : 2;
    control = `<textarea ${common} rows="${rows}">${escapeHtml(value ?? "")}</textarea>`;
  } else {
    control = `<input type="text" ${common} value="${escapeAttr(value ?? "")}">`;
  }
  if (characterName) {
    return `<label class="scenemap-character-name-edit">${labelMarkup}${control}</label>`;
  }
  return `<label class="scenemap-field scenemap-edit-field">${labelMarkup}${control}</label>`;
}
function createTrackerDataLayout(value) {
  const record = getRecord3(value);
  return {
    sections: [{
      title: "Tracker",
      fields: Object.entries(record).map(([key, child]) => {
        if (Array.isArray(child) && child.some((item) => item && typeof item === "object" && !Array.isArray(item))) {
          const childKeys = new Set;
          for (const item of child) {
            for (const childKey of Object.keys(getRecord3(item))) {
              if (childKey !== "name")
                childKeys.add(childKey);
            }
          }
          return {
            path: key,
            label: humanizeTrackerKey(key),
            display: "character_cards",
            fields: Array.from(childKeys).map((childKey) => ({
              path: childKey,
              label: humanizeTrackerKey(childKey),
              display: defaultDisplayForSchema({}, childKey)
            }))
          };
        }
        return {
          path: key,
          label: humanizeTrackerKey(key),
          display: Array.isArray(child) ? "chips" : defaultDisplayForSchema({}, key)
        };
      })
    }]
  };
}
function renderField(field, tracker) {
  const value = getValueByPath(tracker, field.path);
  if (!hasRenderableValue(value))
    return "";
  const label = getFieldLabel(field);
  const labelMarkup = label ? `<span>${escapeHtml(label)}</span>` : "";
  const display = field.display || "text";
  if (display === "chips") {
    return `<div class="scenemap-field">${labelMarkup}<div class="scenemap-chips ${field.center ? "is-centered" : ""}">${toChips(value).map((item) => `<b>${escapeHtml(item)}</b>`).join("")}</div></div>`;
  }
  if (display === "progress")
    return renderProgressField(label, field.path, value);
  if (display === "character_cards" && Array.isArray(value)) {
    return `<div class="scenemap-character-grid">${value.map((item, index2) => renderCharacterCard(item, index2, field.fields ?? [])).join("")}</div>`;
  }
  return `<div class="scenemap-field">${labelMarkup}<p class="${display === "subtle" ? "subtle" : ""} ${display === "mono" ? "mono" : ""}">${escapeHtml(formatDisplayValue(value))}</p></div>`;
}
function getFieldLabel(field) {
  if (Object.prototype.hasOwnProperty.call(field, "label")) {
    const label = field.label?.trim() ?? "";
    return label ? label : null;
  }
  return humanizeTrackerKey(field.path.split(".").pop() || field.path);
}
function renderProgressField(label, path, value) {
  const progress = parseProgressValue(value);
  const labelMarkup = label ? `<span>${escapeHtml(label)}</span>` : "";
  if (!progress)
    return `<div class="scenemap-field">${labelMarkup}<p>${escapeHtml(formatDisplayValue(value))}</p></div>`;
  const tone = progress.value < 34 ? "danger" : progress.value < 67 ? "warning" : "success";
  const ariaLabel = label || humanizeTrackerKey(path.split(".").pop() || path);
  return `
    <div class="scenemap-field scenemap-progress-field" data-progress-tone="${tone}">
      <div class="scenemap-progress-head">
        ${labelMarkup}
        <strong>${progress.label}</strong>
      </div>
      <div class="scenemap-progress-track" role="meter" aria-label="${escapeAttr(ariaLabel)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.value}">
        <i style="width: ${progress.value}%"></i>
      </div>
    </div>
  `;
}
function renderCharacterCard(value, index2, fields) {
  const record = getRecord3(value);
  const name = formatDisplayValue(record.name) || `Character ${index2 + 1}`;
  const innerFields = fields.length > 0 ? fields.map((field) => renderField(field, record)).join("") : Object.entries(record).filter(([key]) => key !== "name").map(([key, child]) => renderField({ path: key, label: humanizeTrackerKey(key), display: key === "postureAndInteraction" ? "mono" : "text" }, { [key]: child })).join("");
  return `<article class="scenemap-character"><h4>${escapeHtml(name)}</h4>${innerFields}</article>`;
}
function getRecord3(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function getValueByPath(value, path) {
  let current = value;
  for (const part of path.split(".").filter(Boolean)) {
    if (current === null || current === undefined || typeof current !== "object")
      return;
    current = current[part];
  }
  return current;
}
function hasRenderableValue(value) {
  if (value === null || value === undefined || value === "")
    return false;
  if (Array.isArray(value))
    return value.some(hasRenderableValue);
  if (typeof value === "object")
    return Object.values(value).some(hasRenderableValue);
  return true;
}
function toChips(value) {
  if (Array.isArray(value))
    return value.map(formatDisplayValue).filter(Boolean).slice(0, 32);
  if (typeof value === "string")
    return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 32);
  return [];
}
function parseProgressValue(value) {
  let numeric = null;
  if (typeof value === "number" && Number.isFinite(value))
    numeric = value;
  if (typeof value === "string") {
    const ratio = value.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
    if (ratio) {
      const current = Number(ratio[1]);
      const max = Number(ratio[2]);
      if (Number.isFinite(current) && Number.isFinite(max) && max > 0)
        numeric = current / max * 100;
    } else {
      const match = value.match(/-?\d+(?:\.\d+)?/);
      if (match)
        numeric = Number(match[0]);
    }
  }
  if (numeric === null || !Number.isFinite(numeric))
    return null;
  const clamped = Math.max(0, Math.min(100, numeric));
  const rounded = Math.round(clamped);
  return { value: rounded, label: `${rounded}%` };
}
function formatDisplayValue(value) {
  if (Array.isArray(value))
    return value.map(formatDisplayValue).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    return Object.entries(value).filter(([, child]) => hasRenderableValue(child)).map(([key, child]) => `${humanizeTrackerKey(key)}: ${formatDisplayValue(child)}`).join(`
`);
  }
  return formatPrimitive(value);
}
function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function escapeAttr(value) {
  return escapeHtml(value);
}
function refreshSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 1-15.3 6.4"/><path d="M3 12A9 9 0 0 1 18.3 5.6"/><path d="M18 2v4h-4"/><path d="M6 22v-4h4"/></svg>`;
}
var styles = `
.scenemap-lv { height: 100%; min-height: 0; display: flex; flex-direction: column; overflow: hidden; color: var(--lumiverse-text); }
.scenemap-drawer-root { height: auto; min-height: 100%; overflow: visible; }
.scenemap-shell { flex: 1 1 auto; display: flex; flex-direction: column; gap: 12px; padding: 14px; min-height: 0; box-sizing: border-box; overflow: hidden; }
.scenemap-header { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px; }
.scenemap-header h2 { margin: 0; font-size: 18px; font-weight: 700; }
.scenemap-header p { margin: 3px 0 0; color: var(--lumiverse-text-muted); font-size: 12px; }
.scenemap-status { align-self: center; display: inline-flex; align-items: center; gap: 7px; width: fit-content; max-width: 100%; box-sizing: border-box; margin: -2px 0 0; padding: 6px 10px; border: 1px solid var(--lumiverse-secondary-border, var(--lumiverse-border)); border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); color: var(--lumiverse-text-muted); font-size: calc(11px * var(--lumiverse-font-scale, 1)); line-height: 1.35; text-align: left; }
.scenemap-status > span:last-child { min-width: 0; overflow-wrap: anywhere; }
.scenemap-status-indicator { width: 6px; height: 6px; flex: 0 0 auto; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 14%, transparent); }
.scenemap-status.is-info, .scenemap-status.is-generating { color: var(--lumiverse-primary-text, var(--lumiverse-primary)); border-color: var(--lumiverse-primary-050, var(--lumiverse-primary)); background: var(--lumiverse-primary-010, color-mix(in srgb, var(--lumiverse-primary) 10%, transparent)); }
.scenemap-status.is-warning { color: var(--lumiverse-warning, #f59e0b); border-color: var(--lumiverse-warning-050, color-mix(in srgb, var(--lumiverse-warning) 50%, transparent)); background: var(--lumiverse-warning-015, color-mix(in srgb, var(--lumiverse-warning) 15%, transparent)); }
.scenemap-status.is-success { color: var(--lumiverse-success, #22c55e); border-color: var(--lumiverse-success-050, color-mix(in srgb, var(--lumiverse-success) 50%, transparent)); background: var(--lumiverse-success-015, color-mix(in srgb, var(--lumiverse-success) 15%, transparent)); }
.scenemap-status.is-generating .scenemap-status-indicator { animation: scenemap-status-pulse 1.2s ease-in-out infinite; }
.scenemap-loading-dots span { display: inline-block; animation: scenemap-dot-fade 1.2s ease-in-out infinite; }
.scenemap-loading-dots span:nth-child(2) { animation-delay: .16s; }
.scenemap-loading-dots span:nth-child(3) { animation-delay: .32s; }
.scenemap-chat-toolbar-root { display: inline-flex; align-items: center; }
.scenemap-chat-toolbar-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 26px; padding: 0; border: 0; border-radius: var(--lumiverse-radius-sm, 5px); background: transparent; color: var(--lumiverse-text-dim, rgba(230, 230, 240, .4)); cursor: pointer; transition: color .12s ease, background .12s ease; }
.scenemap-chat-toolbar-btn:hover:not(:disabled) { color: var(--lumiverse-text, rgba(230, 230, 240, .92)); background: var(--lumiverse-fill, rgba(255, 255, 255, .06)); }
.scenemap-chat-toolbar-btn.is-attention { color: var(--lumiverse-primary, var(--lumiverse-accent)); background: color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 10%, transparent); }
.scenemap-chat-toolbar-btn.is-generating { color: var(--lumiverse-success, var(--lumiverse-accent)); animation: scenemap-status-pulse 1.8s ease-in-out infinite; }
.scenemap-chat-toolbar-btn.is-generating svg { animation: scenemap-spin .9s linear infinite; }
.scenemap-chat-toolbar-btn:disabled { opacity: .45; cursor: default; }
.scenemap-chat-toolbar-btn svg { width: 14px; height: 14px; }
.scenemap-top-toolbar-host { display: inline-flex; align-items: center; }
.scenemap-top-toolbar-btn { display: inline-flex; align-items: center; justify-content: center; gap: 5px; width: 34px; height: 28px; padding: 0 5px; border: 1px solid transparent; border-radius: var(--lumiverse-radius-sm, 6px); background: transparent; color: var(--lumiverse-text-dim); opacity: .68; cursor: pointer; touch-action: manipulation; transition: color var(--lumiverse-transition-fast, .12s ease), background var(--lumiverse-transition-fast, .12s ease), border-color var(--lumiverse-transition-fast, .12s ease), opacity var(--lumiverse-transition-fast, .12s ease); }
.scenemap-top-toolbar-btn:hover:not(:disabled), .scenemap-top-toolbar-btn:focus-visible { opacity: 1; color: var(--lumiverse-text); background: var(--lumiverse-fill-subtle); border-color: var(--lumiverse-border); outline: none; }
.scenemap-top-toolbar-btn:focus-visible { box-shadow: 0 0 0 2px var(--lumiverse-primary-020, color-mix(in srgb, var(--lumiverse-primary) 20%, transparent)); }
.scenemap-top-toolbar-btn:disabled { opacity: .38; cursor: default; }
.scenemap-top-toolbar-icon { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; flex: 0 0 auto; }
.scenemap-top-toolbar-icon svg { width: 14px; height: 14px; }
.scenemap-top-toolbar-dot { display: block; width: 6px; height: 6px; flex: 0 0 auto; border-radius: 50%; background: var(--lumiverse-text-dim); box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 8%, transparent); }
.scenemap-top-toolbar-btn.is-success .scenemap-top-toolbar-dot { background: var(--lumiverse-success, #22c55e); box-shadow: 0 0 7px color-mix(in srgb, var(--lumiverse-success, #22c55e) 48%, transparent); }
.scenemap-top-toolbar-btn.is-warning .scenemap-top-toolbar-dot { background: var(--lumiverse-warning, #f59e0b); box-shadow: 0 0 7px color-mix(in srgb, var(--lumiverse-warning, #f59e0b) 48%, transparent); }
.scenemap-top-toolbar-btn.is-generating { opacity: 1; color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-top-toolbar-btn.is-generating .scenemap-top-toolbar-icon svg { animation: scenemap-spin .9s linear infinite; }
.scenemap-top-toolbar-btn.is-generating .scenemap-top-toolbar-dot { background: var(--lumiverse-primary, var(--lumiverse-accent)); animation: scenemap-status-pulse 1.2s ease-in-out infinite; box-shadow: 0 0 8px color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 55%, transparent); }
.scenemap-toolbar, .scenemap-row, .scenemap-modal-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.scenemap-modal-spacer { flex: 1 1 auto; }
.scenemap-card { border: 1px solid var(--lumiverse-border); background: var(--lumiverse-fill-subtle); border-radius: var(--lumiverse-radius, 8px); padding: 12px; }
.scenemap-board { flex: 1 1 auto; min-height: 0; overflow: auto; background: transparent; border-color: transparent; padding: 0 10px 0 0; }
.scenemap-empty { color: var(--lumiverse-text-muted); font-size: 13px; text-align: center; padding: 20px 4px; }
.scenemap-section { padding: 10px 0 12px; }
.scenemap-section--untitled { padding-top: 4px; }
.scenemap-section h3 { display: flex; align-items: center; gap: 10px; margin: 0 0 10px; color: var(--lumiverse-accent); font-size: 12px; text-align: center; text-transform: uppercase; font-weight: 800; white-space: pre-wrap; }
.scenemap-section h3::before, .scenemap-section h3::after { content: ""; height: 4px; flex: 1 1 auto; border-top: 1px solid color-mix(in srgb, var(--lumiverse-border) 72%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--lumiverse-border) 72%, transparent); }
.scenemap-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.scenemap-field span { color: var(--lumiverse-text-muted); font-size: 10px; font-weight: 700; text-transform: uppercase; }
.scenemap-field p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; line-height: 1.45; }
.scenemap-field p.subtle { color: var(--lumiverse-text-muted); }
.scenemap-field p.mono { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-style: italic; }
.scenemap-progress-field { gap: 6px; }
.scenemap-progress-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.scenemap-progress-head strong { color: var(--lumiverse-text); font-size: 11px; font-weight: 750; font-variant-numeric: tabular-nums; }
.scenemap-progress-track { height: 7px; border-radius: var(--lumiverse-radius-sm, 5px); overflow: hidden; border: 1px solid color-mix(in srgb, var(--lumiverse-border) 72%, transparent); background: color-mix(in srgb, var(--lumiverse-fill) 72%, transparent); }
.scenemap-progress-track i { display: block; height: 100%; min-width: 2px; border-radius: inherit; background: var(--lumiverse-primary, var(--lumiverse-accent)); box-shadow: 0 0 10px color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 35%, transparent); }
.scenemap-progress-field[data-progress-tone="success"] .scenemap-progress-track i { background: var(--lumiverse-success, var(--lumiverse-primary, var(--lumiverse-accent))); box-shadow: 0 0 10px color-mix(in srgb, var(--lumiverse-success, var(--lumiverse-primary, var(--lumiverse-accent))) 35%, transparent); }
.scenemap-progress-field[data-progress-tone="warning"] .scenemap-progress-track i { background: var(--lumiverse-warning, var(--lumiverse-primary, var(--lumiverse-accent))); box-shadow: 0 0 10px color-mix(in srgb, var(--lumiverse-warning, var(--lumiverse-primary, var(--lumiverse-accent))) 35%, transparent); }
.scenemap-progress-field[data-progress-tone="danger"] .scenemap-progress-track i { background: var(--lumiverse-danger, var(--lumiverse-primary, var(--lumiverse-accent))); box-shadow: 0 0 10px color-mix(in srgb, var(--lumiverse-danger, var(--lumiverse-primary, var(--lumiverse-accent))) 35%, transparent); }
.scenemap-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.scenemap-chips.is-centered { justify-content: center; }
.scenemap-chips b { border: 1px solid var(--lumiverse-primary-020, var(--lumiverse-border)); background: color-mix(in srgb, var(--lumiverse-fill) 82%, var(--lumiverse-primary, var(--lumiverse-accent)) 6%); border-radius: var(--lumiverse-radius, 8px); padding: 4px 8px; font-size: 12px; font-weight: 600; }
.scenemap-character-grid { display: flex; flex-direction: column; gap: 14px; }
.scenemap-character { border: 1px solid var(--lumiverse-primary-020, var(--lumiverse-border)); background: color-mix(in srgb, var(--lumiverse-fill) 82%, var(--lumiverse-primary, var(--lumiverse-accent)) 6%); border-radius: var(--lumiverse-radius, 8px); padding: 10px; }
.scenemap-character h4 { margin: 0 0 10px; color: color-mix(in srgb, var(--lumiverse-text) 72%, var(--lumiverse-primary, var(--lumiverse-accent)) 28%); font-size: 14px; font-weight: 760; }
.scenemap-edit-field > input, .scenemap-edit-field > textarea, .scenemap-edit-field > select, .scenemap-character-name-edit > input, .scenemap-character-name-edit > textarea, .scenemap-character-name-edit > select { width: 100%; box-sizing: border-box; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius-sm, 5px); background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); color: var(--lumiverse-text); padding: 8px 9px; font: inherit; font-size: 13px; line-height: 1.4; }
.scenemap-edit-field > textarea { min-height: 42px; max-height: 180px; resize: vertical; field-sizing: content; }
.scenemap-edit-field > select, .scenemap-character-name-edit > select { appearance: auto; }
.scenemap-edit-field > input:focus, .scenemap-edit-field > textarea:focus, .scenemap-edit-field > select:focus, .scenemap-character-name-edit > input:focus, .scenemap-character-name-edit > textarea:focus, .scenemap-character-name-edit > select:focus { outline: none; border-color: var(--lumiverse-primary, var(--lumiverse-accent)); box-shadow: 0 0 0 1px var(--lumiverse-primary-020, transparent); }
.scenemap-character-edit { display: flex; flex-direction: column; }
.scenemap-character-edit-header { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 10px; }
.scenemap-character-name-edit { display: flex; flex: 1 1 auto; min-width: 0; flex-direction: column; gap: 4px; }
.scenemap-character-name-edit > span { color: var(--lumiverse-text-muted); font-size: 10px; font-weight: 700; text-transform: uppercase; }
.scenemap-character-name-edit > input { color: color-mix(in srgb, var(--lumiverse-text) 72%, var(--lumiverse-primary, var(--lumiverse-accent)) 28%); font-size: 14px; font-weight: 760; }
.scenemap-lv .scenemap-edit-remove-card { flex: 0 0 auto; width: 34px; height: 34px; color: var(--lumiverse-danger, #ef4444); }
.scenemap-edit-chip-field { gap: 6px; }
.scenemap-edit-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.scenemap-edit-chips.is-centered { justify-content: center; }
.scenemap-edit-chip { display: inline-flex; min-width: 0; align-items: stretch; overflow: hidden; border: 1px solid var(--lumiverse-primary-020, var(--lumiverse-border)); border-radius: var(--lumiverse-radius, 8px); background: color-mix(in srgb, var(--lumiverse-fill) 82%, var(--lumiverse-primary, var(--lumiverse-accent)) 6%); }
.scenemap-edit-chip > input, .scenemap-edit-chip > select { width: auto; min-width: 42px; max-width: 180px; box-sizing: border-box; border: 0; outline: none; background: transparent; color: var(--lumiverse-text); padding: 5px 4px 5px 8px; font: inherit; font-size: 12px; font-weight: 600; }
.scenemap-edit-chip > input:focus, .scenemap-edit-chip > select:focus { background: var(--lumiverse-primary-010, color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 10%, transparent)); }
.scenemap-lv .scenemap-edit-chip > button { width: 28px; min-width: 28px; padding: 0; border: 0; border-left: 1px solid color-mix(in srgb, var(--lumiverse-border) 70%, transparent); border-radius: 0; background: transparent; color: var(--lumiverse-text-dim); font-size: 16px; line-height: 1; }
.scenemap-lv .scenemap-edit-chip > button:hover:not(:disabled) { color: var(--lumiverse-danger, #ef4444); background: var(--lumiverse-danger-015, rgba(239, 68, 68, .15)); }
.scenemap-lv .scenemap-edit-chip-add { width: 30px; height: 30px; padding: 0; border-style: dashed; border-radius: var(--lumiverse-radius, 8px); background: transparent; color: var(--lumiverse-text-muted); }
.scenemap-lv .scenemap-edit-chip-add:hover:not(:disabled) { color: var(--lumiverse-primary, var(--lumiverse-accent)); border-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-edit-card-list { display: flex; flex-direction: column; gap: 10px; }
.scenemap-lv .scenemap-edit-add-card { width: 100%; padding: 8px 10px; border-style: dashed; color: var(--lumiverse-text-muted); background: transparent; }
.scenemap-lv .scenemap-edit-add-card:hover:not(:disabled) { color: var(--lumiverse-primary, var(--lumiverse-accent)); border-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-drawer-scroll { flex: 0 0 auto; min-height: 0; overflow: visible; box-sizing: border-box; padding: 14px; }
.scenemap-drawer-view { min-height: 0; }
.scenemap-drawer-view > .scenemap-shell { flex: none; min-height: 0; overflow: visible; padding: 14px 0 0; }
.scenemap-drawer-view .scenemap-board, .scenemap-drawer-view .scenemap-settings-scroll, .scenemap-drawer-view .scenemap-macros-scroll { flex: none; overflow: visible; }
.scenemap-drawer-view .scenemap-settings-scroll, .scenemap-drawer-view .scenemap-macros-scroll { padding-right: 0; padding-bottom: 0; }
.scenemap-drawer-root > .scenemap-settings-shell { flex: none; overflow: visible; }
.scenemap-drawer-root > .scenemap-settings-shell .scenemap-settings-scroll { flex: none; overflow: visible; }
.scenemap-view-tabs { display: flex; gap: 2px; width: min(100%, 380px); box-sizing: border-box; margin: 0 auto; padding: 3px; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius-md, 10px); background: var(--lumiverse-fill-subtle); }
.scenemap-lv .scenemap-view-tabs button { flex: 1 1 0; min-width: 0; padding: 7px 10px; border: 1px solid transparent; border-radius: var(--lumiverse-radius, 8px); background: transparent; color: var(--lumiverse-text-dim); font-size: calc(12px * var(--lumiverse-font-scale, 1)); font-weight: 500; text-align: center; transition: color var(--lumiverse-transition-fast, .15s ease), border-color var(--lumiverse-transition-fast, .15s ease); }
.scenemap-lv .scenemap-view-tabs button:hover:not(:disabled):not(.is-active) { color: var(--lumiverse-text-muted); background: var(--lumiverse-fill-subtle); border-color: transparent; }
.scenemap-lv .scenemap-view-tabs button.is-active, .scenemap-lv .scenemap-view-tabs button.is-active:hover:not(:disabled) { color: var(--lumiverse-primary-text, var(--lumiverse-primary)); background: var(--lumiverse-primary-015, color-mix(in srgb, var(--lumiverse-primary) 15%, transparent)); border-color: var(--lumiverse-primary-050, var(--lumiverse-primary)); box-shadow: var(--lumiverse-shadow-sm); }
.scenemap-settings-shell { gap: 0; }
.scenemap-settings-group-heading { min-height: 14px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.scenemap-settings-group .scenemap-settings-group-heading h3 { margin: 0; }
.scenemap-settings-dirty { margin: 0; color: var(--lumiverse-warning, var(--lumiverse-accent)); font-size: 10px; line-height: 1.4; white-space: nowrap; visibility: hidden; }
.scenemap-settings-dirty.is-visible { visibility: visible; }
.scenemap-settings-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 12px; padding: 12px 8px 12px 0; }
.scenemap-macros-shell { gap: 0; }
.scenemap-macros-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 12px; padding: 12px 8px 12px 0; }
.scenemap-reference-header { width: 100%; padding: 6px 0 2px; text-align: center; }
.scenemap-reference-header > span { color: var(--lumiverse-primary-text, var(--lumiverse-primary, var(--lumiverse-accent))); font-size: 10px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
.scenemap-reference-header h2 { margin: 3px 0 2px; color: var(--lumiverse-text); font-size: 18px; line-height: 1.25; font-weight: 750; }
.scenemap-macro-section { display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius-lg, 12px); background: var(--lumiverse-fill-subtle); }
.scenemap-macro-section h3 { margin: 0; color: var(--lumiverse-text); font-size: 13px; font-weight: 750; }
.scenemap-macro-section > p { margin: 0; color: var(--lumiverse-text-muted); font-size: 11px; line-height: 1.5; }
.scenemap-macro-list { display: flex; flex-direction: column; gap: 8px; }
.scenemap-macro-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px; border: 1px solid var(--lumiverse-secondary-border, var(--lumiverse-border)); border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); }
.scenemap-macro-details { min-width: 0; }
.scenemap-macro-details code { display: block; overflow-wrap: anywhere; color: var(--lumiverse-text); font-family: var(--lumiverse-font-mono, ui-monospace, SFMono-Regular, Consolas, monospace); font-size: 12px; font-weight: 700; }
.scenemap-macro-details span { display: block; margin-top: 4px; color: var(--lumiverse-text-muted); font-size: 11px; line-height: 1.45; }
.scenemap-lv .scenemap-macro-copy { flex: 0 0 30px; width: 30px; height: 30px; padding: 6px; color: var(--lumiverse-primary-text, var(--lumiverse-primary, var(--lumiverse-accent))); background: transparent; }
.scenemap-lv .scenemap-macro-copy svg { display: block; width: 100%; height: 100%; }
.scenemap-lv .scenemap-macro-copy.is-copied { color: var(--lumiverse-success, #22c55e); border-color: var(--lumiverse-success-050, rgba(34, 197, 94, .5)); background: var(--lumiverse-success-015, rgba(34, 197, 94, .15)); }
.scenemap-settings-group { border: 1px solid var(--lumiverse-border); background: var(--lumiverse-fill-subtle); border-radius: var(--lumiverse-radius, 8px); padding: 12px; }
.scenemap-settings-group h3 { margin: 0 0 10px; color: var(--lumiverse-accent); font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.scenemap-settings-shell label { display: flex; flex-direction: column; gap: 5px; margin: 10px 0; font-size: 12px; color: var(--lumiverse-text-muted); }
.scenemap-auto-row { display: flex; flex-direction: column; gap: 9px; border-top: 1px solid var(--lumiverse-border); border-bottom: 1px solid var(--lumiverse-border); padding: 9px 0; margin: 10px 0; }
.scenemap-interval-field[hidden] { display: none; }
.scenemap-sampler-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.scenemap-sampler-row label { margin-top: 0; }
.scenemap-settings-shell .scenemap-switch-row { flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; color: var(--lumiverse-text); margin: 0; min-width: 0; }
.scenemap-interface-switches { display: grid; gap: 10px; margin-top: 10px; }
.scenemap-interval-field { margin: 0 !important; min-width: 0; }
.scenemap-switch-row input { position: absolute; opacity: 0; pointer-events: none; }
.scenemap-switch { position: relative; width: 32px; height: 18px; flex: 0 0 auto; border-radius: var(--lumiverse-radius-md, 10px); background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border-hover); transition: background .16s ease, border-color .16s ease; }
.scenemap-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--lumiverse-text-muted); transition: transform .16s ease, background .16s ease; }
.scenemap-switch-row input:focus-visible + .scenemap-switch { outline: 2px solid var(--lumiverse-primary, var(--lumiverse-accent)); outline-offset: 2px; }
.scenemap-switch-row input:checked + .scenemap-switch { background: var(--lumiverse-primary, var(--lumiverse-accent)); border-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-switch-row input:checked + .scenemap-switch::after { transform: translateX(14px); background: var(--lumiverse-primary-contrast, #fff); }
.scenemap-settings-preset-row label { margin: 0; min-width: 0; }
.scenemap-preset-toolbar { display: flex; align-items: end; gap: 8px; flex-wrap: wrap; }
.scenemap-preset-select { flex: 1 1 220px; }
.scenemap-settings-preset-actions, .scenemap-settings-actions-left { display: flex; flex: 0 1 auto; flex-wrap: wrap; gap: 6px; align-items: center; }
.scenemap-settings-preset-actions .scenemap-pill-action, .scenemap-settings-actions-left .scenemap-pill-action { display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; padding: 5px 9px !important; min-height: 30px; }
.scenemap-preset-editor { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--lumiverse-border); }
.scenemap-preset-editor label { display: flex; flex-direction: column; gap: 6px; color: var(--lumiverse-text-muted); font-size: 12px; }
.scenemap-expandable-textarea { position: relative; width: 100%; }
.scenemap-expandable-textarea > textarea { width: 100%; box-sizing: border-box; }
.scenemap-lv .scenemap-expand-editor-btn { position: absolute; top: 5px; right: 5px; z-index: 1; display: flex; align-items: center; justify-content: center; width: var(--lumiverse-btn-icon-sm, 28px); height: var(--lumiverse-btn-icon-sm, 28px); padding: 0; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius-sm, 5px); background: var(--lumiverse-bg, #0f0d15); color: var(--lumiverse-text-dim); cursor: pointer; opacity: 0; transition: all var(--lumiverse-transition-fast, .15s ease); }
.scenemap-expandable-textarea:hover .scenemap-expand-editor-btn, .scenemap-expandable-textarea:focus-within .scenemap-expand-editor-btn { opacity: 1; }
.scenemap-lv .scenemap-expand-editor-btn:hover:not(:disabled) { color: var(--lumiverse-primary); border-color: var(--lumiverse-primary); background: var(--lumiverse-bg, #0f0d15); }
@media (hover: none), (pointer: coarse) {
  .scenemap-lv .scenemap-expand-editor-btn { opacity: 1; }
}
.scenemap-preset-editor textarea { width: 100%; min-height: 180px; box-sizing: border-box; resize: vertical; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); color: var(--lumiverse-text); padding: 10px 11px; font: 12px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; }
.scenemap-preset-editor textarea[data-preset-editor="systemPrompt"], .scenemap-preset-editor textarea[data-preset-editor="userPrompt"] { min-height: 150px; font-family: inherit; }
.scenemap-preset-editor textarea:focus { outline: none; border-color: var(--lumiverse-primary, var(--lumiverse-accent)); box-shadow: 0 0 0 1px var(--lumiverse-primary-020, transparent); }
.scenemap-preset-schema-error { margin-top: -4px; }
.scenemap-preset-layout-row { display: flex; justify-content: flex-end; gap: 8px; }
.scenemap-preset-layout-row .scenemap-primary { min-width: 112px; }
.scenemap-settings-shell input:not([type="checkbox"]), .scenemap-editor textarea, .scenemap-layout-editor input, .scenemap-name-editor input {
  width: 100%; box-sizing: border-box; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius-sm, 5px);
  background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); color: var(--lumiverse-text); padding: 7px 9px; font: inherit;
}
.scenemap-native-select { width: 100%; min-width: 0; }
.scenemap-secondary-control { background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)) !important; }
body:has(.scenemap-secondary-control[aria-expanded="true"]) > [role="listbox"] {
  background:
    linear-gradient(var(--lumiverse-secondary, rgba(128, 128, 128, .15)), var(--lumiverse-secondary, rgba(128, 128, 128, .15))),
    linear-gradient(var(--lumiverse-bg, rgba(28, 24, 38, .95)), var(--lumiverse-bg, rgba(28, 24, 38, .95))),
    var(--lumiverse-bg-deep, #0a0812) !important;
}
body:has([data-spindle-modal] .scenemap-layout-editor) > [role="listbox"] { z-index: 10004 !important; }
.scenemap-editor { display: flex; flex-direction: column; gap: 10px; }
.scenemap-regeneration-modal { min-height: 0; color: var(--lumiverse-text); }
.scenemap-regeneration-options { min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 3px; }
.scenemap-regeneration-mode { display: flex; align-items: flex-start; gap: 10px; padding: 11px 12px; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); cursor: pointer; }
.scenemap-regeneration-mode:has(input:checked) { border-color: var(--lumiverse-primary-050, var(--lumiverse-primary, var(--lumiverse-accent))); background: var(--lumiverse-primary-010, color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 10%, transparent)); }
.scenemap-regeneration-mode:has(input:disabled) { opacity: .55; cursor: default; }
.scenemap-regeneration-mode input, .scenemap-regeneration-field input { flex: 0 0 auto; margin: 2px 0 0; accent-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-regeneration-mode > span, .scenemap-regeneration-field > span { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.scenemap-regeneration-mode strong, .scenemap-regeneration-field strong { font-size: 13px; font-weight: 700; overflow-wrap: anywhere; }
.scenemap-regeneration-mode small, .scenemap-regeneration-field small { color: var(--lumiverse-text-muted); font-size: 11px; line-height: 1.4; overflow-wrap: anywhere; }
.scenemap-regeneration-fields { display: flex; flex-direction: column; gap: 9px; margin-top: 4px; opacity: .72; transition: opacity var(--lumiverse-transition-fast, .15s ease); }
.scenemap-regeneration-modal.is-selecting-fields .scenemap-regeneration-fields { opacity: 1; }
.scenemap-regeneration-group { overflow: hidden; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-fill-subtle); }
.scenemap-regeneration-group h3 { margin: 0; padding: 8px 11px; border-bottom: 1px solid var(--lumiverse-border); color: var(--lumiverse-accent); font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; overflow-wrap: anywhere; }
.scenemap-regeneration-field { display: flex; align-items: flex-start; gap: 10px; padding: 9px 11px; cursor: pointer; }
.scenemap-regeneration-field + .scenemap-regeneration-field { border-top: 1px solid color-mix(in srgb, var(--lumiverse-border) 70%, transparent); }
.scenemap-regeneration-field:hover { background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); }
.scenemap-regeneration-note { margin: 4px 0 0; padding: 10px 11px; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius, 8px); color: var(--lumiverse-text-muted); background: var(--lumiverse-fill-subtle); font-size: 12px; line-height: 1.45; }
.scenemap-regeneration-note.is-warning { color: var(--lumiverse-warning, #f59e0b); border-color: var(--lumiverse-warning-050, color-mix(in srgb, var(--lumiverse-warning) 50%, transparent)); background: var(--lumiverse-warning-015, color-mix(in srgb, var(--lumiverse-warning) 15%, transparent)); }
.scenemap-regeneration-feedback { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; color: var(--lumiverse-text); font-size: 12px; }
.scenemap-regeneration-feedback[hidden] { display: none; }
.scenemap-regeneration-feedback > span { font-weight: 700; }
.scenemap-regeneration-feedback > span small { margin-left: 5px; color: var(--lumiverse-text-muted); font-size: 10px; font-weight: 500; text-transform: uppercase; }
.scenemap-regeneration-feedback textarea { width: 100%; min-height: 76px; box-sizing: border-box; resize: vertical; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius, 8px); outline: none; background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); color: var(--lumiverse-text); padding: 9px 10px; font: inherit; line-height: 1.45; }
.scenemap-regeneration-feedback textarea:focus { border-color: var(--lumiverse-primary, var(--lumiverse-accent)); box-shadow: 0 0 0 1px var(--lumiverse-primary-020, transparent); }
.scenemap-regeneration-modal > .scenemap-modal-actions { flex: 0 0 auto; padding-top: 2px; }
.scenemap-name-editor { display: flex; flex-direction: column; gap: 12px; color: var(--lumiverse-text); }
.scenemap-name-editor label { display: flex; flex-direction: column; gap: 5px; color: var(--lumiverse-text-muted); font-size: 12px; }
.scenemap-editor textarea { min-height: min(58vh, 520px); resize: vertical; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; }
.scenemap-layout-editor { display: flex; flex-direction: column; gap: 12px; color: var(--lumiverse-text); }
.scenemap-layout-intro { display: flex; align-items: center; gap: 12px; justify-content: space-between; }
.scenemap-layout-sections { display: flex; flex-direction: column; gap: 12px; max-height: min(58vh, 520px); overflow: auto; overflow-anchor: none; padding-right: 4px; }
.scenemap-layout-section { border: 1px solid var(--lumiverse-border); background: var(--lumiverse-fill-subtle); border-radius: var(--lumiverse-radius, 8px); padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.scenemap-layout-section-header { display: grid; grid-template-columns: minmax(180px, 1fr) auto; gap: 8px; align-items: end; }
.scenemap-layout-section label, .scenemap-layout-field label { display: flex; flex-direction: column; gap: 5px; color: var(--lumiverse-text-muted); font-size: 12px; }
.scenemap-layout-fields { display: flex; flex-direction: column; gap: 7px; }
.scenemap-layout-field { display: flex; flex-direction: column; gap: 8px; }
.scenemap-layout-schema-warning { border-left: 2px solid var(--lumiverse-warning, #f59e0b); color: var(--lumiverse-warning, #f59e0b); padding: 4px 7px; font-size: 11px; line-height: 1.4; }
.scenemap-layout-field-row { display: grid; grid-template-columns: auto minmax(120px, 1fr) minmax(110px, .8fr) minmax(96px, .6fr) auto; gap: 6px; align-items: center; }
.scenemap-layout-field-row.has-chip-center, .scenemap-layout-child-row.has-chip-center { grid-template-columns: auto minmax(120px, 1fr) minmax(110px, .8fr) minmax(210px, 1.1fr) auto; }
.scenemap-layout-display-controls { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; }
.scenemap-layout-display-controls.has-center-select { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.scenemap-layout-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.scenemap-layout-actions button, .scenemap-layout-child-row button { padding: 5px 8px; font-size: 12px; }
.scenemap-layout-icon-btn { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
.scenemap-layout-icon-btn svg { width: 18px; height: 18px; }
.scenemap-layout-add-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.scenemap-layout-child-box { border-top: 1px solid var(--lumiverse-border); padding-top: 9px; display: flex; flex-direction: column; gap: 7px; }
.scenemap-layout-child-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.scenemap-layout-child-header strong { font-size: 12px; color: var(--lumiverse-text-muted); text-transform: uppercase; }
.scenemap-layout-child-list { display: flex; flex-direction: column; gap: 7px; }
.scenemap-layout-child { display: flex; flex-direction: column; gap: 7px; }
.scenemap-layout-child-row { display: grid; grid-template-columns: auto minmax(120px, 1fr) minmax(110px, .8fr) minmax(96px, .6fr) auto; gap: 6px; align-items: center; }
.scenemap-layout-editor .scenemap-layout-drag-handle, .scenemap-layout-drag-fallback .scenemap-layout-drag-handle { width: 36px; height: 36px; min-width: 36px; display: inline-flex; align-items: center; justify-content: center; align-self: end; padding: 0; color: var(--lumiverse-text-dim); cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none; }
.scenemap-layout-section-header .scenemap-layout-drag-handle { width: 44px; min-width: 44px; color: var(--lumiverse-primary-text, var(--lumiverse-primary, var(--lumiverse-accent))); background: var(--lumiverse-primary-010, color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 10%, transparent)); }
.scenemap-layout-drag-handle svg { width: 18px; height: 18px; pointer-events: none; }
.scenemap-layout-editor .scenemap-layout-drag-handle:hover, .scenemap-layout-editor .scenemap-layout-drag-handle:focus-visible { color: var(--lumiverse-primary, var(--lumiverse-accent)); border-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-layout-editor .scenemap-layout-drag-handle[aria-grabbed="true"] { cursor: grabbing; color: var(--lumiverse-primary, var(--lumiverse-accent)); border-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-layout-drag-ghost { opacity: 1 !important; border: 1px dashed var(--lumiverse-primary-050, var(--lumiverse-primary, var(--lumiverse-accent))) !important; border-radius: var(--lumiverse-radius, 8px); background: linear-gradient(var(--lumiverse-primary-010, rgba(128, 128, 128, .1)), var(--lumiverse-primary-010, rgba(128, 128, 128, .1))), var(--lumiverse-bg-deep, #0a0812) !important; }
.scenemap-layout-drag-ghost > * { visibility: hidden !important; }
.scenemap-layout-drag-chosen { border-color: var(--lumiverse-primary-050, var(--lumiverse-primary, var(--lumiverse-accent))) !important; }
.scenemap-layout-drag-active, .scenemap-layout-drag-fallback { opacity: 1 !important; border: 1px solid var(--lumiverse-primary-050, var(--lumiverse-primary, var(--lumiverse-accent))) !important; border-radius: var(--lumiverse-radius, 8px); background: linear-gradient(var(--lumiverse-fill-subtle, rgba(128, 128, 128, .12)), var(--lumiverse-fill-subtle, rgba(128, 128, 128, .12))), var(--lumiverse-bg-deep, #0a0812) !important; box-shadow: 0 12px 30px rgba(0, 0, 0, .38); }
.scenemap-layout-drag-fallback { pointer-events: none !important; z-index: 10020 !important; }
.scenemap-layout-drag-fallback input:not([type="checkbox"]) { width: 100%; box-sizing: border-box; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius-sm, 5px); background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); color: var(--lumiverse-text); padding: 7px 9px; font: inherit; }
.scenemap-layout-drag-fallback button { border: 1px solid var(--lumiverse-border); background: var(--lumiverse-fill); color: var(--lumiverse-text); border-radius: var(--lumiverse-radius-sm, 5px); font: inherit; }
body.scenemap-layout-is-dragging, body.scenemap-layout-is-dragging * { cursor: grabbing !important; user-select: none !important; -webkit-user-select: none !important; }
.scenemap-lv button, .scenemap-editor button, .scenemap-layout-editor button, .scenemap-name-editor button { border: 1px solid var(--lumiverse-border); background: var(--lumiverse-fill); color: var(--lumiverse-text); border-radius: var(--lumiverse-radius-sm, 5px); padding: 7px 10px; cursor: pointer; font: inherit; }
.scenemap-lv button:hover:not(:disabled), .scenemap-editor button:hover:not(:disabled), .scenemap-layout-editor button:hover:not(:disabled), .scenemap-name-editor button:hover:not(:disabled) { border-color: var(--lumiverse-border-hover); }
.scenemap-lv button:disabled, .scenemap-editor button:disabled, .scenemap-layout-editor button:disabled, .scenemap-name-editor button:disabled { opacity: 0.45; cursor: default; }
.scenemap-lv .scenemap-primary, .scenemap-editor .scenemap-primary, .scenemap-layout-editor .scenemap-primary, .scenemap-name-editor .scenemap-primary { background: var(--lumiverse-primary-015, color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 15%, transparent)); color: var(--lumiverse-primary-text, var(--lumiverse-primary, var(--lumiverse-accent))); border-color: var(--lumiverse-primary-050, var(--lumiverse-primary, var(--lumiverse-accent))); }
.scenemap-lv .scenemap-primary:hover:not(:disabled), .scenemap-editor .scenemap-primary:hover:not(:disabled), .scenemap-layout-editor .scenemap-primary:hover:not(:disabled), .scenemap-name-editor .scenemap-primary:hover:not(:disabled) { background: var(--lumiverse-primary-020, color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 22%, transparent)); border-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-lv .scenemap-danger, .scenemap-editor .scenemap-danger, .scenemap-layout-editor .scenemap-danger, .scenemap-name-editor .scenemap-danger { background: var(--lumiverse-danger-015, rgba(239, 68, 68, .15)); color: var(--lumiverse-danger, #ef4444); border-color: var(--lumiverse-danger-050, rgba(239, 68, 68, .5)); }
.scenemap-lv .scenemap-danger:hover:not(:disabled), .scenemap-editor .scenemap-danger:hover:not(:disabled), .scenemap-layout-editor .scenemap-danger:hover:not(:disabled), .scenemap-name-editor .scenemap-danger:hover:not(:disabled) { background: var(--lumiverse-danger-020, rgba(239, 68, 68, .2)); border-color: var(--lumiverse-danger, #ef4444); }
.scenemap-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; }
.scenemap-pill-action { border-radius: var(--lumiverse-radius, 8px) !important; padding: 7px 13px !important; min-height: 34px; }
.scenemap-tracker-action { min-height: 30px; padding: 5px 10px !important; font-size: calc(12px * var(--lumiverse-font-scale, 1)); }
.scenemap-runtime-error, .scenemap-inline-error { border: 1px solid rgba(255, 100, 100, 0.45); color: #ffb8b8; background: rgba(120, 0, 0, 0.18); border-radius: var(--lumiverse-radius, 8px); padding: 10px; font-size: 12px; }
.scenemap-sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }
@media (max-width: 760px) {
  .scenemap-layout-section-header { grid-template-columns: minmax(0, 1fr) auto; align-items: end; }
  .scenemap-layout-section-header .scenemap-layout-actions { grid-column: 2; flex-wrap: nowrap; }
  .scenemap-layout-section-header .scenemap-layout-icon-btn, .scenemap-layout-section-header .scenemap-layout-drag-handle { width: 44px; height: 44px; min-width: 44px; }
  .scenemap-layout-field-row, .scenemap-layout-child-row { grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; }
  .scenemap-layout-field-row.has-chip-center, .scenemap-layout-child-row.has-chip-center { grid-template-columns: 44px minmax(0, 1fr) 44px; }
  .scenemap-layout-editor .scenemap-layout-drag-handle { width: 44px; height: 44px; min-width: 44px; grid-column: 1; grid-row: 1; }
  .scenemap-layout-field-row > [data-layout-select="field-path"],
  .scenemap-layout-child-row > [data-layout-select="child-path"] { grid-column: 2; grid-row: 1; }
  .scenemap-layout-field-row > .scenemap-layout-icon-btn,
  .scenemap-layout-child-row > .scenemap-layout-icon-btn { grid-column: 3; grid-row: 1; width: 44px; height: 44px; }
  .scenemap-layout-field-row > input,
  .scenemap-layout-child-row > input { grid-column: 1 / -1; grid-row: 2; }
  .scenemap-layout-field-row > .scenemap-layout-display-controls,
  .scenemap-layout-child-row > .scenemap-layout-display-controls { grid-column: 1 / -1; grid-row: 3; }
  .scenemap-settings-actions-left { justify-content: flex-start; }
  .scenemap-layout-actions { justify-content: flex-end; }
  .scenemap-layout-intro { align-items: stretch; flex-direction: column; }
}
@keyframes scenemap-status-pulse {
  0%, 100% { opacity: .72; }
  50% { opacity: 1; }
}
@keyframes scenemap-dot-fade {
  0%, 20% { opacity: .2; transform: translateY(0); }
  45% { opacity: 1; transform: translateY(-1px); }
  80%, 100% { opacity: .2; transform: translateY(0); }
}
@keyframes scenemap-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .scenemap-lv *, .scenemap-editor *, .scenemap-layout-editor *, .scenemap-name-editor * {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
`;
export {
  setup,
  createSchemaDefaultLayout
};
