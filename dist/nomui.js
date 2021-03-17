(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.nomui = {}));
}(this, (function (exports) { 'use strict';

  // Events
  // -----------------
  // Thanks to:
  //  - https://github.com/documentcloud/backbone/blob/master/backbone.js
  //  - https://github.com/joyent/node/blob/master/lib/events.js

  // Regular expression used to split event strings
  const eventSplitter = /\s+/;

  // A module that can be mixed in to *any object* in order to provide it
  // with custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = new Events();
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  function Events() {}

  // Bind one or more space separated events, `events`, to a `callback`
  // function. Passing `"all"` will bind the callback to all events fired.
  Events.prototype.on = function (events, callback, context) {
    if (!callback) return this

    const cache = this.__events || (this.__events = {});
    events = events.split(eventSplitter);

    let event;
    let list;
    while ((event = events.shift())) {
      list = cache[event] || (cache[event] = []);
      list.push(callback, context);
    }

    return this
  };

  Events.prototype.once = function (events, callback, context) {
    const that = this;
    const cb = function () {
      that.off(events, cb);
      callback.apply(context || that, arguments);
    };
    return this.on(events, cb, context)
  };

  // Remove one or many callbacks. If `context` is null, removes all callbacks
  // with that function. If `callback` is null, removes all callbacks for the
  // event. If `events` is null, removes all bound callbacks for all events.
  Events.prototype.off = function (events, callback, context) {
    let cache;
    let event;
    let list;
    let i;

    // No events, or removing *all* events.
    if (!(cache = this.__events)) return this
    if (!(events || callback || context)) {
      delete this.__events;
      return this
    }

    events = events ? events.split(eventSplitter) : Object.keys(cache);

    // Loop through the callback list, splicing where appropriate.
    while ((event = events.shift())) {
      list = cache[event];
      if (!list) continue

      if (!(callback || context)) {
        delete cache[event];
        continue
      }

      for (i = list.length - 2; i >= 0; i -= 2) {
        if (!((callback && list[i] !== callback) || (context && list[i + 1] !== context))) {
          list.splice(i, 2);
        }
      }
    }

    return this
  };

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  Events.prototype.trigger = function (events) {
    let cache;
    let event;
    let all;
    let list;
    let i;
    let len;
    const rest = [];
    let returned = true;
    if (!(cache = this.__events)) return this

    events = events.split(eventSplitter);

    // Fill up `rest` with the callback arguments.  Since we're only copying
    // the tail of `arguments`, a loop is much faster than Array#slice.
    for (i = 1, len = arguments.length; i < len; i++) {
      rest[i - 1] = arguments[i];
    }

    // For each event, walk through the list of callbacks twice, first to
    // trigger the event, then to trigger any `"all"` callbacks.
    while ((event = events.shift())) {
      // Copy callback lists to prevent modification.
      if ((all = cache.all)) all = all.slice();
      if ((list = cache[event])) list = list.slice();

      // Execute event callbacks except one named "all"
      if (event !== 'all') {
        returned = triggerEvents(list, rest, this) && returned;
      }

      // Execute "all" callbacks.
      returned = triggerEvents(all, [event].concat(rest), this) && returned;
    }

    return returned
  };

  Events.prototype.emit = Events.prototype.trigger;

  // Mix `Events` to object instance or Class function.
  Events.mixTo = function (receiver) {
    const proto = Events.prototype;

    if (isFunction(receiver)) {
      for (const key in proto) {
        if (proto.hasOwnProperty(key)) {
          receiver.prototype[key] = proto[key];
        }
      }
      Object.keys(proto).forEach(function (key) {
        receiver.prototype[key] = proto[key];
      });
    } else {
      const event = new Events();
      for (const key in proto) {
        if (proto.hasOwnProperty(key)) {
          copyProto(key, event);
        }
      }
    }

    function copyProto(key, event) {
      receiver[key] = function () {
        proto[key].apply(event, Array.prototype.slice.call(arguments));
        return this
      };
    }
  };

  // Execute callbacks
  function triggerEvents(list, args, context) {
    let pass = true;

    if (list) {
      let i = 0;
      const l = list.length;
      const a1 = args[0];
      const a2 = args[1];
      const a3 = args[2];
      // call is faster than apply, optimize less than 3 argu
      // http://blog.csdn.net/zhengyinhui100/article/details/7837127
      switch (args.length) {
        case 0:
          for (; i < l; i += 2) {
            pass = list[i].call(list[i + 1] || context) !== false && pass;
          }
          break
        case 1:
          for (; i < l; i += 2) {
            pass = list[i].call(list[i + 1] || context, a1) !== false && pass;
          }
          break
        case 2:
          for (; i < l; i += 2) {
            pass = list[i].call(list[i + 1] || context, a1, a2) !== false && pass;
          }
          break
        case 3:
          for (; i < l; i += 2) {
            pass = list[i].call(list[i + 1] || context, a1, a2, a3) !== false && pass;
          }
          break
        default:
          for (; i < l; i += 2) {
            pass = list[i].apply(list[i + 1] || context, args) !== false && pass;
          }
          break
      }
    }
    // trigger will return false if one of the callbacks return false
    return pass
  }

  function isFunction(func) {
    return Object.prototype.toString.call(func) === '[object Function]'
  }

  String.prototype.trim = function (characters) {
    return this.replace(new RegExp(`^${characters}+|${characters}+$`, 'g'), '')
  };

  String.prototype.startWith = function (str) {
    const reg = new RegExp(`^${str}`);
    return reg.test(this)
  };

  String.prototype.trimEnd = function (characters) {
    return this.replace(new RegExp(`${characters}+$`, 'g'), '')
  };

  String.prototype.prepend = function (character) {
    if (this[0] !== character) {
      return (character + this).toString()
    }

    return this.toString()
  };

  String.prototype.format = function (args) {
    let result = this;
    if (arguments.length > 0) {
      if (arguments.length === 1 && typeof args === 'object') {
        for (const key in args) {
          if (args[key] !== undefined) {
            const reg = new RegExp(`({${key}})`, 'g');
            result = result.replace(reg, args[key]);
          }
        }
      } else {
        for (let i = 0; i < arguments.length; i++) {
          if (arguments[i] !== undefined) {
            const reg = new RegExp(`({)${i}(})`, 'g');
            result = result.replace(reg, arguments[i]);
          }
        }
      }
    }
    return result
  };

  /**
   * Strict object type check. Only returns true
   * for plain JavaScript objects.
   *
   * @param {*} obj
   * @return {Boolean}
   */

  const { toString } = Object.prototype;
  const OBJECT_STRING = '[object Object]';
  function isPlainObject(obj) {
    if (Object.prototype.toString.call(obj) !== OBJECT_STRING) {
      return false
    }

    const prototype = Object.getPrototypeOf(obj);
    return prototype === null || prototype === Object.prototype
  }

  function isString(obj) {
    // 判断对象是否是字符串
    return Object.prototype.toString.call(obj) === '[object String]'
  }

  function isFunction$1(val) {
    return toString.call(val) === '[object Function]'
  }

  /**
   * Hyphenate a camelCase string.
   *
   * @param {String} str
   * @return {String}
   */

  const hyphenateRE = /([^-])([A-Z])/g;
  function hyphenate(str) {
    return str.replace(hyphenateRE, '$1-$2').replace(hyphenateRE, '$1-$2').toLowerCase()
  }

  function extend() {
    let options;
    let name;
    let src;
    let copy;
    let _clone;
    let target = arguments[0] || {};
    let i = 1;
    const { length } = arguments;
    let deep = false;

    // Handle a deep copy situation
    if (typeof target === 'boolean') {
      deep = target;

      // Skip the boolean and the target
      target = arguments[i] || {};
      i++;
    }
    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== 'object' && !isFunction$1(target)) {
      target = {};
    }

    for (; i < length; i++) {
      // Only deal with non-null/undefined values
      if ((options = arguments[i]) != null) {
        // Extend the base object
        for (name in options) {
          src = target[name];
          copy = options[name];
          // Prevent never-ending loop
          if (target === copy) {
            continue
          }
          // Recurse if we're merging plain objects
          if (deep && copy && isPlainObject(copy)) {
            _clone = src && isPlainObject(src) ? src : {};
            // Never move original objects, clone them
            target[name] = extend(deep, _clone, copy);
            // Don't bring in undefined values
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }
    // Return the modified object
    return target
  }

  function clone(from) {
    if (isPlainObject(from)) {
      return JSON.parse(JSON.stringify(from))
    }

    return from
  }

  function accessProp(options, key) {
    if (typeof key === 'string') {
      // Handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
      const parts = key.split('.');
      let curOption;
      key = parts.shift();
      if (parts.length) {
        curOption = options[key];
        for (let i = 0; i < parts.length - 1; i++) {
          curOption[parts[i]] = curOption[parts[i]] || {};
          curOption = curOption[parts[i]];
        }
        key = parts.pop();
        return curOption[key] === undefined ? null : curOption[key]
      }

      return options[key] === undefined ? null : options[key]
    }
  }

  function pathCombine() {
    let path = '';
    const args = Array.from(arguments);

    args.forEach(function (item, index) {
      if (index > 0) {
        path += `/${item.trim('/')}`;
      } else {
        path += item.trimEnd('/');
      }
    });

    return path
  }

  const uppercaseRegex = /[A-Z]/g;
  function toLowerCase(capital) {
    return `-${capital.toLowerCase()}`
  }
  function normalizeKey(key) {
    return key[0] === '-' && key[1] === '-'
      ? key
      : key === 'cssFloat'
      ? 'float'
      : key.replace(uppercaseRegex, toLowerCase)
  }

  function isNumeric(val) {
    const num = Number(val);
    const type = typeof val;
    return (
      (val != null &&
        type !== 'boolean' &&
        (type !== 'string' || val.length) &&
        !Number.isNaN(num) &&
        Number.isFinite(num)) ||
      false
    )
  }

  var index = {
    extend,
    isFunction: isFunction$1,
  };

  class ComponentDescriptor {
    constructor(tagOrComponent, props, children, mixins) {
      this.tagOrComponent = tagOrComponent;
      this.props = props || {};
      this.children = children;
      this.mixins = Array.isArray(mixins) ? mixins : [];
    }

    getProps() {
      if (this.props instanceof ComponentDescriptor) {
        this.mixins = this.mixins.concat(this.props.mixins);
        this.props = this.props.getProps();
      }
      if (this.tagOrComponent) {
        this.props.component = this.tagOrComponent;
      }
      if (this.children) {
        this.props.children = this.children;
      }
      return this.props
    }
  }

  const components = {};
  const MIXINS = [];

  class Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'div',
        reference: document.body,
        placement: 'append',
        autoRender: true,

        hidden: false,
        disabled: false,
        selected: false,
        expanded: false,

        selectable: {
          byClick: false,
          byHover: false,
          canRevert: false,
          selectedProps: null,
          unselectedProps: null,
        },
        expandable: {
          byClick: false,
          byHover: false,
          target: null,
          indicator: null,
          byIndicator: false,
          expandedProps: false,
          collapsedProps: false,
        },
      };
      this.props = Component.extendProps(defaults, props);

      this.parent = null;
      this.root = null;
      this.rendered = false;
      this.mixins = [];
      this.firstRender = true;

      this._propStyleClasses = [];

      mixins && this._mixin(mixins);

      if (this.props.key) {
        this.key = this.props.key;
        if (isFunction$1(this.props.key)) {
          this.key = this.props.key.call(this);
        }
      }

      this.referenceComponent =
        this.props.reference instanceof Component
          ? this.props.reference
          : this.props.reference.component;
      if (this.referenceComponent) {
        if (this.props.placement === 'append') {
          this.parent = this.referenceComponent;
        } else {
          this.parent = this.referenceComponent.parent;
        }
      }

      if (this.parent === null) {
        this.root = this;
      } else {
        this.root = this.parent.root;
      }

      if (this.props.ref) {
        this.props.ref(this);
      }

      this.componentType = this.__proto__.constructor.name;
      this.referenceElement =
        this.props.reference instanceof Component
          ? this.props.reference.element
          : this.props.reference;

      this.create();
      if (this.props.autoRender === true) {
        this.config();
        this.render();
      } else {
        this._mountPlaceHolder();
      }
    }

    create() {
      this.__handleClick = this.__handleClick.bind(this);
      isFunction$1(this._created) && this._created();
      this._callMixin('_created');
      this.props._created && this.props._created.call(this);
    }

    _created() {}

    config() {
      this._setExpandableProps();
      this.props._config && this.props._config.call(this);
      this._callMixin('_config');
      isFunction$1(this._config) && this._config();
      this._setExpandableProps();
      this._setStatusProps();
    }

    _config() {}

    render() {
      if (this.rendered === true) {
        this.emptyChildren();
      } else {
        this._mountElement();
      }

      this._renderChildren();

      this._handleAttrs();
      this._handleStyles();

      this.props.disabled === true && isFunction$1(this._disable) && this._disable();
      this.props.selected === true && isFunction$1(this._select) && this._select();
      this.props.hidden === false && isFunction$1(this._show) && this._show();
      this.props.expanded === true && isFunction$1(this._expand) && this._expand();

      this._callRendered();
    }

    _callRendered() {
      this.rendered = true;
      isFunction$1(this._rendered) && this._rendered();
      this._callMixin('_rendered');
      isFunction$1(this.props._rendered) && this.props._rendered.call(this);
      this.firstRender = false;
    }

    _rendered() {}

    // todo: 需要优化，现在循环删除节点，太耗时，计划改成只移除本节点，子节点只做清理操作
    remove() {
      const el = this._removeCore();
      this.parent && this.parent.removeChild(this);
      el.parentNode.removeChild(el);
    }

    update(props) {
      this._propStyleClasses.length = 0;
      this.setProps(props);
      this._off();
      this.off();
      this.config();
      this.render();
    }

    replace(props) {
      Component.create(Component.extendProps(props, { placement: 'replace', reference: this }));
    }

    emptyChildren() {
      while (this.element.firstChild) {
        if (this.element.firstChild.component) {
          this.element.firstChild.component.remove();
        } else {
          this.element.removeChild(this.element.firstChild);
        }
      }
    }

    offsetWidth() {
      return this.element.offsetWidth
    }

    _mountPlaceHolder() {
      const { placement } = this.props;

      this._placeHolderElement = document.createElement('div');
      this._placeHolderElement.classList.add('placeholder');

      if (placement === 'append') {
        this.referenceElement.appendChild(this._placeHolderElement);
      } else if (placement === 'prepend') {
        this.referenceElement.insertBefore(this._placeHolderElement, this.referenceElement.firstChild);
      } else if (placement === 'after') {
        this.referenceElement.insertAdjacentElement('afterend', this._placeHolderElement);
      } else if (placement === 'before') {
        this.referenceElement.insertAdjacentElement('beforebegin', this._placeHolderElement);
      } else if (placement === 'replace') {
        this._placeHolderElement = this.referenceElement;
      }
    }

    _mountElement() {
      const { placement } = this.props;

      this.element = document.createElement(this.props.tag);
      this.element.component = this;

      if (this._placeHolderElement) {
        this._placeHolderElement.parentNode.replaceChild(this.element, this._placeHolderElement);
        return
      }

      if (placement === 'append') {
        this.referenceElement.appendChild(this.element);
      } else if (placement === 'prepend') {
        this.referenceElement.insertBefore(this.element, this.referenceElement.firstChild);
      } else if (placement === 'replace') {
        if (this.referenceComponent) {
          this.referenceComponent._removeCore();
        }
        this.referenceElement.parentNode.replaceChild(this.element, this.referenceElement);
      } else if (placement === 'after') {
        this.referenceElement.insertAdjacentElement('afterend', this.element);
      } else if (placement === 'before') {
        this.referenceElement.insertAdjacentElement('beforebegin', this.element);
      }
    }

    getComponent(componentOrElement) {
      return componentOrElement instanceof Component
        ? componentOrElement
        : componentOrElement.component
    }

    getElement(componentOrElement) {
      return componentOrElement instanceof Component ? componentOrElement.element : componentOrElement
    }

    _renderChildren() {
      const { children } = this.props;
      if (Array.isArray(children)) {
        for (let i = 0; i < children.length; i++) {
          this.appendChild(children[i]);
        }
      } else {
        this.appendChild(children);
      }
    }

    _removeCore() {
      this.emptyChildren();
      const el = this.element;
      isFunction$1(this.props._remove) && this.props._remove.call(this);
      this._callMixin('_remove');
      isFunction$1(this._remove) && this._remove();
      this._off();
      this.off();
      this.props.ref && this.props.ref(null);

      for (const p in this) {
        if (this.hasOwnProperty(p)) {
          delete this[p];
        }
      }

      return el
    }

    _remove() {}

    _callMixin(hookType) {
      for (let i = 0; i < MIXINS.length; i++) {
        const mixin = MIXINS[i];
        mixin[hookType] && mixin[hookType].call(this);
      }
      for (let i = 0; i < this.mixins.length; i++) {
        const mixin = this.mixins[i];
        mixin[hookType] && mixin[hookType].call(this);
      }
    }

    setProps(newProps) {
      this.props = Component.extendProps(this.props, newProps);
    }

    assignProps(newProps) {
      this.props = { ...this.props, ...newProps };
    }

    appendChild(child) {
      if (!child) {
        return
      }

      const childDefaults = this.props.childDefaults;
      let childDefaultsProps = {};
      let childDefaultsMixins = [];
      let childProps = {};
      let childMixins = [];
      let props = {};
      let mixins = [];

      if (childDefaults) {
        if (isPlainObject(childDefaults)) {
          childDefaultsProps = childDefaults;
        } else if (childDefaults instanceof ComponentDescriptor) {
          childDefaultsProps = childDefaults.getProps();
          childDefaultsMixins = childDefaults.mixins;
        }
      }

      if (isPlainObject(child)) {
        childProps = child;
      } else if (child instanceof ComponentDescriptor) {
        childProps = child.getProps();
        childMixins = child.mixins;
      } else if (isString(child) || isNumeric(child)) {
        if (isPlainObject(childDefaults)) {
          childProps = { children: child };
        } else if (child[0] === '#') {
          this.element.innerHTML = child.slice(1);
          return
        } else {
          this.element.textContent = child;
          return
        }
      } else if (child instanceof DocumentFragment) {
        this.element.appendChild(child);
        return
      }

      props = Component.extendProps({}, childDefaultsProps, childProps, {
        reference: this.element,
        placement: 'append',
      });

      mixins = [...childDefaultsMixins, ...childMixins];

      const compt = Component.create(props, ...mixins);

      return compt
    }

    before(props) {
      if (!props) {
        return
      }

      const { normalizedProps, mixins } = this._normalizeProps(props);
      const extNormalizedProps = Component.extendProps({}, normalizedProps, {
        reference: this.element,
        placement: 'before',
      });

      return Component.create(extNormalizedProps, ...mixins)
    }

    after(props) {
      if (!props) {
        return
      }

      const { normalizedProps, mixins } = this._normalizeProps(props);
      const extNormalizedProps = Component.extendProps({}, normalizedProps, {
        reference: this.element,
        placement: 'after',
      });

      return Component.create(extNormalizedProps, ...mixins)
    }

    _normalizeProps(props) {
      let normalizedProps = {};
      let mixins = [];

      if (isPlainObject(props)) {
        normalizedProps = props;
      } else if (props instanceof ComponentDescriptor) {
        normalizedProps = props.getProps();
        mixins = props.mixins;
      } else if (isString(props) || isNumeric(props)) {
        normalizedProps = { children: props };
      }
      return { normalizedProps, mixins }
    }

    disable() {
      if (!this.rendered || this.props.disabled === true) {
        return
      }

      this.props.disabled = true;
      this.addClass('s-disabled');
      isFunction$1(this._disable) && this._disable();
    }

    enable() {
      if (!this.rendered || this.props.disabled === false) {
        return
      }

      this.props.disabled = false;
      this.removeClass('s-disabled');
      isFunction$1(this._enable) && this._enable();
    }

    show() {
      if (!this.rendered) {
        this.setProps({ hidden: false });
        this.config();
        this.render();
        return
      }

      if (this.props.hidden === false) {
        return
      }

      this.props.hidden = false;
      this.removeClass('s-hidden');
      isFunction$1(this._show) && this._show();
      this._callHandler(this.props.onShow);
    }

    hide() {
      if (!this.rendered || this.props.hidden === true) {
        return
      }

      this.props.hidden = true;
      this.addClass('s-hidden');
      isFunction$1(this._hide) && this._hide();
      this._callHandler(this.props.onHide);
    }

    select(selectOption) {
      if (!this.rendered) {
        return
      }

      selectOption = extend(
        {
          triggerSelect: true,
          triggerSelectionChange: true,
        },
        selectOption,
      );
      if (this.props.selected === false) {
        this.props.selected = true;
        this.addClass('s-selected');
        isFunction$1(this._select) && this._select();
        selectOption.triggerSelect === true &&
          this._callHandler(this.props.onSelect, null, selectOption.event);
        selectOption.triggerSelectionChange === true &&
          this._callHandler(this.props.onSelectionChange);

        return true
      }

      return false
    }

    unselect(unselectOption) {
      if (!this.rendered) {
        return
      }

      unselectOption = extend(
        {
          triggerUnselect: true,
          triggerSelectionChange: true,
        },
        unselectOption,
      );
      if (this.props.selected === true) {
        this.props.selected = false;
        this.removeClass('s-selected');
        isFunction$1(this._unselect) && this._unselect();

        if (unselectOption.triggerUnselect === true) {
          this._callHandler(this.props.onUnselect, null, unselectOption.event);
        }

        if (unselectOption.triggerSelectionChange === true) {
          this._callHandler(this.props.onSelectionChange);
        }

        return true
      }

      return false
    }

    toggleSelect(event) {
      if (!this.rendered) return
      const { selected, selectable } = this.props;
      if (selectable && selectable.canRevert === false && selected === true) {
        return
      }
      this.props.selected === true ? this.unselect({ event: event }) : this.select({ event });
    }

    expand() {
      if (!this.rendered) return
      if (this.props.expanded === true) return

      this.props.expanded = true;
      this.addClass('s-expanded');
      const expandTarget = this._getExpandTarget();
      if (expandTarget !== null && expandTarget !== undefined) {
        if (Array.isArray(expandTarget)) {
          expandTarget.forEach((t) => {
            t.show && t.show();
          });
        } else {
          expandTarget.show && expandTarget.show();
        }
      }
      if (!this.props.expandable.byIndicator) {
        this._expandIndicator && this._expandIndicator.expand();
      }
      const { expandedProps } = this.props.expandable;
      if (expandedProps) {
        this.update(expandedProps);
      }
      isFunction$1(this._expand) && this._expand();
    }

    collapse() {
      if (!this.rendered) return
      if (this.props.expanded === false) return
      this.props.expanded = false;
      this.removeClass('s-expanded');
      const expandTarget = this._getExpandTarget();
      if (expandTarget !== null && expandTarget !== undefined) {
        if (Array.isArray(expandTarget)) {
          expandTarget.forEach((t) => {
            t.hide && t.hide();
          });
        } else {
          expandTarget.hide && expandTarget.hide();
        }
      }
      if (!this.props.expandable.byIndicator) {
        this._expandIndicator && this._expandIndicator.collapse();
      }
      isFunction$1(this._collapse) && this._collapse();
      const { collapsedProps } = this.props.expandable;
      if (collapsedProps) {
        this.update(collapsedProps);
      }
    }

    toggleExpand() {
      this.props.expanded === true ? this.collapse() : this.expand();
    }

    toggleHidden() {
      this.props.hidden === true ? this.show() : this.hide();
    }

    addClass(className) {
      this.element.classList.add(className);
    }

    removeClass(className) {
      this.element.classList.remove(className);
    }

    _setExpandable(expandableProps) {
      const that = this;

      this.setProps({
        expandable: expandableProps,
      });
      const { expandable, expanded } = this.props;
      if (isPlainObject(expandable)) {
        if (isPlainObject(expandable.indicator)) {
          this.setProps({
            expandable: {
              indicator: {
                expanded: expanded,
                _created: function () {
                  that._expandIndicator = this;
                },
              },
            },
          });
        }
      }
    }

    _setExpandableProps() {
      const { expandable } = this.props;
      if (isPlainObject(expandable)) {
        if (this.props.expanded) {
          if (expandable.expandedProps) {
            this.setProps(expandable.expandedProps);
          }
        } else if (expandable.collapsedProps) {
          this.setProps(expandable.collapsedProps);
        }
      }
    }

    _setStatusProps() {
      const { props } = this;

      this.setProps({
        classes: {
          's-disabled': props.disabled,
          's-selected': props.selected,
          's-hidden': props.hidden,
          's-expanded': props.expanded,
        },
      });
    }

    _getExpandTarget() {
      const { target } = this.props.expandable;
      if (target === undefined || target === null) {
        return null
      }
      if (target instanceof Component) {
        return target
      }
      if (isFunction$1(target)) {
        return target.call(this)
      }
    }

    _getExpandIndicator() {
      const { indicator } = this.props.expandable;
      if (indicator === undefined || indicator === null) {
        return null
      }
      if (indicator instanceof Component) {
        return indicator
      }
      if (isFunction$1(indicator)) {
        return indicator.call(this)
      }
    }

    getChildren() {
      const children = [];
      for (let i = 0; i < this.element.childNodes.length; i++) {
        children.push(this.element.childNodes[i].component);
      }
      return children
    }

    _handleAttrs() {
      this._processClick();
      for (const name in this.props.attrs) {
        const value = this.props.attrs[name];
        if (value == null) continue
        if (name === 'style') {
          this._setStyle(value);
        } else if (name[0] === 'o' && name[1] === 'n') {
          this._on(name.slice(2), value);
        } else if (
          name !== 'list' &&
          name !== 'tagName' &&
          name !== 'form' &&
          name !== 'type' &&
          name !== 'size' &&
          name in this.element
        ) {
          this.element[name] = value == null ? '' : value;
        } else {
          this.element.setAttribute(name, value);
        }
      }
    }

    _handleStyles() {
      const { props } = this;

      const classes = [];
      let propClasses = [];

      const componentTypeClasses = this._getComponentTypeClasses(this);
      for (let i = 0; i < componentTypeClasses.length; i++) {
        const componentTypeClass = componentTypeClasses[i];
        classes.push(`nom-${hyphenate(componentTypeClass)}`);
      }

      propClasses = propClasses.concat(this._propStyleClasses);
      if (props.type) {
        propClasses.push('type');
      }

      if (props.uistyle) {
        propClasses.push('uistyle');
      }

      for (let i = 0; i < propClasses.length; i++) {
        const modifier = propClasses[i];
        const modifierVal = this.props[modifier];
        if (modifierVal !== null && modifierVal !== undefined) {
          if (modifierVal === true) {
            classes.push(`p-${hyphenate(modifier)}`);
          } else if (typeof modifierVal === 'string' || typeof modifierVal === 'number') {
            classes.push(`p-${hyphenate(modifier)}-${hyphenate(String(modifierVal))}`);
          }
        }
      }

      if (isPlainObject(props.classes)) {
        for (const className in props.classes) {
          if (props.classes.hasOwnProperty(className) && props.classes[className] === true) {
            classes.push(className);
          }
        }
      }

      const { styles } = props;
      if (isPlainObject(styles)) {
        addStylesClass(styles);
      }

      function addStylesClass(_styles, className) {
        className = className || '';
        if (isPlainObject(_styles)) {
          for (const style in _styles) {
            if (_styles.hasOwnProperty(style)) {
              addStylesClass(_styles[style], `${className}-${style}`);
            }
          }
        } else if (Array.isArray(_styles)) {
          for (let i = 0; i < _styles.length; i++) {
            if (isString(_styles[i]) || isNumeric(_styles)) {
              classes.push(`u${className}-${_styles[i]}`);
            } else if (_styles[i] === true) {
              classes.push(`u${className}`);
            }
          }
        } else if (isString(_styles) || isNumeric(_styles)) {
          classes.push(`u${className}-${_styles}`);
        } else if (_styles === true) {
          classes.push(`u${className}`);
        }
      }

      if (classes.length) {
        const classNames = classes.join(' ');
        this.element.setAttribute('class', classNames);
      }
    }

    _processClick() {
      const { onClick, selectable, expandable } = this.props;
      if (
        onClick ||
        (selectable && selectable.byClick === true) ||
        (expandable && expandable.byClick && !expandable.byIndicator)
      ) {
        if (expandable.byIndicator) {
          const indicator = this._getExpandIndicator;
          indicator._on('click', () => {
            this.toggleExpand();
          });
        } else {
          this.setProps({
            attrs: {
              onclick: this.__handleClick,
            },
          });
        }
      }
    }

    __handleClick(event) {
      if (this.props._shouldHandleClick && this.props._shouldHandleClick.call(this) === false) {
        return
      }
      if (this.props.disabled === true) {
        return
      }
      const { onClick, selectable, expandable } = this.props;
      onClick && this._callHandler(onClick, null, event);
      if (selectable && selectable.byClick === true) {
        this.toggleSelect(event);
      }
      if (expandable && expandable.byClick === true) {
        this.toggleExpand();
      }
    }

    _callHandler(handler, argObj, event) {
      argObj = isPlainObject(argObj) ? argObj : {};
      event && (argObj.event = event);
      argObj.sender = this;
      if (handler) {
        if (isFunction$1(handler)) {
          return handler(argObj)
        }
        if (isString(handler) && isFunction$1(this.props[handler])) {
          return this.props[handler](argObj)
        }
      }
    }

    _setStyle(style) {
      const { element } = this;
      if (typeof style !== 'object') {
        // New style is a string, let engine deal with patching.
        element.style.cssText = style;
      } else {
        // `old` is missing or a string, `style` is an object.
        element.style.cssText = '';
        // Add new style properties
        for (const key in style) {
          const value = style[key];
          if (value != null) element.style.setProperty(normalizeKey(key), String(value));
        }
      }
    }

    _getComponentTypeClasses(instance) {
      const classArray = [];
      let ctor = instance.constructor;

      while (ctor && ctor.name !== 'Component') {
        classArray.unshift(ctor.name);
        ctor = ctor.__proto__.prototype.constructor;
      }

      return classArray
    }

    _on(event, callback) {
      /* if (context) {
              callback = callback.bind(context)
          }
          else {
              callback = callback.bind(this)
          } */
      const cache = this.__htmlEvents || (this.__htmlEvents = {});
      const list = cache[event] || (cache[event] = []);
      list.push(callback);

      this.element.addEventListener(event, callback, false);
    }

    _off(event, callback) {
      let cache;
      let i;

      // No events, or removing *all* events.
      if (!(cache = this.__htmlEvents)) return this
      if (!(event || callback)) {
        for (const key in this.__htmlEvents) {
          if (this.__htmlEvents.hasOwnProperty(key)) {
            const _list = this.__htmlEvents[key];
            if (!_list) continue
            for (i = _list.length - 1; i >= 0; i -= 1) {
              this.element.removeEventListener(key, _list[i], false);
            }
          }
        }
        delete this.__htmlEvents;
        return this
      }

      const list = cache[event];
      if (!list) return

      if (!callback) {
        delete cache[event];
        return
      }

      for (i = list.length - 1; i >= 0; i -= 1) {
        if (list[i] === callback) {
          list.splice(i, 1);
          this.element.removeEventListener(event, callback, false);
        }
      }
    }

    _trigger(eventName) {
      const event = new Event(eventName);
      this.element.dispatchEvent(event);
    }

    _addPropStyle(...props) {
      props.forEach((value) => {
        this._propStyleClasses.push(value);
      });
    }

    _mixin(mixins) {
      for (let i = 0; i < mixins.length; i++) {
        const mixin = mixins[i];
        if (isPlainObject(mixin) && isPlainObject(mixin.methods)) {
          for (const key in mixin.methods) {
            if (mixin.methods.hasOwnProperty(key)) {
              if (!this[key]) {
                this[key] = mixin.methods[key];
              }
            }
          }
        }
      }

      this.mixins = [...this.mixins, ...mixins];
    }

    static create(componentProps, ...mixins) {
      let componentType = componentProps.component;
      if (isString(componentType)) {
        componentType = components[componentType];
      }

      if (componentType === undefined || componentType === null) {
        componentType = Component;
      }

      return new componentType(componentProps, ...mixins)
    }

    static register(component, name) {
      if (name !== undefined) {
        components[name] = component;
      } else {
        components[component.name] = component;
      }
    }

    static extendProps(...args) {
      return extend(true, {}, ...args)
    }

    static mixin(mixin) {
      MIXINS.push(mixin);
    }
  }

  Component.normalizeTemplateProps = function (props) {
    if (props === null || props === undefined) {
      return null
    }
    let templateProps = {};
    if (isString(props)) {
      templateProps.children = props;
    } else {
      templateProps = props;
    }

    return templateProps
  };

  Component.components = components;
  Component.mixins = MIXINS;

  Object.assign(Component.prototype, Events.prototype);

  Object.defineProperty(Component.prototype, 'children', {
    get: function () {
      return this.getChildren()
    },
  });

  function n(tagOrComponent, props, children, mixins) {
    if (arguments.length === 2) {
      return new ComponentDescriptor(null, tagOrComponent, null, props)
    }
    return new ComponentDescriptor(tagOrComponent, props, children, mixins)
  }

  let zIndex = 6666;

  function getzIndex() {
    zIndex++;
    return ++zIndex
  }

  /* eslint-disable no-shadow */

  let cachedScrollbarWidth;
  const { max } = Math;
  const { abs } = Math;
  const rhorizontal = /left|center|right/;
  const rvertical = /top|center|bottom/;
  const roffset = /[\+\-]\d+(\.[\d]+)?%?/;
  const rposition = /^\w+/;
  const rpercent = /%$/;

  function getOffsets(offsets, width, height) {
    return [
      parseFloat(offsets[0]) * (rpercent.test(offsets[0]) ? width / 100 : 1),
      parseFloat(offsets[1]) * (rpercent.test(offsets[1]) ? height / 100 : 1),
    ]
  }

  function parseCss(element, property) {
    return parseInt(getComputedStyle(element)[property], 10) || 0
  }

  function isWindow(obj) {
    return obj != null && obj === obj.window
  }

  function getScrollTop(el) {
    const hasScrollTop = 'scrollTop' in el;
    return hasScrollTop ? el.scrollTop : isWindow(el) ? el.pageYOffset : el.defaultView.pageYOffset
  }

  function getScrollLeft(el) {
    const hasScrollLeft = 'scrollLeft' in el;
    return hasScrollLeft ? el.scrollLeft : isWindow(el) ? el.pageXOffset : el.defaultView.pageXOffset
  }

  function getOffsetParent(el) {
    return el.offsetParent || el
  }

  function setOffset(elem, coordinates) {
    const parentOffset = getOffsetParent(elem).getBoundingClientRect();

    let props = {
      top: coordinates.top - parentOffset.top,
      left: coordinates.left - parentOffset.left,
    };
    if (getOffsetParent(elem).tagName.toLowerCase() === 'body') {
      props = {
        top: coordinates.top,
        left: coordinates.left,
      };
    }

    if (getComputedStyle(elem).position === 'static') props.position = 'relative';
    elem.style.top = `${props.top}px`;
    elem.style.left = `${props.left}px`;
    elem.style.position = props.position;
  }

  function getOffset(elem) {
    if (document.documentElement !== elem && !document.documentElement.contains(elem))
      return { top: 0, left: 0 }
    const obj = elem.getBoundingClientRect();
    return {
      left: obj.left + window.pageXOffset,
      top: obj.top + window.pageYOffset,
      width: Math.round(obj.width),
      height: Math.round(obj.height),
    }
  }

  function getDimensions(elem) {
    if (elem.nodeType === 9) {
      return {
        width: elem.documentElement.scrollWidth,
        height: elem.documentElement.scrollHeight,
        offset: { top: 0, left: 0 },
      }
    }
    if (isWindow(elem)) {
      return {
        width: elem.innerWidth,
        height: elem.innerHeight,
        offset: { top: elem.pageYOffset, left: elem.pageXOffset },
      }
    }
    if (elem.preventDefault) {
      return {
        width: 0,
        height: 0,
        offset: { top: elem.pageY, left: elem.pageX },
      }
    }
    const elemOffset = elem.getBoundingClientRect();
    return {
      width: elem.offsetWidth,
      height: elem.offsetHeight,
      offset: {
        left: elemOffset.left + window.pageXOffset,
        top: elemOffset.top + window.pageYOffset,
      },
    }
  }

  const positionTool = {
    scrollbarWidth: function () {
      if (cachedScrollbarWidth !== undefined) {
        return cachedScrollbarWidth
      }

      const scrollDiv = document.createElement('div');
      scrollDiv.className = 'modal-scrollbar-measure';
      document.body.appendChild(scrollDiv);
      const scrollbarWidth = scrollDiv.getBoundingClientRect().width - scrollDiv.clientWidth;
      document.body.removeChild(scrollDiv);
      cachedScrollbarWidth = scrollbarWidth;
      return cachedScrollbarWidth
    },
    getScrollInfo: function (within) {
      const overflowX =
        within.isWindow || within.isDocument ? '' : getComputedStyle(within.element).overflowX;
      const overflowY =
        within.isWindow || within.isDocument ? '' : getComputedStyle(within.element).overflowY;
      const hasOverflowX =
        overflowX === 'scroll' || (overflowX === 'auto' && within.width < within.element.scrollWidth);
      const hasOverflowY =
        overflowY === 'scroll' ||
        (overflowY === 'auto' && within.height < within.element.scrollHeight);
      return {
        width: hasOverflowY ? positionTool.scrollbarWidth() : 0,
        height: hasOverflowX ? positionTool.scrollbarWidth() : 0,
      }
    },
    getWithinInfo: function (element) {
      const withinElement = element || window;
      const isElemWindow = isWindow(withinElement);
      const isDocument = !!withinElement && withinElement.nodeType === 9;
      const hasOffset = !isElemWindow && !isDocument;
      return {
        element: withinElement,
        isWindow: isElemWindow,
        isDocument: isDocument,
        offset: hasOffset ? getOffset(element) : { left: 0, top: 0 },
        scrollLeft: getScrollLeft(withinElement),
        scrollTop: getScrollTop(withinElement),
        width: isWindow ? withinElement.innerWidth : withinElement.offsetWidth,
        height: isWindow ? withinElement.innerHeight : withinElement.offsetHeight,
      }
    },
  };

  const positionFns = {
    fit: {
      left: function (position, data) {
        const { within } = data;
        const withinOffset = within.isWindow ? within.scrollLeft : within.offset.left;
        const outerWidth = within.width;
        const collisionPosLeft = position.left - data.collisionPosition.marginLeft;
        const overLeft = withinOffset - collisionPosLeft;
        const overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset;
        let newOverRight;

        // Element is wider than within
        if (data.collisionWidth > outerWidth) {
          // Element is initially over the left side of within
          if (overLeft > 0 && overRight <= 0) {
            newOverRight = position.left + overLeft + data.collisionWidth - outerWidth - withinOffset;
            position.left += overLeft - newOverRight;

            // Element is initially over right side of within
          } else if (overRight > 0 && overLeft <= 0) {
            position.left = withinOffset;

            // Element is initially over both left and right sides of within
          } else if (overLeft > overRight) {
            position.left = withinOffset + outerWidth - data.collisionWidth;
          } else {
            position.left = withinOffset;
          }

          // Too far left -> align with left edge
        } else if (overLeft > 0) {
          position.left += overLeft;

          // Too far right -> align with right edge
        } else if (overRight > 0) {
          position.left -= overRight;

          // Adjust based on position and margin
        } else {
          position.left = max(position.left - collisionPosLeft, position.left);
        }
      },
      top: function (position, data) {
        const { within } = data;
        const withinOffset = within.isWindow ? within.scrollTop : within.offset.top;
        const outerHeight = data.within.height;
        const collisionPosTop = position.top - data.collisionPosition.marginTop;
        const overTop = withinOffset - collisionPosTop;
        const overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset;
        let newOverBottom;

        // Element is taller than within
        if (data.collisionHeight > outerHeight) {
          // Element is initially over the top of within
          if (overTop > 0 && overBottom <= 0) {
            newOverBottom = position.top + overTop + data.collisionHeight - outerHeight - withinOffset;
            position.top += overTop - newOverBottom;

            // Element is initially over bottom of within
          } else if (overBottom > 0 && overTop <= 0) {
            position.top = withinOffset;

            // Element is initially over both top and bottom of within
          } else if (overTop > overBottom) {
            position.top = withinOffset + outerHeight - data.collisionHeight;
          } else {
            position.top = withinOffset;
          }

          // Too far up -> align with top
        } else if (overTop > 0) {
          position.top += overTop;

          // Too far down -> align with bottom edge
        } else if (overBottom > 0) {
          position.top -= overBottom;

          // Adjust based on position and margin
        } else {
          position.top = max(position.top - collisionPosTop, position.top);
        }
      },
    },
    flip: {
      left: function (position, data) {
        const { within } = data;
        const withinOffset = within.offset.left + within.scrollLeft;
        const outerWidth = within.width;
        const offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left;
        const collisionPosLeft = position.left - data.collisionPosition.marginLeft;
        const overLeft = collisionPosLeft - offsetLeft;
        const overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft;
        const myOffset =
          data.my[0] === 'left' ? -data.elemWidth : data.my[0] === 'right' ? data.elemWidth : 0;
        const atOffset =
          data.at[0] === 'left' ? data.targetWidth : data.at[0] === 'right' ? -data.targetWidth : 0;
        const offset = -2 * data.offset[0];
        let newOverRight;
        let newOverLeft;

        if (overLeft < 0) {
          newOverRight =
            position.left +
            myOffset +
            atOffset +
            offset +
            data.collisionWidth -
            outerWidth -
            withinOffset;
          if (newOverRight < 0 || newOverRight < abs(overLeft)) {
            position.left += myOffset + atOffset + offset;
          }
        } else if (overRight > 0) {
          newOverLeft =
            position.left -
            data.collisionPosition.marginLeft +
            myOffset +
            atOffset +
            offset -
            offsetLeft;
          if (newOverLeft > 0 || abs(newOverLeft) < overRight) {
            position.left += myOffset + atOffset + offset;
          }
        }
      },
      top: function (position, data) {
        const { within } = data;
        const withinOffset = within.offset.top + within.scrollTop;
        const outerHeight = within.height;
        const offsetTop = within.isWindow ? within.scrollTop : within.offset.top;
        const collisionPosTop = position.top - data.collisionPosition.marginTop;
        const overTop = collisionPosTop - offsetTop;
        const overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop;
        const top = data.my[1] === 'top';
        const myOffset = top ? -data.elemHeight : data.my[1] === 'bottom' ? data.elemHeight : 0;
        const atOffset =
          data.at[1] === 'top' ? data.targetHeight : data.at[1] === 'bottom' ? -data.targetHeight : 0;
        const offset = -2 * data.offset[1];
        let newOverTop;
        let newOverBottom;
        if (overTop < 0) {
          newOverBottom =
            position.top +
            myOffset +
            atOffset +
            offset +
            data.collisionHeight -
            outerHeight -
            withinOffset;
          if (newOverBottom < 0 || newOverBottom < abs(overTop)) {
            position.top += myOffset + atOffset + offset;
          }
        } else if (overBottom > 0) {
          newOverTop =
            position.top - data.collisionPosition.marginTop + myOffset + atOffset + offset - offsetTop;
          if (newOverTop > 0 || abs(newOverTop) < overBottom) {
            position.top += myOffset + atOffset + offset;
          }
        }
      },
    },
    flipfit: {
      left: function () {
        positionFns.flip.left.apply(this, arguments);
        positionFns.fit.left.apply(this, arguments);
      },
      top: function () {
        positionFns.flip.top.apply(this, arguments);
        positionFns.fit.top.apply(this, arguments);
      },
    },
  };

  function position(elem, options) {
    if (!options || !options.of) {
      return
    }

    // Make a copy, we don't want to modify arguments
    options = extend({}, options);

    const target = options.of;
    const within = positionTool.getWithinInfo(options.within);
    const scrollInfo = positionTool.getScrollInfo(within);
    const collision = (options.collision || 'flip').split(' ');
    const offsets = {};

    const dimensions = getDimensions(target);
    if (target.preventDefault) {
      // Force left top to allow flipping
      options.at = 'left top';
    }
    const targetWidth = dimensions.width;
    const targetHeight = dimensions.height;
    const targetOffset = dimensions.offset;

    // Clone to reuse original targetOffset later
    const basePosition = extend({}, targetOffset)

    // Force my and at to have valid horizontal and vertical positions
    // if a value is missing or invalid, it will be converted to center
    ;['my', 'at'].forEach(function (item) {
      let pos = (options[item] || '').split(' ');

      if (pos.length === 1) {
        pos = rhorizontal.test(pos[0])
          ? pos.concat(['center'])
          : rvertical.test(pos[0])
          ? ['center'].concat(pos)
          : ['center', 'center'];
      }
      pos[0] = rhorizontal.test(pos[0]) ? pos[0] : 'center';
      pos[1] = rvertical.test(pos[1]) ? pos[1] : 'center';

      // Calculate offsets
      const horizontalOffset = roffset.exec(pos[0]);
      const verticalOffset = roffset.exec(pos[1]);
      offsets[item] = [
        horizontalOffset ? horizontalOffset[0] : 0,
        verticalOffset ? verticalOffset[0] : 0,
      ];

      // Reduce to just the positions without the offsets
      options[item] = [rposition.exec(pos[0])[0], rposition.exec(pos[1])[0]];
    });

    // Normalize collision option
    if (collision.length === 1) {
      collision[1] = collision[0];
    }

    if (options.at[0] === 'right') {
      basePosition.left += targetWidth;
    } else if (options.at[0] === 'center') {
      basePosition.left += targetWidth / 2;
    }

    if (options.at[1] === 'bottom') {
      basePosition.top += targetHeight;
    } else if (options.at[1] === 'center') {
      basePosition.top += targetHeight / 2;
    }

    const atOffset = getOffsets(offsets.at, targetWidth, targetHeight);
    basePosition.left += atOffset[0];
    basePosition.top += atOffset[1];

    const elemWidth = elem.offsetWidth;
    const elemHeight = elem.offsetHeight;
    const marginLeft = parseCss(elem, 'marginLeft');
    const marginTop = parseCss(elem, 'marginTop');
    const collisionWidth = elemWidth + marginLeft + parseCss(elem, 'marginRight') + scrollInfo.width;
    const collisionHeight =
      elemHeight + marginTop + parseCss(elem, 'marginBottom') + scrollInfo.height;
    const position = extend({}, basePosition);
    const myOffset = getOffsets(offsets.my, elem.offsetWidth, elem.offsetHeight);

    if (options.my[0] === 'right') {
      position.left -= elemWidth;
    } else if (options.my[0] === 'center') {
      position.left -= elemWidth / 2;
    }

    if (options.my[1] === 'bottom') {
      position.top -= elemHeight;
    } else if (options.my[1] === 'center') {
      position.top -= elemHeight / 2;
    }

    position.left += myOffset[0];
    position.top += myOffset[1];

    const collisionPosition = {
      marginLeft: marginLeft,
      marginTop: marginTop,
    }
    ;['left', 'top'].forEach(function (dir, i) {
      if (positionFns[collision[i]]) {
        positionFns[collision[i]][dir](position, {
          targetWidth: targetWidth,
          targetHeight: targetHeight,
          elemWidth: elemWidth,
          elemHeight: elemHeight,
          collisionPosition: collisionPosition,
          collisionWidth: collisionWidth,
          collisionHeight: collisionHeight,
          offset: [atOffset[0] + myOffset[0], atOffset[1] + myOffset[1]],
          my: options.my,
          at: options.at,
          within: within,
          elem: elem,
        });
      }
    });

    setOffset(elem, position);
  }

  class PanelBody extends Component {
    // constructor(props, ...mixins) {
    //   super(props, ...mixins)
    // }
  }

  Component.register(PanelBody);

  class PanelFooter extends Component {
    // constructor(props, ...mixins) {
    //     super(props, ...mixins)
    // }
  }

  Component.register(PanelFooter);

  class Icon extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        type: '',
        tag: 'i',
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this.setProps({
        // eslint-disable-next-line prefer-template
        children: Icon.svgs[this.props.type] ? '#' + Icon.svgs[this.props.type].svg : null,
      });
    }
  }

  Icon.svgs = {};

  Icon.add = function (type, svg, cat) {
    Icon.svgs[type] = { type, svg, cat };
  };

  Component.normalizeIconProps = function (props) {
    if (props === null || props === undefined) {
      return null
    }
    let iconProps = {};
    if (isString(props)) {
      iconProps.type = props;
    } else if (isPlainObject(props)) {
      iconProps = props;
    } else {
      return null
    }
    iconProps.component = Icon;

    return iconProps
  };

  Component.register(Icon);

  /* Direction */
  let cat = 'Direction';
  Icon.add(
    'up',
    `<svg focusable="false" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/></svg>`,
    cat,
  );

  Icon.add(
    'down',
    `<svg focusable="false" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>`,
    cat,
  );

  Icon.add(
    'left',
    `<svg focusable="false" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>`,
    cat,
  );

  Icon.add(
    'right',
    `<svg focusable="false" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>`,
    cat,
  );

  Icon.add(
    'refresh',
    `<svg t="1611710311642" viewBox="0 0 1204 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9191" width="1em" height="1em"><path d="M822.704457 813.250853a384.466659 384.466659 0 0 1-225.260731 68.644008 419.812302 419.812302 0 0 1-31.552158-1.625779c-4.214983-0.361284-8.429966-1.083853-12.705163-1.565566a430.048689 430.048689 0 0 1-24.326473-3.73327c-4.937551-0.903211-9.754675-2.167706-14.571798-3.251558-7.827825-1.806421-15.535223-3.673057-23.182407-5.900977-3.673057-1.144067-7.225685-2.408562-10.898741-3.612842a375.916265 375.916265 0 0 1-26.07268-9.453605c-1.926849-0.782783-3.793485-1.685993-5.66012-2.52899a388.862284 388.862284 0 0 1-29.324239-14.029871l-1.324709-0.602141a388.380572 388.380572 0 0 1-111.757262-91.284488c-1.505351-1.806421-3.010702-3.853699-4.516053-5.720334a376.518405 376.518405 0 0 1-84.359873-237.243325h89.23721c2.288134 0 4.516053-1.204281 5.720334-3.371987a6.081618 6.081618 0 0 0-0.30107-6.442902l-149.932965-222.671528a6.563331 6.563331 0 0 0-10.838527 0L1.023639 491.467012a6.202046 6.202046 0 0 0-0.30107 6.503116c1.204281 2.107491 3.4322 3.311772 5.720334 3.311773H95.740327a494.357286 494.357286 0 0 0 89.598495 283.969422c0.722569 1.144067 1.204281 2.348348 1.926849 3.4322 5.900976 8.309538 12.343879 15.896507 18.666353 23.724333 2.288134 3.010702 4.516053 6.021404 6.924615 8.911678a511.819358 511.819358 0 0 0 29.083382 31.672586c1.023639 1.023639 1.866635 2.047277 2.83006 2.950488a499.294837 499.294837 0 0 0 153.967306 103.929437c3.070916 1.324709 6.081618 2.769846 9.272962 4.094555 10.718099 4.395625 21.677055 8.18911 32.756439 11.862166 5.238622 1.806421 10.417029 3.612843 15.655651 5.178408 9.754675 2.83006 19.629778 5.178408 29.504881 7.586969 6.623545 1.505351 13.247089 3.13113 19.991062 4.395625 2.709632 0.60214 5.419264 1.384923 8.128895 1.806422 9.393391 1.685993 18.846995 2.589204 28.240386 3.73327 3.371986 0.361284 6.743973 0.963425 10.115959 1.324709 16.920146 1.625779 33.719864 2.709632 50.579796 2.709632 102.905798 0 203.282606-31.13066 289.4489-90.923204a59.792544 59.792544 0 0 0 14.933082-83.697518 61.117253 61.117253 0 0 0-84.660943-14.75244z m285.595202-311.908738a494.4175 494.4175 0 0 0-89.176996-283.307069c-0.842997-1.384923-1.445137-2.769846-2.288134-4.03434-7.045043-9.875103-14.632012-19.087851-22.158768-28.3006l-2.649417-3.371987a500.318476 500.318476 0 0 0-189.072093-140.539574l-5.96119-2.709632a599.009291 599.009291 0 0 0-35.586499-12.885805c-4.395625-1.445137-8.670822-3.010702-13.066447-4.275197A492.731507 492.731507 0 0 0 716.547101 13.789016C710.525697 12.404093 704.684935 10.958956 698.723745 9.814889c-3.010702-0.60214-5.780548-1.445137-8.731037-1.987064-7.948254-1.384923-16.016935-1.987063-24.025402-3.010702-5.539692-0.662354-11.01917-1.505351-16.558862-2.107491a540.481242 540.481242 0 0 0-40.162766-1.987063c-2.408562 0-4.817123-0.361284-7.225685-0.361285l-1.324709 0.120428a505.797954 505.797954 0 0 0-289.027402 90.501706 59.73233 59.73233 0 0 0-14.933083 83.697518c19.268493 27.216747 57.20334 33.840292 84.660944 14.75244A384.466659 384.466659 0 0 1 604.789839 120.789368c11.500882 0.060214 22.760908 0.60214 33.840292 1.62578l10.236387 1.324709c9.152534 1.083853 18.244855 2.408562 27.156533 4.154768 3.913913 0.722569 7.827825 1.746207 11.681524 2.589204 8.79125 1.987063 17.522286 4.094555 26.132894 6.623545 2.709632 0.842997 5.35905 1.806421 8.008468 2.709632 9.875103 3.13113 19.449136 6.623545 28.90274 10.477243l2.890274 1.204281c56.6012 24.145831 106.277784 61.297895 144.995413 107.662707l0.722569 0.963425a376.458191 376.458191 0 0 1 87.430789 241.157239h-89.23721a6.503117 6.503117 0 0 0-5.720334 3.371986 6.141832 6.141832 0 0 0 0.30107 6.442902l149.993179 222.671528a6.442903 6.442903 0 0 0 5.419263 2.83006c2.22792 0 4.214983-1.083853 5.419264-2.83006l149.932965-222.671528a6.202046 6.202046 0 0 0 0.30107-6.442902 6.503117 6.503117 0 0 0-5.720334-3.371986h-89.176996z" p-id="9192"></path></svg>`,
    cat,
  );
  /* Prompt */
  cat = 'Prompt';

  Icon.add(
    'info-circle',
    `<svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M464 336a48 48 0 1096 0 48 48 0 10-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"></path></svg>`,
    cat,
  );

  Icon.add(
    'question-circle',
    `<svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M623.6 316.7C593.6 290.4 554 276 512 276s-81.6 14.5-111.6 40.7C369.2 344 352 380.7 352 420v7.6c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V420c0-44.1 43.1-80 96-80s96 35.9 96 80c0 31.1-22 59.6-56.1 72.7-21.2 8.1-39.2 22.3-52.1 40.9-13.1 19-19.9 41.8-19.9 64.9V620c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8v-22.7a48.3 48.3 0 0130.9-44.8c59-22.7 97.1-74.7 97.1-132.5.1-39.3-17.1-76-48.3-103.3zM472 732a40 40 0 1080 0 40 40 0 10-80 0z"></path></svg>`,
    cat,
  );

  Icon.add(
    'exclamation-circle',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="exclamation-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M464 688a48 48 0 1096 0 48 48 0 10-96 0zm24-112h48c4.4 0 8-3.6 8-8V296c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8z"></path></svg>`,
    cat,
  );

  Icon.add(
    'close-circle',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="close-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M685.4 354.8c0-4.4-3.6-8-8-8l-66 .3L512 465.6l-99.3-118.4-66.1-.3c-4.4 0-8 3.5-8 8 0 1.9.7 3.7 1.9 5.2l130.1 155L340.5 670a8.32 8.32 0 00-1.9 5.2c0 4.4 3.6 8 8 8l66.1-.3L512 564.4l99.3 118.4 66 .3c4.4 0 8-3.5 8-8 0-1.9-.7-3.7-1.9-5.2L553.5 515l130.1-155c1.2-1.4 1.8-3.3 1.8-5.2z"></path><path d="M512 65C264.6 65 64 265.6 64 513s200.6 448 448 448 448-200.6 448-448S759.4 65 512 65zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path></svg>`,
    cat,
  );

  Icon.add(
    'check-circle',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="check-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M699 353h-46.9c-10.2 0-19.9 4.9-25.9 13.3L469 584.3l-71.2-98.8c-6-8.3-15.6-13.3-25.9-13.3H325c-6.5 0-10.3 7.4-6.5 12.7l124.6 172.8a31.8 31.8 0 0051.7 0l210.6-292c3.9-5.3.1-12.7-6.4-12.7z"></path><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path></svg>`,
    cat,
  );

  Icon.add(
    'question-circle',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="question-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M623.6 316.7C593.6 290.4 554 276 512 276s-81.6 14.5-111.6 40.7C369.2 344 352 380.7 352 420v7.6c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V420c0-44.1 43.1-80 96-80s96 35.9 96 80c0 31.1-22 59.6-56.1 72.7-21.2 8.1-39.2 22.3-52.1 40.9-13.1 19-19.9 41.8-19.9 64.9V620c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8v-22.7a48.3 48.3 0 0130.9-44.8c59-22.7 97.1-74.7 97.1-132.5.1-39.3-17.1-76-48.3-103.3zM472 732a40 40 0 1080 0 40 40 0 10-80 0z"></path></svg>`,
    cat,
  );

  Icon.add(
    'close',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="close" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path></svg>`,
    cat,
  );

  Icon.add(
    'eye',
    `<svg t="1610611013413" class="icon" viewBox="0 0 1603 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6374" width="16" height="16"><path d="M1439.175 502.814c-115.521-233.355-352.825-384.097-616.997-384.097-259.691-0.005-493.642 145.659-611.326 372.903-2.359 4.465-3.744 9.761-3.744 15.379 0 5.406 1.282 10.511 3.557 15.029 115.433 233.162 352.737 383.907 616.905 383.907 259.697 0 493.646-145.659 611.331-372.907 2.359-4.465 3.744-9.761 3.744-15.379 0-5.406-1.282-10.511-3.557-15.029zM827.575 839.278c-232.958 0-442.764-129.694-549.788-331.936 108.743-196.761 315.477-321.972 544.393-321.972 232.958 0 442.764 129.699 549.788 331.94-108.743 196.761-315.483 321.972-544.393 321.972zM952.959 642.373c33.654-34.619 52.858-81.01 52.858-130.373 0-103.084-83.211-186.644-185.849-186.644-102.641 0-185.849 83.561-185.849 186.644s83.206 186.644 185.849 186.644c14.662 0 26.548-11.937 26.548-26.663 0-14.722-11.885-26.661-26.548-26.661-73.319 0-132.749-59.689-132.749-133.319s59.431-133.319 132.749-133.319c73.314 0 132.745 59.689 132.745 133.319 0 35.301-13.68 68.366-37.751 93.123-4.671 4.809-7.55 11.38-7.55 18.623 0 7.469 3.061 14.223 7.998 19.075 4.777 4.693 11.327 7.588 18.553 7.588 7.449 0 14.181-3.078 18.991-8.031z" p-id="6375"></path></svg>`,
    cat,
  );

  Icon.add(
    'pin',
    `<svg t="1615376474037" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3895" width="16" height="16"><path d="M631.637333 178.432a64 64 0 0 1 19.84 13.504l167.616 167.786667a64 64 0 0 1-19.370666 103.744l-59.392 26.304-111.424 111.552-8.832 122.709333a64 64 0 0 1-109.098667 40.64l-108.202667-108.309333-184.384 185.237333-45.354666-45.162667 184.490666-185.344-111.936-112.021333a64 64 0 0 1 40.512-109.056l126.208-9.429333 109.44-109.568 25.706667-59.306667a64 64 0 0 1 84.181333-33.28z m-25.450666 58.730667l-30.549334 70.464-134.826666 135.04-149.973334 11.157333 265.408 265.6 10.538667-146.474667 136.704-136.874666 70.336-31.146667-167.637333-167.765333z" p-id="3896"></path></svg>`,
    cat,
  );

  Icon.add(
    'sort',
    `<svg t="1615376800925" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="20640" width="16" height="16"><path d="M426.666667 554.666667v-85.333334h341.333333v85.333334h-341.333333m0 256v-85.333334h170.666666v85.333334h-170.666666m0-512V213.333333h512v85.333334H426.666667M256 725.333333h106.666667L213.333333 874.666667 64 725.333333H170.666667V298.666667H64L213.333333 149.333333 362.666667 298.666667H256v426.666666z" fill="currentColor" p-id="20641"></path></svg>`,
    cat,
  );

  Icon.add(
    'sort-down',
    `<svg t="1615376844137" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="20851" width="16" height="16"><path d="M426.666667 554.666667v-85.333334h341.333333v85.333334h-341.333333m0 256v-85.333334h170.666666v85.333334h-170.666666m0-512V213.333333h512v85.333334H426.666667M256 725.333333h106.666667L213.333333 874.666667 64 725.333333H170.666667V170.666667h85.333333v554.666666z" fill="currentColor" p-id="20852"></path></svg>`,
    cat,
  );

  Icon.add(
    'sort-up',
    `<svg t="1615376874552" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="21062" width="16" height="16"><path d="M426.666667 469.333333v85.333334h341.333333v-85.333334h-341.333333m0-256v85.333334h170.666666V213.333333h-170.666666m0 512v85.333334h512v-85.333334H426.666667M256 298.666667h106.666667L213.333333 149.333333 64 298.666667H170.666667v554.666666h85.333333V298.666667z" fill="currentColor" p-id="21063"></path></svg>`,
    cat,
  );

  /* Editor */
  cat = 'Editor';

  Icon.add(
    'form',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="form" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M904 512h-56c-4.4 0-8 3.6-8 8v320H184V184h320c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V520c0-4.4-3.6-8-8-8z"></path><path d="M355.9 534.9L354 653.8c-.1 8.9 7.1 16.2 16 16.2h.4l118-2.9c2-.1 4-.9 5.4-2.3l415.9-415c3.1-3.1 3.1-8.2 0-11.3L785.4 114.3c-1.6-1.6-3.6-2.3-5.7-2.3s-4.1.8-5.7 2.3l-415.8 415a8.3 8.3 0 00-2.3 5.6zm63.5 23.6L779.7 199l45.2 45.1-360.5 359.7-45.7 1.1.7-46.4z"></path></svg>`,
    cat,
  );

  Icon.add(
    'plus',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="plus" width="1em" height="1em" fill="currentColor" aria-hidden="true"><defs><style></style></defs><path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"></path><path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"></path></svg>`,
    cat,
  );

  Icon.add(
    'edit',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="edit" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M257.7 752c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 000-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 009.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9zm67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89zM880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z"></path></svg>`,
    cat,
  );

  Icon.add(
    'delete',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="delete" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"></path></svg>`,
    cat,
  );

  Icon.add(
    'blank-square',
    `<svg t="1609925372510" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1811" width="16" height="16"><path d="M845 179v666H179V179h666m0-64H179c-35.3 0-64 28.7-64 64v666c0 35.3 28.7 64 64 64h666c35.3 0 64-28.7 64-64V179c0-35.3-28.7-64-64-64z" p-id="1812"></path></svg>`,
    cat,
  );

  Icon.add(
    'checked-square',
    `<svg t="1609925474194" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2089" width="16" height="16"><path d="M844 116H180c-35.3 0-64 28.7-64 64v664c0 35.3 28.7 64 64 64h664c35.3 0 64-28.7 64-64V180c0-35.3-28.7-64-64-64z m0 728H180V180h664v664z" p-id="2090"></path><path d="M433.4 670.6c6.2 6.2 14.4 9.4 22.6 9.4s16.4-3.1 22.6-9.4l272-272c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L456 602.7 342.6 489.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l136.1 135.9z" p-id="2091"></path></svg>`,
    cat,
  );

  Icon.add(
    'half-square',
    `<svg t="1609936930955" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1365" width="16" height="16"><path d="M844 116H180c-35.3 0-64 28.7-64 64v664c0 35.3 28.7 64 64 64h664c35.3 0 64-28.7 64-64V180c0-35.3-28.7-64-64-64z m0 728H180V180h664v664z" p-id="1366"></path><path d="M320 544h384c17.7 0 32-14.3 32-32s-14.3-32-32-32H320c-17.7 0-32 14.3-32 32s14.3 32 32 32z" p-id="1367"></path></svg>`,
    cat,
  );

  Icon.add(
    'times',
    `<svg t="1610503666305" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2041" width="16" height="16"><path d="M572.16 512l183.466667-183.04a42.666667 42.666667 0 1 0-60.586667-60.586667L512 451.84l-183.04-183.466667a42.666667 42.666667 0 0 0-60.586667 60.586667l183.466667 183.04-183.466667 183.04a42.666667 42.666667 0 0 0 0 60.586667 42.666667 42.666667 0 0 0 60.586667 0l183.04-183.466667 183.04 183.466667a42.666667 42.666667 0 0 0 60.586667 0 42.666667 42.666667 0 0 0 0-60.586667z" p-id="2042"></path></svg>`,
    cat,
  );

  /* Logo */
  cat = 'Logo';

  Icon.add(
    'github',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="github" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M511.6 76.3C264.3 76.2 64 276.4 64 523.5 64 718.9 189.3 885 363.8 946c23.5 5.9 19.9-10.8 19.9-22.2v-77.5c-135.7 15.9-141.2-73.9-150.3-88.9C215 726 171.5 718 184.5 703c30.9-15.9 62.4 4 98.9 57.9 26.4 39.1 77.9 32.5 104 26 5.7-23.5 17.9-44.5 34.7-60.8-140.6-25.2-199.2-111-199.2-213 0-49.5 16.3-95 48.3-131.7-20.4-60.5 1.9-112.3 4.9-120 58.1-5.2 118.5 41.6 123.2 45.3 33-8.9 70.7-13.6 112.9-13.6 42.4 0 80.2 4.9 113.5 13.9 11.3-8.6 67.3-48.8 121.3-43.9 2.9 7.7 24.7 58.3 5.5 118 32.4 36.8 48.9 82.7 48.9 132.3 0 102.2-59 188.1-200 212.9a127.5 127.5 0 0138.1 91v112.5c.8 9 0 17.9 15 17.9 177.1-59.7 304.6-227 304.6-424.1 0-247.2-200.4-447.3-447.5-447.3z"></path></svg>`,
    cat,
  );

  /* Uncategorized */
  cat = 'Uncategorized';

  Icon.add(
    'clock',
    `<svg t="1614131772688" class="icon" viewBox="0 0 1024 1024" version="1.1" fill="currentColor" xmlns="http://www.w3.org/2000/svg" p-id="2901" width="16" height="16"><path d="M512 74.666667C270.933333 74.666667 74.666667 270.933333 74.666667 512S270.933333 949.333333 512 949.333333 949.333333 753.066667 949.333333 512 753.066667 74.666667 512 74.666667z m0 810.666666c-204.8 0-373.333333-168.533333-373.333333-373.333333S307.2 138.666667 512 138.666667 885.333333 307.2 885.333333 512 716.8 885.333333 512 885.333333z" p-id="2902"></path><path d="M695.466667 567.466667l-151.466667-70.4V277.333333c0-17.066667-14.933333-32-32-32s-32 14.933333-32 32v238.933334c0 12.8 6.4 23.466667 19.2 29.866666l170.666667 81.066667c4.266667 2.133333 8.533333 2.133333 12.8 2.133333 12.8 0 23.466667-6.4 29.866666-19.2 6.4-14.933333 0-34.133333-17.066666-42.666666z" p-id="2903"></path></svg>`,
    cat,
  );

  Icon.add(
    'calendar',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="calendar" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M880 184H712v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H384v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H144c-17.7 0-32 14.3-32 32v664c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V216c0-17.7-14.3-32-32-32zm-40 656H184V460h656v380zM184 392V256h128v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h256v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h128v136H184z"></path></svg>`,
    cat,
  );

  Icon.add(
    'table',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="table" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-40 208H676V232h212v136zm0 224H676V432h212v160zM412 432h200v160H412V432zm200-64H412V232h200v136zm-476 64h212v160H136V432zm0-200h212v136H136V232zm0 424h212v136H136V656zm276 0h200v136H412V656zm476 136H676V656h212v136z"></path></svg>`,
    cat,
  );

  Icon.add(
    'profile',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="profile" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656zM492 400h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H492c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8zm0 144h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H492c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8zm0 144h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H492c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8zM340 368a40 40 0 1080 0 40 40 0 10-80 0zm0 144a40 40 0 1080 0 40 40 0 10-80 0zm0 144a40 40 0 1080 0 40 40 0 10-80 0z"></path></svg>`,
    cat,
  );

  Icon.add(
    'user',
    `<svg viewBox="64 64 896 896" focusable="false" data-icon="user" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"></path></svg>`,
    cat,
  );

  /* common */
  cat = 'Common';
  Icon.add(
    'upload',
    `<svg t="1609828633664" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1558" width="1em" height="1em"><path d="M883.6 926.7H140.4c-42.1 0-76.4-35.9-76.4-80V577.8c0-22.1 17.9-40 40-40s40 17.9 40 40v268.9h736V577.8c0-22.1 17.9-40 40-40s40 17.9 40 40v268.9c0 44.1-34.3 80-76.4 80z" fill="#2C2C2C" p-id="1559"></path><path d="M512 744.2c-22.1 0-40-17.9-40-40V104.6c0-22.1 17.9-40 40-40s40 17.9 40 40v599.6c0 22.1-17.9 40-40 40z" fill="#2C2C2C" p-id="1560"></path><path d="M320 335.9c-10.2 0-20.5-3.9-28.3-11.7-15.6-15.6-15.6-40.9 0-56.6L481.6 77.8c4.5-4.5 13.9-13.9 30.4-13.9 10.6 0 20.8 4.2 28.3 11.7l192 192c15.6 15.6 15.6 40.9 0 56.6s-40.9 15.6-56.6 0L512 160.5 348.3 324.2c-7.8 7.8-18.1 11.7-28.3 11.7z" fill="#2C2C2C" p-id="1561"></path></svg>`,
    cat,
  );

  /* Loading */
  cat = 'Loading';
  Icon.add(
    'loading',
    `<svg width="1em" height="1em" viewBox="0 0 50 50" style="enable-background: new 0 0 50 50" xml:space="preserve"><path fill='#4263eb' d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z" transform="rotate(275.098 25 25)"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"></animateTransform>`,
    cat,
  );

  /* FileType */
  cat = 'FileType';
  Icon.add(
    'accdb',
    `<svg t="1609739797704" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3679" width="1em" height="1em"><path d="M262.992 130.472h-0.368l-9.856 39.4h19.352l-9.128-39.4z m268.352 46.88c0.24-8.976-3.648-13.128-11.688-12.472h-11.32v24.44h11.32c8.04 0.672 11.928-3.32 11.688-11.968z m-2.192-38.408c0-7.312-3.168-10.976-9.496-10.976h-11.32v21.448h11.32c6.336 0.008 9.496-3.488 9.496-10.472z" p-id="3680"></path><path d="M591 315V65.368h-408v351.632h0.12v542.56h657.88v-644.56h-250zM493.736 112.512h25.56c15.576 0 23.728 7.976 24.464 23.936-0.248 9.648-4.264 16.296-12.048 19.952v0.496c9.728 3.328 14.728 11.312 14.968 23.936-0.728 14.96-9.856 22.944-27.384 23.944h-25.56V112.512z m-67.176 0h23c22.392 0.336 33.712 15.792 33.952 46.384-0.248 30.264-11.56 45.56-33.952 45.888H426.56V112.512z m-36.88-1.992c18.008 0.336 27.504 10.976 28.48 31.92h-15.336c-0.488-11.296-4.872-17.12-13.144-17.456-8.032 0.672-12.296 11.968-12.776 33.92 0.488 21.616 4.744 32.752 12.776 33.416 8.52-0.328 12.896-6.152 13.144-17.456h15.336c-0.728 20.288-10.224 30.584-28.48 30.92-18.256-0.672-27.624-16.288-28.112-46.88 0.728-31.256 10.096-47.392 28.112-48.384z m-62.064 0c18.008 0.336 27.504 10.976 28.48 31.92h-15.336c-0.488-11.296-4.872-17.12-13.144-17.456-8.032 0.672-12.296 11.968-12.776 33.92 0.488 21.616 4.744 32.752 12.776 33.416 8.52-0.328 12.896-6.152 13.144-17.456h15.336c-0.728 20.288-10.224 30.584-28.48 30.92-18.256-0.672-27.632-16.288-28.112-46.88 0.728-31.256 10.096-47.392 28.112-48.384z m-73.024 1.992h17.16l23.728 92.272H280.88l-5.112-19.448H249.12l-5.112 19.448h-13.872l24.456-92.272z m534.912 794.488h-1.128v1.248h-553.2V434.664h1v-1h553.336v473.336z" p-id="3681"></path><path d="M468.184 158.896c0.24-21.272-6.336-31.584-19.72-30.92H440.8v61.344h7.664c13.384 0.672 19.96-9.472 19.72-30.424zM630.504 64v210.504h210.504L630.504 64zM286.264 479.664h453.152v31.336H286.264v-31.336zM395.76 596.656h343.656v31.336H395.76v-31.336z m0 117h343.656v31.336H395.76v-31.336z m0 116.992h343.656v31.336H395.76v-31.336zM286.432 594.416h31.24v31.24h-31.24v-31.24z m0 118.248h31.24v31.24h-31.24v-31.24z m0 118.256h31.24v31.24h-31.24v-31.24z" p-id="3682"></path></svg>`,
    cat,
  );

  Icon.add(
    'as',
    `<svg t="1609739620763" class="icon" viewBox="0 0 1355 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3393" width="1em" height="1em"><path d="M995.813211 1024c-10.06993 0-18.125874-8.055944-18.125874-18.125874v-104.951049c0-10.06993 8.055944-18.125874 18.125874-18.125874 21.482517 0 29.538462-8.503497 33.79021-14.993007 5.594406-8.27972 12.083916-26.405594 12.083916-66.909091v-119.496504c0-82.573427 16.559441-138.293706 50.573427-169.174825-34.013986-32.223776-50.573427-90.405594-50.573427-176.335664V220.867133c0-79.664336-33.342657-79.664336-45.874126-79.664336-10.06993 0-18.125874-8.055944-18.125874-18.125874v-104.951049c0-10.06993 8.055944-18.125874 18.125874-18.125874 63.552448 0 110.769231 18.125874 140.531469 53.706294 29.090909 34.461538 43.188811 90.629371 43.188811 171.412587v128.447553c0 87.944056 32.671329 87.944056 43.412587 87.944056 10.06993 0 18.125874 8.055944 18.125875 18.125874v103.160839c0 10.06993-8.055944 18.125874-18.125875 18.125874-10.741259 0-43.188811 0-43.188811 86.825175v129.566433c0 84.363636-14.321678 141.65035-43.636363 175.216784-29.538462 34.237762-76.755245 51.468531-140.307693 51.468531z m18.125874-106.517483v69.818182c43.412587-2.685315 75.188811-15.440559 94.881119-38.041958 23.048951-26.405594 34.685315-77.426573 34.685315-151.496503v-129.566434c0-85.034965 30.20979-113.902098 61.314685-121.062937V475.972028c-31.104895-7.160839-61.314685-36.251748-61.314685-122.181818V225.342657c0-70.937063-11.636364-120.839161-34.909091-148.363636C1088.680344 53.034965 1056.90412 39.608392 1013.939085 36.699301V106.741259c32.447552 6.48951 64 33.566434 64 114.125874v115.020979c0 86.153846 17.454545 139.86014 52.139861 160 5.594406 3.132867 8.951049 9.174825 8.951048 15.664336v2.237762c0 6.48951-3.58042 12.755245-9.398601 15.888112-34.461538 18.797203-51.916084 70.041958-51.916084 151.944056v119.496503c0 40.27972-6.041958 68.923077-18.34965 87.048951-7.384615 11.412587-21.258741 24.839161-45.426574 29.314685zM251.757267 1024c-63.328671 0-110.769231-17.230769-140.531468-51.020979-29.762238-33.566434-44.083916-89.958042-44.083916-171.86014v-134.713287C67.141883 581.146853 34.918106 581.146853 24.400624 581.146853c-10.06993 0-18.125874-8.055944-18.125874-18.125874v-103.160839c0-10.06993 8.055944-18.125874 18.125874-18.125874 10.517483 0 42.965035 0 42.965035-89.062937V227.58042c0-82.34965 14.097902-139.188811 43.412587-173.874126C140.092932 18.34965 187.085939 0.223776 250.41461 0h1.342657c10.06993 0 18.125874 8.055944 18.125874 18.125874v104.951049c0 10.06993-8.055944 18.125874-18.125874 18.125874-12.531469 0-45.874126 0-45.874126 79.664336v119.496503c0 83.020979-16.783217 139.412587-50.797202 171.188812 34.237762 31.776224 50.797203 88.839161 50.797202 173.426573v115.020979c0 41.174825 6.48951 59.748252 11.86014 68.251748 4.027972 6.265734 12.307692 14.769231 34.013986 14.769231 4.699301 0 9.398601 2.013986 12.755245 5.370629s5.370629 8.055944 5.370629 12.755245v104.951049c0 9.846154-8.055944 17.902098-18.125874 17.902098z m-209.230769-477.090909c30.881119 7.160839 60.867133 35.58042 60.867133 119.496503v134.713287c0 71.832168 11.86014 121.51049 35.132867 147.916084 19.916084 22.601399 51.916084 35.58042 95.328671 38.265734v-69.818182c-24.615385-4.475524-38.48951-17.902098-46.321678-29.538461-12.083916-18.797203-17.902098-47.440559-17.902098-87.944056v-115.020979c0-84.13986-17.678322-136.951049-52.363636-156.643357-5.594406-3.132867-9.174825-9.174825-9.174825-15.664335v-2.237763c0-6.48951 3.58042-12.531469 9.174825-15.664335 34.909091-19.916084 52.587413-71.832168 52.587412-154.405595V220.867133c0-80.559441 31.776224-107.636364 64-114.125874V36.699301C190.218806 39.608392 158.218806 53.034965 138.302722 76.979021 115.253771 104.503497 103.393631 155.076923 103.393631 227.58042v125.090909c0 86.601399-29.986014 115.916084-60.867133 123.076923v71.160839zM795.757267 785.454545c-25.062937 0-49.454545-2.461538-72.055944-7.384615-13.65035-2.909091-27.076923-6.937063-40.055944-12.531468-0.671329 1.342657-1.342657 2.685315-2.237762 4.027972-3.356643 4.699301-8.727273 7.384615-14.545455 7.384615h-106.965035c-8.055944 0-15.216783-5.370629-17.454545-13.202797l-27.300699-99.132867h-127.328672l-27.076923 99.132867c-2.237762 7.832168-9.398601 13.426573-17.454545 13.426573H236.988036c-5.818182 0-11.188811-2.685315-14.545454-7.384615-3.356643-4.699301-4.475524-10.517483-2.685315-16.111888l158.433567-505.734266c2.461538-7.608392 9.398601-12.755245 17.230769-12.755245h116.363636c8.055944 0 14.993007 5.146853 17.230769 12.755245l124.419581 405.93007v-27.076923c0-7.384615 4.475524-13.874126 11.188811-16.783217 6.713287-2.909091 14.545455-1.342657 19.692308 3.804196 14.993007 14.769231 32.223776 26.629371 51.692307 34.909091 18.573427 7.608392 36.699301 11.188811 55.496504 11.188811h0.447552c9.174825 0.223776 18.34965-0.895105 27.076923-3.132867 7.160839-2.013986 12.755245-4.699301 17.23077-7.832168 3.58042-2.685315 6.48951-5.818182 8.503496-9.622378 1.79021-3.804196 2.685315-8.055944 2.685315-12.531468 0-6.041958-1.566434-11.86014-4.699301-16.783217-3.58042-5.818182-8.951049-11.636364-15.664335-16.783217-7.608392-6.041958-16.559441-11.636364-27.076924-17.230769-11.636364-6.265734-23.944056-12.307692-36.6993-18.34965-36.699301-17.678322-64.671329-40.055944-83.244755-66.237763-18.797203-26.853147-28.41958-59.300699-28.419581-96.447552 0-29.090909 5.146853-54.601399 15.44056-75.636364 10.293706-21.482517 24.615385-39.384615 42.293706-53.258741 18.34965-14.097902 38.937063-24.167832 61.090909-29.986014 21.482517-6.041958 44.755245-9.398601 68.923077-9.398601h1.118881c21.258741-0.223776 42.517483 1.566434 63.552448 5.146853 18.125874 2.909091 35.804196 8.27972 52.811188 15.664335 6.48951 2.909091 10.741259 9.398601 10.741259 16.559441v105.398601c0 6.937063-4.027972 13.426573-10.293706 16.335665-6.265734 2.909091-13.65035 2.013986-19.244755-2.237762-6.041958-4.923077-12.755245-9.398601-20.811189-13.426574-8.055944-4.251748-15.888112-7.384615-23.496504-9.846154-0.223776 0-0.223776 0-0.447552-0.223776-7.608392-2.685315-15.888112-4.475524-24.391609-5.818182-8.727273-1.342657-16.335664-2.013986-23.496503-2.013986-8.503497 0-16.783217 1.118881-24.615385 3.356644h-0.223776c-6.937063 1.79021-12.531469 4.251748-17.006993 7.384615l-0.223776 0.223776c-3.804196 2.685315-6.937063 6.041958-9.174825 10.06993-2.013986 3.58042-2.909091 7.160839-2.909091 11.86014 0 4.923077 1.118881 9.622378 3.356643 13.874126 3.356643 5.370629 7.384615 10.06993 12.307692 14.097902 6.265734 5.146853 14.097902 10.517483 23.272728 15.664336 10.741259 6.041958 21.93007 11.86014 33.118881 17.006993 17.006993 8.27972 33.566434 17.678322 49.230769 28.41958 14.769231 9.846154 28.195804 21.93007 39.384615 35.58042 11.636364 14.097902 20.363636 29.986014 26.181819 47.216783 5.818182 17.006993 8.951049 36.923077 8.951049 59.300699 0 30.881119-5.370629 57.51049-15.664336 79.216783-10.293706 21.482517-24.615385 39.384615-42.741259 53.034966l-0.223776 0.223776c-18.573427 13.65035-39.384615 23.048951-61.762238 28.41958-22.377622 5.594406-46.097902 8.27972-70.937063 8.27972z m-106.06993-57.062937c13.202797 6.48951 27.076923 11.412587 41.398602 14.321679 20.363636 4.475524 42.06993 6.713287 64.671328 6.713286 21.93007 0 42.741259-2.461538 61.762238-7.160839 17.902098-4.251748 34.237762-11.636364 48.783217-22.377622 13.426573-10.293706 24.167832-23.72028 31.776224-39.832168 8.055944-16.783217 12.083916-38.041958 12.083916-63.552447 0-18.34965-2.237762-34.461538-6.937063-47.664336-4.475524-13.202797-10.965035-25.062937-19.692308-35.58042-9.174825-10.965035-19.916084-20.587413-31.776224-28.643356l-0.223776-0.223777c-14.097902-9.622378-28.867133-18.34965-44.307692-25.734265-11.86014-5.594406-23.72028-11.86014-35.356644-18.125874 0 0-0.223776 0-0.223776-0.223777-10.965035-6.265734-20.363636-12.755245-28.41958-19.468531-8.055944-6.713287-14.769231-14.545455-20.363637-23.496504 0-0.223776-0.223776-0.447552-0.223776-0.671328-5.370629-9.846154-8.27972-20.811189-8.055944-32 0-10.741259 2.461538-20.587413 7.384615-29.314686 4.699301-8.727273 11.636364-16.335664 19.916084-22.153846 7.832168-5.818182 17.678322-10.06993 28.867133-12.979021 11.412587-3.132867 23.272727-4.699301 35.132867-4.475524 8.727273 0 17.902098 0.895105 28.195805 2.461538 10.293706 1.566434 20.587413 4.027972 29.986014 7.160839 8.951049 2.685315 17.902098 6.48951 26.853146 10.965035v-60.41958c-10.741259-4.027972-22.153846-6.937063-33.342657-8.727273-18.34965-3.132867-37.146853-4.699301-55.496503-4.699301h-1.566434c-21.482517 0-41.846154 2.685315-60.643357 8.055945h-0.447552c-17.678322 4.699301-33.79021 12.531469-48.335664 23.720279-13.426573 10.517483-23.72028 23.72028-31.776224 40.279721-7.832168 16.335664-11.86014 36.475524-11.86014 59.972028 0 29.986014 7.160839 54.825175 21.706294 75.636363 14.769231 21.034965 38.265734 39.384615 69.370629 54.377623 13.202797 6.265734 25.958042 12.755245 38.041958 19.020979 12.531469 6.713287 23.272727 13.426573 32.447552 20.811188 10.06993 7.832168 18.125874 16.559441 24.167833 26.181819 6.713287 10.965035 10.293706 23.496503 10.06993 36.251748 0 9.846154-2.237762 19.244755-6.265735 28.195804 0 0.223776-0.223776 0.223776-0.223776 0.447552-4.699301 8.951049-11.412587 16.783217-19.468531 22.601399-7.608392 5.594406-17.230769 10.06993-28.643357 13.426573h-0.447552c-12.083916 3.132867-24.391608 4.699301-36.923077 4.475525-23.272727 0-46.545455-4.699301-69.146853-14.097902 0 0-0.223776 0-0.223777-0.223776-11.188811-4.923077-21.93007-10.741259-32.223776-17.454546v64.223776z m-115.916084 12.083916h68.699301l-143.888112-469.482517h-89.734266L261.603421 740.475524h67.804196l27.076923-99.132867c2.237762-7.832168 9.398601-13.426573 17.454545-13.426573h154.853147c8.055944 0 15.216783 5.370629 17.454546 13.202797l27.524475 99.356643zM506.41461 576.671329h-111.44056c-5.594406 0-10.965035-2.685315-14.321678-7.160839s-4.475524-10.293706-3.132867-15.664336l47.440559-171.412588c3.804196-13.426573 6.041958-27.076923 6.937063-40.503496 0.671329-9.622378 8.951049-17.230769 18.573427-16.783217h1.79021c9.398601 0 17.230769 7.160839 18.125874 16.559441 1.342657 16.335664 3.58042 30.433566 6.713287 42.06993l46.76923 169.846154c1.566434 5.370629 0.447552 11.188811-3.132867 15.664335-3.356643 4.699301-8.503497 7.384615-14.321678 7.384616z m-87.72028-36.251749h64L450.918106 424.503497l-32.223776 115.916083z" p-id="3394"></path></svg>`,
    cat,
  );

  Icon.add(
    'asm',
    `<svg t="1609740169231" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6695" width="1em" height="1em"><path d="M115.612903 31.380645h650.735484L941.419355 206.451613v766.348387c0 18.167742-14.864516 33.032258-33.032258 33.032258H115.612903c-18.167742 0-33.032258-14.864516-33.032258-33.032258v-908.387097c0-18.167742 14.864516-33.032258 33.032258-33.032258z" fill="#F8F8F8" p-id="6696"></path><path d="M908.387097 1022.348387H115.612903c-28.077419 0-49.548387-21.470968-49.548387-49.548387v-908.387097c0-28.077419 21.470968-49.548387 49.548387-49.548387h657.341936L957.935484 199.845161v772.954839c0 26.425806-21.470968 49.548387-49.548387 49.548387zM115.612903 31.380645c-18.167742 0-33.032258 14.864516-33.032258 33.032258v908.387097c0 18.167742 14.864516 33.032258 33.032258 33.032258h792.774194c18.167742 0 33.032258-14.864516 33.032258-33.032258V206.451613L766.348387 31.380645H115.612903z" fill="#D5D5D5" p-id="6697"></path><path d="M66.064516 791.122581h891.870968v198.193548c0 18.167742-14.864516 33.032258-33.032258 33.032258H99.096774c-18.167742 0-33.032258-14.864516-33.032258-33.032258v-198.193548z" fill="#6C7795" p-id="6698"></path><path d="M924.903226 1022.348387H99.096774c-18.167742 0-33.032258-14.864516-33.032258-33.032258v-198.193548h891.870968v198.193548c0 18.167742-14.864516 33.032258-33.032258 33.032258z m-842.322581-214.709677v181.677419c0 9.909677 6.606452 16.516129 16.516129 16.516129h825.806452c9.909677 0 16.516129-6.606452 16.516129-16.516129v-181.677419H82.580645z" fill="#66718F" p-id="6699"></path><path d="M320.280774 974.451613l13.278968-36.467613h60.845419L407.684129 974.451613h23.188645l-54.503226-141.510194H351.793548L297.290323 974.451613h22.990451z m67.584-54.305032h-47.764645l23.585032-64.016516h0.792774l23.386839 64.016516z m108.610065 57.079742c17.837419 0 31.710968-3.567484 41.620645-10.702452 9.909677-7.333161 14.864516-17.242839 14.864516-29.927226 0-13.080774-6.144-23.188645-18.233806-30.521806-5.549419-3.36929-18.035613-7.927742-37.062194-13.873549-13.278968-3.963871-21.404903-6.936774-24.576-8.720516-7.134968-3.765677-10.504258-8.720516-10.504258-15.062709 0-7.134968 2.972903-12.288 9.116903-15.459097 4.954839-2.77471 12.089806-4.162065 21.404903-4.162065 10.702452 0 18.630194 1.981935 24.179613 6.144 5.549419 3.963871 9.116903 10.702452 11.098839 19.819355h21.404903c-1.387355-15.459097-6.936774-26.756129-16.846451-34.08929-9.315097-7.134968-22.197677-10.504258-38.647742-10.504258-15.06271 0-27.548903 3.36929-37.458581 10.107871-10.504258 7.134968-15.65729 16.846452-15.65729 29.332645 0 12.288 5.351226 21.80129 16.251871 28.341677 4.360258 2.378323 15.06271 6.144 32.503742 11.69342 15.65729 4.756645 24.972387 7.927742 28.143483 9.51329 8.91871 4.558452 13.477161 10.702452 13.477162 18.630193 0 6.342194-3.171097 11.297032-9.513291 14.864517-6.342194 3.567484-14.864516 5.549419-25.566967 5.549419-11.891613 0-20.612129-2.180129-26.359742-6.540387-6.342194-4.756645-10.306065-12.882581-11.891613-23.98142h-21.404903c1.189161 17.837419 7.531355 30.918194 19.224774 39.242323 9.711484 6.738581 23.188645 10.306065 40.431484 10.306065zM594.580645 974.451613v-101.07871h0.792774L638.777806 974.451613h18.630194l43.404387-101.07871h0.792774V974.451613h21.603097v-141.510194H697.64129l-49.152 113.36671h-0.59458l-49.350194-113.36671h-25.566968V974.451613H594.580645z" fill="#FFFFFF" p-id="6700"></path><path d="M289.032258 502.090323h445.935484v16.516129h-445.935484zM289.032258 584.670968h445.935484v16.516129h-445.935484zM289.032258 336.929032h280.774194v16.516129h-280.774194zM289.032258 254.348387h280.774194v16.516129h-280.774194zM289.032258 419.509677h445.935484v16.516129h-445.935484z" fill="#DDE2E5" p-id="6701"></path><path d="M944.722581 213.058065H766.348387V26.425806h16.516129v170.116129h161.858065z" fill="#D5D5D5" p-id="6702"></path><path d="M829.109677 394.735484l112.309678-84.232258v84.232258z" fill="#F6F6F6" p-id="6703"></path><path d="M779.56129 394.735484l161.858065-122.219355v37.987097l-112.309678 84.232258z" fill="#F6F6F6" p-id="6704"></path><path d="M768 366.658065L941.419355 236.180645v36.335484l-161.858065 122.219355h-11.56129z" fill="#F5F5F5" p-id="6705"></path><path d="M768 328.670968l153.6-115.612903H941.419355v23.12258l-173.419355 130.47742z" fill="#F4F4F4" p-id="6706"></path><path d="M768 292.335484l104.051613-79.277419h49.548387l-153.6 115.612903z" fill="#F2F2F2" p-id="6707"></path><path d="M768 254.348387l54.503226-41.290322h49.548387l-104.051613 79.277419z" fill="#F1F1F1" p-id="6708"></path><path d="M822.503226 213.058065l-54.503226 41.290322v-41.290322z" fill="#F1F1F1" p-id="6709"></path></svg>`,
    cat,
  );

  Icon.add(
    'aspx',
    `<svg t="1609742053109" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7364" width="1em" height="1em"><path d="M578.404848 703.767273a46.545455 46.545455 0 0 0 36.305455 17.687272A46.545455 46.545455 0 0 0 651.636364 703.146667a86.884848 86.884848 0 0 0 15.515151-56.785455 84.712727 84.712727 0 0 0-15.515151-54.768485A45.304242 45.304242 0 0 0 616.106667 574.060606a46.545455 46.545455 0 0 0-36.770909 19.393939 86.729697 86.729697 0 0 0-15.515152 56.32 83.316364 83.316364 0 0 0 14.584242 53.992728zM184.785455 667.151515a28.237576 28.237576 0 0 0-12.877576 10.550303 28.70303 28.70303 0 0 0 5.430303 35.995152 42.356364 42.356364 0 0 0 28.70303 8.688485 67.025455 67.025455 0 0 0 33.357576-8.223031 50.579394 50.579394 0 0 0 21.410909-22.496969 78.351515 78.351515 0 0 0 5.275151-32.426667v-11.946667a238.312727 238.312727 0 0 1-53.061818 12.25697 123.035152 123.035152 0 0 0-28.237575 7.602424z" p-id="7365"></path><path d="M960.077576 448.077576V287.961212L671.961212 0H95.728485a31.030303 31.030303 0 0 0-31.030303 31.030303v417.047273H0v447.922424h64.077576V992.969697a31.030303 31.030303 0 0 0 31.030303 31.030303h833.163636a31.030303 31.030303 0 0 0 31.030303-31.030303v-96.969697H1024V448.077576zM128 64.077576h543.961212v223.883636h224.038788v160.116364H128z m459.248485 491.209697a64.853333 64.853333 0 0 1 31.961212-7.292121 75.713939 75.713939 0 0 1 43.287273 12.567272 77.575758 77.575758 0 0 1 28.392727 35.684849 130.01697 130.01697 0 0 1 9.619394 50.424242 128 128 0 0 1-10.550303 52.906667 79.592727 79.592727 0 0 1-31.030303 36.150303 78.661818 78.661818 0 0 1-42.356364 12.567273 61.129697 61.129697 0 0 1-29.168485-6.826667 66.249697 66.249697 0 0 1-21.255757-17.37697v93.090909h-32.116364V552.339394h29.63394v24.824242a72.921212 72.921212 0 0 1 23.58303-21.876363z m-134.826667 118.380606a141.187879 141.187879 0 0 0-33.512727-11.015758 302.855758 302.855758 0 0 1-49.493333-15.515151A46.545455 46.545455 0 0 1 341.333333 603.229091a49.338182 49.338182 0 0 1 5.895758-23.738182 52.596364 52.596364 0 0 1 15.515151-18.152727 67.025455 67.025455 0 0 1 20.635152-9.464243 98.210909 98.210909 0 0 1 28.082424-3.878787 110.778182 110.778182 0 0 1 39.563637 6.516363 53.837576 53.837576 0 0 1 25.134545 17.532121 68.732121 68.732121 0 0 1 11.170909 29.63394l-31.030303 4.344242a34.753939 34.753939 0 0 0-12.567273-23.117576 46.545455 46.545455 0 0 0-29.168485-8.843636 53.061818 53.061818 0 0 0-31.961212 7.447273 21.566061 21.566061 0 0 0-10.24 17.842424 17.997576 17.997576 0 0 0 4.03394 11.326061 28.547879 28.547879 0 0 0 12.412121 8.688484q4.809697 1.861818 28.70303 8.223031a398.739394 398.739394 0 0 1 48.09697 15.515151 48.717576 48.717576 0 0 1 21.410909 17.066667 47.631515 47.631515 0 0 1 7.757576 27.772121 54.458182 54.458182 0 0 1-9.464243 31.030303 61.129697 61.129697 0 0 1-27.306666 22.186667 99.452121 99.452121 0 0 1-40.339394 7.912727 89.987879 89.987879 0 0 1-56.940606-15.515151 72.145455 72.145455 0 0 1-24.979394-46.545455l32.116363-5.12a44.838788 44.838788 0 0 0 15.515152 29.633939 52.596364 52.596364 0 0 0 34.598788 10.24 50.734545 50.734545 0 0 0 33.202424-9.153939 27.306667 27.306667 0 0 0 10.860606-21.410909 19.704242 19.704242 0 0 0-9.619394-17.532121z m-195.335757-87.815758a54.30303 54.30303 0 0 0-36.926061-11.015757 57.406061 57.406061 0 0 0-33.82303 8.067878 49.027879 49.027879 0 0 0-15.515152 28.392728l-31.030303-4.344243A78.661818 78.661818 0 0 1 152.669091 574.060606a62.060606 62.060606 0 0 1 28.70303-19.238788 127.844848 127.844848 0 0 1 43.442424-6.826666 115.122424 115.122424 0 0 1 39.87394 5.740606 52.596364 52.596364 0 0 1 22.49697 14.584242 51.2 51.2 0 0 1 10.084848 22.031515 183.233939 183.233939 0 0 1 1.551515 29.944243v43.287272a460.334545 460.334545 0 0 0 2.01697 57.250909 72.455758 72.455758 0 0 0 8.22303 22.962425h-33.667879a68.732121 68.732121 0 0 1-6.516363-23.583031 121.018182 121.018182 0 0 1-34.75394 21.721212 100.38303 100.38303 0 0 1-35.84 6.361213 69.66303 69.66303 0 0 1-48.562424-15.515152 50.889697 50.889697 0 0 1-16.911515-39.408485A52.441212 52.441212 0 0 1 139.636364 667.151515a53.061818 53.061818 0 0 1 16.756363-18.618182 78.972121 78.972121 0 0 1 23.427879-10.705454 231.796364 231.796364 0 0 1 28.858182-4.809697 296.804848 296.804848 0 0 0 57.871515-11.170909v-8.533334a35.84 35.84 0 0 0-9.464242-27.461818z m638.913939 374.225455H128v-64.077576h768z m-38.787879-216.126061l-39.408485-59.578182-10.395151-15.515151-50.269091 75.093333h-39.253333l69.973333-99.607273-64.853333-92.004848h40.649697l29.478787 44.993939q8.22303 12.877576 13.343031 21.410909 7.912727-11.946667 14.584242-21.100606L853.333333 552.339394h38.787879l-66.249697 90.14303 71.214546 101.31394z" p-id="7366"></path></svg>`,
    cat,
  );

  Icon.add(
    'avi',
    `<svg t="1609742141955" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8277" width="1em" height="1em"><path d="M893.108633 412.324781v18.801841h-13.70879v-18.801841H865.818378v18.801841h-151.093796v-18.801841h-13.708791v18.801841h-13.708791v-18.801841h-27.460024v338.220915h27.460024v-18.801841h13.708791v18.801841h13.708791v-18.801841H865.818378v18.801841h13.708791v-18.801841h13.708791v18.801841h27.460024V412.324781zM700.973349 713.026899h-13.708791v-37.561238h13.708791z m0-56.363078h-13.708791v-37.561239h13.708791z m0-56.363079h-13.708791v-37.561239h13.708791z m0-56.363079h-13.708791v-37.60368h13.708791z m0-56.363079h-13.708791V449.88602h13.708791zM865.818378 713.026899h-151.093796v-112.768599H865.818378z m0-131.570439h-151.093796v-131.57044H865.818378z m27.460024 131.570439h-13.878559v-37.561238h13.70879z m0-56.363078h-13.878559v-37.561239h13.70879z m0-56.363079h-13.878559v-37.561239h13.70879z m0-56.363079h-13.878559v-37.60368h13.70879z m0-56.363079h-13.878559V449.88602h13.70879z" fill="#606060" p-id="8278"></path><path d="M989.452149 221.420317a117.988975 117.988975 0 0 1 34.547851 83.441125v650.891698a68.459071 68.459071 0 0 1-68.24686 68.24686H273.072326a68.459071 68.459071 0 0 1-68.246861-68.24686v-51.227588h51.185146v51.185146a17.273925 17.273925 0 0 0 16.97683 16.97683h682.765699a17.273925 17.273925 0 0 0 16.976831-16.97683V304.861442a66.209641 66.209641 0 0 0-1.782568-14.727401h-237.081444V52.967713a67.228251 67.228251 0 0 0-14.727401-1.782568H273.072326a17.316368 17.316368 0 0 0-16.976831 16.976831v153.682762H204.783023V68.24686A68.459071 68.459071 0 0 1 273.072326 0h446.066232a117.946533 117.946533 0 0 1 83.441125 34.547851zM785.178431 238.948895h149.438554L785.178431 89.467899zM0 853.340407V273.072326h580.268081v580.268081z m397.38517-136.408837" fill="#606060" p-id="8279"></path></svg>`,
    cat,
  );

  Icon.add(
    'bmp',
    `<svg t="1609742328397" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9772" width="1em" height="1em"><path d="M661.495001 0.623858H131.839828C117.116787 0.623858 105.138719 12.601925 105.138719 35.809431v968.726209c0 6.238577 11.978068 18.216644 26.701109 18.216645h731.410747c14.723041 0 26.701109-11.978068 26.701109-18.216645V237.565005c0-12.726697-1.746802-16.844157-4.741318-19.838674L672.849211 5.365176c-2.994517-2.994517-7.111978-4.741318-11.35421-4.741318z m0 0" fill="#E9E9E0" p-id="9773"></path><path d="M670.977637 3.368831V219.597904h216.229073L670.977637 3.368831z m0 0" fill="#D9D7CA" p-id="9774"></path><path d="M248.625986 264.016571c0 29.820397 15.845985 57.270135 41.673694 72.24272 25.827708 14.847813 57.64445 14.847813 83.347386 0 25.827708-14.847813 41.673693-42.422322 41.673693-72.24272s-15.845985-57.270135-41.673693-72.242719c-25.827708-14.847813-57.64445-14.847813-83.347386 0-25.827708 14.972584-41.673693 42.422322-41.673694 72.242719z m0 0" fill="#F3D55B" p-id="9775"></path><path d="M105.138719 712.445473h784.812965V511.688071l-182.540758-173.432436L515.761846 548.246131l-100.066772-100.066772L105.138719 712.445473z m0 0" fill="#FC2BFC" p-id="9776"></path><path d="M863.250575 1022.752285H131.839828c-14.723041 0-26.701109-11.978068-26.701109-26.701109V712.445473h784.812965v283.605703c0 14.723041-11.978068 26.701109-26.701109 26.701109z m0 0" fill="#A002BC" p-id="9777"></path><path d="M264.971058 779.822103h60.13988c11.978068 0 20.836847 0.623858 26.701109 1.871573 5.864262 1.247715 11.104667 3.867918 15.721214 7.735835 4.616547 3.867918 8.484464 9.108322 11.603753 15.596442 3.119288 6.48812 4.616547 13.849641 4.616546 21.835019 0 8.734008-1.871573 16.844157-5.73949 24.080907-3.743146 7.361521-8.983551 12.851468-15.471671 16.469843 9.233094 3.368831 16.2203 8.983551 21.211161 16.968929 4.990861 7.985378 7.361521 17.343244 7.361521 28.198367 0 8.484464-1.62203 16.844157-4.741318 24.829536-3.24406 7.985378-7.486292 14.473498-13.101012 19.339588-5.489948 4.86609-12.352382 7.735835-20.33776 8.858779-5.115633 0.623858-17.343244 1.122944-36.682832 1.247715H264.971058V779.822103z m30.444255 31.192884v43.295723h19.963445c11.853296 0 19.214817-0.249543 22.084562-0.623857 5.240405-0.748629 9.357865-2.994517 12.227611-6.737663 2.994517-3.743146 4.491775-8.609236 4.491775-14.59827 0-5.739491-1.247715-10.480809-3.867917-14.099184-2.620202-3.618375-6.363348-5.864262-11.478982-6.612891-2.994517-0.374315-11.728524-0.623858-25.952479-0.623858h-17.468015z m0 74.363836v50.033386H323.61368c10.979895 0 17.967101-0.374315 20.836846-1.122944 4.491775-0.998172 8.234921-3.493603 11.104667-7.486292 2.869745-3.992689 4.242232-9.233094 4.242232-15.845985 0-5.614719-1.122944-10.356038-3.244059-14.348727-2.245888-3.867918-5.365176-6.737663-9.482637-8.609236-4.117461-1.746802-13.101011-2.620202-26.950652-2.620202h-24.704764zM416.443703 966.979408V779.822103h45.541611l27.324966 127.641282L516.260932 779.822103H561.927315v187.157305h-28.198368V819.624223l-29.945168 147.355185h-29.321312L444.64207 819.624223V966.979408h-28.198367zM592.122026 966.979408V779.822103h48.785671c18.466187 0 30.569026 0.998172 36.183746 2.869745 8.609236 2.869745 15.845985 8.858779 21.710247 18.341416 5.864262 9.357865 8.734008 21.585476 8.734008 36.433289 0 11.478981-1.62203 21.211161-4.990862 28.946996-3.368831 7.860607-7.611064 13.974412-12.851468 18.466188-5.115633 4.491775-10.480809 7.486292-15.721214 8.858779-7.236749 1.746802-17.717558 2.620202-31.567198 2.620202h-19.838675V966.979408h-30.444255z m30.319484-155.465335V864.666748h16.594614c11.978068 0 19.963446-0.998172 24.080907-2.994517 3.992689-1.996345 7.236749-4.990861 9.482636-9.233094 2.245888-4.117461 3.493603-8.983551 3.493603-14.598269 0-6.862435-1.62203-12.477154-4.866089-16.844158-3.24406-4.367004-7.236749-7.236749-12.227611-8.359693-3.618375-0.873401-10.979895-1.247715-21.835019-1.247715h-14.723041z" fill="#FFFFFF" p-id="9778"></path></svg>`,
    cat,
  );

  Icon.add(
    'c',
    `<svg t="1609742506293" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="12239" width="1em" height="1em"><path d="M738.133333 234.666667c46.933333 46.933333 74.666667 98.133333 78.933334 155.733333H725.333333c-10.666667-44.8-29.866667-78.933333-59.733333-104.533333s-72.533333-38.4-128-38.4c-66.133333 0-119.466667 23.466667-162.133333 72.533333-40.533333 46.933333-61.866667 121.6-61.866667 219.733333 0 81.066667 19.2 147.2 55.466667 196.266667 36.266667 51.2 91.733333 74.666667 166.4 74.666667 68.266667 0 119.466667-25.6 153.6-78.933334 19.2-27.733333 32-64 42.666666-108.8h91.733334c-8.533333 72.533333-34.133333 132.266667-78.933334 181.333334-53.333333 59.733333-128 89.6-219.733333 89.6-78.933333 0-145.066667-23.466667-198.4-72.533334-70.4-64-106.666667-162.133333-106.666667-296.533333 0-102.4 25.6-185.6 78.933334-249.6 57.6-70.4 136.533333-106.666667 236.8-106.666667 87.466667-2.133333 155.733333 19.2 202.666666 66.133334z" p-id="12240"></path></svg>`,
    cat,
  );

  Icon.add(
    'cab',
    `<svg t="1609742697720" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="16286" width="1em" height="1em"><path d="M128 32h630.4l169.6 169.6v742.4c0 17.6-14.4 32-32 32h-768c-17.6 0-32-14.4-32-32v-880c0-17.6 14.4-32 32-32z" fill="#F8F8F8" p-id="16287"></path><path d="M896 992h-768c-27.2 0-48-20.8-48-48v-880c0-27.2 20.8-48 48-48h636.8l179.2 179.2v748.8c0 25.6-20.8 48-48 48z m-768-960c-17.6 0-32 14.4-32 32v880c0 17.6 14.4 32 32 32h768c17.6 0 32-14.4 32-32v-742.4l-169.6-169.6H128z" fill="#D5D5D5" p-id="16288"></path><path d="M934.4 204.8h-176v-177.6" fill="#FAFAFA" p-id="16289"></path><path d="M758.4 208v-184h16v168l161.6-1.6v16z" fill="#D5D5D5" p-id="16290"></path><path d="M819.2 384l108.8-81.6v81.6z" fill="#F6F6F6" p-id="16291"></path><path d="M771.2 384l156.8-118.4v36.8l-108.8 81.6z" fill="#F6F6F6" p-id="16292"></path><path d="M760 356.8l168-126.4v35.2l-156.8 118.4h-11.2z" fill="#F5F5F5" p-id="16293"></path><path d="M760 320l148.8-112h19.2v22.4l-168 126.4z" fill="#F4F4F4" p-id="16294"></path><path d="M760 284.8l100.8-76.8h48l-148.8 112z" fill="#F2F2F2" p-id="16295"></path><path d="M760 248l52.8-40h48l-100.8 76.8z" fill="#F1F1F1" p-id="16296"></path><path d="M812.8 208l-52.8 40v-40z" fill="#F1F1F1" p-id="16297"></path><path d="M80 768h864v192c0 17.6-14.4 32-32 32h-800c-17.6 0-32-14.4-32-32v-192z" fill="#E0732F" p-id="16298"></path><path d="M912 992h-800c-17.6 0-32-14.4-32-32v-192h864v192c0 17.6-14.4 32-32 32z m-816-208v176c0 9.6 6.4 16 16 16h800c9.6 0 16-6.4 16-16v-176h-832z" fill="#E06F28" p-id="16299"></path><path d="M432 816c9.6 8 16 19.2 19.2 32h-14.4c-1.6-9.6-6.4-17.6-14.4-22.4-8-4.8-16-8-27.2-8-16 0-28.8 4.8-36.8 16-8 9.6-12.8 24-12.8 41.6s3.2 30.4 11.2 40c8 11.2 20.8 16 36.8 16 11.2 0 20.8-3.2 27.2-8 8-6.4 14.4-14.4 16-27.2h14.4c-3.2 16-9.6 28.8-20.8 36.8-11.2 8-24 12.8-38.4 12.8-20.8 0-38.4-6.4-49.6-20.8-9.6-12.8-16-28.8-16-49.6s4.8-36.8 16-49.6c11.2-14.4 28.8-22.4 49.6-22.4 16 1.6 28.8 4.8 40 12.8zM531.2 806.4l54.4 137.6h-17.6l-14.4-38.4h-62.4l-14.4 38.4h-17.6l54.4-137.6h17.6z m17.6 86.4l-25.6-68.8-25.6 68.8h51.2zM660.8 806.4c12.8 0 22.4 3.2 30.4 9.6 8 6.4 11.2 14.4 11.2 25.6 0 8-1.6 14.4-6.4 19.2-4.8 4.8-9.6 8-16 11.2 9.6 1.6 16 4.8 20.8 11.2 4.8 6.4 8 12.8 8 22.4 0 12.8-4.8 24-14.4 30.4-8 4.8-19.2 8-33.6 8h-60.8v-137.6h60.8z m-44.8 60.8h41.6c9.6 0 17.6-1.6 22.4-6.4 4.8-4.8 8-9.6 8-17.6 0-8-3.2-12.8-8-17.6-4.8-3.2-12.8-4.8-22.4-4.8h-41.6v46.4z m0 64h43.2c9.6 0 17.6-1.6 22.4-4.8 6.4-4.8 9.6-11.2 9.6-19.2s-3.2-16-9.6-19.2c-4.8-4.8-14.4-6.4-24-6.4h-43.2v49.6z" fill="#FFFFFF" p-id="16300"></path><path d="M696 576h-368c-12.8 0-24-11.2-24-24v-272c0-12.8 11.2-24 24-24h368c12.8 0 24 11.2 24 24v272c0 12.8-11.2 24-24 24z m-368-304c-4.8 0-8 3.2-8 8v272c0 4.8 3.2 8 8 8h368c4.8 0 8-3.2 8-8v-272c0-4.8-3.2-8-8-8h-368z" fill="#E78A52" p-id="16301"></path><path d="M480 272h32v32h-32zM512 304h32v32h-32zM480 336h32v32h-32zM512 368h32v32h-32zM480 400h64v32h-64z" fill="#E78A52" p-id="16302"></path><path d="M480 416h16v48h-16zM528 416h16v48h-16z" fill="#E78A52" p-id="16303"></path><path d="M480 448h64v32h-64z" fill="#E78A52" p-id="16304"></path></svg>`,
    cat,
  );

  Icon.add(
    'chm',
    `<svg t="1609743204538" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="21546" width="1em" height="1em"><path d="M142.336 167.936h624.64v798.72h-624.64z" fill="#F2DBB6" p-id="21547"></path><path d="M89.088 89.088h605.184v78.848H89.088zM482.304 723.968a241.664 241.664 0 1 0 483.328 0 241.664 241.664 0 1 0-483.328 0z" fill="#FFF2E3" p-id="21548"></path><path d="M995.328 723.968c0-118.784-75.776-219.136-181.248-256V149.504h-60.416V89.088h60.416V28.672H118.784c-2.048 0-21.504 0-44.032 10.24-22.528 10.24-48.128 38.912-47.104 79.872v817.152c0 60.416 60.416 60.416 60.416 60.416h637.952c149.504-2.048 269.312-122.88 269.312-272.384zM114.688 148.48c-5.12-1.024-13.312-3.072-17.408-7.168-4.096-4.096-8.192-7.168-8.192-22.528 1.024-19.456 6.144-20.48 13.312-25.6 4.096-2.048 9.216-3.072 12.288-4.096 3.072-1.024 4.096 0 4.096-1.024h574.464v60.416H118.784c0 1.024-1.024 1.024-4.096 0z m34.816 786.432V209.92h605.184v243.712c-10.24-1.024-20.48-2.048-30.72-2.048-64.512 0-123.904 22.528-171.008 60.416H209.92v60.416h287.744c-12.288 18.432-22.528 38.912-29.696 60.416H209.92v60.416h243.712c-1.024 10.24-2.048 20.48-2.048 30.72 0 86.016 39.936 161.792 101.376 211.968H149.504z m574.464 0C607.232 934.912 512 840.704 512 723.968 512 607.232 607.232 512 723.968 512c116.736 0 210.944 95.232 211.968 211.968-1.024 116.736-95.232 210.944-211.968 210.944z" fill="#CC9933" p-id="21549"></path><path d="M209.92 391.168h483.328v60.416H209.92z m475.136 377.856c0-60.416 68.608-69.632 68.608-112.64 0-19.456-18.432-34.816-39.936-34.816-23.552 0-45.056 18.432-45.056 18.432l-29.696-35.84s29.696-30.72 77.824-30.72c47.104 0 90.112 29.696 90.112 77.824 0 68.608-72.704 76.8-72.704 122.88v16.384h-51.2v-20.48h2.048z m0 57.344h51.2v49.152h-51.2v-49.152z" fill="#CC9933" p-id="21550"></path></svg>`,
    cat,
  );

  Icon.add(
    'cpp',
    `<svg t="1609743252598" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="22336" width="1em" height="1em"><path d="M438.613333 946.517333H148.821333V75.093333h727.381334v671.402667h73.386666V75.093333C949.248 34.816 916.48 2.048 876.202667 2.048H148.821333C108.885333 2.048 75.776 34.816 75.776 75.093333v871.424c0 39.936 32.768 73.045333 73.045333 73.045334h289.792v-73.045334z" p-id="22337"></path><path d="M233.813333 412.672v-34.133333l197.973334-83.626667v36.522667l-157.013334 64.512 157.013334 64.853333v36.522667c0.341333 0-197.973333-84.650667-197.973334-84.650667z m221.184 135.850667l86.698667-309.248h29.354667l-86.698667 309.248h-29.354667z m336.554667-135.850667l-197.973333 84.650667V460.8l157.013333-64.853333-157.013333-64.512V294.912l197.973333 83.626667v34.133333z" p-id="22338"></path><path d="M740.010667 831.488h-27.648v59.050667h27.648c20.48 0.341333 30.378667-9.216 29.013333-29.013334 0.341333-20.48-9.216-30.72-29.013333-30.037333zM883.370667 831.488h-27.648v59.050667h27.648c20.48 0.341333 30.378667-9.216 29.013333-29.013334 0.341333-20.48-9.216-30.72-29.013333-30.037333z" p-id="22339"></path><path d="M968.021333 746.496H492.544c-30.037333 0-53.930667 33.109333-53.930667 73.045333v200.362667h529.408c30.037333 0 53.930667-32.768 53.930667-73.045333v-127.317334c0-40.277333-24.234667-73.045333-53.930667-73.045333z m-366.592 205.141333c21.504 1.024 40.618667-10.922667 58.026667-36.181333v30.72c-14.336 17.749333-36.522667 27.306667-65.877333 27.306667-50.176-2.389333-76.117333-30.378667-78.848-82.944 2.389333-52.565333 28.330667-80.554667 77.141333-82.944 39.594667 0 63.829333 17.408 71.338667 52.906666h-35.498667c-5.12-19.797333-16.384-30.037333-33.792-30.037333-27.989333 1.024-42.325333 21.504-42.666667 61.44 1.024 37.546667 17.749333 57.344 50.176 59.733333z m145.408-37.546666h-34.474666v56.32h-35.498667V808.96h69.973333c39.594667 0 59.050667 17.408 58.709334 52.565333 0.682667 35.84-18.432 53.248-58.709334 52.565334z m143.36 0h-34.474666v56.32h-35.498667V808.96h69.973333c39.594667 0 59.050667 17.408 58.709334 52.565333 0.682667 35.84-18.773333 53.248-58.709334 52.565334z" p-id="22340"></path></svg>`,
    cat,
  );

  Icon.add(
    'cs',
    `<svg t="1609743294757" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="23117" width="1em" height="1em"><path d="M233.813333 412.672v-34.133333l197.973334-83.626667v36.522667l-157.013334 64.512 157.013334 64.853333v36.522667c0.341333 0-197.973333-84.650667-197.973334-84.650667z m221.184 135.850667l86.698667-309.248h29.354667l-86.698667 309.248h-29.354667z m336.554667-135.850667l-197.973333 84.650667V460.8l157.013333-64.853333-157.013333-64.512V294.912l197.973333 83.626667v34.133333z" fill="#A39F8D" p-id="23118"></path><path d="M576.512 946.517333H148.821333V75.093333h727.381334v671.402667h73.386666V75.093333C949.248 34.816 916.48 2.048 876.202667 2.048H148.821333C108.885333 2.048 75.776 34.816 75.776 75.093333v871.424c0 39.936 32.768 73.045333 73.045333 73.045334h427.349334v-73.045334z" fill="#A39F8D" p-id="23119"></path><path d="M952.32 746.496h-306.176c-38.229333 0-69.632 33.109333-69.632 73.045333v200.362667h185.344v-0.341333h155.306667v0.341333H952.32c38.229333 0 69.632-32.768 69.632-73.045333v-127.317334c0-40.277333-31.402667-73.045333-69.632-73.045333z m-209.92 205.141333c21.504 1.024 40.618667-10.922667 58.026667-36.181333v30.72c-14.336 17.749333-36.522667 27.306667-65.877334 27.306667-50.176-2.389333-76.117333-30.378667-78.848-82.944 2.389333-52.565333 28.330667-80.554667 77.141334-82.944 39.594667 0 63.146667 17.408 71.338666 52.906666h-35.498666c-5.12-19.797333-16.384-30.037333-33.792-30.037333-27.989333 1.024-42.325333 21.504-42.666667 61.44 1.024 37.546667 17.749333 57.344 50.176 59.733333z m140.970667 21.504c-28.672 1.706667-51.882667-8.533333-68.608-30.037333V914.773333c18.773333 24.576 39.594667 36.864 63.829333 37.546667 22.528 0 34.133333-8.192 34.474667-24.917333 0-12.970667-10.24-21.504-30.72-24.917334-45.738667-7.509333-67.242667-24.917333-63.829334-51.541333 1.706667-29.013333 21.845333-44.032 60.416-44.373333 38.229333 1.024 60.074667 17.749333 65.877334 50.176h-34.474667c-5.461333-17.408-16.042667-26.282667-30.72-27.306667-17.066667 0-25.258667 6.826667-24.917333 20.821333-1.024 12.288 8.533333 20.138667 28.330666 23.210667 44.032 8.533333 65.877333 25.6 65.877334 50.858667 0.682667 32.426667-20.821333 48.810667-65.536 48.810666z" fill="#8E886E" p-id="23120"></path></svg>`,
    cat,
  );

  Icon.add(
    'css',
    `<svg t="1609743324561" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="23900" width="1em" height="1em"><path d="M931.329365 482.505083h-26.349753V220.482543a9.662409 9.662409 0 0 0-0.587494-3.19997 9.61241 9.61241 0 0 0-2.224979-9.999906L697.681558 2.809586A9.56241 9.56241 0 0 0 687.206657 0.747105a9.57491 9.57491 0 0 0-5.899945 8.874917v204.473081a9.56241 9.56241 0 0 0 9.57491 9.57491h194.92317V482.505083H138.19931V20.796917h499.995307A9.57491 9.57491 0 0 0 647.807026 11.259507a9.57491 9.57491 0 0 0-9.57491-9.57491H128.6119a9.57491 9.57491 0 0 0-6.774936 2.749974A9.58741 9.58741 0 0 0 119.02449 11.259507v471.245576H92.662238A27.949738 27.949738 0 0 0 64.7125 510.417321v327.496926a27.949738 27.949738 0 0 0 27.949738 27.949737h26.362252v52.174511a106.061504 106.061504 0 0 0 105.974005 105.961505h670.393707a9.58741 9.58741 0 0 0 9.58741-9.58741V865.851485h26.349753a27.949738 27.949738 0 0 0 27.949738-27.949738v-327.496926A27.949738 27.949738 0 0 0 931.329365 482.505083zM700.494032 204.507693V32.746805L872.20492 204.507693zM450.046383 573.991724q21.174801-20.349809 64.824391-20.349809 33.987181 0 54.924485 14.187367 28.412233 19.16232 28.399733 51.12452a49.324537 49.324537 0 0 1-7.312431 25.54976q-7.349931 12.337384-29.937219 30.099718-15.749852 12.499883-19.899813 19.999812a41.012115 41.012115 0 0 0-4.124962 19.737315H477.583624v-5.937444a73.449311 73.449311 0 0 1 3.374969-24.53727 54.461989 54.461989 0 0 1 10.224904-17.249838 314.30955 314.30955 0 0 1 30.512213-27.437243q12.78738-10.287403 12.77488-18.887322a17.424836 17.424836 0 0 0-5.074952-13.324875 21.699796 21.699796 0 0 0-15.374856-4.749956 24.649769 24.649769 0 0 0-18.337328 7.312432q-7.262432 7.324931-9.287412 25.56226l-60.549432-7.49993q3.037471-33.312187 24.149773-53.611997z m89.136663 156.248534V786.252232H475.583643v-56.024474z m346.621746 274.597422H224.998495a86.899184 86.899184 0 0 1-86.799185-86.811685v-52.17451h747.605482z m0 0" fill="#A5A7A8" p-id="23901"></path><path d="M145.961737 498.754931h739.843055v354.996667H145.961737z" fill="#A5A7A8" p-id="23902"></path><path d="M405.959297 704.115503q-1.537486 48.637043-24.374772 69.074351t-54.836985 20.474808q-36.562157 0-62.499413-24.999765T238.460869 688.753147q0-60.111936 25.137264-89.549159t64.749392-29.424724q33.487186 0 55.599478 21.099802t20.562307 59.486941H370.959625q0-28.124736-10.6624-42.212103t-31.987199-14.074868q-24.387271 0-38.849636 21.112302T274.985526 686.25317q0 46.049568 14.474864 64.599394t37.32465 18.549826q16.749843 0 30.462214-13.424874t13.749871-51.812014zM596.432509 729.702763q0 29.437224-22.099793 46.687061t-60.174435 17.274838q-38.099642 0-59.411942-17.912332T433.459038 730.977751v-8.949916h34.999672v7.674928q0 19.18732 13.749871 29.424723a51.899513 51.899513 0 0 0 31.9872 10.224904q24.362271 0 35.799664-10.862398a34.874673 34.874673 0 0 0 11.424892-26.249753q0-12.76238-13.749871-23.662278T508.070838 688.753147q-36.562157-11.512392-52.562006-25.58726t-15.99985-33.262188q0-26.862248 22.099792-43.499591t52.499507-16.624844q39.599628 0 57.136964 19.824814t17.499836 42.862097h-34.999672q1.499986-14.062368-9.137414-25.587259t-30.474714-11.512392q-18.274828 0-28.937228 8.312422t-10.6624 22.387289a26.899747 26.899747 0 0 0 8.374921 19.824814q8.349922 8.337422 43.412093 19.837314 33.512185 11.512392 51.799514 27.499742t18.312328 36.474658zM791.430678 729.702763q0 29.437224-22.099792 46.687061t-60.174436 17.274838q-38.099642 0-59.411942-17.912332T628.457208 730.977751v-8.949916h34.999671v7.674928q0 19.18732 13.749871 29.424723a51.899513 51.899513 0 0 0 31.9872 10.224904q24.362271 0 35.799664-10.862398a34.874673 34.874673 0 0 0 11.424893-26.249753q0-12.76238-13.749871-23.662278T703.069008 688.753147q-36.562157-11.512392-52.562007-25.58726t-15.99985-33.262188q0-26.862248 22.099793-43.499591t52.499507-16.624844q39.599628 0 57.136964 19.824814t17.499835 42.862097h-34.999671q1.499986-14.062368-9.137414-25.587259t-30.474714-11.512392q-18.274828 0-28.937229 8.312422t-10.6624 22.387289a26.899747 26.899747 0 0 0 8.374922 19.824814q8.362422 8.337422 43.412092 19.837314 33.512185 11.512392 51.799514 27.499742t18.312328 36.474658z" fill="#FFFFFF" p-id="23903"></path></svg>`,
    cat,
  );

  Icon.add(
    'csv',
    `<svg t="1609743386970" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="24844" width="1em" height="1em"><path d="M249.856 389.12V210.944c0-45.056 36.864-81.92 81.92-81.92H788.48L952.32 296.96v337.92c0 12.288-8.192 20.48-20.48 20.48s-20.48-8.192-20.48-20.48V337.92h-102.4c-34.816 0-61.44-26.624-61.44-61.44V169.984H331.776c-22.528 0-40.96 18.432-40.96 40.96V389.12H747.52c22.528 0 40.96 18.432 40.96 40.96V716.8c0 22.528-18.432 40.96-40.96 40.96H290.816v61.44c0 22.528 18.432 40.96 40.96 40.96H870.4c22.528 0 40.96-18.432 40.96-40.96v-61.44c0-12.288 8.192-20.48 20.48-20.48s20.48 8.192 20.48 20.48v61.44c0 45.056-36.864 81.92-81.92 81.92H331.776c-45.056 0-81.92-36.864-81.92-81.92v-61.44H112.64c-22.528 0-40.96-18.432-40.96-40.96V430.08c0-22.528 18.432-40.96 40.96-40.96h137.216zM788.48 186.368v90.112c0 10.24 8.192 20.48 20.48 20.48h86.016L788.48 186.368zM315.392 536.576c-14.336-38.912-40.96-57.344-83.968-59.392-59.392 4.096-90.112 36.864-94.208 102.4 2.048 65.536 34.816 100.352 94.208 102.4 47.104 0 77.824-22.528 88.064-67.584l-36.864-12.288c-4.096 32.768-22.528 47.104-49.152 47.104-34.816-2.048-53.248-26.624-55.296-71.68 2.048-45.056 20.48-67.584 55.296-69.632 24.576 2.048 40.96 14.336 47.104 36.864l34.816-8.192z m26.624 79.872c10.24 45.056 38.912 65.536 90.112 65.536s75.776-20.48 77.824-59.392c0-24.576-14.336-40.96-40.96-53.248l-36.864-12.288c-28.672-6.144-43.008-16.384-40.96-28.672 2.048-16.384 14.336-22.528 34.816-24.576 24.576 0 38.912 10.24 43.008 32.768l36.864-8.192c-6.144-36.864-34.816-57.344-81.92-55.296-45.056 2.048-69.632 20.48-71.68 53.248-2.048 28.672 16.384 47.104 57.344 57.344 10.24 2.048 20.48 4.096 30.72 8.192 22.528 6.144 32.768 16.384 30.72 30.72-2.048 18.432-14.336 26.624-38.912 28.672-28.672 0-47.104-14.336-51.2-45.056l-38.912 10.24z m380.928-137.216h-40.96L632.832 624.64c-4.096 12.288-6.144 18.432-6.144 20.48 0-4.096-2.048-10.24-6.144-20.48l-51.2-147.456h-40.96l77.824 198.656h43.008l73.728-196.608z" fill="#999999" p-id="24845"></path></svg>`,
    cat,
  );

  Icon.add(
    'db',
    `<svg t="1609743437040" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="25621" width="1em" height="1em"><path d="M630.94654 573.659429h-18.724572v68.429206c5.396317 0.723302 11.881651 0.723302 21.243937 0.723302 24.860444 0 46.819556-9.354159 46.819555-34.937905 0.008127-24.478476-21.959111-34.214603-49.33892-34.214603zM674.523429 504.531302c0-18.366984-14.051556-28.103111-38.887619-28.103112-11.897905 0-18.740825 0.723302-23.413842 1.446604v56.531301h18.00127c28.802032 0 44.30019-11.881651 44.300191-29.874793z" fill="#333333" p-id="25622"></path><path d="M840.793397 398.555429h-19.902984V302.502603c0-0.601397-0.097524-1.202794-0.170667-1.812317a15.969524 15.969524 0 0 0-3.860317-10.524445L657.034159 107.60127c-0.048762-0.048762-0.097524-0.065016-0.130032-0.113778a16.075175 16.075175 0 0 0-4.299175-3.348317 16.879746 16.879746 0 0 0-3.210158-1.34908c-0.300698-0.08127-0.568889-0.203175-0.869588-0.284444a16.278349 16.278349 0 0 0-3.730285-0.463238H252.001524c-17.936254 0-32.507937 14.587937-32.507937 32.507936V398.547302h-19.902984a46.461968 46.461968 0 0 0-46.461968 46.461968v241.615238a46.470095 46.470095 0 0 0 46.461968 46.461968h19.902984v165.400381c0 17.92 14.571683 32.507937 32.507937 32.507937h536.380952c17.92 0 32.507937-14.587937 32.507937-32.507937V733.094603h19.902984a46.470095 46.470095 0 0 0 46.461968-46.461968v-241.615238a46.453841 46.453841 0 0 0-46.461968-46.461968z m-52.410921 491.121777h-536.380952V733.094603h536.380952v156.582603zM307.159365 679.911619V441.50654c20.163048-3.242667 46.445714-5.063111 74.191238-5.063111 46.096254 0 75.979175 8.289524 99.384889 25.933206 25.209905 18.740825 41.057524 48.615619 41.057524 91.48546 0 46.445714-16.928508 78.49854-40.334222 98.312127-25.575619 21.243937-64.463238 31.321397-112.006096 31.321397-28.452571 0.008127-48.615619-1.787937-62.293333-3.584z m430.75454-69.867682c0 21.967238-10.085587 39.237079-25.209905 51.492571-17.668063 14.051556-47.193397 21.967238-95.435175 21.967238-27.022222 0-47.193397-1.796063-59.424508-3.592127V441.50654c14.401016-2.885079 43.576889-5.063111 70.932318-5.063111 33.491302 0 54.02819 3.242667 71.671873 13.702095 16.928508 9.004698 29.175873 25.559365 29.175873 47.542857 0 21.593397-12.604952 41.756444-39.976635 51.842032v0.723301c27.72927 7.566222 48.266159 28.452571 48.266159 59.790223z m50.468571-211.488508h-536.380952V134.550349H628.540952v166.31873a16.253968 16.253968 0 0 0 16.253969 16.253969h143.587555v81.432381z" fill="#333333" p-id="25623"></path><path d="M387.096381 478.598095c-12.231111 0-20.163048 1.072762-24.836064 2.145524v158.825651c4.673016 1.072762 12.231111 1.072762 19.090286 1.072762 49.688381 0.365714 82.090667-27.005968 82.090667-84.983873 0.373841-50.411683-29.151492-77.060063-76.344889-77.060064z" fill="#333333" p-id="25624"></path></svg>`,
    cat,
  );

  Icon.add(
    'default',
    `<svg t="1609743512982" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="26933" width="1em" height="1em"><path d="M0 0h1024v1024H0z" fill="#D8D8D8" fill-opacity="0" p-id="26934"></path><path d="M553.356 187.733L768 402.823v342.649c0 40.719-33.01 73.728-73.728 73.728H329.728c-40.719 0-73.728-33.01-73.728-73.728v-484.01c0-40.72 33.01-73.729 73.728-73.729h223.628z" fill="#DBDFE7" p-id="26935"></path><path d="M549.85 187.733L768 405.883v3.717H644.437c-54.291 0-98.304-44.012-98.304-98.304V187.733h3.716z" fill="#C0C4CC" p-id="26936"></path></svg>`,
    cat,
  );

  Icon.add(
    'dll',
    `<svg t="1609743675855" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="28078" width="1em" height="1em"><path d="M870.4 1024H153.6c-35.84 0-64-28.16-64-64V64c0-35.84 28.16-64 64-64h576l204.8 204.8v755.2c0 35.84-28.16 64-64 64z" fill="#F2F2F2" p-id="28079"></path><path d="M934.4 204.8H747.52c-10.24 0-17.92-7.68-17.92-17.92V0" fill="#DDDDDD" p-id="28080"></path><path d="M870.4 1024H153.6c-35.84 0-64-28.16-64-64V640h844.8v320c0 35.84-28.16 64-64 64z" fill="#B9C9D6" p-id="28081"></path><path d="M295.68 736h51.2c12.8 0 24.32 1.28 34.56 3.84s17.92 7.68 25.6 14.08c20.48 16.64 29.44 43.52 29.44 78.08 0 11.52-1.28 21.76-2.56 32s-5.12 17.92-8.96 25.6c-3.84 7.68-8.96 14.08-16.64 20.48-5.12 5.12-10.24 8.96-16.64 11.52s-12.8 5.12-19.2 6.4-15.36 1.28-24.32 1.28h-51.2c-7.68 0-12.8-1.28-16.64-3.84-3.84-2.56-6.4-5.12-6.4-8.96-1.28-3.84-1.28-8.96-1.28-15.36v-140.8c0-8.96 1.28-14.08 5.12-17.92 2.56-5.12 8.96-6.4 17.92-6.4z m14.08 30.72v130.56h44.8c3.84 0 7.68-1.28 11.52-2.56s7.68-3.84 10.24-6.4c12.8-11.52 19.2-29.44 19.2-57.6 0-19.2-2.56-33.28-8.96-42.24s-12.8-15.36-21.76-17.92c-8.96-2.56-17.92-3.84-30.72-3.84h-24.32zM508.16 756.48V896h79.36c6.4 0 11.52 1.28 14.08 5.12 3.84 2.56 5.12 6.4 5.12 11.52s-1.28 8.96-5.12 11.52c-3.84 2.56-7.68 3.84-14.08 3.84h-94.72c-8.96 0-14.08-1.28-17.92-5.12-3.84-3.84-5.12-10.24-5.12-17.92V756.48c0-7.68 1.28-14.08 5.12-17.92 3.84-3.84 7.68-6.4 14.08-6.4 6.4 0 10.24 2.56 14.08 6.4 3.84 3.84 5.12 8.96 5.12 17.92zM670.72 756.48V896h79.36c6.4 0 11.52 1.28 14.08 5.12 3.84 2.56 5.12 6.4 5.12 11.52s-1.28 8.96-5.12 11.52c-3.84 2.56-7.68 3.84-14.08 3.84h-94.72c-8.96 0-14.08-1.28-17.92-5.12-3.84-3.84-5.12-10.24-5.12-17.92V756.48c0-7.68 1.28-14.08 5.12-17.92 3.84-3.84 7.68-6.4 14.08-6.4 6.4 0 10.24 2.56 14.08 6.4 3.84 3.84 5.12 8.96 5.12 17.92z" fill="#FFFFFF" p-id="28082"></path><path d="M540.16 270.08c0-16.64 10.24-32 25.6-37.12-3.84-14.08-8.96-26.88-16.64-39.68-15.36 6.4-32 3.84-44.8-7.68-11.52-11.52-15.36-29.44-7.68-44.8-12.8-7.68-25.6-12.8-39.68-16.64-6.4 15.36-20.48 25.6-37.12 25.6-16.64 0-32-10.24-37.12-25.6-14.08 3.84-26.88 8.96-39.68 16.64 6.4 15.36 3.84 32-7.68 44.8s-29.44 15.36-44.8 7.68c-7.68 12.8-12.8 25.6-16.64 39.68 15.36 6.4 25.6 20.48 25.6 37.12s-10.24 32-25.6 37.12c3.84 14.08 8.96 26.88 16.64 39.68 15.36-6.4 32-3.84 44.8 7.68 11.52 11.52 15.36 29.44 7.68 44.8 12.8 7.68 25.6 12.8 39.68 16.64 6.4-15.36 20.48-25.6 37.12-25.6s32 10.24 37.12 25.6c14.08-3.84 26.88-8.96 39.68-16.64-6.4-15.36-3.84-32 7.68-44.8 11.52-11.52 29.44-15.36 44.8-7.68 7.68-12.8 12.8-25.6 16.64-39.68-15.36-5.12-25.6-20.48-25.6-37.12z m-120.32 40.96c-21.76 0-39.68-17.92-39.68-39.68s17.92-39.68 39.68-39.68 39.68 17.92 39.68 39.68c0 20.48-17.92 39.68-39.68 39.68z" fill="#DDDDDD" p-id="28083"></path><path d="M674.56 456.96c3.84-11.52 14.08-19.2 24.32-19.2 0-10.24 0-20.48-2.56-29.44-11.52 1.28-23.04-3.84-28.16-14.08-5.12-10.24-3.84-23.04 3.84-32-6.4-7.68-14.08-14.08-23.04-19.2-6.4 8.96-19.2 12.8-30.72 10.24-11.52-3.84-19.2-14.08-19.2-24.32-10.24 0-20.48 0-29.44 2.56 1.28 11.52-3.84 23.04-14.08 28.16-10.24 5.12-23.04 3.84-32-3.84-7.68 6.4-14.08 14.08-19.2 23.04 8.96 6.4 12.8 19.2 10.24 30.72-3.84 11.52-14.08 19.2-24.32 19.2 0 10.24 0 20.48 2.56 29.44 11.52-1.28 23.04 3.84 28.16 14.08s3.84 23.04-3.84 32c6.4 7.68 14.08 14.08 23.04 19.2 6.4-8.96 19.2-12.8 30.72-10.24 11.52 3.84 19.2 14.08 19.2 24.32 10.24 0 20.48 0 29.44-2.56-1.28-11.52 3.84-23.04 14.08-28.16s23.04-3.84 32 3.84c7.68-6.4 14.08-14.08 19.2-23.04-8.96-7.68-12.8-19.2-10.24-30.72z m-88.32 2.56c-15.36-5.12-23.04-20.48-19.2-34.56s20.48-23.04 34.56-19.2c15.36 5.12 23.04 20.48 19.2 34.56s-19.2 23.04-34.56 19.2z" fill="#DDDDDD" p-id="28084"></path></svg>`,
    cat,
  );

  Icon.add(
    'doc',
    `<svg t="1609743752390" class="icon" viewBox="0 0 1033 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="29146" width="1em" height="1em"><path d="M904.781575 178.863996q-9.91175-10.041477-22.053618-21.002927-35.969085-33.080428-66.883763-61.960072a27.501169 27.501169 0 0 1-4.989049-3.938359c-29.995694-27.305093-53.755571-48.374369-71.018197-62.945404a307.965364 307.965364 0 0 0-25.007635-18.968884 45.945204 45.945204 0 0 0-11.026809-7.088451 28.092369 28.092369 0 0 0-13.127201-2.954017 23.62817 23.62817 0 0 0-17.458702 7.482584 24.942276 24.942276 0 0 0-7.417225 18.444034v230.121141h229.727008l-26.254403-25.007635v766.697463l26.254403-24.941286h-665.421147a73.05323 73.05323 0 0 1-53.427787-22.447751 74.16928 74.16928 0 0 1-22.447752-54.477488V25.9325L127.975296 52.186902h460.89785a23.759877 23.759877 0 0 0 17.394333-7.417225 25.27006 25.27006 0 0 0 0-35.902736 23.759877 23.759877 0 0 0-17.394333-7.417225H102.179396v894.427228a127.728775 127.728775 0 0 0 127.924851 128.121917h691.742888v-819.142888H691.004077l26.254402 26.255392V25.9325a25.467126 25.467126 0 0 1-24.875927 24.875927 18.574752 18.574752 0 0 1-8.992767-2.100391l2.100392 2.099401c4.594916 3.282791 12.012142 8.927408 22.053619 17.001191 16.671426 14.636393 39.381603 35.377886 68.918795 61.960072a28.223086 28.223086 0 0 1 5.053418 3.938358q30.914677 28.092369 66.883763 61.961062c7.942075 6.563601 15.359301 13.127201 22.053618 19.690802a43.714094 43.714094 0 0 1 7.942075 7.942075 27.501169 27.501169 0 0 0 18.444035 7.088451 23.826226 23.826226 0 0 0 17.983552-7.942075 24.875927 24.875927 0 0 0 7.024083-18.444034 25.664193 25.664193 0 0 0-7.417226-17.458702 59.072405 59.072405 0 0 1-9.385909-7.942076zM102.114037 480.7916H0.049455v434.841504h1023.92762V480.923307z m75.153622 84.933664h86.639923a145.449902 145.449902 0 0 1 44.632087 5.382192 77.188655 77.188655 0 0 1 35.247168 25.204701 126.3503 126.3503 0 0 1 22.382393 44.436011 234.452642 234.452642 0 0 1 7.614292 64.78238 208.854798 208.854798 0 0 1-7.1548 58.351478 124.7094 124.7094 0 0 1-25.27006 48.242662 80.863598 80.863598 0 0 1-32.818003 21.921911 123.527991 123.527991 0 0 1-41.876127 5.776325H177.267659z m47.25832 46.404695v181.485336h35.247168a112.6319 112.6319 0 0 0 28.55186-2.559883 42.598045 42.598045 0 0 0 19.099603-11.420942 60.910371 60.910371 0 0 0 12.338935-26.254402 206.820755 206.820755 0 0 0 4.792973-50.212336 188.639146 188.639146 0 0 0-4.792973-48.767513 64.783371 64.783371 0 0 0-13.126211-26.254402 43.057536 43.057536 0 0 0-21.857542-13.127201 187.063605 187.063605 0 0 0-38.790404-2.559883z m179.383954 92.350889a199.993739 199.993739 0 0 1 10.699025-70.29628 132.125635 132.125635 0 0 1 21.791194-37.609986 92.546965 92.546965 0 0 1 30.258119-24.678861 112.107049 112.107049 0 0 1 50.409402-10.830733 101.999223 101.999223 0 0 1 82.767914 37.544627q30.979046 37.608995 31.045394 104.558117t-30.783959 103.837189a101.210957 101.210957 0 0 1-82.373781 37.478278 102.064582 102.064582 0 0 1-82.767913-37.084145q-30.782969-37.478278-30.78297-102.918206z m49.030928-2.100392q0 46.536403 18.312326 70.625054a56.381804 56.381804 0 0 0 46.601762 24.022303 55.790604 55.790604 0 0 0 46.404695-23.891585q18.11625-23.826226 18.11625-71.477689t-17.853825-70.099214A55.856953 55.856953 0 0 0 517.657882 608.389657a56.447162 56.447162 0 0 0-47.061253 23.432094q-17.656759 23.432093-17.656759 70.558705zM817.812878 738.874392l45.945204 17.0002q-10.566327 44.894512-34.983753 66.620347a89.921723 89.921723 0 0 1-62.157139 21.791194 94.057148 94.057148 0 0 1-76.926229-36.888069q-29.930335-37.281211-29.995694-101.999223 0-68.458314 30.19276-106.264376a96.354606 96.354606 0 0 1 79.288057-37.87241 89.593939 89.593939 0 0 1 69.771429 29.536202 113.945016 113.945016 0 0 1 23.957934 50.474761l-46.798828 13.127201a60.189445 60.189445 0 0 0-17.327984-33.605278 44.763795 44.763795 0 0 0-31.965368-12.339925 50.145987 50.145987 0 0 0-42.203912 21.856552q-16.211935 21.857542-16.211935 70.822121 0 51.983954 15.94951 74.037572a48.964579 48.964579 0 0 0 41.482985 22.118977 43.779453 43.779453 0 0 0 32.423869-14.046184q13.586693-14.111543 19.493735-44.172596z" p-id="29147"></path></svg>`,
    cat,
  );

  Icon.add(
    'docx',
    `<svg t="1609743848434" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="32117" width="1em" height="1em"><path d="M712 145.333c0 36.82 29.848 66.667 66.667 66.667 66.666 22.222 100 33.483 100 33.783V912c0 36.819-29.848 66.667-66.667 66.667H212c-36.819 0-66.667-29.848-66.667-66.667V112c0-36.819 29.848-66.667 66.667-66.667h466.693l33.307 100z m-33.333-66.666H212c-18.41 0-33.333 14.924-33.333 33.333v800c0 18.41 14.924 33.333 33.333 33.333h600c18.41 0 33.333-14.924 33.333-33.333V245.333h-66.666c-55.229 0-100-44.771-100-100V78.667z" p-id="32118"></path><path d="M678.667 45.333v133.334c0 36.819 29.847 66.666 66.666 66.666h133.334l-200-200zM145.333 512h733.334c36.819 0 66.666 29.848 66.666 66.667v200c0 36.819-29.847 66.666-66.666 66.666H145.333c-36.819 0-66.666-29.847-66.666-66.666v-200c0-36.82 29.847-66.667 66.666-66.667zM167 598.6v166.6h60.9c27.067 0 47.367-7.467 61.367-22.4 13.3-14.233 20.066-34.533 20.066-60.9 0-26.6-6.766-46.9-20.066-60.9-14-14.933-34.3-22.4-61.367-22.4H167z m27.3 23.333h28.467c20.766 0 35.933 4.667 45.5 14.234 9.333 9.333 14 24.733 14 45.733 0 20.533-4.667 35.7-14 45.5-9.567 9.567-24.734 14.467-45.5 14.467H194.3V621.933z m227.333-26.6c-25.666 0-45.733 8.167-60.2 24.967-14 15.867-20.766 36.4-20.766 61.833 0 25.2 6.766 45.734 20.766 61.6 14.467 16.334 34.534 24.734 60.2 24.734 25.434 0 45.5-8.167 60.2-24.5 14-15.634 21-36.167 21-61.834 0-25.666-7-46.433-21-62.066-14.7-16.567-34.766-24.734-60.2-24.734z m0 24.034c17.267 0 30.567 5.366 39.9 16.566 9.1 11.2 13.767 26.6 13.767 46.2s-4.667 34.767-13.767 45.734c-9.333 10.966-22.633 16.566-39.9 16.566-17.266 0-30.8-5.833-40.133-17.266-9.1-11.2-13.533-26.134-13.533-45.034 0-19.133 4.433-34.066 13.533-45.266 9.567-11.667 22.867-17.5 40.133-17.5zM613.5 595.333c-26.6 0-46.9 8.634-60.9 26.367-12.367 15.4-18.433 35.7-18.433 60.433 0 25.2 5.833 45.267 17.733 60.2 13.533 17.267 34.3 26.134 62.067 26.134 17.966 0 33.366-5.134 46.2-15.4 13.766-10.967 22.4-26.134 26.133-45.734h-26.6c-3.267 12.6-8.867 22.167-16.8 28.467-7.467 5.6-17.267 8.633-29.167 8.633-18.2 0-31.733-5.833-40.366-17.033-7.934-10.5-11.9-25.667-11.9-45.267 0-19.133 3.966-34.066 12.133-44.8 8.867-12.133 21.933-17.966 39.433-17.966 11.667 0 21.234 2.333 28.7 7.466 7.7 5.134 12.834 13.067 15.634 24.034h26.6c-2.567-16.8-9.8-30.334-21.934-40.134-12.6-10.266-28.933-15.4-48.533-15.4z m99.7 3.267l55.767 80.5-59.5 86.1h33.366l42.934-64.4 42.933 64.4h33.367L802.1 679.1l56.233-80.5h-33.366l-39.2 58.8-39.2-58.8H713.2z" p-id="32119"></path><path d="M245.333 245.333m16.667 0l366.666 0q16.667 0 16.667 16.667l0-0.001q0 16.667-16.667 16.667l-366.666 0q-16.667 0-16.667-16.667l0 0.001q0-16.667 16.667-16.667Z" p-id="32120"></path><path d="M245.333 378.667m16.667 0l199.999 0q16.667 0 16.667 16.667l0-0.001q0 16.667-16.667 16.667l-199.999 0q-16.667 0-16.667-16.667l0 0.001q0-16.667 16.667-16.667Z" p-id="32121"></path></svg>`,
    cat,
  );

  Icon.add(
    'exe',
    `<svg t="1609744096350" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="36014" width="1em" height="1em"><path d="M810.667 170.667A85.333 85.333 0 0 1 896 256v512a85.333 85.333 0 0 1-85.333 85.333H213.333A85.333 85.333 0 0 1 128 768V256a85.333 85.333 0 0 1 85.333-85.333h597.334m0 597.333V341.333H213.333V768h597.334z" fill="#154097" p-id="36015"></path></svg>`,
    cat,
  );

  Icon.add(
    'fla',
    `<svg t="1609744226328" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2816" width="1em" height="1em"><path d="M153.6 0h563.2l204.8 204.8v768a51.2 51.2 0 0 1-51.2 51.2H153.6a51.2 51.2 0 0 1-51.2-51.2V51.2a51.2 51.2 0 0 1 51.2-51.2z" fill="#890000" p-id="2817"></path><path d="M716.8 0l204.8 204.8h-153.6a51.2 51.2 0 0 1-51.2-51.2z" fill="#B74E4E" p-id="2818"></path><path d="M656.896 384v69.632c-32 0-57.088 5.632-86.784 69.632h64.768v69.632h-92.928a261.376 261.376 0 0 1-79.872 117.504A153.6 153.6 0 0 1 367.104 742.4v-69.632c49.664 0 87.04-38.144 114.432-116.992a332.8 332.8 0 0 1 72.704-134.144 137.728 137.728 0 0 1 102.4-37.632z" fill="#FFFFFF" p-id="2819"></path></svg>`,
    cat,
  );

  Icon.add(
    'flv',
    `<svg t="1609744368889" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3668" width="1em" height="1em"><path d="M590.506667 546.816L492.544 624.64c-26.282667 20.821333-65.194667 2.048-65.194667-31.402667V419.84c0-33.792 38.912-52.565333 65.194667-31.402667l98.304 77.824c25.941333 19.797333 25.941333 60.074667-0.341333 80.554667z" fill="#A3BDD3" p-id="3669"></path><path d="M461.482667 946.517333H292.522667V75.093333h437.589333v671.402667h145.749333v-28.672h-109.226666v-76.8h109.226666v-36.522667h-109.226666v-76.458666h109.226666V491.52h-109.226666v-76.458667h109.226666v-36.522666h-109.226666V301.738667h109.226666V265.557333h-109.226666V188.416h109.226666V151.893333h-109.226666V75.093333h109.568v671.402667h73.386666V75.093333C949.248 34.816 916.48 2.048 876.202667 2.048H148.821333C108.885333 2.048 75.776 34.816 75.776 75.093333v871.424c0 39.936 32.768 73.045333 73.045333 73.045334h312.661334v-73.045334z m-205.482667 0H148.821333V866.986667H256v79.530666z m0-116.053333H148.821333V754.346667H256v76.117333z m0-112.64H148.821333v-76.8H256v76.8z m0-113.322667H148.821333v-76.458666H256v76.458666z m0-112.981333H148.821333v-76.458667H256V491.52z m0-112.981333H148.821333V301.397333H256v77.141334z m0-113.664H148.821333V188.416H256v76.458667z m0-112.981334H148.821333V75.093333H256v76.8z" fill="#A3BDD3" p-id="3670"></path><path d="M962.901333 746.496H520.533333c-32.768 0-59.050667 33.109333-59.050666 73.045333v200.362667h501.418666c32.768 0 59.050667-32.768 59.050667-73.045333v-127.317334c0-40.277333-26.282667-73.045333-59.050667-73.045333z m-310.272 129.024v23.210667h-76.458666v67.584h-35.498667v-161.109334h116.053333v22.186667h-80.896v48.128h76.8z m137.216 90.794667h-120.149333v-161.109334h36.181333V945.493333h83.968v20.821334z m166.570667-161.109334l-61.098667 161.109334H853.333333l-61.44-161.109334h38.570667l45.056 132.778667 42.666667-132.778667h38.229333v-0.341333 0.341333z" fill="#8AA9BF" p-id="3671"></path></svg>`,
    cat,
  );

  Icon.add(
    'gif',
    `<svg t="1609744488516" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5998" width="1em" height="1em"><path d="M870.4 1024H153.6c-35.84 0-64-28.16-64-64V64c0-35.84 28.16-64 64-64h576l204.8 204.8v755.2c0 35.84-28.16 64-64 64z" fill="#F2F2F2" p-id="5999"></path><path d="M934.4 204.8H747.52c-10.24 0-17.92-7.68-17.92-17.92V0" fill="#DDDDDD" p-id="6000"></path><path d="M870.4 1024H153.6c-35.84 0-64-28.16-64-64V640h844.8v320c0 35.84-28.16 64-64 64z" fill="#FF7743" p-id="6001"></path><path d="M478.72 849.92v37.12c0 5.12 0 8.96-1.28 11.52-1.28 2.56-2.56 5.12-5.12 7.68-2.56 2.56-6.4 5.12-10.24 6.4-11.52 6.4-23.04 11.52-33.28 14.08s-23.04 3.84-34.56 3.84c-15.36 0-28.16-2.56-40.96-6.4-12.8-5.12-23.04-11.52-30.72-19.2s-15.36-19.2-19.2-32c-5.12-12.8-6.4-25.6-6.4-40.96 0-15.36 2.56-28.16 6.4-40.96s11.52-23.04 19.2-32c8.96-8.96 19.2-15.36 32-20.48 12.8-5.12 26.88-6.4 42.24-6.4 12.8 0 24.32 1.28 34.56 5.12 10.24 3.84 17.92 7.68 24.32 12.8s11.52 10.24 14.08 16.64 5.12 11.52 5.12 15.36c0 5.12-1.28 8.96-5.12 12.8-3.84 3.84-7.68 5.12-12.8 5.12-2.56 0-5.12-1.28-7.68-2.56-2.56-1.28-5.12-2.56-6.4-5.12-5.12-7.68-8.96-12.8-12.8-16.64s-7.68-7.68-14.08-10.24c-5.12-2.56-12.8-3.84-21.76-3.84s-16.64 1.28-24.32 5.12c-7.68 2.56-12.8 7.68-17.92 14.08-5.12 6.4-8.96 12.8-11.52 21.76-2.56 8.96-3.84 17.92-3.84 28.16 0 23.04 5.12 39.68 15.36 52.48 10.24 12.8 24.32 17.92 43.52 17.92 8.96 0 17.92-1.28 25.6-3.84 7.68-2.56 15.36-5.12 24.32-10.24v-30.72h-30.72c-7.68 0-12.8-1.28-16.64-3.84-3.84-2.56-5.12-6.4-5.12-11.52 0-3.84 1.28-7.68 5.12-10.24s7.68-3.84 12.8-3.84h44.8c5.12 0 10.24 0 14.08 1.28 3.84 1.28 6.4 2.56 8.96 6.4s0 8.96 0 15.36zM518.4 907.52V756.48c0-7.68 1.28-14.08 5.12-17.92s7.68-6.4 14.08-6.4c6.4 0 10.24 2.56 14.08 6.4 3.84 3.84 5.12 10.24 5.12 17.92v151.04c0 7.68-1.28 14.08-5.12 17.92-3.84 3.84-8.96 6.4-14.08 6.4-5.12 0-10.24-2.56-14.08-6.4-3.84-3.84-5.12-10.24-5.12-17.92zM715.52 765.44h-76.8v48.64h64c6.4 0 10.24 1.28 12.8 3.84 2.56 2.56 3.84 6.4 3.84 10.24s-1.28 7.68-3.84 10.24-7.68 3.84-12.8 3.84h-64v64c0 7.68-1.28 14.08-5.12 17.92-3.84 3.84-7.68 6.4-14.08 6.4-6.4 0-10.24-2.56-14.08-6.4-3.84-3.84-5.12-10.24-5.12-17.92V759.04c0-5.12 1.28-10.24 2.56-14.08 1.28-3.84 3.84-6.4 7.68-7.68 3.84-1.28 7.68-2.56 14.08-2.56H716.8c6.4 0 10.24 1.28 14.08 3.84 2.56 2.56 5.12 6.4 5.12 10.24 0 5.12-1.28 7.68-5.12 11.52-5.12 3.84-8.96 5.12-15.36 5.12z" fill="#FFFFFF" p-id="6002"></path><path d="M345.6 381.44c29.44 0 85.76 78.08 85.76 78.08 43.52-47.36 139.52-179.2 168.96-179.2 29.44 0 144.64 163.84 209.92 263.68H215.04c1.28-2.56 101.12-162.56 130.56-162.56zM355.84 299.52c-32 0-57.6-26.88-57.6-60.16s25.6-60.16 57.6-60.16 57.6 26.88 57.6 60.16-25.6 60.16-57.6 60.16z" fill="#DDDDDD" p-id="6003"></path></svg>`,
    cat,
  );

  Icon.add(
    'h',
    `<svg t="1609744740404" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="18242" width="1em" height="1em"><path d="M714.453 845.568H586.155V594.603q0-101.59-74.07-101.59-37.077 0-61.354 28.288-23.894 28.246-23.894 73.302v250.965H298.155v-652.16h128.682v277.675h1.579q50.603-76.886 136.235-76.886 149.802 0 149.802 180.864z" fill="#154097" p-id="18243"></path></svg>`,
    cat,
  );

  Icon.add(
    'html',
    `<svg t="1609744775122" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="19045" width="1em" height="1em"><path d="M188.864 870.432L116.96 64h790.08l-72 806.304L511.52 960 188.864 870.432z" fill="#E44F26" p-id="19046"></path><path d="M512 891.456l261.44-72.48 61.504-689.024H512v761.504z" fill="#F1662A" p-id="19047"></path><path d="M512 429.024h-130.88l-9.024-101.28H512V228.832H264l2.368 26.56 24.288 272.544H512v-98.912zM512 685.888l-0.448 0.128-110.144-29.728-7.04-78.88H295.072l13.856 155.264 202.624 56.256 0.448-0.128v-102.912z" fill="#EBEBEB" p-id="19048"></path><path d="M511.648 429.024v98.912h121.792l-11.456 128.288-110.336 29.76v102.912l202.784-56.224 1.472-16.704 23.232-260.384 2.432-26.56H511.648zM511.648 228.832V327.744h238.912l1.984-22.208 4.512-50.144 2.368-26.56h-247.776z" fill="#FFFFFF" p-id="19049"></path></svg>`,
    cat,
  );

  Icon.add(
    'jpg',
    `<svg t="1609744825075" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="19881" width="1em" height="1em"><path d="M916.6848 224.4608h-167.7312c-20.2752 0-35.6352-20.2752-35.6352-40.7552V0.6144l203.3664 223.8464z m0 0" fill="#F29943" p-id="19882"></path><path d="M713.3184 0.6144l203.3664 218.7264L713.3184 0.6144z m203.3664 223.8464v757.76c0 20.2752-20.2752 40.7552-35.6352 40.7552h-737.28c-20.2752 0-35.6352-20.2752-35.6352-40.7552V41.3696C103.0144 21.0944 123.2896 0.6144 143.7696 0.6144h569.5488v183.0912c0 20.2752 20.2752 40.7552 35.6352 40.7552h167.7312L713.3184 0.6144l203.3664 223.8464z m0 0" fill="#ED782E" p-id="19883"></path><path d="M316.6208 453.2224H362.496v137.216c0 20.2752 0 30.5152-5.12 40.7552-5.12 10.24-10.24 25.3952-25.3952 30.5152-10.24 10.24-25.3952 10.24-45.6704 10.24s-35.6352-5.12-50.7904-20.2752c-10.24-10.24-15.1552-30.5152-15.1552-50.7904h40.7552c0 10.24 0 20.2752 5.12 25.3952 5.12 10.24 10.24 10.24 20.2752 10.24 10.24 0 15.1552-5.12 20.2752-10.24 5.12 0 10.24-15.1552 10.24-30.5152v-142.5408z m91.5456 218.7264V453.2224h71.2704c25.3952 0 45.6704 0 50.7904 5.12 10.24 5.12 25.3952 10.24 30.5152 20.2752 10.24 10.24 10.24 25.3952 10.24 40.7552 0 15.1552 0 25.3952-5.12 35.6352-5.12 10.24-10.24 15.1552-20.2752 20.2752-5.12 5.12-15.1552 10.24-20.2752 10.24-10.24 0-25.3952 5.12-45.6704 5.12h-30.5152v81.3056h-40.96z m40.7552-183.0912v61.0304h25.3952c15.1552 0 30.5152 0 35.6352-5.12 5.12 0 10.24-5.12 15.1552-10.24 5.12-5.12 5.12-10.24 5.12-15.1552 0-10.24 0-15.1552-5.12-20.2752-10.24-5.12-15.1552-5.12-20.2752-5.12h-55.9104v-5.12z m259.2768 101.5808V555.008H804.864v86.4256c-10.24 10.24-20.2752 15.1552-40.7552 25.3952-15.1552 5.12-35.6352 10.24-50.7904 10.24-20.2752 0-40.7552-5.12-61.0304-15.1552-15.1552-10.24-30.5152-25.3952-40.7552-40.7552-10.24-20.2752-15.1552-35.6352-15.1552-55.9104 0-20.2752 5.12-40.7552 15.1552-61.0304 10.24-15.36 25.3952-30.5152 40.7552-40.7552 15.1552-5.12 30.5152-10.24 50.7904-10.24 25.3952 0 45.6704 5.12 61.0304 15.1552 15.36 10.24 25.3952 25.3952 30.5152 45.6704l-45.6704 10.24c-5.12-10.24-10.24-20.2752-15.1552-25.3952-10.24-5.12-20.2752-10.24-30.5152-10.24-20.2752 0-35.6352 5.12-45.6704 20.2752-10.24 10.24-15.1552 30.5152-15.1552 55.9104s5.12 45.6704 15.1552 55.9104c10.24 15.1552 25.3952 20.2752 45.6704 20.2752 10.24 0 20.2752 0 25.3952-5.12 10.24-5.12 15.1552-10.24 25.3952-15.1552v-25.3952h-45.6704v-4.9152z m0 0" fill="#FFFFFF" p-id="19884"></path></svg>`,
    cat,
  );

  Icon.add(
    'js',
    `<svg t="1609744940778" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="20652" width="1em" height="1em"><path d="M707.072 648.448c-15.36 8.704-36.864 13.312-63.488 13.312-30.208 0-52.224-5.632-66.56-15.872-15.872-11.776-25.6-31.744-29.696-59.392h-59.392c2.56 46.592 19.456 80.384 50.176 101.888 25.088 17.408 60.416 26.112 105.472 26.112 46.592 0 82.944-9.728 108.544-28.16 25.6-18.944 38.4-45.056 38.4-77.824 0-33.792-15.872-59.904-47.616-78.848-14.336-8.192-46.08-20.48-95.744-35.84-33.792-10.752-54.784-18.432-62.464-22.528-17.408-9.216-25.6-22.016-25.6-37.376 0-17.408 7.168-30.208 22.528-37.888 12.288-6.656 29.696-9.728 52.736-9.728 26.624 0 47.104 4.608 60.416 14.848 13.312 9.728 23.04 26.112 28.16 48.64h59.392c-3.584-39.936-18.432-69.632-44.032-88.576-24.064-17.92-57.856-26.624-100.864-26.624-39.424 0-71.68 8.704-97.28 26.624-27.648 18.432-40.96 44.032-40.96 76.288s13.824 56.832 41.984 73.728c10.752 6.144 38.912 16.384 83.968 30.72 40.448 12.288 64 20.48 71.168 24.064 22.528 11.264 34.304 26.624 34.304 46.08 0 15.36-8.192 27.136-23.552 36.352z" p-id="20653"></path><path d="M884.864 223.84L557.984 34.56a101.088 101.088 0 0 0-101.056 0L130.24 223.872a101.12 101.12 0 0 0-50.24 87.2v401.312c0 36.384 19.712 70.016 51.424 87.872l117.792 66.176c1.28 0.704 2.688 0.768 4.032 1.312 15.648 7.616 34.272 11.52 57.472 11.52 42.496 0 75.36-15.52 94.816-37.024 17.408-20.48 26.112-51.2 26.112-93.184V341.76h-59.904v405.248c0 26.112-4.608 45.056-13.824 56.832-9.216 11.776-24.064 17.92-44.032 17.92-2.688 0-18.656-4.096-31.2-9.408l-0.16-0.032c-0.736-0.48-1.184-1.248-1.952-1.664l-117.76-66.176A36.96 36.96 0 0 1 144 712.352v-401.28c0-13.088 7.04-25.28 18.336-31.84l326.656-189.28a36.8 36.8 0 0 1 36.896 0l326.88 189.28c11.328 6.592 18.368 18.784 18.368 31.872V713.6c0 12.864-6.88 24.96-17.92 31.552L537.472 933.824a36.8 36.8 0 0 1-36.896 0.512l-67.168-37.76a32 32 0 1 0-31.392 55.808l67.2 37.76a100.832 100.832 0 0 0 101.056-1.376l315.744-188.672a101.216 101.216 0 0 0 49.088-86.496V311.072a100.992 100.992 0 0 0-50.24-87.232z" p-id="20654"></path></svg>`,
    cat,
  );

  Icon.add(
    'mdb',
    `<svg t="1609744997130" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="21418" width="1em" height="1em"><path d="M184 1016c-12.8 0-24-11.2-24-24V32c0-12.8 11.2-24 24-24h588.8l171.2 171.2V992c0 12.8-11.2 24-24 24H184z" fill="#FFFFFF" p-id="21419"></path><path d="M769.6 16L936 182.4V992c0 9.6-6.4 16-16 16H184c-9.6 0-16-6.4-16-16V32c0-9.6 6.4-16 16-16h585.6m6.4-16H184C166.4 0 152 14.4 152 32v960c0 17.6 14.4 32 32 32h736c17.6 0 32-14.4 32-32V176L776 0z" fill="#AE5DA1" p-id="21420"></path><path d="M696 412.8H72v-224h624c9.6 0 16 6.4 16 16v192c0 8-6.4 16-16 16z" fill="#AE5DA1" p-id="21421"></path><path d="M72 412.8h80v80z" fill="#804476" p-id="21422"></path><path d="M363.2 372.8v-96c0-8 0-17.6 1.6-28.8-1.6 6.4-3.2 11.2-4.8 14.4l-48 110.4h-11.2l-48-108.8c-1.6-3.2-3.2-8-4.8-16 0 6.4 1.6 16 1.6 28.8v96H232v-145.6h25.6l43.2 99.2c3.2 8 4.8 12.8 6.4 17.6 3.2-9.6 4.8-14.4 6.4-17.6l43.2-99.2h24v145.6h-17.6zM419.2 372.8v-145.6h41.6c22.4 0 40 6.4 54.4 19.2s22.4 30.4 22.4 51.2c0 22.4-8 40-22.4 54.4s-33.6 20.8-56 20.8h-40z m19.2-129.6v112h20.8c19.2 0 33.6-4.8 43.2-14.4s16-24 16-41.6-4.8-32-16-41.6-24-14.4-41.6-14.4h-22.4zM564.8 372.8v-145.6h43.2c12.8 0 22.4 3.2 30.4 9.6s11.2 14.4 11.2 24c0 8-1.6 14.4-6.4 20.8s-11.2 11.2-19.2 12.8c9.6 1.6 17.6 4.8 24 11.2s9.6 14.4 9.6 24c0 12.8-4.8 22.4-12.8 30.4s-20.8 11.2-35.2 11.2h-44.8z m19.2-129.6V288h17.6c9.6 0 16-1.6 20.8-6.4s8-11.2 8-17.6c0-14.4-9.6-20.8-27.2-20.8H584z m0 62.4v51.2h22.4c9.6 0 17.6-1.6 22.4-6.4s8-11.2 8-19.2c0-16-11.2-25.6-33.6-25.6H584z" fill="#FFFFFF" p-id="21423"></path><path d="M776 0h-6.4v182.4H952V176z" fill="#804476" p-id="21424"></path><path d="M265.6 614.4a160 64 0 1 0 320 0 160 64 0 1 0-320 0Z" fill="#AE5DA1" p-id="21425"></path><path d="M585.6 630.4v48c0 35.2-72 64-160 64s-160-28.8-160-64v-48c0 8 4.8 16 11.2 24 9.6 9.6 24 17.6 41.6 24 28.8 9.6 65.6 16 105.6 16s78.4-6.4 105.6-16c17.6-6.4 33.6-14.4 41.6-24 11.2-8 14.4-16 14.4-24z" fill="#AE5DA1" p-id="21426"></path><path d="M585.6 694.4v48c0 35.2-72 64-160 64s-160-28.8-160-64v-48c0 8 4.8 16 11.2 24 9.6 9.6 24 17.6 41.6 24 28.8 9.6 65.6 16 105.6 16s78.4-6.4 105.6-16c17.6-6.4 33.6-14.4 41.6-24 11.2-8 14.4-16 14.4-24z" fill="#AE5DA1" p-id="21427"></path><path d="M585.6 758.4v48c0 35.2-72 64-160 64s-160-28.8-160-64v-48c0 8 4.8 16 11.2 24 9.6 9.6 24 17.6 41.6 24 28.8 9.6 65.6 16 105.6 16s78.4-6.4 105.6-16c17.6-6.4 33.6-14.4 41.6-24 11.2-8 14.4-16 14.4-24z" fill="#AE5DA1" p-id="21428"></path></svg>`,
    cat,
  );

  Icon.add(
    'mp3',
    `<svg t="1609745066287" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="22390" width="1em" height="1em"><path d="M920.08027 901.492621l-81.671586 0 0 20.416365c0 56.388203-45.681375 102.091014-102.088972 102.091014L103.369513 1024c-56.348393 0-102.078765-45.70179-102.078765-102.091014L1.290749 105.19925c0-56.377995 45.730372-102.088972 102.078765-102.088972l408.354868 0 37.7051 0 0-3.110278 2.891834 3.110278 0.23988 0 0 0.3195 282.777021 305.947417 3.070468 0 0 3.349137 1.435199 1.526047-1.435199 0 0 240.137532 81.671586 0c56.408618 0 102.088972 45.709957 102.088972 102.088972l0 142.923745C1022.169242 855.791851 976.488888 901.492621 920.08027 901.492621M552.561195 76.407489l0 130.880733c0 56.388203 45.74058 102.088972 102.088972 102.088972l117.740396 0L552.561195 76.407489zM797.572891 350.212987 613.813353 350.212987c-56.347372 0-102.088972-45.70077-102.088972-102.088972L511.724381 43.947092 144.206327 43.947092c-56.350434 0-102.088972 45.709957-102.088972 102.088972l0 735.03815c0 56.389223 45.738538 102.088972 102.088972 102.088972l551.277592 0c49.389822 0 90.584926-35.063354 100.055604-81.670565L327.965864 901.492621c-56.348393 0-102.088972-45.70077-102.088972-102.091014L225.876892 656.477863c0-56.377995 45.74058-102.088972 102.088972-102.088972l469.607027 0L797.572891 350.212987zM667.629223 761.827165c16.012776 0 28.254837-0.83805 36.70781-2.513129 6.222597-1.345371 12.323723-4.13717 18.344208-8.324357 6.042942-4.188208 11.006933-9.931044 14.915451-17.277506 3.927912-7.327067 5.882682-16.370044 5.882682-27.156491 0-13.947763-3.410383-25.352796-10.188278-34.154872-6.780957-8.824533-15.19412-14.516331-25.243574-17.148889-6.539035-1.764907-20.535795-2.641746-42.112773-2.641746l-56.804676 0 0 175.39435 35.410415 0 0-66.17736L667.629223 761.827165zM466.004217 828.004526l34.095667 0 34.813266-138.067955 0 138.067955 32.879933 0L567.793084 652.610176l-53.09827 0-31.463108 119.633919-31.823439-119.633919-53.01865 0 0 175.39435 32.919743 0L431.30936 689.937592 466.004217 828.004526zM878.666723 696.876767c0-10.838506-4.107567-20.577647-12.342097-29.191901-9.950439-10.538401-23.190811-15.782082-39.7007-15.782082-9.669728 0-18.324813 1.794509-26.119392 5.413129-7.777226 3.628828-13.839562 8.614255-18.183947 14.965468-4.367863 6.329778-7.617986 14.823582-9.751389 25.431395l30.945579 5.274304c0.875818-7.656775 3.349137-13.499647 7.457725-17.476556 4.047342-3.988138 8.953149-5.981696 14.67455-5.981696 5.822456 0 10.507778 1.754699 14.017176 5.263076 3.528792 3.509398 5.283491 8.216155 5.283491 14.107003 0 6.949383-2.431468 12.501336-7.198451 16.678316-4.764941 4.188208-11.722491 6.192995-20.83488 5.942907l-3.689053 27.4076c5.980675-1.675079 11.126363-2.513129 15.431959-2.513129 6.541076 0 12.104258 2.473319 16.629319 7.406687 4.547518 4.946638 6.819746 11.644913 6.819746 20.097886 0 8.943962-2.351848 16.021962-7.118831 21.296267-4.725132 5.263076-10.587398 7.894614-17.525553 7.894614-6.461457 0-11.965433-2.202816-16.489474-6.568637-4.567933-4.399507-7.35769-10.738471-8.414184-19.033226l-32.502249 3.947307c1.675079 14.75519 7.736395 26.680814 18.144138 35.812598 10.470009 9.140971 23.608304 13.71707 39.50063 13.71707 16.748749 0 30.745509-5.413129 41.971907-16.270009 11.246813-10.846673 16.906968-23.975781 16.906968-39.350577 0-10.618021-3.011263-19.659977-9.052164-27.176907-6.020485-7.486307-14.056986-12.313515-24.086024-14.476521C870.251518 724.551808 878.666723 712.278103 878.666723 696.876767M644.539468 682.280817l17.10908 0c12.761632 0 21.254415 0.387892 25.462018 1.206547 5.742836 1.025871 10.507778 3.61862 14.23562 7.755789 3.768673 4.167793 5.642801 9.421682 5.642801 15.801477 0 5.194684-1.374973 9.719746-4.048363 13.638471-2.630517 3.908518-6.318549 6.779936-11.045722 8.622421-4.704716 1.834319-14.016155 2.732594-27.993521 2.732594l-19.362934 0L644.538447 682.280817zM295.006311 443.169155c-0.120451-26.280673 24.186059-47.535088 54.253778-47.535088 6.87895 0 13.699717 1.226962 20.178527 3.269517l-0.43893-164.727333-141.06901 21.334035-0.040831 209.512474-0.578775 0c0.11943 1.115699 0.578775 2.202816 0.578775 3.33995-0.100035 26.527699-39.78032 48.103656-70.166519 48.103656-30.366804 0-54.733539-21.575957-54.393623-48.103656 0.379725-26.439913 29.151071-47.735159 59.29841-47.735159 6.481872 0 13.420027 1.166737 20.278562 3.001056l-0.875818-204.217754 0.459345 0-0.11943-59.419881 227.985299-34.375357-0.339915 102.328853-0.15924 0.03981-0.459345 212.591108-0.379725 0c0.07962 0.87786 0.419535 1.675079 0.419535 2.592749 0.338895 26.398061-29.071451 47.903585-59.41784 47.903585C319.729294 491.072741 295.085931 469.567217 295.006311 443.169155" p-id="22391"></path></svg>`,
    cat,
  );

  Icon.add(
    'mpeg',
    `<svg t="1609745106017" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="23219" width="1em" height="1em"><path d="M590.506667 546.816L492.544 624.64c-26.282667 20.821333-65.194667 2.048-65.194667-31.402667V419.84c0-33.792 38.912-52.565333 65.194667-31.402667l98.304 77.824c25.941333 19.797333 25.941333 60.074667-0.341333 80.554667z" fill="#A3BDD3" p-id="23220"></path><path d="M257.365333 819.541333c0-24.917333 13.994667-47.104 35.498667-60.416V75.093333H730.453333v671.402667h145.749334v-28.672h-109.226667v-76.8h109.226667v-36.522667h-109.226667v-76.458666h109.226667V491.52h-109.226667v-76.458667h109.226667v-36.522666h-109.226667V301.738667h109.226667V265.557333h-109.226667V188.416h109.226667V151.893333h-109.226667V75.093333h109.568v671.402667h65.194667c2.730667 0 5.461333 0 8.192 0.341333V75.093333C949.589333 34.816 916.821333 2.048 876.544 2.048H148.821333C108.885333 2.048 75.776 34.816 75.776 75.093333v871.424c0 39.936 32.768 73.045333 73.045333 73.045334h108.202667v-200.021334z m-1.365333 126.976H148.821333V866.986667H256v79.530666z m0-116.053333H148.821333V754.346667H256v76.117333z m0-112.64H148.821333v-76.8H256v76.8z m0-113.322667H148.821333v-76.458666H256v76.458666z m0-112.981333H148.821333v-76.458667H256V491.52z m0-112.981333H148.821333V301.397333H256v77.141334z m0-113.664H148.821333V188.416H256v76.458667zM148.821333 151.893333V75.093333H256v76.8H148.821333z" fill="#A3BDD3" p-id="23221"></path><path d="M941.397333 746.496H337.578667c-44.373333 0-80.554667 33.109333-80.554667 73.045333v200.362667h684.373333c44.373333 0 80.554667-32.768 80.554667-73.045333v-127.317334c0-40.277333-36.181333-73.045333-80.554667-73.045333zM460.8 966.314667v-127.317334l-36.181333 127.317334h-31.402667l-34.474667-127.317334v127.317334H323.242667v-161.109334h54.613333l30.72 116.053334h1.706667l30.037333-116.053334h54.613333v161.109334h-34.133333z m123.562667-56.32H549.546667v56.32h-35.498667v-161.109334h69.973333c39.594667 0 59.050667 17.408 58.709334 52.565334 1.365333 35.498667-18.432 52.906667-58.368 52.224z m200.362666-82.261334h-90.794666v45.056h84.650666v23.210667h-84.650666V945.493333h90.794666v20.821334h-126.634666v-161.109334h126.634666v22.528z m163.157334 105.472c-10.24 24.234667-33.792 36.181333-71.338667 36.181334-53.248-2.048-80.554667-30.037333-82.261333-83.968 2.048-52.565333 28.672-79.872 80.554666-82.261334 37.546667-0.682667 61.781333 15.018667 72.704 46.762667h-37.546666c-5.461333-16.384-17.066667-24.917333-35.498667-24.917333-27.989333 2.389333-42.666667 22.869333-44.373333 60.416 1.706667 38.570667 17.066667 59.050667 47.445333 61.44 19.114667 0.341333 31.061333-7.850667 36.864-24.917334v-27.306666h-48.128v-21.845334h81.92v60.416z" fill="#8AA9BF" p-id="23222"></path><path d="M577.536 827.733333h-27.648v59.050667h27.648c20.48 0.341333 30.378667-9.216 29.013333-29.013333 0.682667-20.821333-9.216-30.72-29.013333-30.037334z" fill="#8AA9BF" p-id="23223"></path></svg>`,
    cat,
  );

  Icon.add(
    'mpg',
    `<svg t="1609745136293" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="24069" width="1em" height="1em"><path d="M590.506667 546.816L492.544 624.64c-26.282667 20.821333-65.194667 2.048-65.194667-31.402667V419.84c0-33.792 38.912-52.565333 65.194667-31.402667l98.304 77.824c25.941333 19.797333 25.941333 60.074667-0.341333 80.554667z" fill="#A3BDD3" p-id="24070"></path><path d="M382.976 946.517333H292.522667V75.093333h437.589333v671.402667h145.749333v-28.672h-109.226666v-76.8h109.226666v-36.522667h-109.226666v-76.458666h109.226666V491.52h-109.226666v-76.458667h109.226666v-36.522666h-109.226666V301.738667h109.226666V265.557333h-109.226666V188.416h109.226666V151.893333h-109.226666V75.093333h109.568v671.402667h73.386666V75.093333C949.248 34.816 916.48 2.048 876.202667 2.048H148.821333C108.885333 2.048 75.776 34.816 75.776 75.093333v871.424c0 39.936 32.768 73.045333 73.045333 73.045334h234.154667v-73.045334z m-126.976 0H148.821333V866.986667H256v79.530666z m0-116.053333H148.821333V754.346667H256v76.117333z m0-112.64H148.821333v-76.8H256v76.8z m0-113.322667H148.821333v-76.458666H256v76.458666z m0-112.981333H148.821333v-76.458667H256V491.52z m0-112.981333H148.821333V301.397333H256v77.141334z m0-113.664H148.821333V188.416H256v76.458667z m0-112.981334H148.821333V75.093333H256v76.8z" fill="#A3BDD3" p-id="24071"></path><path d="M718.848 827.733333h-27.648v59.050667h27.648c20.48 0.341333 30.378667-9.216 29.013333-29.013333 0.682667-20.821333-9.216-30.72-29.013333-30.037334z" fill="#8AA9BF" p-id="24072"></path><path d="M954.709333 746.496H450.218667c-36.864 0-67.242667 33.109333-67.242667 73.045333v200.362667h571.733333c37.205333 0 67.242667-32.768 67.242667-73.045333v-127.317334c0-40.277333-30.378667-73.045333-67.242667-73.045333z m-352.256 219.818667v-127.317334l-36.181333 127.317334h-31.402667l-34.474666-127.317334v127.317334h-35.498667v-161.109334h54.613333l30.72 116.053334h1.706667l30.037333-116.053334h54.613334v161.109334h-34.133334z m123.562667-56.32h-34.474667v56.32h-35.498666v-161.109334h69.973333c39.594667 0 59.050667 17.408 58.709333 52.565334 0.682667 35.498667-18.773333 52.906667-58.709333 52.224z m221.866667 23.210666c-10.24 24.234667-33.792 36.181333-71.338667 36.181334-53.248-2.048-80.554667-30.037333-82.261333-83.968 2.048-52.565333 28.672-79.872 80.554666-82.261334 37.546667-0.682667 61.781333 15.018667 72.704 46.762667h-37.546666c-5.461333-16.384-17.066667-24.917333-35.498667-24.917333-27.989333 2.389333-42.666667 22.869333-44.373333 60.416 1.706667 38.570667 17.066667 59.050667 47.445333 61.44 19.114667 0.341333 31.061333-7.850667 36.864-24.917334v-27.306666h-48.128v-21.845334h81.92v60.416z" fill="#8AA9BF" p-id="24073"></path></svg>`,
    cat,
  );

  Icon.add(
    'msi',
    `<svg t="1609745915959" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="27319" width="1em" height="1em"><path d="M836.855172 0v217.158621h132.413794z" fill="#5E89C1" p-id="27320"></path><path d="M969.268966 296.606897V247.172414h-167.724138V0H54.731034v1024H971.034483l-1.765517-727.393103zM667.365517 82.97931h31.779311v218.924138h-31.779311V82.97931z m-95.337931 141.24138c-3.531034-5.296552-10.593103-8.827586-19.420689-12.358621-5.296552-1.765517-17.655172-5.296552-38.84138-10.593103-19.42069-5.296552-33.544828-8.827586-42.372414-14.124138-10.593103-5.296552-17.655172-12.358621-22.951724-21.186207-3.531034-5.296552-7.062069-15.889655-7.062069-24.717242 0-10.593103 3.531034-21.186207 8.827587-31.77931 7.062069-8.827586 15.889655-17.655172 28.248275-22.951724 12.358621-5.296552 24.717241-7.062069 40.606897-7.062069 15.889655 0 30.013793 1.765517 42.372414 7.062069 12.358621 5.296552 22.951724 12.358621 28.248276 22.951724 7.062069 10.593103 10.593103 21.186207 10.593103 35.310345v1.765517l-30.013793 1.765517v-1.765517c-1.765517-12.358621-7.062069-22.951724-14.124138-30.013793-8.827586-7.062069-21.186207-10.593103-37.075862-10.593104-15.889655 0-28.248276 3.531034-37.075862 8.827587-5.296552 8.827586-8.827586 15.889655-8.827586 24.717241 0 7.062069 1.765517 12.358621 7.062069 17.655172 5.296552 5.296552 19.42069 10.593103 42.372413 14.124138 22.951724 5.296552 38.841379 10.593103 47.668966 14.124138 12.358621 5.296552 22.951724 14.124138 28.248276 22.951724 5.296552 8.827586 8.827586 19.42069 8.827586 31.779311s-3.531034 22.951724-10.593103 33.544827c-7.062069 10.593103-15.889655 17.655172-28.248276 24.717242-12.358621 5.296552-26.482759 8.827586-42.372414 8.827586-19.42069 0-37.075862-3.531034-49.434483-8.827586-14.124138-5.296552-24.717241-14.124138-31.77931-26.482759-7.062069-12.358621-12.358621-24.717241-12.358621-38.841379v-1.765517l30.013793-1.765518v1.765518c1.765517 10.593103 3.531034 19.42069 8.827586 26.482758 5.296552 7.062069 10.593103 12.358621 21.186207 15.889655 8.827586 3.531034 21.186207 7.062069 31.779311 7.062069 10.593103 0 19.42069-1.765517 28.248276-5.296551 7.062069-3.531034 14.124138-7.062069 17.655172-12.358621 3.531034-5.296552 5.296552-10.593103 5.296552-17.655172 1.765517-10.593103 0-15.889655-3.531035-21.186207z m-397.241379-141.24138h45.903448l51.2 153.6c3.531034 10.593103 7.062069 19.42069 8.827586 26.482759 1.765517-7.062069 5.296552-17.655172 10.593104-28.248276l51.2-150.068965h40.606896v218.924138H353.103448V130.648276l-60.027586 171.255172H264.827586V300.137931L204.8 127.117241v174.786207H174.786207V82.97931z m776.827586 921.6H72.386207V388.413793h879.227586v616.165517z" fill="#5E89C1" p-id="27321"></path><path d="M335.448276 736.22069h45.903448l10.593104 26.482758-31.779311 31.779311c-7.062069 7.062069-7.062069 19.42069 0 26.482758l30.013793 30.013793c7.062069 7.062069 19.42069 7.062069 26.482759 0l31.77931-31.77931c8.827586 3.531034 17.655172 8.827586 26.482759 10.593103v45.903449c0 10.593103 8.827586 17.655172 17.655172 17.655172h40.606897c10.593103 0 17.655172-8.827586 17.655172-17.655172V829.793103l26.482759-10.593103 31.77931 31.77931c7.062069 7.062069 19.42069 7.062069 26.482759 0l30.013793-30.013793c7.062069-7.062069 7.062069-19.42069 0-26.482758l-31.77931-31.779311c3.531034-8.827586 8.827586-17.655172 10.593103-26.482758H688.551724c10.593103 0 17.655172-8.827586 17.655173-17.655173v-40.606896c0-10.593103-8.827586-17.655172-17.655173-17.655173h-45.903448l-10.593104-26.482758 31.779311-31.779311c7.062069-7.062069 7.062069-19.42069 0-26.482758L635.586207 545.544828c-7.062069-7.062069-19.42069-7.062069-26.482759 0l-31.77931 31.77931c-8.827586-3.531034-17.655172-8.827586-26.482759-10.593104v-45.903448c0-10.593103-8.827586-17.655172-17.655172-17.655172h-40.606897c-10.593103 0-17.655172 8.827586-17.655172 17.655172v45.903448l-26.482759 10.593104-31.77931-31.77931c-7.062069-7.062069-19.42069-7.062069-26.482759 0l-30.013793 30.013793c-7.062069 7.062069-7.062069 19.42069 0 26.482758l31.779311 31.779311c-3.531034 8.827586-8.827586 17.655172-10.593104 26.482758H335.448276c-10.593103 0-17.655172 8.827586-17.655173 17.655173v40.606896c0 8.827586 8.827586 17.655172 17.655173 17.655173z m176.551724-116.524138c42.372414 0 77.682759 35.310345 77.682759 77.682758 0 42.372414-35.310345 77.682759-77.682759 77.682759s-77.682759-35.310345-77.682759-77.682759c0-44.137931 35.310345-77.682759 77.682759-77.682758z" fill="#5E89C1" p-id="27322"></path></svg>`,
    cat,
  );

  Icon.add(
    'pdf',
    `<svg t="1609745972835" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="28117" width="1em" height="1em"><path d="M833.755611 2.553616v217.057357h132.78803L833.755611 2.553616zM437.945137 270.683292c15.321696 0 22.982544-2.553616 30.643392-2.553616 7.660848-2.553616 12.76808-5.107232 17.875311-12.76808 5.107232-5.107232 12.76808-15.321696 15.321696-22.982544 2.553616-12.76808 5.107232-22.982544 5.107232-38.304239 0-20.428928-2.553616-35.750623-12.76808-48.518703-7.660848-12.76808-15.321696-17.875312-22.982543-22.982544-7.660848-5.107232-20.428928-5.107232-35.750624-5.107232h-40.857855v153.216958h43.411471z m-160.877805-137.895262c-2.553616-5.107232-7.660848-7.660848-15.321696-12.76808-2.553616 0-10.214464-2.553616-22.982544-2.553616h-51.072319v66.394015h48.518703c17.875312 0 25.53616-2.553616 35.750624-10.214464 7.660848-2.553616 10.214464-12.76808 10.214464-20.428927 0-10.214464 0-15.321696-5.107232-20.428928z" fill="#E0474C" p-id="28118"></path><path d="M966.543641 298.773067v-51.072319h-168.538653V2.553616H54.902743v1021.446384h911.640898V298.773067zM591.162095 81.715711h155.770573v35.750623h-117.466334v58.733167h99.591023v35.750624h-99.591023V306.433915h-38.304239V81.715711z m-229.825437 0h79.162095c17.875312 0 30.643392 2.553616 38.30424 2.553616 12.76808 2.553616 22.982544 10.214464 33.197007 15.321695 12.76808 12.76808 20.428928 22.982544 25.53616 38.30424 5.107232 15.321696 10.214464 33.197007 10.214463 53.625935 0 15.321696-2.553616 30.643392-5.107231 43.411471s-10.214464 22.982544-15.321696 33.197008c-7.660848 10.214464-15.321696 15.321696-20.428928 20.428927-7.660848 5.107232-17.875312 10.214464-25.53616 12.76808-12.76808 2.553616-22.982544 2.553616-35.750623 2.553616h-81.715711l-2.553616-222.164588z m-211.950124 0h86.822942c15.321696 0 25.53616 0 33.197008 2.553616 12.76808 2.553616 20.428928 5.107232 28.089775 12.768079 7.660848 5.107232 12.76808 12.76808 17.875312 22.982544 5.107232 10.214464 7.660848 20.428928 7.660848 30.643392 0 20.428928-7.660848 35.750623-20.428928 48.518703-12.76808 15.321696-35.750623 20.428928-66.394015 20.428928h-51.072319V306.433915H146.832918V81.715711h2.553616z m801.835411 924.408977H72.778055V390.703242h875.890274v615.421446z" fill="#E0474C" p-id="28119"></path><path d="M672.877805 806.942643c-33.197007-2.553616-66.394015-15.321696-89.376558-35.750623-51.072319 12.76808-99.591022 25.53616-145.55611 48.518703-38.304239 66.394015-71.501247 102.144638-104.698254 102.144639-7.660848 0-15.321696-2.553616-20.428928-5.107232-12.76808-5.107232-20.428928-20.428928-20.428928-33.197008s2.553616-40.857855 120.019951-89.376558c25.53616-48.518703 48.518703-99.591022 66.394015-153.216958-15.321696-30.643392-48.518703-102.144638-22.982544-137.895262 7.660848-15.321696 22.982544-20.428928 38.304239-20.428928 12.76808 0 22.982544 5.107232 30.643392 15.321696 15.321696 22.982544 15.321696 68.947631-5.107232 137.895262 20.428928 35.750623 45.965087 71.501247 74.054863 99.591023 25.53616-5.107232 51.072319-10.214464 76.608479-10.214464 58.733167 2.553616 66.394015 28.089776 66.394014 43.411471-5.107232 38.304239-43.411471 38.304239-63.840399 38.304239z m-344.738154 76.608479l2.553616-2.553616c17.875312-7.660848 30.643392-17.875312 38.304239-35.750623-15.321696 10.214464-30.643392 20.428928-40.857855 38.304239z m163.431421-370.274314H486.46384c-2.553616 0-2.553616 0-5.107232 2.553616-5.107232 20.428928-2.553616 40.857855 7.660848 63.840399 7.660848-22.982544 7.660848-45.965087 2.553616-66.394015z m7.660848 178.753117h-2.553616c-12.76808 28.089776-22.982544 56.179551-35.750623 84.269327l2.553616-2.553616v2.553616c28.089776-12.76808 53.625935-17.875312 84.269326-22.982544l-2.553616-2.553616h2.553616c-17.875312-15.321696-33.197007-38.304239-48.518703-58.733167z m168.538654 66.394015c-12.76808 0-20.428928 0-30.643392 2.553616 12.76808 5.107232 22.982544 10.214464 35.750623 12.76808 10.214464 2.553616 17.875312 0 22.982544-2.553616 0-7.660848-5.107232-12.76808-28.089775-12.76808z" fill="#E0474C" p-id="28120"></path></svg>`,
    cat,
  );

  Icon.add(
    'php',
    `<svg t="1609746039672" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="29019" width="1em" height="1em"><path d="M576.384 633.184a23.616 23.616 0 0 0-8.288-1.088h-30.08v30.048h29.6c5.312 0 9.056-0.8 11.2-2.432 3.168-2.56 4.768-7.008 4.768-13.344 0-6.848-2.4-11.232-7.2-13.184z m329.44-60.704c-10.016-10.016-20.32-14.72-33.44-14.72h-36.768v-189.184c0-1.344 3.104-2.688 3.232-4.032 0.384-4.96 2.784-11.744-0.128-19.616-2.272-6.176-4.288-13.216-9.76-19.616L649.28 113.536c-6.336-7.424-13.472-10.72-19.904-13.6l-2.368-1.12a43.936 43.936 0 0 0-19.072-3.744c-1.568 0-3.104 0.352-4.672 0.384-1.28 0.032-2.528 0.384-3.808 0.384H256.544c-21.728 0-41.728 5.408-52.992 16.672-10.304 10.304-25.344 24.384-25.344 44.32v697.984c0 16.768 11.936 36.32 25.344 49.76s36.192 22.144 52.992 22.144h523.488c19.936 0 31.328-11.84 41.632-22.144 11.264-11.264 13.984-28.032 13.984-49.76v-71.84h36.768c13.12 0 23.424-5.024 33.44-15.04s12.192-23.168 12.192-36.288v-123.168c0-13.12-2.176-25.952-12.192-36zM609.44 127.52l4.224 0.48c5.152 2.336 9.472 3.712 11.2 5.76l178.048 208.352h-149.024c-8.992 0-22.56-4.864-29.664-11.968-7.072-7.04-14.784-17.76-14.784-26.848V127.488z m190.464 755.328c-9.184 9.184-13.088 13.184-19.904 13.184H256.512c-8.48 0-23.328-5.728-30.784-13.184s-15.904-19.584-15.904-28.064V156.8c0-6.816 6.752-13.44 15.904-22.592 6.592-6.592 21.664-7.744 30.816-7.744h322.24v176.8c0 17.344 10.816 35.648 23.744 48.544 12.96 12.96 34.112 20.928 51.392 20.928h151.04v184.96H451.584c-13.12 0-29.472 4.704-39.488 14.72s-18.24 22.848-18.24 36v123.168c0 13.12 8.224 26.272 18.24 36.288s26.368 15.04 39.488 15.04h353.376v71.84c0 9.12 1.568 21.472-5.024 28.064z m-156.8-208.992v42.336h-21.792v-102.304h21.792v41.728h39.584v-41.728h21.632v102.304h-21.632v-42.336h-39.584z m-35.584-26.688c0 5.216-0.96 10.144-2.848 14.784s-4.512 8.48-7.904 11.424c-3.072 2.656-6.304 4.512-9.728 5.504s-8.096 1.536-14.048 1.536h-34.976v35.744h-21.792v-102.304h51.072c9.312 0 15.936 0.672 19.936 1.984 6.752 2.24 12.064 6.912 15.968 13.952 2.848 5.312 4.288 11.104 4.288 17.344z m206.08 14.784a29.376 29.376 0 0 1-7.904 11.424c-3.072 2.656-6.304 4.512-9.728 5.504s-8.096 1.536-14.048 1.536h-34.976v35.744h-21.792v-102.304h51.072c9.312 0 15.936 0.672 19.936 1.984 6.752 2.24 12.064 6.912 15.968 13.952 2.848 5.312 4.288 11.104 4.288 17.344 0 5.216-0.96 10.144-2.848 14.784z m-28.288-28.768a23.616 23.616 0 0 0-8.288-1.088h-30.08v30.048h29.6c5.312 0 9.056-0.8 11.2-2.432 3.168-2.56 4.768-7.008 4.768-13.344 0-6.848-2.4-11.232-7.2-13.184zM485.888 235.392h20.608v21.088h-20.608v-21.088z m-20.512-9.824h20.544v0.128h20.608v-20.768h-51.392v20.768h10.272z m-71.872 0h20.544v0.128h20.544v-20.768h-71.84v20.768h30.784z m71.872 112.768h41.12v20.768h-41.12v-20.768z m10.24-10.144v-20.96h-51.328v20.96h-20.544v-20.96H311.52v21.088h40.928v-0.128h20.544v0.128z m-61.568-92.8h51.328v21.088h-51.328v-21.088z m30.784 123.712v-20.768h-71.84v20.64h-20.544v0.128z m-92.384-20.768H311.52v20.768h20.384v-0.128h20.544z m51.392 51.584v-21.088h-51.392v21.088h51.392zM311.552 204.896h30.656v20.768h-30.656v-20.768z m0 163.936h20.384v21.088h-20.384v-21.088z m51.168-112.48h20.544v0.128h10.272v-21.088H311.552v21.088h51.168z m41.056 20.544h0.064v-10.4h-20.608v20.64h-20.544v-20.64H311.52v20.768h92.224z" fill="" p-id="29020"></path></svg>`,
    cat,
  );

  Icon.add(
    'png',
    `<svg t="1609746092268" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="29850" width="1em" height="1em"><path d="M295.456 371.424v-8.352c0-9.568-6.688-17.024-20.032-22.368l-13.664-0.672h-17.056v51.392h28.704c9.568 0 16.928-6.656 22.048-20zM928 640h32V160h-32v-27.072C928 77.28 883.552 32 828.928 32H195.04C140.448 32 96 77.28 96 132.928V160H64v480h32v251.072C96 946.72 140.448 992 195.04 992h480.032a31.872 31.872 0 0 0 20.96-7.84l153.856-133.632a32 32 0 1 0-41.92-48.32L704 892.512V772.96c0-20.384 15.712-36.96 35.072-36.96h157.632a32 32 0 0 0 32-32c0-1.792-0.736-3.36-1.024-5.088 0-0.576 0.32-1.056 0.32-1.664V640z m-64 32H739.072C684.448 672 640 717.28 640 772.928V928H195.04c-19.328 0-35.04-16.576-35.04-36.928V640h704v32zM192 488.864V310.688c0-9.792 6.912-17.344 20.672-22.688h61.408c22.912 0 43.488 11.68 61.728 35.04 8.448 14.464 12.672 27.584 12.672 39.36v7.68c0 23.136-11.776 43.808-35.36 62.048-14.464 8.224-27.488 12.352-39.04 12.352h-29.376v27.36c0 17.568-3.008 27.808-8.992 30.688 0 2.24-4.768 4.576-14.336 7.008h-6.688c-9.792 0.032-17.344-6.88-22.688-20.672z m188.864 0V310.688c0-9.568 6.688-17.12 20.032-22.688h9.344c7.328 0 19.008 9.12 35.04 27.36l104.448 103.776v-97.76c0-17.568 6.24-28.48 18.688-32.704l4.64-0.672h6.656c9.568 0 17.12 6.912 22.688 20.672v178.176c0 9.568-6.784 17.12-20.352 22.688h-8.992c-7.552 0-19.232-9.12-35.04-27.36L433.568 378.4v94.752c0 16-3.232 26.144-9.664 30.368-5.568 4-10.112 6.016-13.664 6.016h-6.656c-9.824 0.032-17.376-6.88-22.72-20.672z m342.688-36.032c7.328 2.656 13.888 4 19.68 4h5.344c10.912 0 21.024-3.456 30.368-10.336v-13.664h-41.696c-9.568 0-17.12-7.008-22.688-21.024v-8.352c0-6.912 4.32-13.44 13.024-19.68 3.776-2.656 10.56-4 20.352-4h50.72c17.568 0 28.48 6.336 32.704 19.008l0.64 4.672v58.4c0 12-14.784 25.344-44.384 40.032-15.136 5.12-27.136 7.68-36.032 7.68h-11.008c-28.704 0-55.392-13.248-80.096-39.712-16.896-22.24-25.344-44.16-25.344-65.728V393.44c0-28.704 13.248-55.392 39.712-80.096 22.24-16.896 44.16-25.344 65.728-25.344h11.008c18.016 0 37.824 6.912 59.392 20.672 14.016 9.792 21.024 19.36 21.024 28.704v4.672c0 4.224-2.656 9.664-8 16.352-6.656 4.672-12.672 7.008-18.016 7.008-7.776 0-16.352-4.576-25.696-13.664-10.24-7.328-20.8-11.008-31.712-11.008h-5.344c-22.016 0-39.168 12-51.392 36.032a55.936 55.936 0 0 0-4 19.36v5.344c0 22.016 11.904 39.136 35.712 51.36zM864 160H160v-27.072C160 112.576 175.712 96 195.04 96h633.888C848.288 96 864 112.576 864 132.928V160z" p-id="29851"></path></svg>`,
    cat,
  );

  Icon.add(
    'ppt',
    `<svg t="1609746123263" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="30787" width="1em" height="1em"><path d="M947.2 870.4h-25.6v102.4a51.2 51.2 0 0 1-51.2 51.2H153.6a51.2 51.2 0 0 1-51.2-51.2v-102.4H76.8a51.2 51.2 0 0 1-51.2-51.2V512a51.2 51.2 0 0 1 51.2-51.2h25.6V51.2a51.2 51.2 0 0 1 51.2-51.2h460.8v51.2H153.6v409.6h716.8v-204.8h-204.8V0h51.2l204.8 204.8v256h25.6a51.2 51.2 0 0 1 51.2 51.2v307.2a51.2 51.2 0 0 1-51.2 51.2zM716.8 72.3968V204.8h132.4032zM358.4 588.8a51.2 51.2 0 0 0-51.2-51.2H153.6v256h51.2v-102.4h102.4a51.2 51.2 0 0 0 51.2-51.2v-51.2z m256 0a51.2 51.2 0 0 0-51.2-51.2h-153.6v256h51.2v-102.4h102.4a51.2 51.2 0 0 0 51.2-51.2v-51.2z m256-51.2h-204.8v51.2h76.8v204.8h51.2v-204.8h76.8v-51.2z m0 332.8H153.6v102.4h716.8v-102.4zM460.8 588.8h102.4v51.2h-102.4v-51.2zM204.8 588.8h102.4v51.2H204.8v-51.2z" fill="#F07A23" p-id="30788"></path></svg>`,
    cat,
  );

  Icon.add(
    'pptx',
    `<svg t="1609746157700" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="31619" width="1em" height="1em"><path d="M284.411941 910.242537v28.448507a26.254535 26.254535 0 0 0 25.596344 28.411941h631.388658a26.254535 26.254535 0 0 0 25.596344-28.411941V312.970147h-255.963434v-255.963434H310.008285a26.291101 26.291101 0 0 0-25.596344 28.448508v170.654478H227.551493V85.455221A82.676189 82.676189 0 0 1 307.192687 0.146265h472.10627L1023.853735 261.77746v676.913584a82.676189 82.676189 0 0 1-79.604628 85.308956H307.192687a82.676189 82.676189 0 0 1-79.641194-85.308956v-28.448507zM941.396943 256.109699L767.890301 68.415369v187.69433z m0 0" fill="#E97459" p-id="31620"></path><path d="M625.720897 511.926868h284.375375v28.448507h-284.375375z m0 113.757463h284.375375v28.448507h-284.375375z m0 0" fill="#E97459" p-id="31621"></path><path d="M654.132838 426.617912v312.823882h227.551493v-312.823882z m-28.411941-28.448508h284.375375V767.890301h-284.375375z m0 0" fill="#E97459" p-id="31622"></path><path d="M271.02871 462.562491H232.597629v92.585631h28.704471c5.338666 0.365662 9.909442 0.511927 14.224253 0.511927a70.901871 70.901871 0 0 0 47.316669-12.798172 41.685474 41.685474 0 0 0 11.701186-35.176689 37.846022 37.846022 0 0 0-11.737752-31.885731 79.056135 79.056135 0 0 0-51.777746-13.236966z" fill="#E97459" p-id="31623"></path><path d="M0 284.411941v568.787316h568.823882V284.411941z m336.409084 303.097272a212.961577 212.961577 0 0 1-74.521925 9.580346h-29.252964v118.145407H182.026568v-292.529638h93.024425a132.77189 132.77189 0 0 1 82.09113 20.659906 75.72861 75.72861 0 0 1 29.76489 64.35652 81.981431 81.981431 0 0 1-50.351664 79.787459z" fill="#E97459" p-id="31624"></path></svg>`,
    cat,
  );

  Icon.add(
    'psd',
    `<svg t="1609746206513" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="32473" width="1em" height="1em"><path d="M168.8 32c-12 0-24.8 4.8-33.6 14.4-8.8 9.6-14.4 20.8-14.4 33.6v864c0 12 4.8 24.8 14.4 33.6 9.6 9.6 21.6 14.4 33.6 14.4h704c12 0 24.8-4.8 33.6-14.4 9.6-9.6 14.4-21.6 14.4-33.6V304l-272-272h-480z" fill="#0077CC" p-id="32474"></path><path d="M921.6 304h-224c-12 0-24.8-4.8-33.6-14.4-9.6-8.8-14.4-21.6-14.4-33.6V32c-0.8 0 272 272 272 272z" fill="#66ADE0" p-id="32475"></path><path d="M360.8 669.6v125.6h-76.8V436H408c89.6 0 134.4 37.6 134.4 113.6 0 36.8-13.6 66.4-40.8 88.8-27.2 22.4-60.8 32.8-101.6 32h-39.2z m0-174.4v116h32.8c44.8 0 67.2-19.2 67.2-58.4 0-38.4-22.4-57.6-66.4-57.6h-33.6zM582.4 726.4c25.6 16 50.4 23.2 75.2 23.2 31.2 0 46.4-8 46.4-24.8 0-12-12.8-21.6-38.4-29.6-32-9.6-53.6-20.8-65.6-32.8-12-12-17.6-28.8-17.6-49.6 0-25.6 10.4-44.8 30.4-59.2 20.8-14.4 47.2-21.6 80-21.6 23.2 0 46.4 3.2 68 10.4v59.2c-20-12-41.6-17.6-65.6-17.6-12 0-21.6 2.4-28.8 6.4-7.2 4-11.2 9.6-11.2 16.8 0 12 11.2 21.6 32.8 28.8 23.2 8 40.8 14.4 52 20.8 12 6.4 20.8 14.4 26.4 24.8S776 704 776 717.6c0 26.4-10.4 47.2-32 61.6s-49.6 21.6-84.8 21.6c-28 0-53.6-4.8-77.6-13.6v-60.8z" fill="#FFFFFF" p-id="32476"></path></svg>`,
    cat,
  );

  Icon.add(
    'rar',
    `<svg t="1609746286340" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="33317" width="1em" height="1em"><path d="M107.789474 0h808.421052a107.789474 107.789474 0 0 1 107.789474 107.789474v231.747368H0V107.789474a107.789474 107.789474 0 0 1 107.789474-107.789474z" fill="#F98882" p-id="33318"></path><path d="M0 684.463158h1024V916.210526a107.789474 107.789474 0 0 1-107.789474 107.789474H107.789474a107.789474 107.789474 0 0 1-107.789474-107.789474v-231.747368z" fill="#A2D85B" p-id="33319"></path><path d="M0 340.884211h1024v342.231578H0z" fill="#5DDFED" p-id="33320"></path><path d="M404.210526 0h215.578948v1024h-215.578948z" fill="#F4B962" p-id="33321"></path><path d="M711.410526 460.8v102.4H312.589474v-102.4h398.821052m43.11579-43.115789H269.473684v188.631578h485.052632v-188.631578z" fill="#FFFFFF" p-id="33322"></path></svg>`,
    cat,
  );

  Icon.add(
    'rft',
    `<svg t="1609746399509" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="34746" width="1em" height="1em"><path d="M676.297143 0H145.609143C130.834286 0 118.857143 11.977143 118.857143 35.218286V1005.714286c0 6.308571 11.977143 18.285714 26.752 18.285714h732.781714c14.774857 0 26.752-11.977143 26.752-18.285714V237.312c0-12.726857-1.700571-16.822857-4.699428-19.84L687.670857 4.699429A16.164571 16.164571 0 0 0 676.297143 0z" fill="#E9E9E0" p-id="34747"></path><path d="M685.714286 2.761143V219.428571h216.667428z" fill="#D9D7CA" p-id="34748"></path><path d="M878.390857 1024H145.609143A26.752 26.752 0 0 1 118.857143 997.248V713.142857h786.285714v284.105143c0 14.774857-11.977143 26.752-26.752 26.752z" fill="#90BAE1" p-id="34749"></path><path d="M380.891429 969.142857l-34.742858-66.742857c-0.493714 0-1.170286 0.036571-1.993142 0.128-0.841143 0.091429-2.121143 0.128-3.876572 0.128h-22.637714V969.142857H287.634286V784.896h52.992c7.826286 0 15.579429 1.243429 23.241143 3.748571 7.661714 2.505143 14.537143 6.253714 20.626285 11.245715s11.008 11.044571 14.756572 18.121143 5.632 15.030857 5.632 23.881142c0 13.330286-3.090286 24.667429-9.252572 33.993143a55.478857 55.478857 0 0 1-24.996571 20.754286L412.635429 969.142857H380.891429z m-63.250286-88.502857h27.245714c3.657143 0 7.314286-0.621714 11.008-1.883429 3.657143-1.243429 7.003429-3.291429 10.002286-6.125714s5.412571-6.784 7.241143-11.867428c1.828571-5.083429 2.742857-11.373714 2.742857-18.870858 0-2.998857-0.420571-6.473143-1.243429-10.368-0.841143-3.913143-2.541714-7.661714-5.12-11.245714s-6.217143-6.582857-10.88-8.996571c-4.681143-2.413714-10.843429-3.620571-18.505143-3.620572h-22.491428v72.978286zM583.149714 784.896v20.498286h-55.003428V969.142857h-30.244572v-163.748571h-55.003428v-20.498286h140.251428zM650.148571 807.643429v58.002285h77.001143v20.498286h-77.001143V969.142857h-30.500571V784.896h115.254857v22.747429h-84.754286z" fill="#FFFFFF" p-id="34750"></path><path d="M228.571429 237.714286h109.714285a18.285714 18.285714 0 1 0 0-36.571429h-109.714285a18.285714 18.285714 0 1 0 0 36.571429zM228.571429 329.142857h164.571428a18.285714 18.285714 0 1 0 0-36.571428h-164.571428a18.285714 18.285714 0 1 0 0 36.571428zM466.285714 329.142857c4.754286 0 9.508571-2.011429 12.982857-5.302857 3.291429-3.474286 5.302857-8.228571 5.302858-12.982857 0-4.754286-2.011429-9.508571-5.302858-12.982857-6.948571-6.765714-19.017143-6.765714-25.965714 0-3.309714 3.474286-5.302857 8.045714-5.302857 12.982857s1.993143 9.508571 5.302857 12.982857c3.456 3.291429 8.228571 5.302857 12.982857 5.302857zM539.428571 329.142857h146.285715a18.285714 18.285714 0 1 0 0-36.571428h-146.285715a18.285714 18.285714 0 1 0 0 36.571428zM215.588571 572.16c-3.309714 3.474286-5.302857 8.045714-5.302857 12.982857s1.993143 9.508571 5.302857 12.982857c3.456 3.291429 8.027429 5.302857 12.982858 5.302857 4.937143 0 9.508571-2.011429 12.982857-5.302857 3.291429-3.474286 5.302857-8.228571 5.302857-12.982857 0-4.754286-2.011429-9.508571-5.302857-12.982857-6.765714-6.765714-19.2-6.765714-25.965715 0zM448 566.857143h-146.285714a18.285714 18.285714 0 1 0 0 36.571428h146.285714a18.285714 18.285714 0 1 0 0-36.571428zM758.857143 329.142857h36.571428a18.285714 18.285714 0 1 0 0-36.571428h-36.571428a18.285714 18.285714 0 1 0 0 36.571428zM228.571429 420.571429h402.285714a18.285714 18.285714 0 1 0 0-36.571429h-402.285714a18.285714 18.285714 0 1 0 0 36.571429zM795.428571 384h-109.714285a18.285714 18.285714 0 1 0 0 36.571429h109.714285a18.285714 18.285714 0 1 0 0-36.571429zM228.571429 512h73.142857a18.285714 18.285714 0 1 0 0-36.571429h-73.142857a18.285714 18.285714 0 1 0 0 36.571429zM557.714286 475.428571h-182.857143a18.285714 18.285714 0 1 0 0 36.571429h182.857143a18.285714 18.285714 0 1 0 0-36.571429zM795.428571 475.428571h-164.571428a18.285714 18.285714 0 1 0 0 36.571429h164.571428a18.285714 18.285714 0 1 0 0-36.571429z" fill="#C8BDB8" p-id="34751"></path></svg>`,
    cat,
  );

  Icon.add(
    'swf',
    `<svg t="1609746980664" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="47043" width="1em" height="1em"><path d="M836.855172 0v217.158621H971.034483z" fill="#F65B4F" p-id="47044"></path><path d="M971.034483 296.606897V247.172414h-167.724138V0H54.731034v1024H971.034483V296.606897zM623.227586 79.448276h155.365517v35.310345h-116.524137v56.496551h100.634482v35.310345h-100.634482v97.103449h-38.84138V79.448276z m-277.186207 0l33.544828 144.772414c1.765517 7.062069 3.531034 14.124138 5.296552 19.420689 1.765517-8.827586 3.531034-14.124138 3.531034-15.889655l42.372414-148.303448h42.372414l31.77931 112.993103c5.296552 17.655172 8.827586 33.544828 12.358621 49.434483l5.296551-21.186207 35.310345-141.241379h38.84138l-61.793104 225.986207h-35.310345l-45.903448-167.724138c0-1.765517-1.765517-3.531034-1.765517-5.296552 0 1.765517-1.765517 3.531034-1.765517 5.296552l-45.903449 167.724138h-37.075862L305.434483 79.448276h40.606896z m-102.4 148.303448c-3.531034-3.531034-8.827586-8.827586-17.655172-10.593103-5.296552-1.765517-17.655172-5.296552-37.075862-10.593104-21.186207-5.296552-33.544828-8.827586-42.372414-14.124138-10.593103-5.296552-19.42069-12.358621-24.717241-21.186207-7.062069-8.827586-8.827586-19.42069-8.827587-30.013793 0-12.358621 3.531034-22.951724 10.593104-33.544827 7.062069-10.593103 15.889655-17.655172 30.013793-22.951724 10.593103-5.296552 24.717241-8.827586 40.606897-8.827587 15.889655 0 31.77931 3.531034 44.137931 8.827587s22.951724 14.124138 30.013793 24.717241c7.062069 10.593103 10.593103 22.951724 10.593103 37.075862v5.296552l-37.075862 3.531034v-5.296551c-1.765517-12.358621-5.296552-21.186207-12.358621-26.482759-8.827586-8.827586-19.42069-12.358621-35.310344-12.358621-15.889655 0-28.248276 3.531034-33.544828 8.827586-7.062069 5.296552-10.593103 12.358621-10.593103 19.42069 0 7.062069 1.765517 10.593103 7.062068 15.889655 3.531034 3.531034 12.358621 7.062069 40.606897 14.124138 22.951724 5.296552 38.841379 10.593103 49.434483 14.124138 14.124138 7.062069 22.951724 14.124138 30.013793 22.951724 7.062069 8.827586 10.593103 21.186207 10.593103 33.544828s-3.531034 24.717241-10.593103 35.310345c-7.062069 10.593103-17.655172 19.42069-30.013793 24.717241-12.358621 5.296552-28.248276 8.827586-44.137931 8.827586-19.42069 0-37.075862-3.531034-51.2-8.827586-14.124138-5.296552-24.717241-15.889655-33.544828-28.248276-8.827586-12.358621-12.358621-26.482759-12.358621-40.606896v-5.296552l35.310345-3.531035v5.296552c1.765517 10.593103 3.531034 17.655172 8.827587 24.717242 3.531034 5.296552 10.593103 10.593103 19.420689 14.124137 8.827586 3.531034 19.42069 5.296552 30.013793 5.296552 10.593103 0 19.42069-1.765517 26.482759-5.296552 7.062069-3.531034 12.358621-7.062069 15.889655-10.593103 3.531034-5.296552 5.296552-10.593103 5.296552-15.889655 1.765517-3.531034 0-8.827586-3.531035-12.358621zM953.37931 1006.344828H72.386207V388.413793H953.37931v617.931035z" fill="#F65B4F" p-id="47045"></path><path d="M674.427586 554.372414v-79.448276c-143.006897 0-197.737931 180.082759-199.503448 188.910345-38.841379 146.537931-120.055172 139.475862-123.586207 137.710345v79.448275h3.531035c37.075862 0 135.944828-14.124138 187.144827-164.193103h90.041379v-79.448276h-60.027586c19.42069-37.075862 52.965517-82.97931 102.4-82.97931z" fill="#F65B4F" p-id="47046"></path></svg>`,
    cat,
  );

  Icon.add(
    'tif',
    `<svg t="1609747030431" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="47886" width="1em" height="1em"><path d="M46.545455 930.408727h930.90909V954.181818a69.818182 69.818182 0 0 1-69.818181 69.818182H116.363636a69.818182 69.818182 0 0 1-69.818181-69.818182v-23.773091z" fill="#3F41B2" opacity=".766" p-id="47887"></path><path d="M116.363636 0h692.433455l84.293818 91.636364L977.454545 183.307636V930.909091a69.818182 69.818182 0 0 1-69.818181 69.818182H116.363636a69.818182 69.818182 0 0 1-69.818181-69.818182V69.818182a69.818182 69.818182 0 0 1 69.818181-69.818182z" fill="#D9D9F0" opacity=".817" p-id="47888"></path><path d="M46.545455 756.363636h930.90909v174.545455a69.818182 69.818182 0 0 1-69.818181 69.818182H116.363636a69.818182 69.818182 0 0 1-69.818181-69.818182V756.363636z" fill="#BABAE4" p-id="47889"></path><path d="M977.454545 183.272727h-98.90909a69.818182 69.818182 0 0 1-69.818182-69.818182V0l84.363636 91.636364L977.454545 183.272727z" fill="#3F41B2" opacity=".275" p-id="47890"></path><path d="M698.88 391.389091c-4.154182-6.155636-10.658909-8.948364-17.757091-8.948364s-13.602909 3.909818-17.733818 8.948364l-88.692364 102.865454-157.323636-240.942545c-4.142545-6.155636-10.647273-8.948364-17.745455-8.948364-7.098182 0-13.602909 3.909818-17.733818 8.948364L166.016 583.133091c-4.142545 6.144-4.142545 13.963636 0 19.549091 4.142545 6.714182 10.647273 10.077091 17.745455 10.077091h628.072727c7.098182 0 14.778182-3.921455 18.932363-10.065455 2.955636-6.155636 2.955636-13.975273-1.186909-19.002182L698.868364 391.389091z" fill="#3F41B2" opacity=".2" p-id="47891"></path><path d="M605.090909 247.575273c0 27.392 21.969455 49.745455 48.872727 49.745454 26.914909 0 48.872727-22.353455 48.872728-49.745454S680.890182 197.818182 653.963636 197.818182c-26.903273 0-48.872727 22.365091-48.872727 49.757091z" fill="#3F41B2" opacity=".102" p-id="47892"></path><path d="M190.370909 953.658182l26.274909-124.055273h45.102546L267.473455 802.909091H145.361455L139.636364 829.602909h45.312l-26.298182 124.055273h31.709091z m92.346182 0L314.717091 802.909091h-31.290182l-32 150.749091h31.290182z m60.648727 0l13.393455-63.208727h66.176l5.515636-26.181819h-66.164364l7.365819-34.676363h75.578181l5.620364-26.472728h-106.868364l-31.918545 150.539637h31.301818z" fill="#FFFFFF" p-id="47893"></path></svg>`,
    cat,
  );

  Icon.add(
    'txt',
    `<svg t="1609747213644" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="48703" width="1em" height="1em"><path d="M821.754542 1023.078483 201.955703 1023.078483C147.215247 1023.078483 102.787762 976.150219 102.787762 918.210294L102.787762 315.323252 102.440481 314.956012 400.886013 0.194857 401.233294 0.613919 821.754542 0.613919C876.545065 0.613919 920.922481 47.595131 920.922481 105.48211L920.922481 918.210294C920.922481 976.150219 876.545065 1023.078483 821.754542 1023.078483L821.754542 1023.078483ZM400.290522 74.86124 172.402717 315.218487 350.706018 315.218487C378.076247 315.218487 400.289456 291.728445 400.289456 262.784956L400.289456 74.86124 400.290522 74.86124ZM871.337977 105.48211C871.337977 76.538621 849.124768 53.048576 821.754542 53.048576L449.875026 53.048576 449.875026 262.784956C449.875026 320.671935 405.497608 367.653144 350.707084 367.653144L152.3712 367.653144 152.3712 918.210294C152.3712 947.153783 174.58441 970.643825 201.954638 970.643825L821.753474 970.643825C849.123703 970.643825 871.336912 947.153783 871.336912 918.210294L871.336912 105.48211 871.337977 105.48211ZM747.378852 813.342105 276.331393 813.342105C262.645747 813.342105 251.539142 801.597084 251.539142 787.124776 251.539142 772.652468 262.645747 760.907447 276.331393 760.907447L747.378852 760.907447C761.064496 760.907447 772.171104 772.652468 772.171104 787.124776 772.171104 801.597084 761.064496 813.342105 747.378852 813.342105L747.378852 813.342105ZM747.378852 629.823055 276.331393 629.823055C262.645747 629.823055 251.539142 618.078034 251.539142 603.605726 251.539142 589.133418 262.645747 577.388397 276.331393 577.388397L747.378852 577.388397C761.064496 577.388397 772.171104 589.133418 772.171104 603.605726 772.171104 618.078034 761.064496 629.823055 747.378852 629.823055L747.378852 629.823055ZM747.378852 446.304007 276.331393 446.304007C262.645747 446.304007 251.539142 434.558986 251.539142 420.086678 251.539142 405.61437 262.645747 393.869346 276.331393 393.869346L747.378852 393.869346C761.064496 393.869346 772.171104 405.61437 772.171104 420.086678 772.171104 434.558986 761.064496 446.304007 747.378852 446.304007L747.378852 446.304007ZM747.378852 262.784956 524.250716 262.784956C510.565069 262.784956 499.458464 251.039935 499.458464 236.567627 499.458464 222.095319 510.565069 210.350298 524.250716 210.350298L747.378852 210.350298C761.064496 210.350298 772.171104 222.095319 772.171104 236.567627 772.171104 251.039935 761.064496 262.784956 747.378852 262.784956L747.378852 262.784956Z" p-id="48704"></path></svg>`,
    cat,
  );

  Icon.add(
    'vb',
    `<svg t="1609747305058" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="50475" width="1em" height="1em"><path d="M0 0h1024v1024H0z" fill="#F3F7FF" p-id="50476"></path><path d="M353.28 730.453333z" fill="#87643A" p-id="50477"></path><path d="M314.026667 542.72l-104.106667-293.546667H273.066667l73.386666 216.746667 71.68-216.746667h63.146667L375.466667 542.72h-61.44zM512 249.173333h117.76c23.893333 0 40.96 1.706667 51.2 3.413334s22.186667 5.12 30.72 11.946666 17.066667 13.653333 22.186667 23.893334 8.533333 22.186667 8.533333 34.133333c0 13.653333-3.413333 25.6-11.946667 37.546667s-17.066667 20.48-30.72 25.6c17.066667 5.12 32.426667 13.653333 40.96 27.306666s13.653333 27.306667 13.653334 44.373334c0 13.653333-3.413333 25.6-8.533334 39.253333s-15.36 22.186667-25.6 30.72-20.48 10.24-37.546666 11.946667c-10.24 1.706667-34.133333 1.706667-71.68 1.706666H512V249.173333z m59.733333 47.786667v68.266667h39.253334c23.893333 0 37.546667 0 42.666666-1.706667 10.24-1.706667 18.773333-5.12 23.893334-10.24s8.533333-13.653333 8.533333-22.186667-1.706667-17.066667-6.826667-22.186666-11.946667-8.533333-22.186666-10.24c-5.12 0-22.186667-1.706667-51.2-1.706667h-34.133334z m0 117.76v78.506667h54.613334c22.186667 0 34.133333 0 40.96-1.706667 8.533333-1.706667 15.36-5.12 22.186666-11.946667s8.533333-13.653333 8.533334-25.6c0-8.533333-1.706667-17.066667-6.826667-22.186666s-10.24-10.24-18.773333-13.653334-25.6-3.413333-52.906667-3.413333h-47.786667z" p-id="50478"></path><path d="M353.28 747.52zM353.28 747.52zM119.466667 785.066667h716.8v34.133333H119.466667zM119.466667 687.786667h477.866666v34.133333H119.466667zM119.466667 887.466667h785.066666v34.133333H119.466667z" p-id="50479"></path></svg>`,
    cat,
  );

  Icon.add(
    'wav',
    `<svg t="1609747668691" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="52661" width="1em" height="1em"><path d="M641.926623 511.39793V268.643462l-208.797742 46.238946v199.044215c-13.245532-3.973659-30.464722-2.76952-47.322672 4.334901-29.501411 12.523048-46.600188 38.532455-38.291628 58.159925 8.308561 19.627469 39.014111 25.286924 68.395109 12.763876 26.491063-11.198495 42.98777-33.475071 40.097836-52.018815 0.240828-0.842897 0.361242-1.806209 0.361242-2.76952V355.943556l162.438382-36.003763v170.746943c-13.245532-3.973659-30.464722-2.76952-47.322672 4.334901-29.501411 12.523048-46.600188 38.532455-38.291628 58.159925 8.308561 19.627469 39.014111 25.286924 68.395109 12.763875 26.491063-11.198495 43.108184-33.475071 40.097836-52.018814 0.120414-0.722484 0.240828-1.565381 0.240828-2.528693zM547.040452 753.189087h-0.481656c-0.722484 4.455315-1.444967 7.826905-2.408279 10.235184l-21.915334 60.929445h49.128881L549.207902 763.424271c-0.60207-1.926623-1.444967-5.418627-2.16745-10.235184z" fill="#7D89FF" p-id="52662"></path><path d="M704.301035 107.890875H204.222013c-21.19285 0-38.412041 17.219191-38.412041 38.532455v731.273754c0 21.313264 17.219191 38.532455 38.412041 38.532455h615.43556c21.19285 0 38.412041-17.219191 38.412041-38.532455V261.900282L704.301035 107.890875z m19.266227 46.479774l88.142992 88.263406h-68.997178c-5.057385 0-9.994356-2.047037-13.606773-5.659455s-5.659454-8.549389-5.659454-13.606773v-68.997178zM421.087488 880.94826L391.586077 775.465663c-1.324553-4.816557-2.167451-9.873942-2.408278-15.172154h-0.240828c-0.361242 5.177799-1.204139 10.235183-2.649106 14.931326L356.425212 880.94826h-21.79492L292.124177 734.524929H313.076199l29.862653 110.660396c1.324553 4.936971 2.167451 9.994356 2.408279 15.05174h0.602069c0.361242-3.732832 1.324553-8.790216 3.130762-15.05174l31.668862-110.660396h18.664158l30.223895 111.503293c0.963311 3.612418 1.806209 8.308561 2.408278 13.968015h0.361242c0.361242-4.094073 1.204139-8.91063 2.76952-14.329257l28.778928-111.142051h20.349953L443.123236 880.94826h-22.035748z m171.108185 0l-14.931327-40.097837h-61.049859L502.126058 880.94826h-20.952022L537.046096 734.524929h20.229539l55.751646 146.423331h-20.831608z m86.698024 0h-20.952022L605.200376 734.524929H626.152399l39.375353 114.513641c1.324553 3.732832 2.287865 8.188147 2.889934 13.125118h0.481655c0.481656-4.334901 1.565381-8.790216 3.251176-13.365946l40.218251-114.272813h20.229539l-53.70461 146.423331zM838.923801 685.155221h-653.847602V146.42333c0-5.057385 2.047037-9.994356 5.659455-13.606773s8.549389-5.659454 13.606773-5.659454h492.131703l7.947319 7.947318v88.263406c0 21.313264 17.219191 38.532455 38.412041 38.532455h88.263406l7.947318 7.947319V685.155221z" fill="#7D89FF" p-id="52663"></path></svg>`,
    cat,
  );

  Icon.add(
    'wma',
    `<svg t="1609747703522" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="53508" width="1em" height="1em"><path d="M836.855172 0v217.158621h132.413794zM704.441379 139.475862c-1.765517 7.062069-3.531034 14.124138-7.062069 21.186207l-19.420689 52.965517h52.965517l-17.655172-49.434483c-3.531034-10.593103-7.062069-17.655172-8.827587-24.717241z" fill="#FE4579" p-id="53509"></path><path d="M969.268966 296.606897V247.172414h-167.724138V0H54.731034v1024H971.034483l-1.765517-727.393103z m-282.482759-204.8h35.310345l86.510345 213.627586h-42.372414l-22.951724-61.793104h-77.682759l-22.951724 61.793104h-40.606897l84.744828-213.627586z m-305.434483 0h49.434483l49.434483 146.537931c1.765517 5.296552 3.531034 10.593103 5.296551 14.124138 1.765517-5.296552 3.531034-10.593103 5.296552-17.655173l49.434483-144.772414h45.903448v213.627587h-37.075862v-141.24138l-49.434483 143.006897h-31.77931l-49.434483-144.772414v144.772414h-37.075862V91.806897zM123.586207 91.806897L155.365517 229.517241c1.765517 5.296552 3.531034 12.358621 3.531035 17.655173 1.765517-7.062069 3.531034-12.358621 3.531034-14.124138l38.84138-141.241379h40.606896l30.013793 105.931034c5.296552 15.889655 8.827586 31.77931 10.593104 45.903448 1.765517-5.296552 3.531034-12.358621 3.531034-17.655172l33.544828-134.17931h38.841379L300.137931 305.434483h-33.544828l-44.137931-158.896552c0-1.765517 0-1.765517-1.765517-3.531034 0 1.765517 0 1.765517-1.765517 3.531034l-42.372414 158.896552H141.241379L84.744828 91.806897H123.586207z m828.027586 912.772413H72.386207V388.413793h879.227586v616.165517z" fill="#FE4579" p-id="53510"></path><path d="M607.337931 508.468966l-158.896552 49.434482c-19.42069 5.296552-35.310345 26.482759-35.310345 45.903449v174.786206s-12.358621-8.827586-37.075862-3.531034c-37.075862 5.296552-67.089655 35.310345-67.089655 67.089655 0 31.77931 30.013793 51.2 67.089655 45.903448 37.075862-5.296552 65.324138-33.544828 65.324138-65.324138v-148.303448c0-14.124138 15.889655-19.42069 15.889656-19.420689l139.475862-45.903449s15.889655-5.296552 15.889655 8.827586v118.289656s-14.124138-8.827586-40.606897-5.296552c-37.075862 5.296552-67.089655 33.544828-67.089655 65.324138 0 31.77931 30.013793 51.2 67.089655 45.903448 37.075862-5.296552 67.089655-33.544828 67.089655-65.324138V534.951724c3.531034-21.186207-12.358621-31.77931-31.77931-26.482758z" fill="#FE4579" p-id="53511"></path></svg>`,
    cat,
  );

  Icon.add(
    'wmv',
    `<svg t="1609747746956" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="54364" width="1em" height="1em"><path d="M199.1 0H768l227.6 227.6V1024H199.1z" fill="#BFC3C7" p-id="54365"></path><path d="M256 56.9v910.2h682.7v-716L744.4 56.9z" fill="#FFFFFF" p-id="54366"></path><path d="M724.4 739.8L564.8 847.5c-15.6 10.5-36.7 6.3-47.1-9.5-3.7-5.7-5.7-12.3-5.7-19.1V603.3c0-19 15.2-34.4 34-34.4 6.7 0 13.3 2 18.8 5.8l159.6 107.8c15.6 10.5 19.8 31.9 9.4 47.7-2.4 3.8-5.6 7-9.4 9.6z" fill="#E6E8EB" p-id="54367"></path><path d="M77.2 170.7h585.1c26.9 0 48.8 21.8 48.8 48.8v243.8c0 26.9-21.8 48.8-48.8 48.8H77.2c-26.9 0-48.8-21.8-48.8-48.8V219.4c0-26.9 21.9-48.7 48.8-48.7z" fill="#0CC0C9" p-id="54368"></path><path d="M256.7 422.6h-35.5L193.6 312h-0.4l-27.1 110.6h-36.2l-43-162.5h35.8l25.7 110.6h0.4L177 260.1h33.5l27.8 112h0.4l26.6-112h35.1zM316.8 260.1H367l38 111.7h0.5l36-111.7h50.2v162.5h-33.4V307.4h-0.5L418 422.6h-27.5l-39.8-114h-0.5v114h-33.4zM598.7 422.6h-40.3l-52.5-162.5h36.6l36.2 114.2h0.4l36.7-114.2h36.8z" fill="#FFFFFF" p-id="54369"></path></svg>`,
    cat,
  );

  Icon.add(
    'xls',
    `<svg t="1609747843554" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="55326" width="1em" height="1em"><path d="M756.26427 17.258427H218.462921C177.669753 17.258427 144.286202 50.636225 144.286202 91.435146v846.876764c0 40.798921 33.383551 74.176719 74.176719 74.176719h704.701843c40.798921 0 74.176719-33.383551 74.176719-74.176719V258.341393L756.26427 17.258427z" fill="#E9FFE9" p-id="55327"></path><path d="M756.26427 184.158921c0 40.798921 33.383551 74.176719 74.176719 74.176719h166.900494L756.26427 17.258427v166.900494z" fill="#97DD97" p-id="55328"></path><path d="M662.504989 949.213483H95.870562c-37.968539 0-69.033708-31.065169-69.033708-69.033708v-184.089887c0-37.968539 31.065169-69.033708 69.033708-69.033708h566.634427c37.968539 0 69.033708 31.065169 69.033708 69.033708v184.089887c0 37.968539-31.065169 69.033708-69.033708 69.033708z" fill="#65CE65" p-id="55329"></path><path d="M251.94427 144.320719h352.348045v49.451146H251.94427z" fill="#97DD97" p-id="55330"></path><path d="M251.94427 144.320719h49.451146v352.348045h-49.451146zM367.000449 144.320719h49.451147v352.348045h-49.451147zM482.056629 144.320719h49.451146v352.348045h-49.451146zM597.112809 144.320719h49.451146v352.348045h-49.451146z" fill="#97DD97" p-id="55331"></path><path d="M251.94427 253.526292h352.348045v49.451146H251.94427zM251.94427 362.737618h372.321797v49.451146h-372.321797zM251.94427 471.943191h394.619685v49.451146H251.94427z" fill="#97DD97" p-id="55332"></path><path d="M248.003596 738.292494l23.891415 36.012585c6.236045 9.348315 11.430831 18.006292 16.970787 27.354606h1.041258c5.539955-10.044404 11.07991-18.696629 16.625618-27.699775l23.546247-35.667416h32.894562l-57.136899 81.034068 58.868495 86.574022h-34.63191l-24.587506-37.749932c-6.581213-9.699236-12.121169-19.047551-18.006292-29.086203h-0.690337c-5.539955 10.044404-11.430831 19.047551-17.661124 29.086203l-24.236584 37.749932h-33.590652l59.564584-85.532764-56.79173-82.075326h33.930068zM376.843506 660.031281h30.472629v245.869303h-30.472629v-245.869303zM437.098427 874.737618c9.003146 5.885124 24.932674 12.121169 40.171865 12.121169 22.165573 0 32.549393-11.07991 32.549393-24.932675 0-14.543101-8.657978-22.510742-31.162966-30.817797-30.127461-10.734742-44.325393-27.354607-44.325393-47.443416 0-27.009438 21.814652-49.175011 57.832989-49.175011 16.970787 0 31.859056 4.849618 41.20737 10.389573l-7.616719 22.165573c-6.581213-4.153528-18.696629-9.699236-34.280988-9.699236-18.006292 0-28.044944 10.389573-28.044944 22.85591 0 13.852764 10.044404 20.083056 31.859056 28.395865 29.091955 11.07991 43.980225 25.628764 43.980225 50.561438 0 29.437124-22.85591 50.21627-62.682607 50.21627-18.351461 0-35.322247-4.504449-47.098247-11.425079l7.610966-23.212584z" fill="#FFFFFF" p-id="55333"></path></svg>`,
    cat,
  );

  Icon.add(
    'xlsx',
    `<svg t="1609747856768" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="55473" width="1em" height="1em"><path d="M532.64384 73.14432h60.672v81.65376c102.17472 0 204.34944 0.2048 306.52416-0.3072 17.2544 0.7168 36.2496-0.512 51.22048 9.79968 10.50624 15.0528 9.28768 34.29376 10.0352 51.65056-0.512 177.18272-0.57344 354.304-0.2048 531.36384-0.512 29.70624 2.7648 60.0064-3.46112 89.31328-4.15744 21.18656-29.68576 21.69856-46.75584 22.41536-105.74848 0.3072-211.58912-0.2048-317.44 0v91.82208h-63.34464c-155.56608-28.2624-311.42912-54.39488-467.2-81.65376v-714.3424c156.69248-27.25888 313.37472-54.08768 469.95456-81.7152z" fill="#207245" p-id="55474"></path><path d="M595.58912 188.07808h334.36672v637.3888H595.58912v-60.7232h81.05984V693.9648h-81.05984v-40.47872h81.05984v-70.8096h-81.05984v-40.47872h81.05984v-70.8096h-81.05984V430.8992h81.05984v-70.81984h-81.05984v-40.46848h81.05984v-70.83008h-81.05984z" fill="#FFFFFF" p-id="55475"></path><path d="M720.97792 250.7776h135.8336v70.27712H720.97792V250.7776z m0 110.4384h135.8336v70.27712H720.97792v-70.27712z m0 110.42816h135.8336v70.27712H720.97792v-70.27712z m0 110.42816h135.8336v70.27712H720.97792v-70.27712z m0 110.42816h135.8336v70.27712H720.97792v-70.27712z" fill="#207245" p-id="55476"></path><path d="M242.97472 552.96h-27.4432l-19.456-35.98336c-0.70656-1.30048-1.4336-3.65568-2.17088-7.0656h-0.28672a48.9472 48.9472 0 0 1-2.51904 7.2704L171.5712 552.96h-27.648l34.78528-54.25152-31.77472-54.1696h28.13952l16.16896 33.1776c1.30048 2.70336 2.42688 5.6832 3.35872 8.94976h0.27648c0.98304-2.93888 2.17088-6.0416 3.57376-9.30816l17.84832-32.82944h25.83552l-32.768 53.76L242.97472 552.96z m76.92288 0h-63.63136V444.52864h23.10144v89.52832h40.52992V552.96z m9.79968-27.29984c8.72448 7.22944 18.6368 10.8544 29.75744 10.8544 6.2976 0 11.02848-1.08544 14.20288-3.25632 3.1744-2.17088 4.7616-4.9664 4.7616-8.36608 0-2.93888-1.25952-5.71392-3.7888-8.33536-2.5088-2.6112-9.1648-6.15424-19.93728-10.63936-16.9472-7.18848-25.41568-17.63328-25.41568-31.35488 0-10.0864 3.84-17.92 11.52-23.49056s17.83808-8.36608 30.48448-8.36608c10.58816 0 19.47648 1.3824 26.66496 4.13696v21.69856c-7.2704-4.94592-15.79008-7.424-25.5488-7.424-5.69344 0-10.24 1.04448-13.64992 3.11296-3.40992 2.07872-5.10976 4.87424-5.10976 8.36608 0 2.80576 1.16736 5.38624 3.50208 7.74144 2.33472 2.3552 8.0896 5.5296 17.28512 9.55392 10.78272 4.61824 18.19648 9.49248 22.2208 14.63296 4.0448 5.12 6.06208 11.24352 6.06208 18.3296 0 10.41408-3.6864 18.35008-11.0592 23.808-7.3728 5.45792-17.84832 8.192-31.4368 8.192-12.41088 0-22.5792-2.00704-30.5152-6.02112v-23.17312zM507.98592 552.96h-27.4432l-19.456-35.98336c-0.69632-1.30048-1.42336-3.65568-2.17088-7.0656h-0.27648a48.9472 48.9472 0 0 1-2.51904 7.2704L436.59264 552.96h-27.648l34.78528-54.25152-31.78496-54.1696h28.14976l16.16896 33.1776c1.30048 2.70336 2.42688 5.6832 3.35872 8.94976h0.27648c0.98304-2.93888 2.17088-6.0416 3.57376-9.30816l17.84832-32.82944h25.82528l-32.75776 53.76L507.98592 552.96z" fill="#FFFFFF" p-id="55477"></path></svg>`,
    cat,
  );

  Icon.add(
    'xml',
    `<svg t="1609747906986" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="56577" width="1em" height="1em"><path d="M218.792 147.808v504h608v-360l-160-160h-432a16 16 0 0 0-16 16z" fill="#CBE5CA" p-id="56578"></path><path d="M864.632 891.144H177.76a40.56 40.56 0 0 1-40.56-40.56V651.712c0-22.4 18.16-40.56 40.56-40.56h686.872c22.4 0 40.56 18.16 40.56 40.56v198.872a40.552 40.552 0 0 1-40.56 40.56z" fill="#42A048" p-id="56579"></path><path d="M682.792 291.808h144l-160-160v144a16 16 0 0 0 16 16z" fill="#A5D4A6" p-id="56580"></path><path d="M346 381.48h368v28h-368zM346 493.48h368v28h-368z" fill="#42A048" p-id="56581"></path><path d="M329.2 773.648l-44 70h-43l65-96-61-89H295.2l38 63 40-63h42l-61 89 65 96h-49l-41-70zM609.2 684.648l-52 159h-33L475.2 684.648l-1 1v158H437.2V658.648h65l39 135h1l42-135h62v185H609.2V684.648zM800.2 843.648H681.2V658.648h39v154h80v31z" fill="#E7F3E3" p-id="56582"></path></svg>`,
    cat,
  );

  Icon.add(
    'zip',
    `<svg t="1609746286340" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="33317" width="1em" height="1em"><path d="M107.789474 0h808.421052a107.789474 107.789474 0 0 1 107.789474 107.789474v231.747368H0V107.789474a107.789474 107.789474 0 0 1 107.789474-107.789474z" fill="#F98882" p-id="33318"></path><path d="M0 684.463158h1024V916.210526a107.789474 107.789474 0 0 1-107.789474 107.789474H107.789474a107.789474 107.789474 0 0 1-107.789474-107.789474v-231.747368z" fill="#A2D85B" p-id="33319"></path><path d="M0 340.884211h1024v342.231578H0z" fill="#5DDFED" p-id="33320"></path><path d="M404.210526 0h215.578948v1024h-215.578948z" fill="#F4B962" p-id="33321"></path><path d="M711.410526 460.8v102.4H312.589474v-102.4h398.821052m43.11579-43.115789H269.473684v188.631578h485.052632v-188.631578z" fill="#FFFFFF" p-id="33322"></path></svg>`,
    cat,
  );

  Icon.add(
    'gz',
    `<svg t="1610004628117" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1945" width="1em" height="1em"><path d="M698.944 164.864V14.976l-4.032-4.288H184.576a75.136 75.136 0 0 0-72.96 77.184v848.256a75.264 75.264 0 0 0 72.96 77.184h656.256a75.136 75.136 0 0 0 72.896-77.184V242.048h-141.824a75.264 75.264 0 0 1-72.96-77.184z" fill="#2ABE84" opacity=".2" p-id="1946"></path><path d="M914.432 242.048h-145.92a75.264 75.264 0 0 1-72.96-77.184V10.688l109.568 115.776 109.312 115.584z" fill="#2ABE84" opacity=".1" p-id="1947"></path><path d="M426.176 464.384v401.088h168.96V464.384h-168.96zM574.08 601.472h-63.424v42.112h63.424v42.368h-63.424v42.112h63.424v42.368h-63.424v42.368h-63.424v-42.368h63.424v-42.368h-63.424v-42.112h63.424v-42.368h-63.424v-42.112h63.424V559.36h-63.424v-42.368h63.424v42.368h63.424v42.112zM771.264 242.048a75.264 75.264 0 0 1-72.96-77.184V14.976l-4.032-4.288H183.936a75.136 75.136 0 0 0-72.96 77.184v231.36h802.112V242.048h-141.824z m-369.408-12.992c-10.176 10.688-27.776 18.496-49.344 18.496-41.92 0-71.68-30.656-71.68-82.432 0-51.52 30.848-82.816 73.024-82.816 22.144 0 36.736 9.984 45.824 19.776l-10.816 13.12a44.736 44.736 0 0 0-34.624-15.232c-31.936 0-52.8 24.768-52.8 64.576 0 40.192 18.944 65.408 52.992 65.408 11.52 0 22.592-3.52 28.928-9.344v-41.728h-33.728v-16.704h52.16v66.88z m136.768 15.68H428.864v-11.968l84.096-130.432H436.48v-16.896h101.248v11.712L453.632 227.584h84.992v17.152z" fill="#2ABE84" p-id="1948"></path></svg>`,
    cat,
  );

  Icon.add(
    'file-error',
    `<svg t="1609815861438" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2630" width="1em" height="1em"><path d="M960.002941 320.008822H576.004901V0h63.989218v256.003921H960.002941v64.004901zM339.197745 678.411175l300.796374-300.812057 44.808136 44.808136-300.796374 300.796373-44.808136-44.792452z" p-id="2631" fill="#f03e3e"></path><path d="M339.197745 422.407254l44.808136-44.808136 300.796374 300.812057-44.808136 44.792452-300.796374-300.796373z" p-id="2632" fill="#f03e3e"></path><path d="M870.355302 1024h-716.741971A89.616272 89.616272 0 0 1 64.012743 934.399412V89.600588A89.616272 89.616272 0 0 1 153.613331 0h486.380788l319.946087 249.604999v684.794413a89.616272 89.616272 0 0 1-89.584904 89.600588z m-716.741971-959.995099c-19.196765 0-25.595687 12.797844-25.595687 25.595687v844.798824a25.595687 25.595687 0 0 0 25.595687 25.61137h716.741971c19.196765 0 25.595687-12.797844 25.595687-25.595687V275.200686L620.797353 64.004901z" p-id="2633" fill="#f03e3e"></path></svg>`,
    cat,
  );

  class Caption extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        title: '',
        subtitle: '',
        icon: null,
        image: null,
        titleLevel: 5,
      };

      const tagProp = props.href ? { tag: 'a' } : {};

      super(Component.extendProps(defaults, props, tagProp), ...mixins);
    }

    _config() {
      this._addPropStyle('subtitleWrap');
      const { title, subtitle, icon, image, href, titleLevel } = this.props;
      const children = [];
      if (isPlainObject(image)) {
        children.push(Component.extendProps({ tag: 'img', classes: { 'nom-caption-image': true } }, image));
      }
      else if (isString(image)) {
        children.push({ tag: 'img', classes: { 'nom-caption-image': true }, attrs: { src: image } });
      }
      else if (icon) {
        children.push(Component.extendProps({ classes: { 'nom-caption-icon': true } }, Component.normalizeIconProps(icon)));
      }
      const titleTag = `h${titleLevel}`;
      children.push({
        tag: titleTag,
        classes: {
          'nom-caption-title': true,
        },
        children: [title, subtitle && { tag: 'small', children: subtitle }],
      });
      if (href) {
        this.setProps({ attrs: { href: href } });
      }
      this.setProps({
        children: children,
      });
    }
  }

  Component.register(Caption);

  class Col extends Component {
    // constructor(props, ...mixins) {
    //   super(props, ...mixins)
    // }
  }

  Component.register(Col);

  class Cols extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        wrap: false,
        items: [],
        itemDefaults: null,
        gutter: 'md',
        childDefaults: {
          component: Col
        },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this._propStyleClasses = ['gutter', 'align', 'justify', 'fills', 'inline'];
      const { items } = this.props;
      const children = [];
      if (Array.isArray(items) && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          let item = items[i];
          if (isString(item)) {
            item = {
              children: item,
            };
          }
          item = Component.extendProps({}, this.props.itemDefaults, item);
          children.push({ component: Col, children: item });
        }

        this.setProps({
          children: children,
        });
      }
    }
  }

  Component.register(Cols);

  class PanelHeaderCaption extends Component {
    // constructor(props, ...mixins) {
    //   super(props, ...mixins)
    // }
  }

  Component.register(PanelHeaderCaption);

  class PanelHeaderNav extends Component {
    // constructor(props, ...mixins) {
    //     super(props, ...mixins)
    // }
  }

  Component.register(PanelHeaderNav);

  class PanelHeaderTools extends Component {
    // constructor(props, ...mixins) {
    //     super(props, ...mixins)
    // }
  }

  Component.register(PanelHeaderTools);

  class PanelHeader extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        caption: null,
        nav: null,
        tools: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    config() {
      const { caption, nav, tools } = this.props;
      let toolsProps;
      const captionProps = caption ? Component.extendProps({ component: Caption }, caption) : null;
      const navProps = nav ? Component.extendProps({ component: Cols }, nav) : null;
      if (Array.isArray(tools)) {
        toolsProps = { component: Cols, items: tools };
      } else if (isPlainObject(tools)) {
        toolsProps = Component.extendProps({ component: Cols }, tools);
      }

      this.setProps({
        children: [
          captionProps && { component: PanelHeaderCaption, children: captionProps },
          navProps && { component: PanelHeaderNav, children: navProps },
          toolsProps && { component: PanelHeaderTools, children: toolsProps },
        ],
      });
    }
  }

  Component.register(PanelHeader);

  class Panel extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        header: null,
        body: null,
        footer: null,
        uistyle: 'default', // splitline,outline,card,bordered,plain
        startAddons: [],
        endAddons: [],
        fit: false
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this._addPropStyle('fit');

      const { header, body, footer, startAddons, endAddons } = this.props;
      let footerProps;
      const headerProps =
        header !== false && Component.extendProps({ component: PanelHeader }, header);
      const bodyProps = Component.extendProps({ component: PanelBody }, body);
      if (footer) {
        footerProps = Component.extendProps({ component: PanelFooter }, footer);
      }

      this.setProps({
        children: [headerProps, ...startAddons, bodyProps, ...endAddons, footerProps],
      });
    }
  }

  Component.register(Panel);

  Object.defineProperty(Component.prototype, '$modal', {
    get: function () {
      let cur = this;
      while (cur) {
        if (cur.__isModalContent === true) {
          return cur.modal
        }

        cur = cur.parent;
      }
      return cur.modal
    },
  });

  var ModalContentMixin = {
    _created: function () {
      this.modal = this.parent.modal;
      this.__isModalContent = true;
    },

    _config: function () {
      this.setProps({
        classes: {
          'nom-modal-content': true,
        },
      });
    },
  };

  class ModalDialog extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        children: { component: Panel },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      const modal = (this.modal = this.parent);
      const { content } = this.modal.props;
      if (isString(content)) {
        require([content], (contentConfig) => {
          let props = contentConfig;
          if (isFunction$1(props)) {
            props = contentConfig.call(this, modal);
          }
          props = Component.extendProps(this._getDefaultPanelContent(props), props);
          this.update({
            children: n(null, props, null, [ModalContentMixin]),
          });
        });
      }
    }

    _getDefaultPanelContent(contentProps) {
      const modal = this.modal;
      modal.setProps({
        okText: contentProps.okText,
        onOk: contentProps.onOk,
        cancelText: contentProps.cancelText,
        onCancel: contentProps.onCancel,
      });

      const { okText, cancelText } = modal.props;

      return {
        component: Panel,
        header: {
          nav: {},
          tools: [
            {
              component: 'Button',
              icon: 'close',
              styles: {
                border: 'none',
              },
              onClick: function () {
                modal.close();
              },
            },
          ],
        },
        footer: {
          children: {
            component: 'Cols',
            items: [
              {
                component: 'Button',
                styles: {
                  color: 'primary',
                },
                text: okText,
                onClick: () => {
                  modal._handleOk();
                },
              },
              {
                component: 'Button',
                text: cancelText,
                onClick: () => {
                  modal._handleCancel();
                },
              },
            ],
          },
        },
      }
    }

    _config() {
      const { content } = this.modal.props;
      if (isPlainObject(content)) {
        const contentProps = Component.extendProps(this._getDefaultPanelContent(content), content);
        this.setProps({
          children: n(null, contentProps, null, [ModalContentMixin]),
        });
      }
    }
  }

  Component.register(ModalDialog);

  class Modal extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        content: {},
        closeOnClickOutside: false,
        okText: '确 定',
        cancelText: '取 消',
        onOk: (e) => {
          e.sender.close();
        },
        onCancel: (e) => {
          e.sender.close();
        }
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this._scoped = true;
      this.bodyElem = document.body;
    }

    _config() {
      this.setProps({
        children: {
          component: ModalDialog,
        },
      });
    }

    _show() {
      this.setzIndex();
      this.checkScrollbar();
      this.setScrollbar();
    }

    close(result) {
      const that = this;

      if (!this.rendered) {
        return
      }

      if (this.element === undefined) {
        return
      }

      if (result !== undefined) {
        that.returnValue = result;
      }

      let { modalCount } = this.bodyElem;
      if (modalCount) {
        modalCount--;
        this.bodyElem.modalCount = modalCount;
        if (modalCount === 0) {
          this.resetScrollbar();
        }
      }

      this._callHandler(this.props.onClose, { result: result });
      this.remove();
    }

    setzIndex() {
      this.element.style.zIndex = getzIndex();
    }

    checkScrollbar() {
      const fullWindowWidth = window.innerWidth;
      this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
      this.scrollbarWidth = positionTool.scrollbarWidth();
    }

    setScrollbar() {
      /* var bodyPad = parseInt((this.bodyElem.css('padding-right') || 0), 10);
          this.originalBodyPad = document.body.style.paddingRight || '';
          this.originalBodyOverflow = document.body.style.overflow || '';
          if (this.bodyIsOverflowing) {
              this.bodyElem.css('padding-right', bodyPad + this.scrollbarWidth);
          }
          this.bodyElem.css("overflow", "hidden");
          var modalCount = this.bodyElem.data('modalCount');
          if (modalCount) {
              modalCount++;
              this.bodyElem.data('modalCount', modalCount);
          }
          else {
              this.bodyElem.data('modalCount', 1);
          } */
    }

    resetScrollbar() {
      /* this.bodyElem.css('padding-right', this.originalBodyPad);
          this.bodyElem.css('overflow', this.originalBodyOverflow);
          this.bodyElem.removeData('modalCount'); */
    }

    _handleOk() {
      this._callHandler(this.props.onOk);
    }

    _handleCancel() {
      this._callHandler(this.props.onCancel);
    }
  }

  Component.register(Modal);

  class Button extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'button',
        text: null,
        icon: null,
        rightIcon: null,
        type: null, // null(default) primary,dashed,text,link
        ghost: false,
        danger: false,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this._propStyleClasses = ['type', 'ghost', 'size', 'shape', 'danger', 'block'];
      const { icon, text, rightIcon, href, target } = this.props;

      if (icon || rightIcon) {
        this.setProps({
          classes: {
            'p-with-icon': true,
          },
        });

        if (!text) {
          this.setProps({
            classes: {
              'p-only-icon': true,
            },
          });
        }
      }

      this.setProps({
        children: [
          Component.normalizeIconProps(icon),
          text && { tag: 'span', children: text },
          Component.normalizeIconProps(rightIcon),
        ],
      });

      if (href) {
        this.setProps({
          tag: 'a',
          attrs: {
            href: href,
            target: target || '_self',
          },
        });
      }
    }

    _disable() {
      this.element.setAttribute('disabled', 'disabled');
    }

    _enable() {
      this.element.removeAttribute('disabled');
    }
  }

  Component.register(Button);

  class AlertContent extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        title: null,
        description: null,
        icon: null,
        type: null,
        okText: null,
      };
      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const { title, description, type, okText, action } = this.props;
      let { icon } = this.props;

      const alertInst = this.modal;

      const iconMap = {
        info: 'info-circle',
        success: 'check-circle',
        error: 'close-circle',
        warning: 'exclamation-circle',
      };

      icon = icon || iconMap[type];

      const iconProps = icon
        ? Component.extendProps(Component.normalizeIconProps(icon), {
          classes: { 'nom-alert-icon': true },
        })
        : null;

      const titleProps = title
        ? Component.extendProps(Component.normalizeTemplateProps(title), {
          classes: { 'nom-alert-title': true },
        })
        : null;

      const descriptionProps = description
        ? Component.extendProps(Component.normalizeTemplateProps(description), {
          classes: { 'nom-alert-description': true },
        })
        : null;

      const okButtonProps = {
        component: Button,
        styles: {
          color: 'primary'
        },
        text: okText,
        onClick: () => {
          alertInst._handleOk();
        }
      };

      let actionProps = {
        component: Cols,
        justify: 'end',
      };
      if (!action) {
        actionProps.items = [okButtonProps];
      }
      else if (isPlainObject(action)) {
        actionProps = Component.extendProps(actionProps, action);
      }
      else if (Array.isArray(action)) {
        actionProps.items = action;
      }

      this.setProps({
        children: [
          {
            classes: {
              'nom-alert-body': true,
            },
            children: [
              {
                classes: {
                  'nom-alert-body-icon': true
                },
                children: iconProps
              },
              {
                classes: {
                  'nom-alert-body-content': true,
                },
                children: [titleProps, descriptionProps],
              },
            ],
          },
          {
            classes: {
              'nom-alert-actions': true,
            },
            children: actionProps,
          },
        ],
      });
    }
  }

  Component.register(AlertContent);

  class Alert extends Modal {
    constructor(props, ...mixins) {
      const defaults = {
        type: 'default',
        icon: null,
        title: null,
        description: null,
        okText: '知道了',
        onOk: (e) => {
          e.sender.close();
        },
        action: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const { type, icon, title, description, okText, action } = this.props;
      this.setProps({
        content: {
          component: AlertContent,
          type,
          icon,
          title,
          description,
          okText,
          action,
        },
      });

      super._config();
    }
  }

  Component.register(Alert);

  class Route {
    constructor(defaultPath) {
      const that = this;

      this.hash = window.location.hash;
      if (!this.hash) {
        this.hash = `#${defaultPath}`;
      }
      this.path = this.hash.substring(1);
      this.paths = [null, null, null];
      this.query = {};
      this.queryStr = '';
      const queryIndex = this.hash.indexOf('?');

      if (this.hash.length > 1) {
        if (queryIndex > -1) {
          this.path = this.hash.substring(1, queryIndex);

          const paramStr = (this.queryStr = this.hash.substring(queryIndex + 1));
          const paramArr = paramStr.split('&');

          paramArr.forEach(function (e) {
            const item = e.split('=');
            const key = item[0];
            const val = item[1];
            if (key !== '') {
              that.query[key] = decodeURIComponent(val);
            }
          });
        }
      }

      const pathArr = this.path.split('!');

      this.maxLevel = pathArr.length - 1;

      pathArr.forEach(function (path, index) {
        that.paths[index] = path;
      });
    }
  }

  class Router extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        defaultPath: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.currentView = null;
      this.path = null;
      this.level = this.$app.lastLevel;
      this.$app.routers[this.level] = this;
      this.handleHashChange = this.handleHashChange.bind(this);
      this.$app.on('hashChange', this.handleHashChange, this);
    }

    render() {
      this._mountElement();
      this.routeView();
      this.$app.lastLevel++;
    }

    handleHashChange(changed) {
      this._callHandler(this.props.onHashChange); // 可以在这里做路由变更前处理

      if (changed.queryChanged && (changed.changedLevel === null || this.level < changed.changedLevel)) {
        this._callHandler(this.props.onQueryChange);
      }

      if (changed.changedLevel === null) {
        return
      }

      if (this.level > changed.changedLevel) {
        this.remove();
      }
      else if (this.level === changed.changedLevel) {
        this.routeView();
        this.$app.lastLevel = this.level + 1;
      }
      else if (this.level === changed.changedLevel - 1) {
        this._callHandler(this.props.onSubpathChange);
      }
    }

    getSubpath() {
      let subpath = null;
      const { paths } = this.$app.currentRoute;
      if (this.level < paths.length) {
        subpath = paths[this.level + 1];
      }

      return subpath
    }

    _removeCore() {
    }

    remove() {
      this.$app.off('hashChange', this.handleHashChange);
      delete this.$app.routers[this.level];
      for (const p in this) {
        if (this.hasOwnProperty(p)) {
          delete this[p];
        }
      }
    }

    routeView() {
      const level = this.level;
      const element = this.element;
      const defaultPath = this.props.defaultPath;
      const { paths } = this.$app.currentRoute;
      const that = this;

      if (defaultPath) {
        if (!paths[level]) {
          paths[level] = defaultPath;
        }
      }

      let url = this.getRouteUrl(level);
      url = `${pathCombine(this.$app.props.viewsDir, url)}.js`;

      require([url], (viewPropsOrRouterPropsFunc) => {
        let routerProps = {};
        if (isFunction$1(viewPropsOrRouterPropsFunc)) {
          routerProps = viewPropsOrRouterPropsFunc.call(this);
        }
        else {
          routerProps.view = viewPropsOrRouterPropsFunc;
        }
        if (isString(routerProps.title)) {
          document.title = routerProps.title;
        }
        const extOptions = {
          reference: element,
          placement: 'replace',
        };
        const viewOptions = Component.extendProps(routerProps.view, extOptions);
        this.currentView = Component.create(viewOptions, {
          _rendered: function () {
            that.element = this.element;
          }
        });
        this.setProps(routerProps);
        this._callRendered();
      });
    }

    getRouteUrl(level) {
      const paths = this.$app.currentRoute.paths;
      const maxLevel = this.$app.currentRoute.maxLevel;
      let path = paths[level];

      if (level < maxLevel) {
        path = pathCombine(path, '_layout');
      }

      path = prefix(path, level);

      function prefix(patharg, levelarg) {
        if (levelarg === 0) {
          return patharg
        }
        if (patharg[0] !== '/') {
          patharg = pathCombine(paths[levelarg - 1], patharg);
          return prefix(patharg, levelarg - 1)
        }

        return patharg
      }

      return path
    }
  }

  Component.register(Router);

  /* eslint-disable no-shadow */

  class App extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'body',
        placement: 'replace',
        defaultPath: '!',
        viewsDir: '/',
        isFixedLayout: true,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.lastLevel = 0;
      this.previousRoute = null;
      this.currentRoute = new Route(this.props.defaultPath);

      this.routers = {};

      Object.defineProperty(Component.prototype, '$app', {
        get: function () {
          return this.root
        },
      });

      Object.defineProperty(Component.prototype, '$route', {
        get: function () {
          return this.$app.currentRoute
        },
      });
    }

    _config() {
      this.setProps({
        children: { component: Router },
      });

      if (this.props.isFixedLayout === true) {
        document.documentElement.setAttribute('class', 'app');
      }
    }

    _rendered() {
      const that = this;
      window.addEventListener('hashchange', function () {
        that.handleRoute();
      });
    }

    handleRoute() {
      const route = new Route(this.props.defaultPath);
      console.info(JSON.stringify(route));

      let changedLevel = null;
      let queryChanged = false;

      this.previousRoute = this.currentRoute;
      this.currentRoute = route;

      if (this.previousRoute !== null) {
        const currentRoutePaths = this.currentRoute.paths;
        const previousRoutePaths = this.previousRoute.paths;

        const length = Math.min(previousRoutePaths.length, currentRoutePaths.length);
        for (let i = 0; i < length; i++) {
          if (previousRoutePaths[i] !== currentRoutePaths[i]) {
            changedLevel = i;
            break
          }
        }
        if ((this.previousRoute.queryStr || '') !== this.currentRoute.queryStr) {
          queryChanged = true;
        }
      }

      this.trigger('hashChange', { changedLevel, queryChanged });
    }
  }

  Component.register(App);

  class Avatar extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'span',
        size: 'default',
        alt: '图片',
        gap: 4, // 字符类型距离左右两侧边界单位像素
        text: null, // 文本
        icon: null, // 图标
        src: null, // 图片地址
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const { text, icon, src, alt } = this.props;
      this._propStyleClasses = ['size'];
      if (src) {
        this.setProps({
          classes: {
            'avatar-image': true,
          },
          children: [
            {
              tag: 'img',
              attrs: {
                src,
                alt,
              },
            },
          ],
        });
      } else if (icon) {
        this.setProps({
          children: [Component.normalizeIconProps(icon)],
        });
      } else {
        this.setProps({
          children: [text && { tag: 'span', classes: { 'nom-avatar-string': true }, children: text }],
        });
      }
    }

    _setScale() {
      const { gap, src, icon } = this.props;
      if (src || icon) {
        return
      }

      const childrenWidth = this.element.lastChild.offsetWidth;
      const nodeWidth = this.element.offsetWidth;
      if (childrenWidth !== 0 && nodeWidth !== 0) {
        if (gap * 2 < nodeWidth) {
          const scale =
            nodeWidth - gap * 2 < childrenWidth ? (nodeWidth - gap * 2) / childrenWidth : 1;
          const transformString = `scale(${scale}) translateX(-50%)`;
          const child = this.children[this.children.length - 1];
          child.update({
            attrs: {
              style: {
                '-ms-transform': transformString,
                '-webkit-transform': transformString,
                transform: transformString,
              },
            },
          });
        }
      }
    }

    _rendered() {
      this._setScale();
    }
  }

  Component.register(Avatar);

  class AvatarGroup extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'div',
        size: 'default', // 通过设置 mode 可以改变时间轴和内容的相对位置 left | alternate | right
        maxCount: null, // 显示的最大头像个数
        maxPopoverPlacement: 'top', // 多余头像气泡弹出位置
        items: [], // 子元素项列表
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const { size, items, maxCount, maxPopoverPlacement, itemDefaults } = this.props;

      // 赋size值
      const avatars = items.map((item) => {
        return {
          component: Avatar,
          size,
          ...itemDefaults,
          ...item,
        }
      });
      const numOfChildren = avatars.length;
      if (maxCount && maxCount < numOfChildren) {
        const childrenShow = avatars.slice(0, maxCount);
        const childrenHidden = avatars.slice(maxCount, numOfChildren);
        childrenShow.push({
          component: Avatar,
          text: `+${numOfChildren - maxCount}`,
          size,
          ...itemDefaults,
          popup: {
            triggerAction: 'hover',
            align: maxPopoverPlacement,
            children: childrenHidden,
            attrs: {
              style: {
                padding: '8px 12px',
              },
            },
          },
        });
        this.setProps({
          children: childrenShow,
        });
      } else {
        this.setProps({
          children: avatars,
        });
      }
    }
  }

  Component.register(AvatarGroup);

  class Badge extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        key: null,
        tag: 'span',
        type: 'round',
        text: null,
        icon: null,
        number: null,
        overflowCount: 99,
        size: 'xs',
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this._propStyleClasses = ['size', 'color'];
      const { icon, text, type, number, overflowCount } = this.props;

      if (icon) {
        this.setProps({
          classes: {
            'p-with-icon': true,
          },
        });
      }

      if (type === 'round') {
        this.setProps({
          classes: {
            'u-shape-round': true,
          },
        });
      } else if (type === 'dot') {
        if (number > 0) {
          this.setProps({
            classes: {
              'p-with-number': true,
            },
          });
        }
      }

      this.setProps({
        children: [
          Component.normalizeIconProps(icon),
          text && { tag: 'span', children: text },
          number && { tag: 'span', children: number > overflowCount ? `${overflowCount}+` : number },
        ],
      });
    }

    _disable() {
      this.element.setAttribute('disabled', 'disabled');
    }
  }

  Component.mixin({
    _config: function () {
      if (this.props.badge) {
        this.setProps({
          classes: {
            's-with-badge': true,
          },
        });
      }
    },
    _rendered: function () {
      if (this.props.badge) {
        const badgeProps = {
          type: 'dot',
        };
        badgeProps.number = this.props.badge.number ? this.props.badge.number : null;
        badgeProps.overflowCount = this.props.badge.overflowCount
          ? this.props.badge.overflowCount
          : 99;
        badgeProps.styles = this.props.badge.styles ? this.props.badge.styles : { color: 'danger' };
        this.props.badge = badgeProps;
        this.badge = new Badge(Component.extendProps({ reference: this }, this.props.badge));
      }
    },
  });

  Component.register(Badge);

  class LayerBackdrop extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        zIndex: 2,
        attrs: {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            userSelect: 'none',
            opacity: 0.1,
            background: '#000',
          },
        },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this.setProps({
        attrs: {
          style: {
            zIndex: this.props.zIndex,
          },
        },
      });

      if (this.referenceElement === document.body) {
        this.setProps({
          attrs: {
            style: {
              position: 'fixed',
            },
          },
        });
      }
    }
  }

  Component.register(LayerBackdrop);

  class Layer extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        align: null,
        alignTo: null,
        alignOuter: false,
        within: window,
        collision: 'flipfit',
        onClose: null,
        onHide: null,
        onShown: null,

        closeOnClickOutside: false,
        closeToRemove: false,

        position: null,

        hidden: false,

        backdrop: false,
        closeOnClickBackdrop: false,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.relativeElements = [];
      this._onDocumentMousedown = this._onDocumentMousedown.bind(this);
      this._onWindowResize = this._onWindowResize.bind(this);
    }

    _config() {
      if (this.props.placement === 'replace') {
        this.props.position = null;
      }
      this._normalizePosition();
      this._zIndex = getzIndex();
      this.setProps({
        attrs: {
          style: {
            zIndex: this._zIndex,
          },
        },
      });
      if (this.props.align || this.props.position) {
        this.setProps({
          attrs: {
            style: {
              position: this.props.fixed ? 'fixed' : 'absolute',
              left: 0,
              top: 0,
            },
          },
        });
      }
    }

    _rendered() {
      const that = this;

      this.addRel(this.element);
      if (this.props.backdrop) {
        this.backdrop = new LayerBackdrop({
          zIndex: this._zIndex - 1,
          reference: this.props.reference,
        });

        if (this.props.closeOnClickBackdrop) {
          this.backdrop._on('click', function (e) {
            if (e.target !== e.currentTarget) {
              return
            }
            that.remove();
          });
        }
      }
    }

    _show() {
      const { props } = this;

      this.setPosition();
      this._docClickHandler();

      if (props.align) {
        window.removeEventListener('resize', this._onWindowResize, false);
        window.addEventListener('resize', this._onWindowResize, false);
      }
      this.props.onShown && this._callHandler(this.props.onShown);
    }

    _hide(forceRemove) {
      window.removeEventListener('resize', this._onWindowResize, false);
      document.removeEventListener('mousedown', this._onDocumentMousedown, false);

      if (forceRemove === true || this.props.closeToRemove) {
        this.props.onClose && this._callHandler(this.props.onClose);
        this.remove();
      } else {
        this.props.onHide && this._callHandler(this.props.onHide);
      }
    }

    _remove() {
      window.removeEventListener('resize', this._onWindowResize, false);
      document.removeEventListener('mousedown', this._onDocumentMousedown, false);

      if (this.backdrop) {
        this.backdrop.remove();
      }
    }

    _onWindowResize() {
      if (this.props.hidden === false) {
        this.setPosition();
      }
    }

    _onDocumentMousedown(e) {
      for (let i = 0; i < this.relativeElements.length; i++) {
        const el = this.relativeElements[i];
        if (el === e.target || el.contains(e.target)) {
          return
        }
      }

      const closestLayer = e.target.closest('.nom-layer');
      if (closestLayer !== null) {
        const idx = closestLayer.component._zIndex;
        if (idx < this._zIndex) {
          this.hide();
        }
      } else {
        this.hide();
      }
    }

    setPosition() {
      if (this.props.position) {
        position(this.element, this.props.position);
      }
    }

    addRel(elem) {
      this.relativeElements.push(elem);
    }

    _docClickHandler() {
      const that = this;
      if (that.props.closeOnClickOutside) {
        document.addEventListener('mousedown', this._onDocumentMousedown, false);
      }
    }

    _normalizePosition() {
      const { props } = this;

      if (props.align) {
        props.position = {
          of: window,
          collision: props.collision,
          within: props.within,
        };

        if (props.alignTo) {
          props.position.of = props.alignTo;
        }

        if (props.alignTo && props.alignOuter === true) {
          const arr = props.align.split(' ');
          if (arr.length === 1) {
            arr[1] = 'center';
          }

          const myArr = ['center', 'center'];
          const atArr = ['center', 'center'];

          if (arr[1] === 'left') {
            myArr[0] = 'left';
            atArr[0] = 'left';
          } else if (arr[1] === 'right') {
            myArr[0] = 'right';
            atArr[0] = 'right';
          } else if (arr[1] === 'top') {
            myArr[1] = 'top';
            atArr[1] = 'top';
          } else if (arr[1] === 'bottom') {
            myArr[1] = 'bottom';
            atArr[1] = 'bottom';
          }

          if (arr[0] === 'top') {
            myArr[1] = 'bottom';
            atArr[1] = 'top';
          } else if (arr[0] === 'bottom') {
            myArr[1] = 'top';
            atArr[1] = 'bottom';
          } else if (arr[0] === 'left') {
            myArr[0] = 'right';
            atArr[0] = 'left';
          } else if (arr[0] === 'right') {
            myArr[0] = 'left';
            atArr[0] = 'right';
          }

          props.position.my = `${myArr[0]} ${myArr[1]}`;
          props.position.at = `${atArr[0]} ${atArr[1]}`;
        } else {
          const rhorizontal = /left|center|right/;
          const rvertical = /top|center|bottom/;
          let pos = props.align.split(' ');
          if (pos.length === 1) {
            pos = rhorizontal.test(pos[0])
              ? pos.concat(['center'])
              : rvertical.test(pos[0])
              ? ['center'].concat(pos)
              : ['center', 'center'];
          }
          pos[0] = rhorizontal.test(pos[0]) ? pos[0] : 'center';
          pos[1] = rvertical.test(pos[1]) ? pos[1] : 'center';

          props.position.my = `${pos[0]} ${pos[1]}`;
          props.position.at = `${pos[0]} ${pos[1]}`;
        }
      }
    }
  }

  Component.register(Layer);

  class Tooltip extends Layer {
    constructor(props, ...mixins) {
      const defaults = {
        trigger: null,
        align: 'top',
        alignOuter: true,

        closeOnClickOutside: true,

        autoRender: false,
        hidden: false,

        styles: {
          color: 'black',
        },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();

      this._showHandler = this._showHandler.bind(this);
      this._hideHandler = this._hideHandler.bind(this);
      this._onOpenerFocusinHandler = this._onOpenerFocusinHandler.bind(this);
      this._onOpenerFocusoutHandler = this._onOpenerFocusoutHandler.bind(this);

      this._openerFocusing = false;
      this.opener = this.props.trigger;
      this.props.alignTo = this.opener.element;
      this.showTimer = null;
      this.hideTimer = null;
      this.delay = 100;
      this.addRel(this.opener.element);
      this._bindHover();
    }

    _remove() {
      this.opener._off('mouseenter', this._showHandler);
      this.opener._off('mouseleave', this._hideHandler);
      this.opener._off('focusin', this._onOpenerFocusinHandler);
      this.opener._off('focusout', this._onOpenerFocusoutHandler);

      this._off('mouseenter');
      this._off('mouseleave');
      clearTimeout(this.showTimer);
      this.showTimer = null;
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
      super._remove();
    }

    _bindHover() {
      this.opener._on('mouseenter', this._showHandler);
      this.opener._on('mouseleave', this._hideHandler);
      this.opener._on('focusin', this._onOpenerFocusinHandler);
      this.opener._on('focusout', this._onOpenerFocusoutHandler);
    }

    _onOpenerFocusinHandler() {
      this._openerFocusing = true;
      this._showHandler();
    }

    _onOpenerFocusoutHandler() {
      this._openerFocusing = false;
      this._hideHandler();
    }

    _showHandler() {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
      this.showTimer = setTimeout(() => {
        this.show();
      }, this.delay);
    }

    _hideHandler() {
      if (this._openerFocusing === true) {
        return
      }
      clearTimeout(this.showTimer);
      this.showTimer = null;

      if (this.props.hidden === false) {
        this.hideTimer = setTimeout(() => {
          this.hide();
        }, this.delay);
      }
    }

    _show() {
      super._show();
      this._off('mouseenter');
      this._on('mouseenter', function () {
        clearTimeout(this.hideTimer);
      });
      this._off('mouseleave', this._hideHandler);
      this._on('mouseleave', this._hideHandler);
    }
  }

  Component.mixin({
    _rendered: function () {
      if (this.props.tooltip) {
        if (isString(this.props.tooltip)) {
          this.tooltip = new Tooltip({ trigger: this, children: this.props.tooltip });
        } else {
          this.tooltip = new Tooltip(Component.extendProps({}, this.props.tooltip), {
            trigger: this,
          });
        }
      }
    },
  });

  Component.register(Tooltip);

  /* eslint-disable no-useless-escape */

  const RuleManager = {};
  RuleManager.ruleTypes = {
    required: {
      validate: function (value) {
        return !isEmpty(value)
      },
      message: '必填',
    },
    number: {
      validate: function (value) {
        return !isEmpty(value) ? /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value) : true
      },
      message: '请输入有效的数字',
    },
    digits: {
      validate: function (value) {
        return !isEmpty(value) ? /^\d+$/.test(value) : true
      },
      message: '只能输入数字',
    },
    regex: {
      validate: function (value, ruleValue) {
        return !isEmpty(value)
          ? new RegExp(ruleValue.pattern, ruleValue.attributes).test(value)
          : true
      },
    },
    email: {
      validate: function (value) {
        return !isEmpty(value)
          ? /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(
              value,
            )
          : true
      },
      message: '请输入有效的 Email 地址',
    },
    url: {
      validate: function (value) {
        return !isEmpty(value)
          ? /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(
              value,
            )
          : true
      },
      message: '请输入有效的 URL',
    },
    min: {
      validate: function (value, ruleValue) {
        return !isEmpty(value) ? Number(value) >= ruleValue : true
      },
      message: '输入值不能小于 {0}',
    },
    max: {
      validate: function (value, ruleValue) {
        return !isEmpty(value) ? Number(value) <= ruleValue : true
      },
      message: '输入值不能大于 {0}',
    },
    range: {
      validate: function (value, ruleValue) {
        return !isEmpty(value) ? Number(value) >= ruleValue[0] && Number(value) <= ruleValue[1] : true
      },
      message: '输入值必须介于 {0} 和 {1} 之间',
    },
    minlength: {
      validate: function (value, ruleValue) {
        if (!isEmpty(value)) {
          let length = 0;
          if (Array.isArray(value)) {
            length = value.length;
          } else {
            length = value.trim().length;
          }

          return length >= ruleValue
        }
        return true
      },
      message: '不能少于 {0} 个字',
    },
    maxlength: {
      validate: function (value, ruleValue) {
        if (!isEmpty(value)) {
          let length = 0;
          if (Array.isArray(value)) {
            length = value.length;
          } else {
            length = value.trim().length;
          }

          return length <= ruleValue
        }
        return true
      },
      message: '不能多于 {0} 个字',
    },
    rangelength: {
      validate: function (value, ruleValue) {
        if (!isEmpty(value)) {
          let length = 0;
          if (Array.isArray(value)) {
            length = value.length;
          } else {
            length = value.trim().length;
          }

          return ruleValue[0] <= length && length <= ruleValue[1]
        }
        return true
      },
      message: '输入字数在 {0} 个到 {1} 个之间',
    },
    remote: {
      validate: function (value, ruleValue) {
        const data = {};
        data[ruleValue[1]] = value;
        const response = $.ajax({
          url: ruleValue[0],
          dataType: 'json',
          data: data,
          async: false,
          cache: false,
          type: 'post',
        }).responseText;
        return response === 'true'
      },
      message: 'Please fix this field',
    },
    date: {
      validate: function () {
        return true
      },
      message: '请输入有效的日期格式.',
    },
    identifier: {
      validate: function (value) {
        return !isEmpty(value) ? /^[a-zA-Z][a-zA-Z0-9_]*$/.test(value) : true
      },
      message: '只能输入字母、数字、下划线且必须以字母开头',
    },
    phoneNumber: {
      validate: function (value) {
        return !isEmpty(value) ? /^1[3|4|5|7|8][0-9]{9}$/.test(value) : true
      },
      message: '请输入正确的手机号',
    },
    func: {
      validate: function (value, ruleValue) {
        if (!isEmpty(value) && isFunction$1(ruleValue)) {
          return ruleValue(value)
        }
        return true
      },
    },
  };

  RuleManager.validate = function (rules, controlValue) {
    for (let i = 0; i < rules.length; i++) {
      const checkResult = checkRule(rules[i], controlValue);
      if (checkResult !== true) {
        return checkResult
      }
    }

    return true
  };

  function isEmpty(val) {
    return val === undefined || val === null || val === '' || (Array.isArray(val) && !val.length)
  }

  function checkRule(ruleSettings, controlValue) {
    const rule = RuleManager.ruleTypes[ruleSettings.type];

    if (rule) {
      let ruleValue = ruleSettings.value || null;
      if (!rule.validate(controlValue, ruleValue)) {
        let message = ruleSettings.message || rule.message;
        if (ruleValue !== null) {
          if (!Array.isArray(ruleValue)) {
            ruleValue = [ruleValue];
          }
          for (let i = 0; i < ruleValue.length; i++) {
            message = message.replace(new RegExp(`\\{${i}\\}`, 'g'), ruleValue[i]);
          }
        }
        return message
      }
    }
    return true
  }

  var FieldActionMixin = {
      _created: function () {
          this.field = this.parent;
          this.field.action = this;
      }
  };

  var ControlMixin = {
      _created: function () {
          this.field = this.parent.field;
          this.field.control = this;
          this.form = this.field.form;
      }
  };

  var ControlActionMixin = {
      _created: function () {
          this.field = this.parent.field;
          this.field.controlAction = this;
      }
  };

  var ControlBeforeMixin = {
    _created: function () {
      this.field = this.parent.field;
      this.field.controlBefore = this;
    },
  };

  var ControlAfterMixin = {
      _created: function () {
          this.field = this.parent.field;
          this.field.controlAfter = this;
      }
  };

  class FieldContent extends Component {
    // eslint-disable-next-line no-useless-constructor
    constructor(props, ...mixins) {
      super(props, ...mixins);
    }

    _created() {
      this.field = this.parent;
      this.field.content = this;
    }

    _config() {
      const { control, controlBefore, controlAfter, controlAction } = this.field.props;

      let controlAfterProps = null;
      if (controlAfter) {
        controlAfterProps = { component: 'List', classes: { 'nom-control-after': true } };
        if (Array.isArray(controlAfter)) {
          controlAfterProps = Component.extendProps(controlAfterProps, { items: controlAfter });
        } else {
          controlAfterProps = Component.extendProps(controlAfterProps, controlAfter);
        }
      }

      let controlBeforeProps = null;
      if (controlBefore) {
        controlBeforeProps = { component: 'List', classes: { 'nom-control-before': true } };
        if (Array.isArray(controlAfter)) {
          controlBeforeProps = Component.extendProps(controlBeforeProps, { items: controlBefore });
        } else {
          controlBeforeProps = Component.extendProps(controlBeforeProps, controlBefore);
        }
      }

      let controlActionProps = null;
      if (controlAction) {
        controlActionProps = {
          component: 'List',
          gutter: 'sm',
          classes: { 'nom-control-action': true },
        };
        if (Array.isArray(controlAction)) {
          controlActionProps = Component.extendProps(controlActionProps, { items: controlAction });
        } else {
          controlActionProps = Component.extendProps(controlActionProps, controlAction);
        }
      }

      this.setProps({
        children: [
          controlBeforeProps && n(controlBeforeProps, [ControlBeforeMixin]),
          n(null, Component.extendProps(control, { classes: { 'nom-control': true } }), null, [
            ControlMixin,
          ]),
          controlAfterProps && n(controlAfterProps, [ControlAfterMixin]),
          controlActionProps && n(controlActionProps, [ControlActionMixin]),
        ],
      });
    }
  }

  Component.register(FieldContent);

  class FieldLabel extends Component {
    // constructor(props, ...mixins) {
    //   super(props)
    // }

    _created() {
      this.field = this.parent;
    }

    _config() {
      this.setProps({
        children: {
          tag: 'label',
          classes: {
            'nom-label': true,
          },
          children: this.field.props.label,
        },
      });
    }
  }

  Component.register(FieldLabel);

  let nameSeq = 0;

  class Field extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        label: null,
        labelAlign: 'right',
        invalidTipAlign: 'top right',
        value: null,
        flatValue: false,
        span: null,
        notShowLabel: false,
        rules: [],
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      const { name, value } = this.props;
      this.initValue = value !== undefined ? clone(this.props.value) : null;
      this.oldValue = null;
      this.currentValue = this.initValue;
      if (name) {
        this.name = name;
        this._autoName = false;
      } else {
        this._autoName = true;
        this.name = `__field${++nameSeq}`;
      }
      this.group = this.props.__group || null;
      this.rootField = this.group === null ? this : this.group.rootField;
    }

    _config() {
      delete this.errorTip;
      
      this._addPropStyle('required', 'requiredMark', 'labelAlign', 'controlWidth');
      const {
        label,
        labelWidth,
        span,
        notShowLabel,
        required,
        requiredMessage,
        rules,
        action,
      } = this.props;
      const showLabel = notShowLabel === false && label !== undefined && label !== null;

      if (required === true) {
        rules.unshift({ type: 'required', message: requiredMessage });
      }

      if (span) {
        this.setProps({
          styles: {
            col: span,
          },
        });
      }

      let labelProps = showLabel ? { component: FieldLabel } : null;
      if (labelProps && labelWidth) {
        labelProps = Component.extendProps(labelProps, {
          attrs: {
            style: {
              width: `${labelWidth}px`,
              maxWidth: `${labelWidth}px`,
              flexBasis: `${labelWidth}px`,
            },
          },
        });
      }

      let actionProps = null;
      if (action) {
        actionProps = { component: 'List', classes: { 'nom-field-action': true } };
        if (Array.isArray(action)) {
          actionProps = Component.extendProps(actionProps, { items: action });
        } else {
          actionProps = Component.extendProps(actionProps, action);
        }
      }

      this.setProps({
        children: [
          labelProps,
          { component: FieldContent, value: this.props.value },
          actionProps && n(actionProps, [FieldActionMixin]),
        ],
      });
    }

    getValue(options) {
      const value = isFunction$1(this._getValue) ? this._getValue(options) : null;
      return value
    }

    setValue(value) {
      isFunction$1(this._setValue) && this._setValue(value);
    }

    validate() {
      this.validateTriggered = true;
      return this._validate()
    }

    _validate() {
      const { rules, disabled, hidden } = this.props;
      if (disabled || hidden) {
        return true
      }
      const value = this._getRawValue ? this._getRawValue() : this.getValue();

      if (Array.isArray(rules) && rules.length > 0) {
        const validationResult = RuleManager.validate(rules, value);

        if (validationResult === true) {
          this.removeClass('s-invalid');
          this.trigger('valid');
          if (this.errorTip) {
            this.errorTip.remove();
            delete this.errorTip;
          }
          return true
        }

        this.addClass('s-invalid');
        this.trigger('invalid', validationResult);
        this._invalid(validationResult);
        return false
      }

      return true
    }

    _invalid(message) {
      if (!this.errorTip) {
        this.errorTip = new Tooltip({
          trigger: this,
          reference: this.content,
          styles: {
            color: 'danger',
          },
          children: message,
        });

        if (this.element.contains(document.activeElement)) {
          this.errorTip.show();
        }
      } else {
        this.errorTip.update({
          children: message,
        });
      }
    }

    focus() {
      isFunction$1(this._focus) && this._focus();
    }

    blur() {
      isFunction$1(this._blur) && this._blur();
    }

    reset() {
      isFunction$1(this._reset) && this._reset();
    }

    clear() {
      isFunction$1(this._clear) && this._clear();
    }

    after(props) {
      if (props) {
        props.__group = this.group;
      }
      return super.after(props)
    }

    _reset() {
      this.setValue(this.initValue);
    }

    _clear() {
      this.setValue(null);
    }

    _remove() {
      if (this.group && Array.isArray(this.group.fields)) {
        const fields = this.group.fields;

        for (let i = 0; i < fields.length; i++) {
          if (fields[i] === this) {
            delete fields[i];
            fields.splice(i, 1);
          }
        }
      }
    }

    // 派生的控件子类内部适当位置调用
    _onValueChange() {
      const that = this;
      this.oldValue = clone(this.currentValue);
      this.currentValue = clone(this.getValue());
      this.props.value = this.currentValue;

      const changed = {
        name: this.props.name,
        oldValue: this.oldValue,
        newValue: this.currentValue,
      };

      setTimeout(function () {
        that._callHandler(that.props.onValueChange, changed);
        that.group && that.group._onValueChange(changed);
        isFunction$1(that._valueChange) && that._valueChange(changed);
        if (that.validateTriggered) {
          that._validate();
        }
      }, 0);
    }
  }

  Object.defineProperty(Field.prototype, 'fields', {
    get: function () {
      return this.control.getChildren()
    },
  });

  Component.register(Field);

  class LayoutHeader extends Component {
    // constructor(props, ...mixins) {
    //   super(props)
    // }
  }

  Component.register(LayoutHeader);

  class LayoutBody extends Component {
    // constructor(props, ...mixins) {
    //     super(props)
    // }
  }

  Component.register(LayoutBody);

  class LayoutFooter extends Component {
    // constructor(props, ...mixins) {
    //     super(props);
    // }
  }

  Component.register(LayoutFooter);

  class LayoutSider extends Component {
    // constructor(props, ...mixins) {
    //   super(props)
    // }
  }

  Component.register(LayoutSider);

  class LayoutAsider extends Component {
    // constructor(props, ...mixins) {
    //   super(props)
    // }
  }

  Component.register(LayoutAsider);

  class Layout extends Component {
      constructor(props, ...mixins) {
          const defaults = {
              header: null,
              body: null,
              footer: null,
              sider: null,
              asider: null,
              fit: true
          };

          super(Component.extendProps(defaults, props), ...mixins);
      }

      _config() {
          const { header, body, footer, sider, asider } = this.props;
          this._addPropStyle('fit');

          this.setProps(
              {
                  tag: 'div',
                  header: header && { component: LayoutHeader },
                  body: body && { component: LayoutBody },
                  footer: footer && { component: LayoutFooter },
                  sider: sider && { component: LayoutSider },
                  asider: asider && { component: LayoutAsider }
              }
          );

          if (sider || asider) {
              this.setProps({
                  classes: {
                      'p-has-sider': true
                  },
                  children: [
                      this.props.sider,
                      this.props.body,
                      this.props.asider
                  ]
              });
          }
          else {
              this.setProps({
                  children: [
                      this.props.header,
                      this.props.body,
                      this.props.footer
                  ]
              });
          }
      }
  }

  Component.register(Layout);

  class Popup extends Layer {
    constructor(props, ...mixins) {
      const defaults = {
        trigger: null,
        triggerAction: 'click',
        align: 'bottom left',
        alignOuter: true,

        closeOnClickOutside: true,
        placement: 'append',

        autoRender: false,
        hidden: true,

        uistyle: 'default',
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();

      this._showHandler = this._showHandler.bind(this);
      this._hideHandler = this._hideHandler.bind(this);
      this._onOpenerClickHandler = this._onOpenerClickHandler.bind(this);

      this.opener = this.props.trigger;
      this.props.alignTo = this.opener.element;
      this.showTimer = null;
      this.hideTimer = null;
      this.addRel(this.opener.element);
      this._bindTrigger();
    }

    _bindTrigger() {
      const { triggerAction } = this.props;
      if (triggerAction === 'click') {
        this._bindClick();
      }
      if (triggerAction === 'hover') {
        this._bindHover();
      }
      if (triggerAction === 'both') {
        this._bindClick();
        this._bindHover();
      }
    }

    _bindClick() {
      this.opener._on('click', this._onOpenerClickHandler);
    }

    _bindHover() {
      this.opener._on('mouseenter', this._showHandler);
      this.opener._on('mouseleave', this._hideHandler);
    }

    _onOpenerClickHandler() {
      if (this.opener.props.disabled !== true) {
        this.toggleHidden();
      }
    }

    _showHandler() {
      if (this.opener.props.disabled !== true) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
        this.showTimer = setTimeout(() => {
          this.show();
        }, this.delay);
      }
    }

    _hideHandler() {
      if (this.opener.props.disabled !== true) {
        clearTimeout(this.showTimer);
        this.showTimer = null;

        if (this.props.hidden === false) {
          this.hideTimer = setTimeout(() => {
            this.hide();
          }, this.delay);
        }
      }
    }

    _show() {
      super._show();
      if (this.props.triggerAction === 'hover') {
        this._off('mouseenter');
        this._on('mouseenter', () => {
          clearTimeout(this.hideTimer);
        });
        this._off('mouseleave');
        this._on('mouseleave', this._hideHandler);
      }
    }
  }

  Component.mixin({
    _rendered: function () {
      if (this.props.popup) {
        this.props.popup.trigger = this;
        this.popup = new Popup(this.props.popup);
      }
    },
  });

  Component.register(Popup);

  class CascaderList extends Component {
    constructor(props, ...mixins) {
      const defaults = {};

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.cascaderControl = this.parent.parent.parent.cascaderControl;
      this.cascaderControl.optionList = this;
    }

    _config() {
      const { popMenu } = this.props;
      const value = this.cascaderControl.selectedOption.map((e) => e.key);

      this.setProps({
        children: popMenu
          ? popMenu.map((menu, index) => {
              return this.getMenuItems(menu, value[index])
            })
          : null,
      });
    }

    getMenuItems(menu, currentVal) {
      // const that = this
      if (!menu) {
        return null
      }

      return {
        tag: 'ul',
        classes: {
          'nom-cascader-menu': true,
        },
        children: menu.map((item) => {
          if (item.children) {
            return {
              tag: 'li',
              classes: {
                'nom-cascader-menu-item': true,
                'nom-cascader-menu-item-active': item.key === currentVal,
              },
              onClick: () => {
                this.cascaderControl._itemSelected(item.key);
              },
              children: [
                {
                  tag: 'span',
                  children: item.label,
                },
                {
                  component: Icon,
                  type: 'right',
                  classes: {
                    'nom-cascader-menu-item-expand-icon': true,
                  },
                },
              ],
            }
          }

          return {
            tag: 'li',
            classes: {
              'nom-cascader-menu-item': true,
              'nom-cascader-menu-item-active': item.key === currentVal,
            },
            onClick: () => {
              this.cascaderControl._itemSelected(item.key, true);
            },
            children: [
              {
                tag: 'span',
                children: item.label,
              },
            ],
          }
        }),
      }
    }
  }

  class CascaderPopup extends Popup {
    constructor(props, ...mixins) {
      const defaults = {};

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();

      this.cascaderControl = this.opener.field;
    }

    _config() {
      const { popMenu } = this.props;
      this.setProps({
        children: {
          component: Layout,
          body: {
            children: {
              component: CascaderList,
              popMenu,
            },
          },
        },
      });

      super._config();
    }
  }

  Component.register(CascaderPopup);

  class Cascader extends Field {
    constructor(props, ...mixins) {
      const defaults = {
        options: [],
        showArrow: true,
        separator: ' / ',
        fieldsMapping: { label: 'label', value: 'value', children: 'children' },
        valueType: 'cascade',
      };
      super(Component.extendProps(defaults, props), ...mixins);
    }

    _rendered() {
      this.popup = new CascaderPopup({
        trigger: this.control,
        popMenu: this.getSelectedMenu(),
      });

      this._valueChange({ newValue: this.currentValue });
    }

    _created() {
      super._created();
      const { value, options, fieldsMapping } = this.props;
      this.internalOption = JSON.parse(JSON.stringify(options));
      this.handleOptions(this.internalOption, fieldsMapping);
      this.flatItems(this.internalOption);

      this.initValue = isFunction$1(value) ? value() : value;
      this.selectedOption = [];
      this.handleOptionSelected(this.initValue);
      this.currentValue = this.initValue;
      this.checked = true;
    }

    _config() {
      const cascader = this;
      const children = [];
      const { showArrow, placeholder, separator, valueType } = this.props;

      children.push({
        classes: { 'nom-cascader-content': true },
        _created() {
          cascader.content = this;
        },
        _config() {
          const selectedOpt = cascader.selectedOption;
          let c;

          if (selectedOpt.length === 0) {
            c = null;
          } else {
            c =
              valueType === 'cascade'
                ? selectedOpt.map((e) => e.label).join(separator)
                : selectedOpt[selectedOpt.length - 1].label;
          }

          this.setProps({
            children: c,
          });
        },
      });

      if (isString(placeholder)) {
        children.push({
          _created() {
            cascader.placeholder = this;
          },
          classes: { 'nom-cascader-placeholder': true },
          children: placeholder,
        });
      }

      if (showArrow) {
        children.push({
          component: Icon,
          type: 'down',
          classes: {
            'nom-cascader-icon': true,
          },
          _created() {
            cascader.down = this;
          },
        });
      }

      children.push({
        component: Icon,
        type: 'close',
        classes: {
          'nom-cascader-icon': true,
        },
        hidden: true,
        _created() {
          cascader.close = this;
        },
        onClick: ({ event }) => {
          event.stopPropagation();
          if (this.selectedOption.length === 0) return
          this.selectedOption = [];
          this.checked = true;
          this.popup.update({
            popMenu: this.getSelectedMenu(),
          });
          this._onValueChange();
        },
      });

      this.setProps({
        control: {
          children,
        },
        attrs: {
          onmouseover() {
            cascader.close.show();
            showArrow && cascader.down.hide();
          },
          onmouseleave() {
            showArrow && cascader.down.show();
            cascader.close.hide();
          },
        },
      });

      super._config();
    }

    _itemSelected(selectedKey, isLeaf = false) {
      if (!this.items) return
      this.selectedOption = [];
      let recur = this.items.get(selectedKey);
      while (recur) {
        this.selectedOption.unshift(recur);

        recur = this.items.get(recur.pid);
      }

      this.checked = isLeaf;

      const selectedItem = this.items.get(selectedKey);
      if (!selectedItem) return
      if (this.checked && this.triggerChange(selectedItem.value)) {
        this._onValueChange();
      }
      this.popup.update({ popMenu: this.getSelectedMenu() });
    }

    _valueChange(changed) {
      if (this.placeholder) {
        if ((Array.isArray(changed.newValue) && changed.newValue.length === 0) || !changed.newValue) {
          this.placeholder.show();
        } else {
          this.placeholder.hide();
        }
      }

      this.content && this.content.update();
      this.popup && this.popup.hide();
    }

    _getValue() {
      if (!this.checked) {
        return this.currentValue
      }

      if (this.props.valueType === 'cascade') {
        const result = this.selectedOption.map((e) => e.value);
        return result.length ? result : null
      }

      return this.selectedOption.length
        ? this.selectedOption[this.selectedOption.length - 1].value
        : null
    }

    _setValue(value) {
      if (this.triggerChange(value)) {
        this.handleOptionSelected(value);
        this._onValueChange();
      }
    }

    _onValueChange() {
      const that = this;
      this.oldValue = clone(this.currentValue);
      this.currentValue = clone(this.getValue());
      this.props.value = this.currentValue;

      const changed = {
        name: this.props.name,
        oldValue: this.oldValue,
        newValue: this.currentValue,
        checkedOption:
          this.props.valueType === 'cascade'
            ? this.selectedOption
            : this.selectedOption[this.selectedOption.length - 1],
      };

      setTimeout(function () {
        that._callHandler(that.props.onValueChange, changed);
        that.group && that.group._onValueChange(changed);
        isFunction$1(that._valueChange) && that._valueChange(changed);
        if (that.validateTriggered) {
          that._validate();
        }
      }, 0);
    }

    triggerChange(value) {
      if (!value || !this.currentValue || !Array.isArray(value)) return value !== this.currentValue
      return this.currentValue.toString() !== value.toString()
    }

    handleOptions(options, fieldsMapping) {
      const {
        key: keyField,
        label: labelField,
        value: valueField,
        children: childrenField,
      } = fieldsMapping;

      const key = keyField || valueField;

      if (!Array.isArray(options)) return []
      const internalOption = options;
      for (let i = 0; i < internalOption.length; i++) {
        const item = internalOption[i];
        item.label = item[labelField];
        item.value = item[valueField];
        item.key = item[key];
        item.children = item[childrenField];
        if (Array.isArray(item.children) && item.children.length > 0) {
          this.handleOptions(item.children, fieldsMapping);
        }
      }
    }

    flatItems(options, level = 0, pid = null) {
      if (!options || !Array.isArray(options)) {
        return null
      }

      if (level === 0) {
        this.items = new Map();
      }

      for (let i = 0; i < options.length; i++) {
        const { key, value, label, children } = options[i];
        this.items.set(key, { key, label, value, pid, level, leaf: !children });
        if (children) {
          this.flatItems(children, level + 1, key);
        }
      }
    }

    handleOptionSelected(value) {
      let key = null;
      const { valueType } = this.props;

      this.checked = false;
      const oldCheckedOption = this.selectedOption;
      this.selectedOption = [];

      if (!value) this.checked = true;

      if (!this.items || this.items.size === 0) return

      if (valueType === 'single') {
        for (const v of this.items.values()) {
          if (v.leaf && v.value === value) {
            key = v.key;
          }
        }

        if (!key) return

        while (key) {
          this.selectedOption.unshift(this.items.get(key));
          key = this.items.get(key).pid;
        }
      } else {
        if (!Array.isArray(value)) return
        let opt = null;
        let options = this.internalOption;
        for (let i = 0; i < value.length; i++) {
          opt = options ? options.find((e) => e.value === value[i]) : null;

          if (!opt) {
            this.selectedOption = oldCheckedOption;
            return
          }
          this.selectedOption.push(this.items.get(opt.key));
          options = opt.children;
        }
      }

      this.checked = true;
      if (this.popup) this.popup.update({ popMenu: this.getSelectedMenu() });
      if (this.content) this.content.update();
    }

    getSelectedMenu() {
      if (!this.selectedOption) {
        return null
      }

      const val = this.selectedOption.map((e) => e.value);
      const internalOption = this.internalOption;
      let recur = internalOption;

      const options = [internalOption];

      for (let i = 0; i < val.length; i++) {
        for (let j = 0; j < recur.length; j++) {
          if (val[i] === recur[j].value) {
            if (recur[j].children) {
              options.push([...recur[j].children]);
              recur = recur[j].children;
              break
            }
          }
        }
      }

      return options
    }
  }

  Component.register(Cascader);

  class Checkbox extends Field {
    constructor(props, ...mixins) {
      const defaults = {
        text: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const that = this;
      this.setProps({
        control: {
          tag: 'label',
          children: [
            {
              tag: 'input',
              attrs: {
                type: 'checkbox',
                checked: this.props.value,
                onchange() {
                  that._onValueChange();
                },
              },
              _created() {
                that.input = this;
              },
            },
            { tag: 'span' },
            { tag: 'span', classes: { 'checkbox-text': true }, children: this.props.text || '' },
          ],
        },
      });

      super._config();
    }

    _getValue() {
      return this.input.element.checked
    }

    _setValue(value) {
      this.input.element.checked = value === true;
      this._onValueChange();
    }

    _disable() {
      this.input.element.setAttribute('disabled', 'disabled');
    }

    _enable() {
      this.input.element.removeAttribute('disabled', 'disabled');
    }
  }

  Component.register(Checkbox);

  var ListItemMixin = {
    _created: function () {
      this.wrapper = this.parent;
      this.wrapper.item = this;
      this.list = this.wrapper.list;
      this.list.itemRefs[this.key] = this;
    },
    _config: function () {
      const { onSelect, onUnselect } = this.props;
      const listProps = this.list.props;
      const selectedItems =
        listProps.selectedItems !== null && listProps.selectedItems !== undefined
          ? Array.isArray(listProps.selectedItems)
            ? listProps.selectedItems
            : [listProps.selectedItems]
          : [];

      this.setProps({
        classes: {
          'nom-list-item': true,
        },
        selected: selectedItems.indexOf(this.key) !== -1,
        selectable: {
          byClick: listProps.itemSelectable.byClick,
          canRevert: listProps.itemSelectable.multiple === true,
        },
        _shouldHandleClick: function () {
          if (listProps.disabled === true) {
            return false
          }
        },
        onSelect: () => {
          if (listProps.itemSelectable.multiple === false) {
            listProps.selectedItems = this.key;
            if (this.list.selectedItem !== null) {
              this.list.selectedItem.unselect({ triggerSelectionChange: false });
            }
            this.list.selectedItem = this;
          }

          this._callHandler(onSelect);
        },
        onUnselect: () => {
          if (listProps.selectedItems === this.key) {
            listProps.selectedItems = null;
          }
          if (this.list.selectedItem === this) {
            this.list.selectedItem = null;
          }

          this._callHandler(onUnselect);
        },
        onSelectionChange: () => {
          this.list._onItemSelectionChange();
        },
      });
    },
    _rendered: function () {
      const listProps = this.list.props;
      if (listProps.itemSelectable.multiple === false) {
        if (this.props.selected) {
          this.list.selectedItem = this;
        }
      }
    },
    _remove: function () {
      delete this.list.itemRefs[this.key];
    },
  };

  class ListItemWrapper extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'li',
        item: {},
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.list = this.parent.list;
    }

    _config() {
      this._addPropStyle('span');
      const { item, span } = this.props;
      const { itemDefaults } = this.list.props;

      if (!span && item.span) {
        this.setProps({
          span: item.span
        });
      }

      this.setProps({
        selectable: false,
        children: item,
        childDefaults: n(null, itemDefaults, null, [ListItemMixin]),
      });
    }
  }

  Component.register(ListItemWrapper);

  class ListContent extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'ul',
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.list = this.parent;
      this.list.content = this;
    }

    _config() {
      this._addPropStyle('gutter', 'line', 'align', 'justify', 'cols');
      const { items, wrappers, wrapperDefaults } = this.list.props;
      const children = [];

      if (Array.isArray(wrappers) && wrappers.length > 0) {
        for (let i = 0; i < wrappers.length; i++) {
          let wrapper = wrappers[i];
          wrapper = Component.extendProps(
            {},
            { component: ListItemWrapper },
            wrapperDefaults,
            wrapper,
          );
          children.push(wrapper);
        }
      } else if (Array.isArray(items) && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          children.push({ component: ListItemWrapper, item: items[i] });
        }
      }

      this.setProps({
        children: children,
        childDefaults: wrapperDefaults,
      });
    }

    getItem(param) {
      let retItem = null;

      if (param instanceof Component) {
        return param
      }

      if (isFunction$1(param)) {
        for (const key in this.itemRefs) {
          if (this.itemRefs.hasOwnProperty(key)) {
            if (param.call(this.itemRefs[key]) === true) {
              retItem = this.itemRefs[key];
              break
            }
          }
        }
      } else {
        return this.itemRefs[param]
      }

      return retItem
    }

    selectItem(param, selectOption) {
      const item = this.getItem(param);
      item && item.select(selectOption);
    }

    selectItems(param, selectOption) {
      selectOption = extend(
        {
          triggerSelect: true,
          triggerSelectionChange: true,
        },
        selectOption,
      );
      let itemSelectionChanged = false;
      param = Array.isArray(param) ? param : [param];
      for (let i = 0; i < param.length; i++) {
        itemSelectionChanged =
          this.selectItem(param[i], {
            triggerSelect: selectOption.triggerSelect,
            triggerSelectionChange: false,
          }) || itemSelectionChanged;
      }
      if (selectOption.triggerSelectionChange === true && itemSelectionChanged) {
        this._onItemSelectionChange();
      }
      return itemSelectionChanged
    }

    selectAllItems(selectOption) {
      return this.selectItems(this.getChildren(), selectOption)
    }

    unselectItem(param, unselectOption) {
      unselectOption = extend(
        {
          triggerUnselect: true,
          triggerSelectionChange: true,
        },
        unselectOption,
      );
      const item = this.getItem(param);
      item && item.unselect(unselectOption);
    }

    unselectItems(param, unselectOption) {
      unselectOption = extend(
        {
          triggerUnselect: true,
          triggerSelectionChange: true,
        },
        unselectOption,
      );
      let itemSelectionChanged = false;
      if (Array.isArray(param)) {
        for (let i = 0; i < param.length; i++) {
          itemSelectionChanged =
            this.unselectItem(param[i], {
              triggerUnselect: unselectOption.triggerUnselect,
              triggerSelectionChange: false,
            }) || itemSelectionChanged;
        }
      }
      if (unselectOption.triggerSelectionChange && itemSelectionChanged) {
        this._onItemSelectionChange();
      }
      return itemSelectionChanged
    }

    unselectAllItems(unselectOption) {
      return this.unselectItems(this.getAllItems(), unselectOption)
    }

    getAllItems() {
      const items = [];
      const children = this.getChildren();
      for (let i = 0; i < children.length; i++) {
        const itemWrapper = children[i];
        items.push(itemWrapper.item);
      }
      return items
    }

    _onItemSelectionChange() {
      this._callHandler(this.props.onItemSelectionChange);
    }

    getSelectedItem() {
      return this.selectedItem
    }

    getSelectedItems() {
      const selectedItems = [];
      const children = this.getChildren();
      for (let i = 0; i < children.length; i++) {
        const { item } = children[i];
        if (item.props.selected) {
          selectedItems.push(item);
        }
      }
      return selectedItems
    }

    appendItem(itemProps) {
      itemProps = Component.extendProps({}, this.props.itemDefaults, itemProps);
      const itemWrapperProps = { component: ListItemWrapper, item: itemProps };
      this.appendChild(itemWrapperProps);
    }

    removeItem(param) {
      const item = this.getItem(param);
      if (item !== null) {
        item.wrapper.remove();
      }
    }

    removeItems(param) {
      if (Array.isArray(param)) {
        for (let i = 0; i < param.length; i++) {
          this.removeItem(param[i]);
        }
      }
    }
  }

  Component.register(ListContent);

  class List extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'div',
        items: [],
        itemDefaults: {},

        selectedItems: null,

        itemSelectable: {
          multiple: false,
          byClick: false,
        },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.itemRefs = {};
      this.selectedItem = null;
    }

    _config() {
      this._addPropStyle('gutter', 'line', 'align', 'justify', 'cols');

      this.setProps({
        children: { component: ListContent },
      });
    }

    getItem(param) {
      let retItem = null;

      if (param instanceof Component) {
        return param
      }

      if (isFunction$1(param)) {
        for (const key in this.itemRefs) {
          if (this.itemRefs.hasOwnProperty(key)) {
            if (param.call(this.itemRefs[key]) === true) {
              retItem = this.itemRefs[key];
              break
            }
          }
        }
      } else {
        return this.itemRefs[param]
      }

      return retItem
    }

    selectItem(param, selectOption) {
      const item = this.getItem(param);
      item && item.select(selectOption);
    }

    selectItems(param, selectOption) {
      selectOption = extend(
        {
          triggerSelect: true,
          triggerSelectionChange: true,
        },
        selectOption,
      );
      let itemSelectionChanged = false;
      param = Array.isArray(param) ? param : [param];
      for (let i = 0; i < param.length; i++) {
        itemSelectionChanged =
          this.selectItem(param[i], {
            triggerSelect: selectOption.triggerSelect,
            triggerSelectionChange: false,
          }) || itemSelectionChanged;
      }
      if (selectOption.triggerSelectionChange === true && itemSelectionChanged) {
        this._onItemSelectionChange();
      }
      return itemSelectionChanged
    }

    selectAllItems(selectOption) {
      return this.selectItems(this.content.getChildren(), selectOption)
    }

    unselectItem(param, unselectOption) {
      unselectOption = extend(
        {
          triggerUnselect: true,
          triggerSelectionChange: true,
        },
        unselectOption,
      );
      const item = this.getItem(param);
      item && item.unselect(unselectOption);
    }

    unselectItems(param, unselectOption) {
      unselectOption = extend(
        {
          triggerUnselect: true,
          triggerSelectionChange: true,
        },
        unselectOption,
      );
      let itemSelectionChanged = false;
      if (Array.isArray(param)) {
        for (let i = 0; i < param.length; i++) {
          itemSelectionChanged =
            this.unselectItem(param[i], {
              triggerUnselect: unselectOption.triggerUnselect,
              triggerSelectionChange: false,
            }) || itemSelectionChanged;
        }
      }
      if (unselectOption.triggerSelectionChange && itemSelectionChanged) {
        this._onItemSelectionChange();
      }
      return itemSelectionChanged
    }

    unselectAllItems(unselectOption) {
      return this.unselectItems(this.getAllItems(), unselectOption)
    }

    getAllItems() {
      const items = [];
      const children = this.content.getChildren();
      for (let i = 0; i < children.length; i++) {
        const itemWrapper = children[i];
        items.push(itemWrapper.item);
      }
      return items
    }

    _onItemSelectionChange() {
      this._callHandler(this.props.onItemSelectionChange);
    }

    getSelectedItem() {
      return this.selectedItem
    }

    getSelectedItems() {
      const selectedItems = [];
      const children = this.content.getChildren();
      for (let i = 0; i < children.length; i++) {
        const { item } = children[i];
        if (item.props.selected) {
          selectedItems.push(item);
        }
      }
      return selectedItems
    }

    appendItem(itemProps) {
      this.content.appendItem(itemProps);
    }

    removeItem(param) {
      const item = this.getItem(param);
      if (item !== null) {
        item.wrapper.remove();
      }
    }

    removeItems(param) {
      if (Array.isArray(param)) {
        for (let i = 0; i < param.length; i++) {
          this.removeItem(param[i]);
        }
      }
    }
  }

  Component.register(List);

  var OptionListMixin = {
    _created: function () {
      this.checkboxList = this.parent.parent;
      this.checkboxList.optionList = this;
    },
    _config: function () {
      const { itemSelectionChange } = this.props;
      const listProps = this.checkboxList.props;
      this.setProps({
        disabled: listProps.disabled,
        items: listProps.options,
        itemDefaults: listProps.optionDefaults,
        itemSelectable: {
          byClick: true,
          multiple: true,
        },
        selectedItems: listProps.value,
        onItemSelectionChange: () => {
          this.checkboxList._onValueChange();
          this._callHandler(itemSelectionChange);
        },
      });
    },
  };

  class OptionList extends List {
    constructor(props, ...mixins) {
      const defaults = {
        gutter: 'x-md',
        itemDefaults: {
          tag: 'label',
          _config: function () {
            this.setProps({
              children: [
                {
                  tag: 'span',
                  classes: {
                    checkbox: true,
                  },
                },
                {
                  tag: 'span',
                  classes: {
                    text: true,
                  },
                  children: this.props.text,
                },
              ],
            });
          },
        },
      };

      super(Component.extendProps(defaults, props), OptionListMixin, ...mixins);
    }
  }

  class CheckboxList extends Field {
    constructor(props, ...mixins) {
      const defaults = {
        options: [],
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this.setProps({
        optionDefaults: {
          key: function () {
            return this.props.value
          },
        },
      });

      this.setProps({
        optionList: {
          component: OptionList,
        },
      });

      this.setProps({
        control: this.props.optionList,
      });

      super._config();
    }

    getSelectedOptions() {
      return this.optionList.getSelectedItems()
    }

    _getValue() {
      const selected = this.getSelectedOptions();
      if (selected !== null && Array.isArray(selected)) {
        const vals = selected.map(function (item) {
          return item.props.value
        });

        return vals
      }

      return null
    }

    _setValue(value) {
      if (value === null) {
        this.optionList.unselectAllItems();
      }
      this.optionList.selectItem(function () {
        return this.props.value === value
      });
    }

    _disable() {
      if (this.firstRender === false) {
        this.optionList.disable();
      }
    }

    _enable() {
      if (this.firstRender === false) {
        this.optionList.enable();
      }
    }
  }

  Component.register(CheckboxList);

  class CollapseItem extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        key: null,
        title: null,
        content: null,
        collapsed: true,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const { key, title, content, collapsed } = this.props;
      const that = this;
      this.setProps({
        children: [
          {
            tag: 'div',
            classes: { 'nom-collapse-item-title': true },
            styles: {
              padding: '3px',
            },
            key: key,
            children: [
              {
                ...Component.normalizeIconProps(
                  collapsed ? that.parent.props.icon.default : that.parent.props.icon.open,
                ),
                onClick: function () {
                  if (!that.parent.props.iconOnly) return
                  that.setProps({
                    collapsed: collapsed !== true,
                  });
                  that.parent.setProps({
                    activeKey: that.props.key,
                  });
                  that.update(collapsed);
                },
              },
              { tag: 'span', children: title },
            ],
            onClick: function () {
              if (that.parent.props.iconOnly) return
              that.setProps({
                collapsed: collapsed !== true,
              });
              that.parent.setProps({
                activeKey: that.props.key,
              });
              that.update(collapsed);
            },
          },
          {
            tag: 'div',
            classes: { 'nom-collapse-item-content': true },
            styles: {
              padding: '3px',
            },
            hidden: collapsed,
            children: content,
          },
        ],
      });
    }

    _disable() {
      this.element.setAttribute('disabled', 'disabled');
    }
  }

  Component.register(CollapseItem);

  class Collapse extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        activeKey: 1,
        items: null,
        bordered: false,
        icon: {
          default: 'right',
          open: 'up',
        },
        iconOnly: false,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const { activeKey, bordered } = this.props;
      // const that = this
      const items = this.props.items.map(function (item) {
        return {
          component: CollapseItem,
          key: item.key,
          title: item.title,
          content: item.content,
          collapsed: activeKey !== item.key,
          classes: {
            'nom-collapse-bordered': !!bordered,
          },
        }
      });
      this.setProps({
        children: items,
      });
    }

    _disable() {
      this.element.setAttribute('disabled', 'disabled');
    }
  }

  Component.register(Collapse);

  class ConfirmContent extends Component {
      constructor(props, ...mixins) {
          const defaults = {
              title: null,
              description: null,
              icon: null,
              type: null,
          };
          super(Component.extendProps(defaults, props), ...mixins);
      }

      _config() {
          const confirmInst = this.modal;

          const { title, description, icon, action, okText, cancelText } = confirmInst.props;

          const iconProps = icon
              ? Component.extendProps(Component.normalizeIconProps(icon), {
                  classes: { 'nom-confirm-icon': true },
              })
              : null;

          const titleProps = title
              ? Component.extendProps(Component.normalizeTemplateProps(title), {
                  classes: { 'nom-confirm-title': true },
              })
              : null;

          const descriptionProps = description
              ? Component.extendProps(Component.normalizeTemplateProps(description), {
                  classes: { 'nom-confirm-description': true },
              })
              : null;

          const okButtonProps = {
              component: Button,
              styles: {
                  color: 'primary'
              },
              text: okText,
              onClick: () => {
                  confirmInst._handleOk();
              }
          };

          const cancelButtonProps = {
              component: Button,
              text: cancelText,
              onClick: () => {
                  confirmInst._handleCancel();
              }
          };

          let actionProps = {
              component: Cols,
              justify: 'end',
          };
          if (!action) {
              actionProps.items = [okButtonProps, cancelButtonProps];
          }
          else if (isPlainObject(action)) {
              actionProps = Component.extendProps(actionProps, action);
          }
          else if (Array.isArray(action)) {
              actionProps.items = action;
          }

          this.setProps({
              children: [
                  {
                      classes: {
                          'nom-confirm-body': true,
                      },
                      children: [
                          iconProps,
                          {
                              classes: {
                                  'nom-confirm-body-content': true,
                              },
                              children: [titleProps, descriptionProps],
                          },
                      ],
                  },
                  {
                      classes: {
                          'nom-confirm-actions': true,
                      },
                      children: actionProps,
                  },
              ],
          });
      }
  }

  Component.register(ConfirmContent);

  class Confirm extends Modal {
    constructor(props, ...mixins) {
      const defaults = {
        icon: 'question-circle',
        title: null,
        description: null,
        action: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const { onOk } = this.props;
      this.setProps({
        content: {
          component: ConfirmContent,
        },
        onOk: (e) => {
          if (onOk(e) !== false) {
            e.sender.close();
          }
        },
      });

      super._config();
    }
  }

  Component.register(Confirm);

  class Container extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        fluid: false,
        // type: null,
        breakpoint: null,
      };

      super(Component.extendProps(defaults, props), mixins);
    }

    _config() {
      this._addPropStyle('breakpoint', 'fluid');
    }
  }

  Component.register(Container);

  class Row extends Component {
    // constructor(props, ...mixins) {
    //   super(props, ...mixins)
    // }
  }

  Component.register(Row);

  class Rows extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        wrap: false,
        items: [],
        itemDefaults: null,
        gutter: 'md',
        childDefaults: {
          component: Row
        },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this._propStyleClasses = ['gutter', 'align', 'justify'];
      const { items } = this.props;
      const children = [];
      if (Array.isArray(items) && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          let item = items[i];
          item = Component.extendProps({}, this.props.itemDefaults, item);
          children.push({ component: Row, children: item });
        }

        this.setProps({
          children: children,
        });
      }
    }
  }

  Component.register(Rows);

  var SelectListItemMixin = {
      _config: function () {
          const { onSelect, onUnselect } = this.props;

          this.setProps({
              selectable: {
                  byClick: true,
                  canRevert: this.list.selectControl.props.multiple === true,
              },
              onSelect: () => {
                  const { selectControl } = this.list;
                  const selectProps = selectControl.props;

                  const selectedOption = { text: this.props.text, value: this.props.value, option: this.props };
                  if (selectProps.multiple === false) {
                      selectControl.selectedSingle.update(selectedOption);
                      selectControl.popup.hide();
                  } else {
                      selectControl.selectedMultiple.appendItem(selectedOption);
                  }

                  this._callHandler(onSelect);
              },
              onUnselect: () => {
                  const { selectControl } = this.list;
                  const selectProps = selectControl.props;

                  if (selectProps.multiple === true) {
                      selectControl.selectedMultiple.removeItem(this.key);
                  }

                  this._callHandler(onUnselect);
              }

          });
      },
  };

  class SelectList extends List {
    constructor(props, ...mixins) {
      const defaults = {
        gutter: 'x-md',
        cols: 1,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();

      this.selectControl = this.parent.parent.parent.selectControl;
      this.selectControl.optionList = this;
    }

    _config() {
      const {
        showSearch,
        options,
        optionDefaults,
        value,
        multiple,
        filterOption,
      } = this.selectControl.props;
      const { text } = this.props;
      const { checked, checkedOption } = this.selectControl;
      const filterStr = checked ? checkedOption?.text : text;
      const filterOptions = filterOption(filterStr, options);

      this.setProps({
        items: showSearch ? filterOptions : options,
        itemDefaults: n(null, optionDefaults, null, [SelectListItemMixin]),
        itemSelectable: {
          multiple: multiple,
          byClick: true,
        },
        selectedItems: showSearch ? checkedOption?.value : value,

        onItemSelectionChange: () => {
          this.selectControl._onValueChange();
        },
      });

      super._config();
    }
  }

  class SelectPopup extends Popup {
    constructor(props, ...mixins) {
      const defaults = {};

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();

      this.selectControl = this.opener.field;
    }

    _config() {
      this.setProps({
        attrs: {
          style: {
            width: `${this.selectControl.control.offsetWidth()}px`,
          },
        },
        children: {
          component: Layout,
          body: {
            children: {
              component: SelectList,
            },
          },
        },
      });

      super._config();
    }
  }

  Component.register(SelectPopup);

  class Select extends Field {
    constructor(props, ...mixins) {
      const defaults = {
        options: [],
        optionDefaults: {
          key() {
            return this.props.value
          },
          _config: function () {
            this.setProps({
              children: this.props.text,
            });
          },
        },
        selectedSingle: {
          classes: {
            'nom-select-single': true,
          },
          _config: function () {
            this.setProps({
              children: this.props.text,
            });
          },
        },
        selectedMultiple: {
          component: List,
          itemDefaults: {
            _config: function () {
              this.setProps({
                tag: 'span',
                children: this.props.text,
              });
            },
          },
          gutter: 'md',
        },
        multiple: false,
        showArrow: true,
        minItemsForSearch: 20,
        filterOption: (text, options) => options.filter((o) => o.text.indexOf(text) >= 0),
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const that = this;
      const { multiple, showArrow, placeholder, disabled, showSearch } = this.props;
      const children = [];

      this.setProps({
        selectedSingle: {
          _created() {
            that.selectedSingle = this;
          },
        },
        selectedMultiple: {
          itemDefaults: {
            key() {
              return this.props.value
            },
          },
          _created() {
            that.selectedMultiple = this;
          },
        },
      });

      if (multiple) {
        children.push(this.props.selectedMultiple);
      } else if (showSearch) {
        const { onSearch } = this.props;
        that.checked = true;
        that.checkedOption = that._getOption(this.props.value);
        const searchInput = {
          tag: 'input',
          classes: { 'nom-select-search-input': true },
          _created() {
            that.selectedSingle = this;
          },
          _rendered() {
            this.element.value = this.props.text;
          },
          attrs: {
            autocomplete: 'false',
            oninput() {
              that.checked = false;
              that.updateSearchPopup(this.value);
              isFunction$1(onSearch) && onSearch(this.value);
            },
            onchange() {
              if (!that.checked) return
              this.value = that.checkedOption ? that.checkedOption?.text : null;
              that.updateSearchPopup(this.value);
            },
          },
        };

        children.push(searchInput);
      } else {
        children.push(this.props.selectedSingle);
      }

      if (isString(placeholder)) {
        children.push({
          _created() {
            that.placeholder = this;
          },
          classes: { 'nom-select-placeholder': true },
          children: placeholder,
        });
      }

      if (showArrow) {
        children.push({
          component: Icon,
          type: 'down',
          classes: {
            'nom-select-arrow': true,
          },
        });
      }

      this.setProps({
        control: {
          attrs: {
            style: { cursor: 'text' },
          },
          disabled: disabled,
          children: children,
        },
        onClick: () => {
          showSearch && this.selectedSingle.element.focus();
        },
      });

      super._config();
    }

    _rendered() {
      const { value } = this.props;

      this.popup = new SelectPopup({ trigger: this.control });

      this._directSetValue(value);

      this._valueChange({ newValue: this.currentValue });
    }

    _directSetValue(value, options) {
      const { valueOptions } = this.props;
      options = extend(
        {
          asArray: false,
        },
        valueOptions,
        options,
      );

      const { multiple } = this.props;
      if (multiple === true) {
        const selValueOptions = this._getOptions(value);
        if (selValueOptions.length) {
          this.selectedMultiple.update({ items: selValueOptions });
          this.currentValue = selValueOptions.map(function (item) {
            return item.value
          });
        } else {
          this.selectedMultiple.unselectAllItems();
        }
      } else {
        if (options.asArray === true) {
          value = value[0];
        }
        const selValueOption = this._getOption(value);
        if (selValueOption !== null) {
          this.selectedSingle.update(selValueOption);
          this.currentValue = selValueOption.value;
        } else {
          this.selectedSingle.emptyChildren();
        }
      }
    }

    selectOption(option) {
      this.optionList.selectItem(option);
    }

    selectOptions(options) {
      this.optionList.selectItems(options);
    }

    getSelectedOption() {
      if (!this.optionList) {
        return null
      }
      if (this.props.multiple === false) {
        return this.optionList.getSelectedItem()
      }

      return this.optionList.getSelectedItems()
    }

    _getValue(options) {
      const { valueOptions, showSearch } = this.props;
      options = extend(
        {
          asArray: false,
        },
        valueOptions,
        options,
      );

      if (!this.optionList) {
        return this.currentValue
      }

      if (showSearch) {
        const selectedSearch = this.getSelectedOption();
        if (selectedSearch && selectedSearch.props) return selectedSearch.props.value
        return this.currentValue
      }

      const selected = this.getSelectedOption();

      if (selected !== null) {
        if (Array.isArray(selected)) {
          const vals = selected.map(function (item) {
            return item.props.value
          });

          return vals
        }
        if (options.asArray === true) {
          return [selected.props.value]
        }

        return selected.props.value
      }

      return null
    }

    _setValue(value, triggerChange) {
      triggerChange = triggerChange !== false;

      if (this.props.showSearch) {
        const selectedOption = this.props.options.find((e) => e.value === value);
        if (selectedOption) {
          this.checked = true;
          this.checkedOption = selectedOption;
          this.updateSearchPopup(selectedOption.text);
          this._directSetValue(value);
        }
      }

      if (this.optionList) {
        this.optionList.unselectAllItems({ triggerSelectionChange: value === null });
        this.selectOptions(value, { triggerSelectionChange: triggerChange });
      } else {
        this._directSetValue(value);
        if (triggerChange) {
          this._onValueChange();
        }
      }
    }

    _getOption(value) {
      let option = null;
      const { options } = this.props;
      for (let i = 0; i < options.length; i++) {
        if (options[i].value === value) {
          option = options[i];
          break
        }
      }
      return option
    }

    _getOptions(value) {
      const retOptions = [];
      const { options } = this.props;
      if (Array.isArray(value)) {
        for (let i = 0; i < options.length; i++) {
          if (value.indexOf(options[i].value) !== -1) {
            retOptions.push(options[i]);
          }
        }
      }
      return retOptions
    }

    _valueChange(changed) {
      if (this.placeholder) {
        if (
          (Array.isArray(changed.newValue) && changed.newValue.length === 0) ||
          changed.newValue === null ||
          changed.newValue === undefined
        ) {
          this.placeholder.show();
        } else {
          this.placeholder.hide();
        }
      }

      if (this.props.showSearch) {
        const selectedOption = this.props.options.find((e) => e.value === changed.newValue);
        this.checkedOption = selectedOption;
        this.updateSearchPopup(selectedOption.text);
        this.checked = true;
      }
    }

    _disable() {
      if (this.firstRender === false) {
        this.control.disable();
      }
    }

    _enable() {
      if (this.firstRender === false) {
        this.control.enable();
      }
    }

    appendOption() {}

    updateSearchPopup(text) {
      if (this.optionList) this.optionList.update({ text });
    }

    handleFilter(text, options) {
      const { filterOption } = this.props;
      return filterOption(text, options)
    }
  }

  Component.register(Select);

  class Input extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'input',
        attrs: {
          type: 'text',
          autocomplete: 'off',
        },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.capsLock = false;
    }

    _config() {
      this.setProps({
        attrs: {
          value: this.props.value,
          oninput: () => {
            if (!this.capsLock) {
              this.textbox._onValueChange();
            }
          },
          onblur: () => {
            this.textbox.trigger('blur');
          },
          oncompositionstart: () => {
            this.capsLock = true;
          },
          oncompositionend: () => {
            this.capsLock = false;
            this.element.dispatchEvent(new Event('input'));
          },
        },
      });
    }

    _rendered() {
      if (this.textbox.props.autofocus === true) {
        this.focus();
      }
    }

    getText() {
      return this.element.value
    }

    setText(text) {
      this.element.value = text;
    }

    focus() {
      this.element.focus();
    }

    blur() {
      this.element.blur();
    }

    disable(){
      this.element.setAttribute('disabled', 'disabled');
    }

    enable(){
      this.element.removeAttribute('disabled', 'disabled');
    }
  }

  class Textbox extends Field {
    constructor(props, ...mixins) {
      const defaults = {
        leftIcon: null,
        rightIcon: null,
        autofocus: false,
        placeholder: null,
        value: null,
        htmlType: 'text',
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const that = this;
      const { leftIcon, rightIcon, placeholder, value, htmlType } = this.props;

      let leftIconProps = Component.normalizeIconProps(leftIcon);
      if (leftIconProps != null) {
        leftIconProps = Component.extendProps(leftIconProps, {
          classes: { 'nom-textbox-left-icon': true },
        });
      }

      let rightIconProps = Component.normalizeIconProps(rightIcon);
      if (rightIconProps != null) {
        rightIconProps = Component.extendProps(rightIconProps, {
          classes: { 'nom-textbox-right-icon': true },
        });
      }

      const inputProps = {
        component: Input,
        name: 'input',
        attrs: {
          value: value,
          placeholder: placeholder,
          type: htmlType,
        },
        _created: function () {
          this.textbox = that;
          this.textbox.input = this;
        },
      };

      this.setProps({
        classes: {
          'p-with-left-icon': !!leftIcon,
          'p-with-right-icon': !!rightIcon,
        },
        control: {
          children: [inputProps, leftIcon && leftIconProps, rightIcon && rightIconProps],
        },
      });

      super._config();
    }

    getText() {
      return this.input.getText()
    }

    _getValue() {
      const inputText = this.getText();
      if (inputText === '') {
        return null
      }
      return inputText
    }

    _setValue(value) {
      this.input.setText(value);
      const newValue = this.getValue();
      if (newValue !== this.oldValue) {
        super._onValueChange();
      }
      this.oldValue = this.currentValue;
      this.currentValue = newValue;
    }

    focus() {
      this.input.focus();
    }

    blur() {
      this.input.blur();
    }

    _disable() {
      this.input.disable();
    }

    _enable() {
      this.input.enable();
    }
  }

  Component.register(Textbox);

  /**
   * Copyright (c)2005-2009 Matt Kruse (javascripttoolbox.com)
   *
   * Dual licensed under the MIT and GPL licenses.
   * This basically means you can use this code however you want for
   * free, but don't claim to have written it yourself!
   * Donations always accepted: http://www.JavascriptToolbox.com/donate/
   *
   * Please do not link to the .js files on javascripttoolbox.com from
   * your site. Copy the files locally to your server instead.
   *
   */
  /*
  Date functions

  These functions are used to parse, format, and manipulate Date objects.
  See documentation and examples at http://www.JavascriptToolbox.com/lib/date/

  */
  Date.$VERSION = 1.02;

  // Utility function to append a 0 to single-digit numbers
  Date.LZ = function (x) {
    return (x < 0 || x > 9 ? '' : '0') + x
  };
  // Full month names. Change this for local month names
  Date.monthNames = new Array(
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  );
  // Month abbreviations. Change this for local month names
  Date.monthAbbreviations = new Array(
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  );
  // Full day names. Change this for local month names
  Date.dayNames = new Array(
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  );
  // Day abbreviations. Change this for local month names
  Date.dayAbbreviations = new Array('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
  // Used for parsing ambiguous dates like 1/2/2000 - default to preferring 'American' format meaning Jan 2.
  // Set to false to prefer 'European' format meaning Feb 1
  Date.preferAmericanFormat = true;

  // If the getFullYear() method is not defined, create it
  if (!Date.prototype.getFullYear) {
    Date.prototype.getFullYear = function () {
      const yy = this.getYear();
      return yy < 1900 ? yy + 1900 : yy
    };
  }

  // Parse a string and convert it to a Date object.
  // If no format is passed, try a list of common formats.
  // If string cannot be parsed, return null.
  // Avoids regular expressions to be more portable.
  Date.parseString = function (val, format) {
    // If no format is specified, try a few common formats
    if (typeof format === 'undefined' || format == null || format === '') {
      const generalFormats = new Array(
        'y-M-d',
        'MMM d, y',
        'MMM d,y',
        'y-MMM-d',
        'd-MMM-y',
        'MMM d',
        'MMM-d',
        'd-MMM',
      );
      const monthFirst = new Array('M/d/y', 'M-d-y', 'M.d.y', 'M/d', 'M-d');
      const dateFirst = new Array('d/M/y', 'd-M-y', 'd.M.y', 'd/M', 'd-M');
      const checkList = new Array(
        generalFormats,
        Date.preferAmericanFormat ? monthFirst : dateFirst,
        Date.preferAmericanFormat ? dateFirst : monthFirst,
      );
      for (let i = 0; i < checkList.length; i++) {
        const l = checkList[i];
        for (let j = 0; j < l.length; j++) {
          const d = Date.parseString(val, l[j]);
          if (d != null) {
            return d
          }
        }
      }
      return null
    }

    this.isInteger = function (_val) {
      for (let i = 0; i < _val.length; i++) {
        if ('1234567890'.indexOf(_val.charAt(i)) === -1) {
          return false
        }
      }
      return true
    };
    this.getInt = function (str, i, minlength, maxlength) {
      for (let x = maxlength; x >= minlength; x--) {
        const token = str.substring(i, i + x);
        if (token.length < minlength) {
          return null
        }
        if (this.isInteger(token)) {
          return token
        }
      }
      return null
    };
    val += '';
    format += '';
    let i_val = 0;
    let i_format = 0;
    let c = '';
    let token = '';
    let x;
    let y;
    let year = new Date().getFullYear();
    let month = 1;
    let date = 1;
    let hh = 0;
    let mm = 0;
    let ss = 0;
    let ampm = '';
    while (i_format < format.length) {
      // Get next token from format string
      c = format.charAt(i_format);
      token = '';
      while (format.charAt(i_format) === c && i_format < format.length) {
        token += format.charAt(i_format++);
      }
      // Extract contents of value based on format token
      if (token === 'yyyy' || token === 'yy' || token === 'y') {
        if (token === 'yyyy') {
          x = 4;
          y = 4;
        }
        if (token === 'yy') {
          x = 2;
          y = 2;
        }
        if (token === 'y') {
          x = 2;
          y = 4;
        }
        year = this.getInt(val, i_val, x, y);
        if (year == null) {
          return null
        }
        i_val += year.length;
        if (year.length === 2) {
          if (year > 70) {
            year = 1900 + (year - 0);
          } else {
            year = 2000 + (year - 0);
          }
        }
      } else if (token === 'MMM' || token === 'NNN') {
        month = 0;
        const names =
          token === 'MMM' ? Date.monthNames.concat(Date.monthAbbreviations) : Date.monthAbbreviations;
        for (let i = 0; i < names.length; i++) {
          const month_name = names[i];
          if (
            val.substring(i_val, i_val + month_name.length).toLowerCase() === month_name.toLowerCase()
          ) {
            month = (i % 12) + 1;
            i_val += month_name.length;
            break
          }
        }
        if (month < 1 || month > 12) {
          return null
        }
      } else if (token === 'EE' || token === 'E') {
        const names = token === 'EE' ? Date.dayNames : Date.dayAbbreviations;
        for (let i = 0; i < names.length; i++) {
          const day_name = names[i];
          if (
            val.substring(i_val, i_val + day_name.length).toLowerCase() === day_name.toLowerCase()
          ) {
            i_val += day_name.length;
            break
          }
        }
      } else if (token === 'MM' || token === 'M') {
        month = this.getInt(val, i_val, token.length, 2);
        if (month == null || month < 1 || month > 12) {
          return null
        }
        i_val += month.length;
      } else if (token === 'dd' || token === 'd') {
        date = this.getInt(val, i_val, token.length, 2);
        if (date == null || date < 1 || date > 31) {
          return null
        }
        i_val += date.length;
      } else if (token === 'hh' || token === 'h') {
        hh = this.getInt(val, i_val, token.length, 2);
        if (hh == null || hh < 1 || hh > 12) {
          return null
        }
        i_val += hh.length;
      } else if (token === 'HH' || token === 'H') {
        hh = this.getInt(val, i_val, token.length, 2);
        if (hh == null || hh < 0 || hh > 23) {
          return null
        }
        i_val += hh.length;
      } else if (token === 'KK' || token === 'K') {
        hh = this.getInt(val, i_val, token.length, 2);
        if (hh == null || hh < 0 || hh > 11) {
          return null
        }
        i_val += hh.length;
        hh++;
      } else if (token === 'kk' || token === 'k') {
        hh = this.getInt(val, i_val, token.length, 2);
        if (hh == null || hh < 1 || hh > 24) {
          return null
        }
        i_val += hh.length;
        hh--;
      } else if (token === 'mm' || token === 'm') {
        mm = this.getInt(val, i_val, token.length, 2);
        if (mm == null || mm < 0 || mm > 59) {
          return null
        }
        i_val += mm.length;
      } else if (token === 'ss' || token === 's') {
        ss = this.getInt(val, i_val, token.length, 2);
        if (ss == null || ss < 0 || ss > 59) {
          return null
        }
        i_val += ss.length;
      } else if (token === 'a') {
        if (val.substring(i_val, i_val + 2).toLowerCase() === 'am') {
          ampm = 'AM';
        } else if (val.substring(i_val, i_val + 2).toLowerCase() === 'pm') {
          ampm = 'PM';
        } else {
          return null
        }
        i_val += 2;
      } else {
        if (val.substring(i_val, i_val + token.length) !== token) {
          return null
        }

        i_val += token.length;
      }
    }
    // If there are any trailing characters left in the value, it doesn't match
    if (i_val !== val.length) {
      return null
    }
    // Is date valid for month?
    if (month === 2) {
      // Check for leap year
      if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
        // leap year
        if (date > 29) {
          return null
        }
      } else if (date > 28) {
        return null
      }
    }
    if (month === 4 || month === 6 || month === 9 || month === 11) {
      if (date > 30) {
        return null
      }
    }
    // Correct hours value
    if (hh < 12 && ampm === 'PM') {
      hh = hh - 0 + 12;
    } else if (hh > 11 && ampm === 'AM') {
      hh -= 12;
    }
    return new Date(year, month - 1, date, hh, mm, ss)
  };

  // Check if a date string is valid
  Date.isValid = function (val, format) {
    return Date.parseString(val, format) != null
  };

  // Check if a date object is before another date object
  Date.prototype.isBefore = function (date2) {
    if (date2 == null) {
      return false
    }
    return this.getTime() < date2.getTime()
  };

  // Check if a date object is after another date object
  Date.prototype.isAfter = function (date2) {
    if (date2 == null) {
      return false
    }
    return this.getTime() > date2.getTime()
  };

  // Check if two date objects have equal dates and times
  Date.prototype.equals = function (date2) {
    if (date2 == null) {
      return false
    }
    return this.getTime() === date2.getTime()
  };

  // Check if two date objects have equal dates, disregarding times
  Date.prototype.equalsIgnoreTime = function (date2) {
    if (date2 == null) {
      return false
    }
    const d1 = new Date(this.getTime()).clearTime();
    const d2 = new Date(date2.getTime()).clearTime();
    return d1.getTime() === d2.getTime()
  };

  // Format a date into a string using a given format string
  Date.prototype.format = function (format) {
    format += '';
    let result = '';
    let i_format = 0;
    let c = '';
    let token = '';
    let y = `${this.getYear()}`;
    const M = this.getMonth() + 1;
    const d = this.getDate();
    const E = this.getDay();
    const H = this.getHours();
    const m = this.getMinutes();
    const s = this.getSeconds();

    // Convert real date parts into formatted versions
    const value = {};
    if (y.length < 4) {
      y = `${+y + 1900}`;
    }
    value.y = `${y}`;
    value.yyyy = y;
    value.yy = y.substring(2, 4);
    value.M = M;
    value.MM = Date.LZ(M);
    value.MMM = Date.monthNames[M - 1];
    value.NNN = Date.monthAbbreviations[M - 1];
    value.d = d;
    value.dd = Date.LZ(d);
    value.E = Date.dayAbbreviations[E];
    value.EE = Date.dayNames[E];
    value.H = H;
    value.HH = Date.LZ(H);
    if (H === 0) {
      value.h = 12;
    } else if (H > 12) {
      value.h = H - 12;
    } else {
      value.h = H;
    }
    value.hh = Date.LZ(value.h);
    value.K = value.h - 1;
    value.k = value.H + 1;
    value.KK = Date.LZ(value.K);
    value.kk = Date.LZ(value.k);
    if (H > 11) {
      value.a = 'PM';
    } else {
      value.a = 'AM';
    }
    value.m = m;
    value.mm = Date.LZ(m);
    value.s = s;
    value.ss = Date.LZ(s);
    while (i_format < format.length) {
      c = format.charAt(i_format);
      token = '';
      while (format.charAt(i_format) === c && i_format < format.length) {
        token += format.charAt(i_format++);
      }
      if (typeof value[token] !== 'undefined') {
        result += value[token];
      } else {
        result += token;
      }
    }
    return result
  };

  // Get the full name of the day for a date
  Date.prototype.getDayName = function () {
    return Date.dayNames[this.getDay()]
  };

  // Get the abbreviation of the day for a date
  Date.prototype.getDayAbbreviation = function () {
    return Date.dayAbbreviations[this.getDay()]
  };

  // Get the full name of the month for a date
  Date.prototype.getMonthName = function () {
    return Date.monthNames[this.getMonth()]
  };

  // Get the abbreviation of the month for a date
  Date.prototype.getMonthAbbreviation = function () {
    return Date.monthAbbreviations[this.getMonth()]
  };

  // Clear all time information in a date object
  Date.prototype.clearTime = function () {
    this.setHours(0);
    this.setMinutes(0);
    this.setSeconds(0);
    this.setMilliseconds(0);
    return this
  };

  // Add an amount of time to a date. Negative numbers can be passed to subtract time.
  Date.prototype.add = function (interval, number) {
    if (
      typeof interval === 'undefined' ||
      interval == null ||
      typeof number === 'undefined' ||
      number == null
    ) {
      return this
    }
    number = +number;
    if (interval === 'y') {
      // year
      this.setFullYear(this.getFullYear() + number);
    } else if (interval === 'M') {
      // Month
      this.setMonth(this.getMonth() + number);
    } else if (interval === 'd') {
      // Day
      this.setDate(this.getDate() + number);
    } else if (interval === 'w') {
      // Weekday
      const step = number > 0 ? 1 : -1;
      while (number !== 0) {
        this.add('d', step);
        while (this.getDay() === 0 || this.getDay() === 6) {
          this.add('d', step);
        }
        number -= step;
      }
    } else if (interval === 'h') {
      // Hour
      this.setHours(this.getHours() + number);
    } else if (interval === 'm') {
      // Minute
      this.setMinutes(this.getMinutes() + number);
    } else if (interval === 's') {
      // Second
      this.setSeconds(this.getSeconds() + number);
    }
    return this
  };

  class DatePicker extends Textbox {
    constructor(props, ...mixins) {
      const defaults = {
        format: 'yyyy-MM-dd',
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const { value, format, disabled } = this.props;
      let currentDate = value !== null ? Date.parseString(value, format) : new Date();
      if (!currentDate) {
        currentDate = new Date();
      }
      let year = currentDate.getFullYear();
      let month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      const that = this;

      this.setProps({
        rightIcon: 'calendar',
        control: {
          disabled: disabled,
          popup: {
            _created: function () {
              that.popup = this;
            },
            styles: {
              padding: '1',
            },
            triggerAction: 'click',
            attrs: {
              style: {
                width: '300px',
              },
            },
            children: {
              component: Rows,
              items: [
                {
                  component: Cols,
                  justify: 'between',
                  fills: true,
                  items: [
                    {
                      component: Select,
                      value: year,
                      options: this._getYears(),
                      onValueChange: (changed) => {
                        year = changed.newValue;
                        that.days.update({
                          items: that._getDays(year, month),
                        });
                      },
                    },
                    {
                      component: Select,
                      value: month,
                      options: this._getMonths(),
                      onValueChange: function (changed) {
                        month = changed.newValue;
                        that.days.update({
                          items: that._getDays(year, month),
                        });
                      },
                    },
                  ],
                },
                {
                  component: Cols,
                  items: ['日', '一', '二', '三', '四', '五', '六'],
                  fills: true,
                  gutter: null,
                  itemDefaults: {
                    styles: {
                      text: 'center',
                    },
                  },
                },
                {
                  component: List,
                  _created: function () {
                    that.days = this;
                  },
                  gutter: 'sm',
                  cols: 7,
                  selectedItems: `${year}-${month}-${day}`,
                  itemSelectable: {
                    byClick: true,
                  },
                  items: this._getDays(year, month),
                  itemDefaults: {
                    key: function () {
                      return this.props.date
                    },
                    styles: {
                      padding: 'd375',
                      hover: {
                        color: 'darken',
                      },
                      selected: {
                        color: 'primary',
                      },
                    },
                    attrs: {
                      role: 'button',
                    },
                    _config: function () {
                      const textStyles = ['center'];
                      const isToday = this.props.date === new Date().format('yyyy-M-dd');

                      if (this.props.lastMonth === true || this.props.nextMonth === true) {
                        textStyles.push('muted');
                      }

                      if (isToday) {
                        this.setProps({
                          styles: {
                            border: ['1px', 'primary'],
                          },
                        });
                      }

                      this.setProps({
                        styles: {
                          text: textStyles,
                        },
                        children: this.props.day,
                      });
                    },
                    onClick: function (args) {
                      const { year: selYear, month: selMonth, day: selDay } = args.sender.props;
                      const selDate = new Date(selYear, selMonth - 1, selDay);
                      that.setValue(selDate.format(format));
                      that.popup.hide();
                    },
                  },
                },
              ],
            },
          },
        },
      });

      super._config();
    }

    _getYears() {
      const years = [];
      const thisYear = new Date().getFullYear();

      for (let i = thisYear + 20; i > thisYear - 30; i--) {
        years.push({
          text: i,
          value: i,
        });
      }

      return years
    }

    _getMonths() {
      const months = [];

      for (let i = 1; i < 13; i++) {
        months.push({
          text: i,
          value: i,
        });
      }

      return months
    }

    _getDays(year, month) {
      const firstDay = this._getFirstDayOfMonth(year, month);
      const currentDayCount = this._getDaysInMonth(year, month);
      let lastDayCount = this._getDaysInMonth(year, month);
      const daysList = [];
      let i = 0;
      let lastMonthYear = year;
      let lastMonthMonth = month - 1;
      let nextMonthYear = year;
      let nextMonthMonth = month + 1;

      if (month === 1) {
        lastDayCount = this._getDaysInMonth(year - 1, 12);
        lastMonthYear = year - 1;
        lastMonthMonth = 11;
      }

      if (firstDay > 0) {
        for (i = lastDayCount - firstDay + 1; i < lastDayCount + 1; i++) {
          daysList.push({
            day: i,
            year: lastMonthYear,
            month: lastMonthMonth,
            lastMonth: true,
            date: `${lastMonthYear}-${lastMonthMonth}-${i}`,
          });
        }
      }

      for (i = 1; i < currentDayCount + 1; i++) {
        daysList.push({
          day: i,
          year: year,
          month: month,
          date: `${year}-${month}-${i}`,
        });
      }
      const nextMonthCount = 7 - (daysList.length % 7 || 7);
      if (month === 12) {
        nextMonthYear++;
        nextMonthMonth = 1;
      }
      for (i = 1; i < nextMonthCount + 1; i++) {
        daysList.push({
          day: i,
          year: nextMonthYear,
          month: nextMonthMonth,
          nextMonth: true,
          date: `${nextMonthYear}-${nextMonthMonth}-${i}`,
        });
      }
      return daysList
    }

    /* 求XX年XX月1号是星期几 */
    _getFirstDayOfMonth(year, month) {
      return new Date(year, month - 1, 1).getDay()
    }

    /* 求XX年XX月有多少天 */
    _getDaysInMonth(year, month) {
      return 32 - this._daylightSavingAdjust(new Date(year, month - 1, 32)).getDate()
    }

    _daylightSavingAdjust(date) {
      if (!date) {
        return null
      }
      date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
      return date
    }

    _disable() {
      super._disable();
      if (this.firstRender === false) {
        this.control.disable();
      }
    }

    _enable() {
      super._enable();
      if (this.firstRender === false) {
        this.control.enable();
      }
    }
  }

  Component.register(DatePicker);

  class Ellipsis extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        text: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this.setProps({
        children: {
          classes: {
            'nom-ellipsis-inner': true,
          },
          children: this.props.text ? this.props.text : this.props.children,
        },
      });
    }
  }

  Component.mixin({
    _config: function () {
      if (this.props.ellipsis) {
        this.setProps({
          classes: {
            'nom-ellipsis-block': true,
          },
        });
      }
    },
  });

  Component.register(Ellipsis);

  class Group extends Field {
    constructor(props, ...mixins) {
      const defaults = {
        fields: [],
        fieldDefaults: { component: Field },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this._addPropStyle('inline', 'striped', 'line', 'nowrap');
      const { fields, fieldDefaults, value } = this.props;
      const children = [];

      for (let i = 0; i < fields.length; i++) {
        let fieldProps = extend(true, {}, fields[i]);
        if (isPlainObject(value)) {
          if (fieldProps.flatValue === true) {
            fieldProps.value = value;
          } else if (fieldProps.value === null || fieldProps.value === undefined) {
            fieldProps.value = value[fieldProps.name];
          }
        }
        fieldProps.__group = this;
        fieldProps = Component.extendProps(fieldDefaults, fieldProps);
        children.push(fieldProps);
      }

      this.setProps({
        control: { children: children },
      });

      super._config();
    }

    getValue(options) {
      const { valueOptions } = this.props;
      options = extend(
        {
          ignoreDisabled: true,
          ignoreHidden: true,
          merge: false,
        },
        valueOptions,
        options,
      );

      const value = {};
      for (let i = 0; i < this.fields.length; i++) {
        const field = this.fields[i];
        if (field.getValue && this._needHandleValue(field, options)) {
          const fieldValue = field.getValue();
          if (field.props.flatValue === true) {
            extend(value, fieldValue);
          } else {
            value[field.name] = fieldValue;
          }
        }
      }

      if (options.merge === true) {
        return extend(this.currentValue, value)
      }
      return value
    }

    setValue(value, options) {
      options = extend(
        {
          ignoreDisabled: true,
          ignoreHidden: true,
        },
        options,
      );

      for (let i = 0; i < this.fields.length; i++) {
        const field = this.fields[i];
        if (field.setValue && this._needHandleValue(field, options)) {
          let fieldValue = value;
          if (field.props.flatValue === false) {
            if (isPlainObject(value)) {
              fieldValue = value[field.name];
            }
          }
          if (fieldValue === undefined) {
            fieldValue = null;
          }
          field.setValue(fieldValue);
        }
      }
    }

    validate() {
      const invalids = [];
      for (let i = 0; i < this.fields.length; i++) {
        const field = this.fields[i];
        if (field.validate) {
          const valResult = field.validate();

          if (valResult !== true) {
            invalids.push(field);
          }
        }
      }

      if (invalids.length > 0) {
        invalids[0].focus();
      }

      return invalids.length === 0
    }

    getField(fieldName) {
      if (typeof fieldName === 'string') {
        // Handle nested keys, e.g., "foo.bar" "foo[1].bar" "foo[key].bar"
        const parts = fieldName.split('.');
        let curField = this;
        if (parts.length) {
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            curField = curField._getSubField(part);
            if (!curField) {
              break
            }
          }
        }

        return curField
      }
    }

    appendField(fieldProps) {
      const { fieldDefaults } = this.props;
      this.props.fields.push(fieldProps);
      return this.control.appendChild(
        Component.extendProps(fieldDefaults, fieldProps, { __group: this }),
      )
    }

    _getSubField(fieldName) {
      for (let i = 0; i < this.fields.length; i++) {
        const field = this.fields[i];
        if (field.name === fieldName) {
          return field
        }
      }

      return null
    }

    _clear() {
      for (let i = 0; i < this.fields.length; i++) {
        const field = this.fields[i];
        if (field.setValue) {
          field.setValue(null);
        }
      }
    }

    _needHandleValue(field, options) {
      const { disabled, hidden } = field.props;
      if (field._autoName) {
        return false
      }
      if (options.ignoreDisabled && disabled === true) {
        return false
      }
      if (options.ignoreHidden && hidden === true) {
        return false
      }

      return true
    }
  }

  Component.register(Group);

  class Form extends Group {
    constructor(props, ...mixins) {
      const defaults = {
        labelAlign: 'top'
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }
  }

  Component.register(Form);

  class Spinner extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        spinning: true,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const { spinning } = this.props;

      this.setProps({
        classes: {
          'p-type-border': spinning,
        },
      });
    }
  }

  Component.register(Spinner);

  class Loading extends Layer {
    constructor(props, ...mixins) {
      const defaults = {
        align: 'center',
        container: document.body,
        backdrop: true,
        collision: 'none',
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this.setProps({
        reference: this.props.container,
        alignTo: this.getElement(this.props.container),
        children: {
          component: Spinner,
        },
      });

      if (this.props.container instanceof Component) {
        this.props.container.addClass('nom-loading-container');
      } else {
        this.props.container.component.addClass('nom-loading-container');
      }

      super._config();
    }

    _remove() {
      if (this.props.container instanceof Component) {
        this.props.container.removeClass('nom-loading-container');
      } else {
        this.props.container.component.removeClass('nom-loading-container');
      }

      super._remove();
    }
  }

  Component.register(Loading);

  class ColGroupCol extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'col',
        column: {},
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const { width } = this.props.column;
      let widthPx = null;
      if (width) {
        widthPx = `${width}px`;
      }
      this.setProps({
        attrs: {
          style: {
            width: widthPx,
          },
        },
      });
    }
  }

  Component.register(ColGroupCol);

  class ColGroup extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'colgroup',
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.table = this.parent;
      this.columns = this.table.props.columns;
      this.colList = [];
    }

    _config() {
      let children = [];

      if (Array.isArray(this.columns)) {
        this.colList = [];
        children = this.createCols(this.columns);
      }

      if (
        this.table.parent.componentType === 'GridHeader' &&
        this.table.parent.parent.props.frozenHeader
      ) {
        children.push({
          component: ColGroupCol,
          column: {
            width: 17,
          },
        });
      }

      this.setProps({
        children: children,
      });
    }

    createCols(data) {
      const that = this;
      data.forEach(function (column) {
        if (column.children && column.children.length > 0) {
          that.createCols(column.children);
        } else {
          that.colList.push({
            component: ColGroupCol,
            name: column.field,
            column: column,
          });
        }
      });

      return that.colList
    }
  }

  Component.register(ColGroup);

  class Td extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'td',
        data: null,
        column: {},
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.tr = this.parent;
      this.table = this.parent.table;
    }

    _config() {
      const { level, isLeaf, data: rowData } = this.tr.props;
      const { column } = this.props;
      const { treeConfig } = this.table.props;

      let children = this.props.data;

      if (isFunction$1(this.props.column.render)) {
        children = this.props.column.render.call(
          this,
          this.props.data,
          this.props.record,
          this.parent.props.index,
        );
      }

      const isTreeNodeColumn = treeConfig.treeNodeColumn && column.field === treeConfig.treeNodeColumn;

      if (isTreeNodeColumn) {
        if (!isLeaf) {
          this.setProps({
            expanded: treeConfig.initExpandLevel === -1 || treeConfig.initExpandLevel > level,
          });

          this._setExpandable({
            byClick: true,
            target: () => {
              return rowData.children.map((subrowData) => {
                return this.table.rowRefs[subrowData[this.table.props.keyField]]
              })
            },
            indicator: {
              component: 'Icon',
              classes: { 'nom-tr-expand-indicator': true },
              expandable: {
                expandedProps: {
                  type: 'down',
                },
                collapsedProps: {
                  type: 'right',
                },
              },
            },
          });
        }

        children = [
          {
            tag: 'span',
            attrs: {
              style: {
                paddingLeft: `${level * 15}px`,
              },
            },
          },
          !isLeaf && this.props.expandable.indicator,
          { tag: 'span', children: children },
        ];
      }

      this.setProps({
        children: children,
        attrs: {
          colspan: this.props.column.colSpan,
          rowspan: this.props.column.rowSpan,
        },
        hidden: this.props.column.colSpan === 0 || this.props.column.rowSpan === 0,
        classes: {
          'nom-td-tree-node': isTreeNodeColumn,
          'nom-td-tree-node-leaf': isTreeNodeColumn && isLeaf,
          'nom-table-fixed-left': this.props.column.fixed === 'left',
          'nom-table-fixed-left-last': this.props.column.lastLeft,
          'nom-table-fixed-right': this.props.column.fixed === 'right',
          'nom-table-fixed-right-first': this.props.column.firstRight,
        },
      });
    }

    _rendered() {
      if (this.props.column.fixed === 'left') {
        this._setStyle({ left: `${this.element.offsetLeft}px` });
      } else if (this.props.column.fixed === 'right') {
        this._setStyle({
          right: `${
          this.parent.element.offsetWidth - this.element.offsetLeft - this.element.offsetWidth
        }px`,
        });
      }
    }

    _expand() {
      this.tr._onExpand();
    }

    _collapse() {
      this.tr._onCollapse();
    }
  }

  Component.register(Td);

  class Tr extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'tr',
        data: {},
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.tbody = this.parent;
      this.table = this.tbody.table;
      this.tdList = [];
      if (this.props.data[this.table.props.keyField]) {
        this.table.rowRefs[this.props.data[this.table.props.keyField]] = this;
      }
    }

    _config() {
      const columns = this.table.props.columns;
      const { data, level } = this.props;
      const { treeConfig } = this.table.props;

      let children = [];

      if (Array.isArray(columns)) {
        this.TdList = [];
        children = this.createTds(columns);
      }

      this.setProps({
        key: data[this.table.props.keyField],
        attrs: {
          level: level,
        },
        hidden: treeConfig.initExpandLevel !== -1 && treeConfig.initExpandLevel < level,
        children: children,
      });
    }

    createTds(item) {
      const data = this.props.data;
      const that = this;

      item.forEach(function (column) {
        if (column.children && column.children.length > 0) {
          that.createTds(column.children);
        } else {
          that.tdList.push({
            component: Td,
            name: column.field,
            column: column,
            record: data,
            data: accessProp(data, column.field),
          });
        }
      });

      return that.tdList
    }

    _onExpand() {
      this.setProps({
        classes: {
          's-expanded': true,
        },
      });
      this.addClass('s-expanded');
      this._expanded = true;
    }

    _onCollapse() {
      this.setProps({
        classes: {
          's-expanded': false,
        },
      });
      this.removeClass('s-expanded');
      this._expanded = false;
    }

    _show() {
      const { data: rowData } = this.props;

      if (Array.isArray(rowData.children)) {
        rowData.children.forEach((subrowData) => {
          if (this._expanded) {
            const row = this.table.getRow(subrowData);
            row && row.show && row.show();
          }
        });
      }
    }

    _hide() {
      const { data: rowData } = this.props;

      if (Array.isArray(rowData.children)) {
        rowData.children.forEach((subrowData) => {
          const row = this.table.getRow(subrowData);
          row && row.hide && row.hide();
        });
      }
    }
  }

  Component.register(Tr);

  class Tbody extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'tbody',
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.table = this.parent;
    }

    _config() {
      const { data = [], rowDefaults } = this.table.props;
      const rows = [];
      this._getRows(data, rows, 0, 0);

      this.setProps({
        children: rows,
        childDefaults: rowDefaults,
      });
    }

    _getRows(data, rows, index, level) {
      const curLevel = level;
      for (const item of data) {
        rows.push({
          component: Tr,
          data: item,
          index: index++,
          level: curLevel,
          isLeaf: !(item.children && item.children.length > 0),
        });

        if (item.children && item.children.length > 0) {
          this._getRows(item.children, rows, index, curLevel + 1);
        }
      }
    }
  }

  Component.register(Tbody);

  class Th extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'th',
        column: {},
        sortDirection: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.tr = this.parent;
      this.table = this.tr.table;
    }

    _config() {
      const that = this;
      let sortIcon = 'sort';
      if (this.props.column.sortDirection === 'asc') {
        sortIcon = 'sort-up';
      }

      if (this.props.column.sortDirection === 'desc') {
        sortIcon = 'sort-down';
      }

      const children = {
        component: 'Cols',
        align: 'center',
        justify: this.props.column.colSpan > 1 ? 'center' : null,
        items: [
          {
            children: this.props.column.header || this.props.column.title,
          },
          {
            component: 'Icon',
            type: sortIcon,
            hidden: !this.props.column.sortable || this.props.column.colSpan > 1,
            onClick: function () {
              that.onSortChange();
            },
          },
          {
            component: 'Icon',
            type: 'pin',
            hidden: !that.table.hasGrid || !that.table.grid.props.allowFrozenCols,
            onClick: function () {
              // that.table.grid.handlePinClick(that.props.column)
            },
          },
        ],
      };

      this.setProps({
        children: children,
        classes: {
          'nom-table-fixed-left': this.props.column.fixed === 'left',
          'nom-table-fixed-left-last': this.props.column.lastLeft,
          'nom-table-fixed-right': this.props.column.fixed === 'right',
          'nom-table-fixed-right-first': this.props.column.firstRight,
          'nom-table-parent-th': this.props.column.colSpan > 1,
        },
        attrs: {
          colspan: this.props.column.colSpan,
          rowspan: this.props.column.rowSpan,
        },
      });
    }

    _rendered() {
      if (this.props.column.fixed === 'left') {
        this._setStyle({ left: `${this.element.offsetLeft}px` });
      } else if (this.props.column.fixed === 'right') {
        this._setStyle({
          right: `${
          this.parent.element.offsetWidth - this.element.offsetLeft - this.element.offsetWidth
        }px`,
        });
      }
    }

    onSortChange() {
      const that = this;
      if (that.props.column.sortDirection === 'asc') {
        that.update({
          column: { ...that.props.column, ...{ sortDirection: 'desc' } },
        });
      } else if (that.props.column.sortDirection === 'desc') {
        that.update({
          column: { ...that.props.column, ...{ sortDirection: null } },
        });
      } else {
        that.update({
          column: { ...that.props.column, ...{ sortDirection: 'asc' } },
        });
      }
      that.table.grid.handleSort(that.props.column);
    }
  }

  Component.register(Th);

  class TheadTr extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'tr',
        columns: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.thead = this.parent;
      this.table = this.thead.table;
    }

    _config() {
      const { columns } = this.props;

      const children =
        Array.isArray(columns) &&
        columns.map(function (column) {
          return {
            component: Th,
            column: column,
          }
        });

      this.setProps({
        children: children,
      });
    }
  }

  Component.register(TheadTr);

  class Thead extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'thead',
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.table = this.parent;
    }

    _config() {
      const { columns } = this.table.props;
      const arr = this.mapHeadData(columns);

      const children = [];
      for (let i = 0; i < arr.length; i++) {
        children.push({ component: TheadTr, columns: arr[i] });
      }

      this.setProps({
        children: children,
      });
    }

    mapHeadData(rootColumns) {
      const rows = [];

      function fillRowCells(columns, colIndex, rowIndex) {
        // Init rows
        rows[rowIndex] = rows[rowIndex] || [];

        let currentColIndex = colIndex;
        const colSpans = columns.filter(Boolean).map((column) => {
          const cell = {
            field: column.field || null,
            title: column.title,
            width: column.width || null,
            sortable: column.sortable || null,
          };

          let colSpan = 1;

          const subColumns = column.children;
          if (subColumns && subColumns.length > 0) {
            colSpan = fillRowCells(subColumns, currentColIndex, rowIndex + 1).reduce(
              (total, count) => total + count,
              0,
            );
            cell.hasSubColumns = true;
          }

          // if ('colSpan' in column) {
          //   ;({ colSpan } = column)
          // }

          if ('rowSpan' in column) {
            cell.rowSpan = column.rowSpan;
          }

          cell.colSpan = colSpan;
          // cell.colEnd = cell.colStart + colSpan - 1
          rows[rowIndex].push(cell);

          currentColIndex += colSpan;

          return colSpan
        });

        return colSpans
      }

      // Generate `rows` cell data
      fillRowCells(rootColumns, 0, 0);

      // Handle `rowSpan`
      const rowCount = rows.length;

      for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
        rows[rowIndex].forEach((cell) => {
          if (!('rowSpan' in cell) && !cell.hasSubColumns) {
            cell.rowSpan = rowCount - rowIndex;
          }
        });
      }

      return rows
    }
  }

  Component.register(Thead);

  class Table extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'table',
        columns: [],
        rowDefaults: {},
        onlyHead: false,
        onlyBody: false,
        keyField: 'id',
        treeConfig: {
          childrenField:'children',
          treeNodeColumn: null,
          initExpandLevel: -1,
          indentSize: 6
        },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();

      this.hasGrid = this.parent.parent.componentType === 'Grid';

      if (this.hasGrid) {
        this.grid = this.parent.parent;
      }

      this.rowRefs = {};
    }

    _config() {
      this._propStyleClasses = ['line', 'bordered'];
      this.setProps({
        tag: 'table',
        children: [
          { component: ColGroup },
          this.props.onlyBody !== true && { component: Thead },
          this.props.onlyHead !== true && { component: Tbody },
        ],
      });
    }

    _rendered() {
      if (this.loadingInst) {
        this.loadingInst.remove();
        this.loadingInst = null;
      }
    }

    getRow(param) {
      let result = null;

      if (param instanceof Component) {
        return param
      }

      if (isFunction$1(param)) {
        for (const key in this.rowRefs) {
          if (this.rowRefs.hasOwnProperty(key)) {
            if (param.call(this.rowRefs[key]) === true) {
              result = this.rowRefs[key];
              break
            }
          }
        }
      } else if (isPlainObject(param)) {
        return this.rowRefs[param[this.props.keyField]]
      } else {
        return this.rowRefs[param]
      }

      return result
    }

    loading() {
      this.loadingInst = new Loading({
        container: this.parent,
      });
    }
  }

  Component.register(Table);

  class GridBody extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        children: { component: Table },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.grid = this.parent;
      this.grid.body = this;
    }

    _config() {
      this.setProps({
        children: {
          columns: this.grid.props.columns,
          data: this.grid.props.data,
          attrs: {
            style: {
              minWidth: `${this.grid.minWidth}px`,
            },
          },
          onlyBody: true,
          line: this.props.line,
          rowDefaults: this.props.rowDefaults,
          treeConfig: this.grid.props.treeConfig,
        },
        attrs: {
          onscroll: () => {
            const { scrollLeft } = this.element;

            this.grid.header.element.scrollLeft = scrollLeft;

            // console.log(scrollLeft)
            // console.log(this.grid.header.element.scrollLeft)
            // if (scrollLeft > this.grid.header.element.scrollLeft) {
            //   debugger
            // }

            // this.grid.update({
            //   classes: {
            //     'nom-table-has-left-fixed': scrollLeft > 0,
            //     'nom-table-has-right-fixed': scrollLeft !== this.element.scrollWidth,
            //   },
            // })
          },
        },
      });
    }
  }

  Component.register(GridBody);

  class GridHeader extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        children: { component: Table },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.grid = this.parent;
      this.grid.header = this;
    }

    _config() {
      this.setProps({
        children: {
          columns: this.grid.props.columns,
          data: this.grid.data,
          attrs: {
            style: {
              minWidth: `${this.grid.minWidth}px`,
            },
          },
          onlyHead: true,
          line: this.props.line,
        },
      });
    }
  }

  Component.register(GridHeader);

  class Grid extends Component {
    constructor(props, ...mixins) {
      super(Component.extendProps(Grid.defaults, props), ...mixins);
    }

    _created() {
      this.minWidth = 0;
      this.lastSortField = null;
    }

    _config() {
      this._propStyleClasses = ['bordered'];

      const { line, rowDefaults, frozenLeftCols, frozenRightCols } = this.props;

      if (frozenLeftCols || frozenRightCols) {
        const rev = this.props.columns.length - frozenRightCols;

        const c = this.props.columns.map(function (n, i) {
          if (i + 1 < frozenLeftCols) {
            return {
              ...{
                fixed: 'left',
              },
              ...n,
            }
          }

          if (i + 1 === frozenLeftCols) {
            return {
              ...{
                fixed: 'left',
                lastLeft: true,
              },
              ...n,
            }
          }

          if (i === rev) {
            return {
              ...{
                fixed: 'right',
                firstRight: true,
              },
              ...n,
            }
          }

          if (i > rev) {
            return {
              ...{
                fixed: 'right',
              },
              ...n,
            }
          }

          return n
        });

        this.props.columns = c;
      }

      this._calcMinWidth();

      this.setProps({
        classes: {
          'm-frozen-header': this.props.frozenHeader,
        },
        children: [
          { component: GridHeader, line: line },
          { component: GridBody, line: line, rowDefaults: rowDefaults },
        ],
      });
    }

    _calcMinWidth() {
      this.minWidth = 0;
      const { props } = this;
      for (let i = 0; i < props.columns.length; i++) {
        const column = props.columns[i];
        if (column.width) {
          this.minWidth += column.width;
        } else {
          this.minWidth += 120;
        }
      }
    }

    _rendered() {
      if (this.loadingInst) {
        this.loadingInst.remove();
        this.loadingInst = null;
      }
    }

    loading() {
      this.loadingInst = new Loading({
        container: this.parent,
      });
    }

    setSortDirection(sorter) {
      const c = this.props.columns.map(function (item) {
        if (item.field === sorter.field) {
          return {
            ...item,
            ...{
              sortDirection: sorter.sortDirection,
            },
          }
        }
        return {
          ...item,
          ...{
            sortDirection: null,
          },
        }
      });

      this.update({ columns: c });
    }

    handleSort(sorter) {
      const key = sorter.field;
      if (!sorter.sortDirection) return

      if (isFunction$1(sorter.sortable)) {
        let arr = [];
        if (this.lastSortField === key) {
          arr = this.props.data.reverse();
        } else {
          arr = this.props.data.sort(sorter.sortable);
        }
        this.setSortDirection(sorter);
        this.update({ data: arr });
        this.lastSortField = key;
        return
      }

      this._callHandler(this.props.onSort, {
        field: sorter.field,
        sortDirection: sorter.sortDirection,
      });

      this.setSortDirection(sorter);
      this.lastSortField = key;
    }

    // handlePinClick(data) {
    //   const { columns } = this.props

    //   const arr = columns.filter(function (item) {
    //     return item.field === data.field
    //   })
    // }
  }

  Grid.defaults = {
    columns: [],
    data: [],
    frozenHeader: false,
    frozenLeftCols: null,
    frozenRightCols: null,
    allowFrozenCols: false,
    onSort: null,
  };

  Component.register(Grid);

  class GroupList extends Group {
    constructor(props, ...mixins) {
      const defaults = {
        fieldDefaults: { component: Group },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const that = this;
      const { groupDefaults, value, addDefaultValue } = this.props;
      const extGroupDefaults = Component.extendProps(groupDefaults, {
        _config: function () {
          const group = this;
          this.setProps({
            action: [
              {
                component: 'Button',
                text: '移除',
                onClick: () => {
                  group.remove();
                  that._onValueChange();
                },
              },
            ],
          });
        },
      });

      const groups = [];
      if (Array.isArray(value)) {
        value.forEach(function (item) {
          groups.push(Component.extendProps(extGroupDefaults, { value: item }));
        });
      }

      this.setProps({
        fields: groups,
        fieldDefaults: extGroupDefaults,
        controlAction: [
          {
            component: 'Button',
            type: 'dashed',
            text: '添加',
            span: 12,
            block: true,
            onClick: () => {
              extGroupDefaults.value = isFunction$1(addDefaultValue)
                ? addDefaultValue.call(this)
                : addDefaultValue;
              that.appendField(extGroupDefaults);
              that._onValueChange();
            },
          },
        ],
      });

      super._config();
    }

    getValue() {
      const value = [];
      for (let i = 0; i < this.fields.length; i++) {
        const field = this.fields[i];
        if (field.getValue) {
          const fieldValue = field.getValue();
          value.push(fieldValue);
        }
      }

      return value
    }

    setValue(value) {
      if (Array.isArray(value)) {
        for (let i = 0; i < this.fields.length; i++) {
          const field = this.fields[i];
          if (field.setValue) {
            field.setValue(value[i]);
          }
        }
      }
    }
  }

  Component.register(GroupList);

  class MaskInfo extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'span',
        type: null,
        text: null,
        mask: true,
        icon: true,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.originText = this.props.text;
    }

    _config() {
      const { text, type, icon } = this.props;
      const that = this;

      if (this.props.mask === true) {
        this.props.text = MaskInfo.format({
          value: text,
          type: type,
        });
      } else {
        this.props.text = this.originText;
      }

      let textNode = null;

      if (icon) {
        textNode = {
          tag: 'span',
          children: this.props.text,
        };
      } else if (!this.props.mask) {
        textNode = {
          tag: 'span',
          children: this.props.text,
        };
        if (that.tooltip) {
          that.tooltip.remove();
          delete that.tooltip;
        }
      } else {
        textNode = {
          tag: 'span',
          children: this.props.text,
          onClick: () => {
            that.handleClick();
          },
        };
      }

      const children = [
        textNode,
        this.props.mask &&
          !!icon &&
          Component.normalizeIconProps({
            type: 'eye',
            onClick: function () {
              that.handleClick();
            },
          }),
      ];

      this.setProps({
        children: children,
      });
    }

    _rendered() {
      if (this.props.mask && !this.props.icon) {
        this.tooltip = new nomui.Tooltip({ trigger: this, children: '点击显示完整信息' });
      }
    }

    handleClick() {
      this.props.mask = false;
      this.update(this.props.text);
      this.update(this.props.mask);
    }

    static format(data) {
      const { value, type } = data;

      if (!value) {
        return ''
      }
      if (value === 'NA' || value === '') {
        return value
      }

      let newText = '';

      // 手机号
      if (type === 'mobile') {
        newText = value.replace(/(\d{1,3})(\d{4})(\d+)/g, '$1****$3');
      }
      // 电话号码
      else if (type === 'phone') {
        newText = value.replace(/(\d+)(\d{4})/g, '$1*****');
      }
      // 传真号码
      else if (type === 'fax') {
        newText = value.replace(/(\d+)(\d{4})/g, '$1*****');
      }
      // 邮箱
      else if (type === 'mail') {
        let strend;
        if (value.indexOf('@') < 5) {
          strend = value.substring(1, value.lastIndexOf('@') - 1);
        } else {
          strend = value.substring(2, value.lastIndexOf('@') - 2);
        }
        newText = value.replace(strend, '***');
      }
      // 银行卡
      else if (type === 'card') {
        const strend = value.substring(0, value.length - 4);
        newText = value.replace(strend, '************');
      }

      // 身份证
      else if (type === 'identity') {
        newText = value.replace(/(\d{4}).*(\w{3})/gi, '$1***********$2');
      }
      // 姓名
      else if (type === 'name') {
        const strend = value.substring(0, value.length - 1);
        let star = '';
        for (let i = 0; i < strend.length; i++) {
          star += '*';
        }
        newText = value.replace(strend, star);
      }
      // 中间
      else if (type === 'middle') {
        if (value.length <= 4) {
          newText = '****';
        } else if (value.length > 4 && value.length <= 8) {
          const strend = value.substring(value.length - 4, value.length);
          newText = `****${strend}`;
        } else {
          const strend = value.substring(0, value.length - 8);
          const strend2 = value.substring(value.length - 4, value.length);
          newText = `${strend}****${strend2}`;
        }
      }

      // 其他
      else if (!type || type === 'other') {
        if (value.length > 4) {
          const strend = value.substring(0, value.length - 4);
          newText = `${strend}****`;
        } else {
          newText = '';
          for (let i = 0; i < value.length; i++) {
            newText += '*';
          }
        }
      }
      return newText
    }
  }

  Component.register(MaskInfo);

  class MenuItem extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'a',
        url: null,
        icon: null,
        text: null,
        subtext: null,
        indicator: {
          component: 'Icon',
          expandable: {
            expandedProps: {
              type: 'up',
            },
            collapsedProps: {
              type: 'down',
            },
          },
          type: 'down',
        },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.wrapper = this.parent;
      this.wrapper.item = this;
      this.menu = this.wrapper.menu;
      this.level = this.wrapper.level;
      this.isLeaf = this.wrapper.isLeaf;
      this.menu.itemRefs[this.key] = this;
      this.parentItem = null;
      if (this.wrapper.parentWrapper) {
        this.parentItem = this.wrapper.parentWrapper.item;
      }
      this.handleSelect = this.handleSelect.bind(this);
    }

    _config() {
      const { menu } = this;
      const { onSelect, onUnselect } = this.props;
      const menuProps = menu.props;

      let indicatorIconType = 'down';
      if (menuProps.direction === 'horizontal' && this.level > 0) {
        indicatorIconType = 'right';
      }

      if (menuProps.direction === 'horizontal') {
        this.setProps({
          indicator: {
            expandable: false,
          },
        });
      }

      this.setProps({
        indicator: {
          type: indicatorIconType,
          classes: { 'nom-menu-toggler': true },
          _created() {
            this.parent.indicator = this;
          },
        },
        selectable: {
          byClick: menuProps.itemSelectable.byClick,
        },
        expandable: {
          byClick: !this.isLeaf,
          target: function () {
            return this.wrapper.submenu
          },
        },
        attrs: {
          href: this.getItemUrl(this.props.url),
          style: {
            paddingLeft:
              menuProps.direction === 'vertical' ? `${(this.level + 1) * menuProps.indent}rem` : null,
          },
        },
        onSelect: () => {
          if (menu.selectedItem !== null) menu.selectedItem.unselect();
          menu.selectedItem = this;
          this._callHandler(onSelect);
        },
        onUnselect: () => {
          if (menu.selectedItem === this) menu.selectedItem = null;
          this._callHandler(onUnselect);
        },
      });

      this.setProps({
        children: [
          this.props.icon && {
            component: 'Icon',
            type: this.props.icon,
            classes: { 'nom-menu-item-icon': true },
          },
          { component: Component, tag: 'span', classes: { text: true }, children: this.props.text },
          this.props.subtext && {
            component: Component,
            tag: 'span',
            classes: { subtext: true },
            children: this.props.subtext,
          },
          this.props.indicator && !this.isLeaf && this.props.indicator,
        ],
      });
    }

    handleSelect() {

    }

    _collapse() {
      this.indicator && this.indicator.collapse();
      if (this.menu.props.itemExpandable.expandSingle === true) {
        this.wrapper.parent.expandedChildItem = null;
      }
    }

    _expand() {
      this.indicator && this.indicator.expand();
      if (this.menu.props.itemExpandable.expandSingle === true) {
        if (this.wrapper.parent.expandedChildItem) {
          this.wrapper.parent.expandedChildItem.collapse();
        }
        this.wrapper.parent.expandedChildItem = this;
      }
    }

    getItemUrl(url) {
      if (url) {
        return url
      }

      return 'javascript:void(0);'
    }
  }

  Component.register(MenuItem);

  class MenuSub extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'ul',
        itemDefaults: {
          component: 'menu-item',
        },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.wrapper = this.props.wrapper || this.parent;
      this.wrapper.submenu = this;
      this.menu = this.wrapper.menu;
      this.props.itemDefaults = this.menu.props.itemDefaults;
    }

    _config() {
      const that = this;

      const children =
        Array.isArray(this.props.items) &&
        this.props.items.map(function (item) {
          return {
            component: 'MenuItemWrapper',
            item: Component.extendProps({}, that.props.itemDefaults, item),
            items: item.items,
          }
        });

      const typeClass = `nom-menu-${this.menu.props.type}`;
      const classes = {};
      classes[typeClass] = true;
      this.setProps({
        classes: classes,
        children: children,
      });
    }
  }

  Component.register(MenuSub);

  class MenuItemWrapper extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'li',
        item: {
          component: MenuItem,
        },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.isLeaf = false;
      this.level = 0;
      this.parentWrapper = null;

      if (this.parent instanceof Component.components.Menu) {
        this.menu = this.parent;
      } else if (this.parent instanceof Component.components.MenuSub) {
        this.menu = this.parent.menu;
        this.parentWrapper = this.parent.wrapper;
      }

      if (this.parentWrapper) {
        this.level = this.parentWrapper.level + 1;
      }

      this.isLeaf = !Array.isArray(this.props.item.items) || this.props.item.items.length < 1;
    }

    _config() {
      const that = this;
      const { menu } = this;
      const menuProps = menu.props;
      const expanded =
        menuProps.direction === 'horizontal' || menuProps.itemExpandable.initExpandLevel >= this.level;

      this.setProps({
        submenu: menuProps.submenu,
      });

      this.setProps({
        submenu: {
          component: MenuSub,
          name: 'submenu',
          items: this.props.item.items,
          hidden: !expanded,
        },
      });

      if (menuProps.direction === 'horizontal' && !this.isLeaf) {
        let reference = document.body;
        if (this.level > 0) {
          reference = this;
        }
        let align = 'bottom left';
        if (this.level > 0) {
          align = 'right top';
        }

        this.setProps({
          submenu: {
            wrapper: that,
          },
        });

        this.setProps({
          item: {
            popup: {
              triggerAction: 'hover',
              align: align,
              reference: reference,
              children: this.props.submenu,
            },
          },
        });
      }

      this.setProps({
        children: [
          this.props.item,
          !this.isLeaf && menuProps.direction === 'vertical' && this.props.submenu,
        ],
      });
    }
  }

  Component.register(MenuItemWrapper);

  class Menu extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'ul',
        items: [],
        itemDefaults: {
          component: MenuItem,
        },
        itemSelectable: {
          onlyleaf: false,
          byClick: false,
        },
        itemExpandable: {
          expandSingle: true,
          initExpandLevel: -1,
        },

        indent: 1.5,
        direction: 'vertical'
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.itemRefs = [];
      this.selectedItem = null;
    }

    _config() {
      this._addPropStyle('direction');
      const that = this;
      const children = this.props.items.map(function (item) {
        return {
          component: MenuItemWrapper,
          item: Component.extendProps({}, that.props.itemDefaults, item),
        }
      });

      this.setProps({
        children: children,
      });
    }

    getItem(param) {
      let retItem = null;

      if (isFunction$1(param)) {
        for (const key in this.itemRefs) {
          if (this.itemRefs.hasOwnProperty(key)) {
            if (param.call(this.itemRefs[key]) === true) {
              retItem = this.itemRefs[key];
              break
            }
          }
        }
      } else {
        return this.itemRefs[param] || null
      }

      return retItem
    }

    selectItem(param, selectOption) {
      const item = this.getItem(param);
      if (item === null || item === undefined) {
        return false
      }
      return item.select(selectOption)
    }

    unselectItem(param, unselectOption) {
      unselectOption = extend(
        {
          triggerUnselect: true,
          triggerSelectionChange: true,
        },
        unselectOption,
      );
      const item = this.getItem(param);
      if (item === null) {
        return false
      }
      return item.unselect(unselectOption)
    }

    getSelectedItem() {
      return this.selectedItem
    }

    expandToItem(param) {
      const item = this.getItem(param);
      if (item !== null) {
        let p = item.parentItem;
        while (p) {
          p.expand();
          p = p.parentItem;
        }
      }
    }
  }

  Component.register(Menu);

  class Message extends Layer {
    constructor(props, ...mixins) {
      const defaults = {
        type: null,
        icon: null,
        content: null,
        duration: 2,
        closeToRemove: true,
        position: {
          my: 'center center',
          at: 'center center',
          of: window,
        },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {   
      this._addPropStyle('type');
      const iconMap = {
        info: 'info-circle',
        success: 'check-circle',
        error: 'close-circle',
        warning: 'exclamation-circle',
      };

      const icon = this.props.icon || iconMap[this.props.type];
      let iconProps = Component.normalizeIconProps(icon);
      if (iconProps) {
        iconProps = Component.extendProps(iconProps, { classes: { 'nom-message-icon': true } });
      }
      this.props.content = Component.normalizeTemplateProps(this.props.content);
      this.setProps({
        content: {
          classes: {
            'nom-message-content': true,
          },
        },
      });
      this.setProps({
        children: [
          iconProps,
          this.props.content,
        ],
      });

      super._config();
    }

    close() {
      this.remove();
    }

    _rendered() {
      const that = this;
      const { props } = this;

      if (props.duration) {
        setTimeout(function () {
          that.close();
        }, 1000 * props.duration);
      }
    }
  }

  Component.register(Message);

  // Thanks to https://github.com/andreypopp/react-textarea-autosize/
  /**
   * calculateNodeHeight(uiTextNode)
   */
  const HIDDEN_TEXTAREA_STYLE = `
  min-height:0 !important;
  max-height:none !important;
  height:0 !important;
  visibility:hidden !important;
  overflow:hidden !important;
  position:absolute !important;
  z-index:-1000 !important;
  top:0 !important;
  right:0 !important
`;

  const SIZING_STYLE = [
    'letter-spacing',
    'line-height',
    'padding-top',
    'padding-bottom',
    'font-family',
    'font-weight',
    'font-size',
    'font-variant',
    'text-rendering',
    'text-transform',
    'width',
    'text-indent',
    'padding-left',
    'padding-right',
    'border-width',
    'box-sizing',
  ];

  let hiddenTextarea;

  function calculateNodeStyling(node) {
    const style = window.getComputedStyle(node);

    const boxSizing =
      style.getPropertyValue('box-sizing') ||
      style.getPropertyValue('-moz-box-sizing') ||
      style.getPropertyValue('-webkit-box-sizing');

    const paddingSize =
      parseFloat(style.getPropertyValue('padding-bottom')) +
      parseFloat(style.getPropertyValue('padding-top'));

    const borderSize =
      parseFloat(style.getPropertyValue('border-bottom-width')) +
      parseFloat(style.getPropertyValue('border-top-width'));

    const sizingStyle = SIZING_STYLE.map((name) => `${name}:${style.getPropertyValue(name)}`).join(
      ';',
    );

    const nodeInfo = {
      sizingStyle,
      paddingSize,
      borderSize,
      boxSizing,
    };

    return nodeInfo
  }

  function calculateNodeHeight(uiTextNode, minRows = null, maxRows = null) {
    if (!hiddenTextarea) {
      hiddenTextarea = document.createElement('textarea');
      hiddenTextarea.setAttribute('tab-index', '-1');
      hiddenTextarea.setAttribute('aria-hidden', 'true');
      document.body.appendChild(hiddenTextarea);
    }

    // Fix wrap="off" issue
    // https://github.com/ant-design/ant-design/issues/6577
    if (uiTextNode.getAttribute('wrap')) {
      hiddenTextarea.setAttribute('wrap', `${uiTextNode.getAttribute('wrap')}`);
    } else {
      hiddenTextarea.removeAttribute('wrap');
    }

    // Copy all CSS properties that have an impact on the height of the content in
    // the textbox
    const { paddingSize, borderSize, boxSizing, sizingStyle } = calculateNodeStyling(uiTextNode);

    // Need to have the overflow attribute to hide the scrollbar otherwise
    // text-lines will not calculated properly as the shadow will technically be
    // narrower for content
    hiddenTextarea.setAttribute('style', `${sizingStyle};${HIDDEN_TEXTAREA_STYLE}`);
    hiddenTextarea.value = uiTextNode.value || uiTextNode.placeholder || '';

    let minHeight = Number.MIN_SAFE_INTEGER;
    let maxHeight = Number.MAX_SAFE_INTEGER;
    let height = hiddenTextarea.scrollHeight;
    let overflowY;

    if (boxSizing === 'border-box') {
      // border-box: add border, since height = content + padding + border
      height += borderSize;
    } else if (boxSizing === 'content-box') {
      // remove padding, since height = content
      height -= paddingSize;
    }

    if (minRows !== null || maxRows !== null) {
      // measure height of a textarea with a single row
      hiddenTextarea.value = ' ';
      const singleRowHeight = hiddenTextarea.scrollHeight - paddingSize;
      if (minRows !== null) {
        minHeight = singleRowHeight * minRows;
        if (boxSizing === 'border-box') {
          minHeight = minHeight + paddingSize + borderSize;
        }
        height = Math.max(minHeight, height);
      }
      if (maxRows !== null) {
        maxHeight = singleRowHeight * maxRows;
        if (boxSizing === 'border-box') {
          maxHeight = maxHeight + paddingSize + borderSize;
        }
        overflowY = height > maxHeight ? '' : 'hidden';
        height = Math.min(maxHeight, height);
      }
    }
    return {
      height: `${height}px`,
      minHeight: `${minHeight}px`,
      maxHeight: `${maxHeight}px`,
      overflowY: overflowY ? `${overflowY}px` : undefined,
      resize: 'none',
    }
  }

  class Textarea extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'textarea',
        attrs: {
          autocomplete: 'off',
        },
        autoSize: false, // boolean|{minRows:number,maxRows:number}
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.multilineTextbox = this.parent;
      this.multilineTextbox.textarea = this;

      this.capsLock = false;
    }

    _config() {
      this.setProps({
        attrs: {
          oninput: () => {
            if (!this.capsLock) {
              this.multilineTextbox._onValueChange();
            }
            this.resizeTextarea();
          },
          oncompositionstart: () => {
            this.capsLock = true;
          },
          oncompositionend: () => {
            this.capsLock = false;
            this.multilineTextbox.trigger('input');
          },
          onblur: () => {
            this.multilineTextbox.trigger('blur');
          },
        },
      });
    }

    _rendered() {
      if (this.multilineTextbox.props.autofocus === true) {
        this.focus();
      }
      this.resizeTextarea();
    }

    _remove() {
      cancelAnimationFrame && cancelAnimationFrame(this.resizeFrameId);
    }

    resizeTextarea() {
      const { autoSize } = this.props;
      if (!autoSize && this.element) {
        return
      }
      cancelAnimationFrame && cancelAnimationFrame(this.resizeFrameId);
      this.resizeFrameId = requestAnimationFrame(() => {
        // TODO 需要修改为  updateStyles
        this._setStyle({
          overflow: 'hidden',
        });
        const { minRows, maxRows } = autoSize;
        const textareaStyles = calculateNodeHeight(this.element, minRows, maxRows);
        // TODO 需要修改为  updateStyles
        this._setStyle({
          overflow: 'inherit',
          ...textareaStyles,
        });
        this.fixFirefoxAutoScroll();
      });
    }

    // https://github.com/ant-design/ant-design/issues/21870
    fixFirefoxAutoScroll() {
      try {
        if (document.activeElement === this.element) {
          const currentStart = this.element.selectionStart;
          const currentEnd = this.element.selectionEnd;
          this.element.setSelectionRange(currentStart, currentEnd);
        }
      } catch (e) {
        // Fix error in Chrome:
        // Failed to read the 'selectionStart' property from 'HTMLInputElement'
        // http://stackoverflow.com/q/21177489/3040605
      }
    }

    getText() {
      return this.element.value
    }

    setText(text) {
      this.element.value = text;
    }

    focus() {
      this.element.focus();
    }

    blur() {
      this.element.blur();
    }

    disable() {
      this.element.setAttribute('disabled', 'disabled');
    }

    enable() {
      this.element.removeAttribute('disabled', 'disabled');
    }
  }

  Component.register(Textarea);

  class MultilineTextbox extends Field {
    constructor(props, ...mixins) {
      const defaults = {
        autofocus: false,
        autoSize: false, // boolean|{minRows:number,maxRows:number}
        placeholder: null,
        value: null,
        maxLength: null,
        rows: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const that = this;
      const { autoSize, value, placeholder, autofocus, rows, maxLength } = this.props;

      this.setProps({
        control: {
          children: {
            component: Textarea,
            autoSize,
            attrs: {
              value,
              placeholder,
              autofocus,
              rows,
              maxLength,
            },
            _created: function () {
              this.multilineTextbox = that;
              this.multilineTextbox.textarea = this;
            },
          },
        },
      });
      super._config();
    }

    getText() {
      return this.textarea.getText()
    }

    _getValue() {
      const inputText = this.getText();
      if (inputText === '') {
        return null
      }
      return inputText
    }

    _setValue(value) {
      this.textarea.setText(value);
    }

    focus() {
      this.textarea.focus();
    }

    blur() {
      this.textarea.blur();
    }

    _disable() {
      this.textarea.disable();
    }

    _enable() {
      this.textarea.enable();
    }
  }

  Component.register(MultilineTextbox);

  class NavbarCaption extends Component {
    // constructor(props, ...mixins) {
    //   super(props, ...mixins)
    // }
  }

  Component.register(NavbarCaption);

  class NavbarCaptionBefore extends Component {
    // constructor(props, ...mixins) {
    //   super(props, ...mixins)
    // }
  }

  Component.register(NavbarCaptionBefore);

  class NavbarCaptionAfter extends Component {
    // constructor(props, ...mixins) {
    //   super(props, ...mixins)
    // }
  }

  Component.register(NavbarCaptionAfter);

  class NavbarNav extends Component {
    // constructor(props, ...mixins) {
    //   super(props, ...mixins)
    // }
  }

  Component.register(NavbarNav);

  class NavbarTools extends Component {
    // constructor(props, ...mixins) {
    //     super(props, ...mixins)
    // }
  }

  Component.register(NavbarTools);

  class Navbar extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        caption: null,
        nav: null,
        tools: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    config() {
      this._addPropStyle('fit');
      const { caption, nav, tools, captionBefore, captionAfter } = this.props;
      let toolsProps, captionBeforeProps, captionAfterProps;
      const captionProps = caption
        ? Component.extendProps({ component: Caption, titleLevel: 3 }, caption)
        : null;
      const navProps = nav ? Component.extendProps({ component: Cols }, nav) : null;
      if (Array.isArray(tools)) {
        toolsProps = { component: Cols, items: tools };
      } else if (isPlainObject(tools)) {
        toolsProps = Component.extendProps({ component: Cols }, tools);
      }
      if (Array.isArray(captionBefore)) {
        captionBeforeProps = { component: Cols, items: captionBefore };
      } else if (isPlainObject(tools)) {
        captionBeforeProps = Component.extendProps({ component: Cols }, captionBefore);
      }
      if (Array.isArray(captionAfter)) {
        captionAfterProps = { component: Cols, items: captionAfter };
      } else if (isPlainObject(tools)) {
        captionAfterProps = Component.extendProps({ component: Cols }, captionAfter);
      }

      this.setProps({
        children: [
          captionBeforeProps && { component: NavbarCaptionBefore, children: captionBeforeProps },
          captionProps && { component: NavbarCaption, children: captionProps },
          captionAfterProps && { component: NavbarCaptionAfter, children: captionAfterProps },
          navProps && { component: NavbarNav, children: navProps },
          toolsProps && { component: NavbarTools, children: toolsProps },
        ],
      });
    }
  }

  Component.register(Navbar);

  class Numberbox extends Textbox {
    constructor(props, ...mixins) {
      const defaults = {
        min: null,
        max: null,
        precision: 0,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const rules = [];
      if (this.props.precision === 0) {
        rules.push({
          type: 'regex',
          value: {
            pattern: '^(\\-|\\+)?(0|[1-9][0-9]*)$',
          },
          message: '请输入整数',
        });
      }
      if (this.props.precision > 0) {
        rules.push({
          type: 'regex',
          value: {
            pattern: `^(\\-|\\+)?(0|[1-9][0-9]*)(\\.\\d{${this.props.precision}})$`,
          },
          message: `请输入 ${this.props.precision} 位小数`,
        });
      }
      if (this.props.min) {
        rules.push({
          type: 'min',
          value: this.props.min,
        });
      }
      if (this.props.max) {
        rules.push({
          type: 'max',
          value: this.props.max,
        });
      }

      this.setProps({ rules: rules });

      super._config();
    }

    _getValue() {
      const { precision } = this.props;

      let numberValue = null;
      const textValue = this.input.getText();

      if (precision) {
        const dotCount = this._dotCount(textValue);
        if (precision >= 0 && dotCount > precision) {
          numberValue = this._toDecimal(textValue, precision);
        } else {
          numberValue = parseFloat(textValue);
        }
      } else {
        numberValue = parseFloat(textValue);
      }

      if (Number.isNaN(numberValue)) {
        numberValue = null;
      }

      return numberValue
    }

    _setValue(value) {
      const { precision } = this.props;

      this.currentValue = this.getValue();

      if (precision !== null && precision !== undefined) {
        if (precision >= 0) {
          const dotCount = this._dotCount(value);
          if (dotCount > precision) {
            value = this._toDecimal(value, precision);
          }
        }
      }

      if (Number.isNaN(value)) {
        value = '';
      }

      super._setValue(value);
    }

    _toDecimal(val, precision, notRound) {
      if (notRound === undefined) {
        notRound = false;
      }
      let f = parseFloat(val);
      if (Number.isNaN(f)) {
        return
      }
      if (notRound === true) {
        f = Math.floor(val * 10 ** precision) / 10 ** precision;
      } else {
        f = Math.round(val * 10 ** precision) / 10 ** precision;
      }
      return f
    }

    _dotCount(val) {
      val = String(val);
      const dotPos = val.indexOf('.');
      const len = val.substr(dotPos + 1).length;

      return len
    }

    _getRawValue() {
      return this.input.getText()
    }
  }

  Component.register(Numberbox);

  class Pager extends Component {
    constructor(props, ...mixins) {
      super(Component.extendProps(Pager.defaults, props), ...mixins);
    }

    _config() {
      const pager = this;

      this.setProps({
        children: {
          component: 'Cols',
          justify: 'between',
          items: [
            {
              component: List,
              gutter: 'md',
              items: pager.getPageItems(),
              itemDefaults: {
                tag: 'a',
                key() {
                  return this.props.pageNumber
                },
                _config: function () {
                  this.setProps({
                    children: `${this.props.text}`,
                  });
                },
              },
              itemSelectable: {
                byClick: true,
              },
              selectedItems: pager.props.pageIndex,
              onItemSelectionChange: function (e) {
                const n = e.sender.selectedItem.props.pageNumber;

                if (n < 1) {
                  pager.props.pageIndex = 1;
                } else if (n > pager._getPageCount()) {
                  pager.props.pageIndex = pager._getPageCount();
                } else {
                  pager.props.pageIndex = n;
                }

                pager._onPageChange();
              },
            },
            {
              component: 'Cols',
              gutter: 'xs',
              items: [
                {
                  children: `共有数据${this.props.totalCount}条`,
                },
                {
                  component: 'Select',
                  value: pager.props.pageSize || 10,
                  onValueChange: (data) => {
                    pager.props.pageSize = data.newValue;
                    pager._onPageChange();
                  },
                  options: [
                    {
                      text: '10条/页',
                      value: 10,
                    },
                    {
                      text: '20条/页',
                      value: 20,
                    },
                    {
                      text: '30条/页',
                      value: 30,
                    },
                    {
                      text: '40条/页',
                      value: 40,
                    },
                    {
                      text: '50条/页',
                      value: 50,
                    },
                  ],
                },
              ],
            },
          ],
        },
      });
    }

    _onPageChange() {
      this._callHandler(this.props.onPageChange, this.getPageParams());
    }

    /**
     * 极端分页的起始和结束点，取决于pageIndex 和 displayItemCount.
     * @返回 {数组(Array)}
     */
    _getInterval() {
      const { props } = this;
      const { pageIndex } = props;
      const displayItemHalf = Math.floor(props.displayItemCount / 2);
      const pageCount = this._getPageCount();
      const upperLimit = pageCount - props.displayItemCount;
      const start =
        pageIndex > displayItemHalf
          ? Math.max(Math.min(pageIndex - displayItemHalf, upperLimit), 1)
          : 1;
      const end =
        pageIndex > displayItemHalf
          ? Math.min(pageIndex + displayItemHalf, pageCount)
          : Math.min(props.displayItemCount, pageCount);
      return [start, end]
    }

    _getPageCount() {
      return Math.ceil(this.props.totalCount / this.props.pageSize)
    }

    getPageParams() {
      return this.props.getPageParams.call(this)
    }

    getPageItems() {
      const items = [];
      const { props } = this;
      if (props.totalCount === 0) {
        return items
      }
      const { pageIndex } = props;
      const interval = this._getInterval();
      const pageCount = this._getPageCount();

      // 产生"Previous"-链接
      if (props.texts.prev && (pageIndex > 1 || props.prevShowAlways)) {
        items.push({
          pageNumber: pageIndex - 1,
          text: props.texts.prev,
          classes: { prev: true },
        });
      }
      // 产生起始点
      if (interval[0] > 1 && props.edgeItemCount > 0) {
        const end = Math.min(props.edgeItemCount, interval[0] - 1);
        for (let i = 1; i <= end; i++) {
          items.push({
            pageNumber: i,
            text: i,
            classes: '',
          });
        }
        if (props.edgeItemCount < interval[0] - 1 && props.texts.ellipse) {
          items.push({
            pageNumber: null,
            text: props.texts.ellipse,
            classes: { space: true },
            space: true,
          });
        }
      }

      // 产生内部的那些链接
      for (let i = interval[0]; i <= interval[1]; i++) {
        items.push({
          pageNumber: i,
          text: i,
          classes: '',
        });
      }
      // 产生结束点
      if (interval[1] < pageCount && props.edgeItemCount > 0) {
        if (pageCount - props.edgeItemCount > interval[1] && props.texts.ellipse) {
          items.push({
            pageNumber: null,
            text: props.texts.ellipse,
            classes: { space: true },
            space: true,
          });
        }
        const begin = Math.max(pageCount - props.edgeItemCount + 1, interval[1]);
        for (let i = begin; i <= pageCount; i++) {
          items.push({
            pageNumber: i,
            text: i,
            classes: '',
          });
        }
      }
      // 产生 "Next"-链接
      if (props.texts.next && (pageIndex < pageCount || props.nextShowAlways)) {
        items.push({
          pageNumber: pageIndex + 1,
          text: props.texts.next,
          classes: { next: true },
        });
      }

      return items
    }
  }

  Pager.defaults = {
    pageIndex: 1,
    pageSize: 10,
    totalCount: 0,
    displayItemCount: 5,
    edgeItemCount: 1,

    prevShowAlways: true,
    nextShowAlways: true,

    texts: {
      prev: '上一页',
      next: '下一页',
      ellipse: '...',
    },

    getPageParams: function () {
      const { pageIndex, pageSize } = this.props;
      let params = {};
      if (this.props.paramsType === 'skiptake') {
        params = {
          skipCount: (pageIndex - 1) * pageSize,
          maxResultCount: pageSize,
        };
      } else {
        params = {
          pageIndex: pageIndex,
          pageSize: pageSize,
        };
      }

      return params
    },
  };

  Component.register(Pager);

  class Password extends Textbox {
    constructor(props, ...mixins) {
      const defaults = {};

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();
      this.realValue = '';
    }

    _config() {
      const that = this;
      const { onValueChange } = this.props;

      this.setProps({
        onValueChange: () => {
          const pass = that.getText();

          const start = that.input.element.selectionStart; // 光标位置

          const fake = pass ? pass.split('') : [];
          let real = that.realValue ? that.realValue.split('') : [];
          const clen = fake.length - real.length;

          // 处理Value
          if (!pass) {
            that.realValue = null;
          } else {
            if (clen > 0) {
              const middle = fake.join('').replace(/\*/g, '').split('');
              const right = fake.length - start > 0 ? real.slice(-(fake.length - start)) : [];
              real = [].concat(real.slice(0, start - middle.length), middle, right);
            }

            if (clen < 0) {
              real.splice(start, Math.abs(clen));
            }
            fake.forEach(function (value, index) {
              if (value !== '*') {
                real[index] = value;
              }
            });
            that.realValue = real.join('');
          }

          that.setValue(pass ? pass.replace(/./g, '*') : null);

          // 让光标回到正确位置

          if (pass && start < pass.length) {
            that.input.element.selectionStart = start;
            that.input.element.selectionEnd = start;
          }

          that._callHandler(onValueChange);
        },
      });

      super._config();
    }

    _getValue() {
      if (!this.realValue || this.realValue === '') {
        return null
      }
      return this.realValue
    }
  }

  Component.register(Password);

  class OptionList$1 extends List {
    constructor(props, ...mixins) {
      const defaults = {
        itemDefaults: {
          tag: 'label',
          _config: function () {
            this.setProps({
              children: [
                {
                  tag: 'span',
                  classes: {
                    radio: true,
                  },
                },
                {
                  tag: 'span',
                  classes: {
                    text: true,
                  },
                  children: this.props.text,
                },
              ],
            });
          },
        },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();

      this.radioList = this.parent.parent;
      this.radioList.optionList = this;
    }

    _config() {
      const listProps = this.radioList.props;
      if (listProps.type === 'radio') {
        this.setProps({
          gutter: 'x-md',
        });
      }
      this.setProps({
        disabled: listProps.disabled,
        items: listProps.options,
        itemDefaults: listProps.optionDefaults,
        itemSelectable: {
          byClick: true,
        },
        selectedItems: listProps.value,
        onItemSelectionChange: () => {
          this.radioList._onValueChange();
        },
      });

      super._config();
    }
  }

  class RadioList extends Field {
    constructor(props, ...mixins) {
      const defaults = {
        options: [],
        uistyle: 'radio',
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this.setProps({
        optionDefaults: {
          key() {
            return this.props.value
          },
        },
      });

      this.setProps({
        optionList: {
          component: OptionList$1,
        },
      });

      this.setProps({
        control: this.props.optionList,
      });

      super._config();
    }

    getSelectedOption() {
      return this.optionList.getSelectedItem()
    }

    _getValue(options) {
      const { valueOptions } = this.props;
      options = extend(
        {
          asArray: false,
        },
        valueOptions,
        options,
      );

      const selected = this.getSelectedOption();
      if (selected !== null) {
        if (options.asArray === true) {
          return [selected.props.value]
        }
        return selected.props.value
      }

      return null
    }

    _setValue(value) {
      if (value === null) {
        this.optionList.unselectAllItems();
      } else {
        if (Array.isArray(value)) {
          value = value[0];
        }
        this.optionList.selectItem(function () {
          return this.props.value === value
        });
      }
    }

    _disable() {
      if (this.firstRender === false) {
        this.optionList.disable();
      }
    }

    _enable() {
      if (this.firstRender === false) {
        this.optionList.enable();
      }
    }
  }

  Component.register(RadioList);

  class SlideCaptcha extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        token: null,
        bgSrc: '',
        captchSrc: '',
        width: 300,
        height: 300,
        top: 0,
        // onRefresh:()=>{},
        // validate:()=>{},
        // onFinish:()=>{},
        // onFinishFailed:()=>{},
        refreshTitle: '换一张',
        tip: '向右滑动完成拼图',
        autoRefreshOnFail: true, // 失败后是否自动刷新图片
      };

      super(
        Component.extendProps(defaults, props, {
          state: {
            // 记录开始滑动的时间
            startTime: new Date(),
            // 记录结束滑动的时间
            endTime: new Date(),
            // 当前是否正在移动中
            isMove: false,
            // 位置差(相当于页面浏览器最左端)
            poorX: 0,
            // 拖拽元素距离左边的距离
            distance: 0,
          },
        }),
        ...mixins,
      );
    }

    dispatch(action) {
      let newState = {};
      switch (action.type) {
        // 重置
        case 'reset':
          newState = {
            // 记录开始滑动的时间
            startTime: new Date(),
            // 记录结束滑动的时间
            endTime: new Date(),
            // 当前是否正在移动中
            isMove: false,
            // 位置差(相当于页面浏览器最左端)
            poorX: 0,
            // 拖拽元素距离左边的距离
            distance: 0,
          };
          break
        // 记录开始时间
        case 'setStartTime':
          newState = {
            startTime: action.payload,
          };
          break
        // 记录结束时间
        case 'setEndTime':
          newState = {
            endTime: action.payload,
          };
          break
        // 记录移动状态
        case 'setMove':
          newState = {
            isMove: action.payload,
          };
          break
        // 记录位置差
        case 'setPoorX':
          newState = {
            poorX: action.payload,
          };
          break
        // 设置拖拽元素距离左边的距离
        case 'setDistance':
          newState = {
            distance: action.payload,
          };
          break
        case 'change':
          newState = {
            ...action.payload,
          };
          break
        default:
          throw new Error(`unsupport dispatch type:${action} in SlideCaptcha reducer`)
      }
      this.update({
        state: {
          ...newState,
        },
      });
    }

    /**
     * 获取最大可拖拽宽度
     */
    getMaxSlideWidth() {
      return this.props.width - 40
    }

    defaultEvent(e) {
      e.preventDefault();
    }

    refresh() {
      this.props.onRefresh && this.props.onRefresh();
      this.dispatch({ type: 'reset' });
    }

    /**
     * 鼠标/手指开始滑动
     * @param {*} currentPageX 当前所处位置距离浏览器最左边的位置
     */
    dragStart(currentPageX) {
      const { state } = this.props;
      this.dispatch({
        type: 'change',
        payload: {
          isMove: true,
          poorX: currentPageX - state.distance, // 当前位置减去已拖拽的位置作为位置差
          startTime: new Date(),
        },
      });
    }

    /**
     * 拖拽移动过程触发
     * @param {*} currentPageX 当前所处位置距离浏览器最左边的位置
     */
    dragMoving(currentPageX) {
      const { state } = this.props;
      const distance = currentPageX - state.poorX;
      // 鼠标指针移动距离超过最大时清空事件
      const maxSlideWidth = this.getMaxSlideWidth();
      if (state.isMove && distance !== state.distance && distance >= 0 && distance < maxSlideWidth) {
        this.dispatch({
          type: 'change',
          payload: {
            distance,
          },
        });
      }
    }

    /**
     * 拖拽结束触发
     * @param {*} currentPageX 当前所处位置距离浏览器最左边的位置
     */
    dragEnd() {
      const that = this;
      const { state, validate, autoRefreshOnFail, onFinish, token, onFinishFailed } = that.props;
      // 距离不能少于5 否则算没拖动
      if (!state.isMove || state.distance < 5) {
        that.dispatch({ type: 'reset' });
        return true
      }
      that.dispatch({ type: 'setMove', payload: false });
      if (state.poorX === undefined) {
        return true
      }
      that.dispatch({ type: 'setEndTime', payload: new Date() });
      setTimeout(() => {
        // 调用远程进行校验
        validate &&
          validate({
            token: token,
            point: state.distance,
            timespan: Math.abs(Number(state.endTime) - Number(state.startTime)),
          })
            .then((result) => {
              onFinish && onFinish(result);
              return result
            })
            .catch((err) => {
              if (onFinishFailed) {
                onFinishFailed(err, that.refresh);
              }
              if (autoRefreshOnFail) {
                that.refresh();
              }
            });
      });
    }

    handleMouseMove(e) {
      this.dragMoving(e.pageX);
    }

    handleMouseUp() {
      this.dragEnd();
    }

    handleRefreshCaptcha(e) {
      this.refresh();
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
      e.stopImmediatePropagation && e.stopImmediatePropagation();
    }

    _config() {
      const { width, height, bgSrc, captchSrc, top, tip, refreshTitle, state } = this.props;
      const that = this;
      this.setProps({
        attrs: {
          style: {
            height: `${height + 34}px`,
            width: `${width}px`,
          },
        },
        children: [
          {
            tag: 'div',
            attrs: {
              style: {
                width: `${width}px`,
                height: `${height}px`,
                background: '#e8e8e8',
              },
            },
            children: [
              {
                tag: 'div',
                classes: {
                  'captcha-img': true,
                },
                attrs: {
                  style: {
                    backgroundImage: `url(${bgSrc})`,
                    width: `${width}px`,
                    height: `${height}px`,
                  },
                },
              },
              {
                tag: 'div',
                classes: {
                  'small-drag': true,
                },

                attrs: {
                  style: {
                    backgroundImage: `url(${captchSrc})`,
                    top: `${top}px`,
                    left: `${state.distance}px`,
                  },
                },
              },
            ],
          },
          {
            tag: 'div',
            classes: {
              drag: true,
            },
            attrs: {
              style: {
                width: `${width}px`,
              },
            },
            children: [
              {
                tag: 'div',
                classes: {
                  'drag-bg': true,
                },
                attrs: {
                  style: {
                    width: `${state.distance}px`,
                  },
                },
              },
              {
                tag: 'div',
                classes: {
                  'drag-text': true,
                },
                attrs: {
                  style: {
                    width: `${width}px`,
                  },
                  unselectable: 'on',
                },
                children: tip,
              },
              {
                tag: 'div',
                classes: {
                  handler: true,
                  'handler-bg': true,
                },
                attrs: {
                  style: {
                    left: `${state.distance}px`,
                  },
                  onmousedown: function (e) {
                    that.dragStart(e.pageX);
                  },
                },
              },
              {
                classes: {
                  'refesh-btn': true,
                },
                component: 'Button',
                icon: 'refresh',
                shape: 'circle',
                type: 'link',
                attrs: {
                  onmouseup: this.handleRefreshCaptcha,
                  style: {
                    visibility: state.isMove ? 'hidden' : 'visible',
                  },
                  title: refreshTitle,
                },
              },
            ],
          },
        ],
      });
    }

    _created() {
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleMouseUp = this.handleMouseUp.bind(this);
      this.dragStart = this.dragStart.bind(this);
      this.dragEnd = this.dragEnd.bind(this);
      this.dragMoving = this.dragMoving.bind(this);

      this.handleRefreshCaptcha = this.handleRefreshCaptcha.bind(this);
      this.defaultEvent = this.defaultEvent.bind(this);

      // 移动鼠标、松开鼠标
      this.referenceElement.addEventListener('mousemove', this.handleMouseMove, true);
      this.referenceElement.addEventListener('mouseup', this.handleMouseUp);
    }

    _remove() {
      this.referenceElement.removeEventListener('mousemove', this.handleMouseMove, true);
      this.referenceElement.removeEventListener('mouseup', this.handleMouseUp);
    }
  }

  Component.register(SlideCaptcha);

  class StaticText extends Field {
      constructor(props, ...mixins) {
          const defaults = {
              value: null,
          };

          super(Component.extendProps(defaults, props), ...mixins);
      }

      _config() {
          this.setProps({
              control: {
                  children: this.props.value,
              }
          });
          super._config();
      }

      _setValue(value) {
          this.update({
              value,
          });
      }

      _getValue() {
          return this.props.value
      }
  }

  Component.register(StaticText);

  class Switch extends Field {
    constructor(props, ...mixins) {
      const defaults = {

        unselectedText: '关',
        selectedText: '开',
        value: false,
      };
      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const that = this;
      const { value, unselectedText, selectedText } = this.props;

      this._propStyleClasses = ['size'];
      this.setProps({
        control: {
          tag: 'button',
          classes: { 'nom-switch-control': true, 'nom-switch-active': !!value },
          attrs: {
            onclick: () => {
              that._handleClick();
            },
          },
          children: [
            {
              tag: 'input',
              _created() {
                that.ck = this;
              },
              attrs: {
                type: 'checkbox',
                hidden: true,
                checked: value,
                onchange() {
                  that._onValueChange();
                  that.update({ value: !value });
                },
              },
            },
            {
              tag: 'div',
              classes: {
                'nom-switch-el': true,
                'nom-switch-text': value,
                'nom-switch-indicator': !value,
              },
              children: value ? selectedText : null,
            },
            {
              tag: 'div',
              children: value ? null : unselectedText,
              classes: {
                'nom-switch-el': true,
                'nom-switch-text': !value,
                'nom-switch-indicator': value,
              },
            },
          ],
        }
      });

      super._config();
    }

    _handleClick() {
      if (this.ck) {
        this.ck.element.click();
      }
    }

    _getValue() {
      return this.ck.element.checked
    }

    _setValue(value) {
      this.ck.element.checked = value === true;
    }
  }

  Component.register(Switch);

  class TabPanel extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        hidden: true,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.tabContent = this.parent;
      this.tabContent.panels[this.key] = this;
    }

    _config() {
      this.setProps({
        hidden: this.key !== this.tabContent.props.selectedPanel,
      });
    }

    _show() {
      if (this.tabContent.shownPanel === this) {
        return
      }
      this.tabContent.shownPanel && this.tabContent.shownPanel.hide();
      this.tabContent.shownPanel = this;
      this.tabContent.props.selectedPanel = this.key;
    }
  }

  Component.register(TabPanel);

  class TabContent extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        panels: [],
        panelDefaults: { component: TabPanel },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.panels = {};
      this.shownPanel = null;
    }

    _config() {
      const { panels } = this.props;
      const children = [];
      if (Array.isArray(panels) && panels.length > 0) {
        for (let i = 0; i < panels.length; i++) {
          let panel = panels[i];
          panel = Component.extendProps({}, this.props.panelDefaults, panel);
          children.push(panel);
        }
      }

      this.setProps({
        children: children,
      });
    }

    getPanel(param) {
      let retPanel = null;

      if (isString(param)) {
        return this.panels[param]
      }
      if (isFunction$1(param)) {
        for (const panel in this.panels) {
          if (this.panels.hasOwnProperty(panel)) {
            if (param.call(this.panels[panel]) === true) {
              retPanel = this.panels[panel];
              break
            }
          }
        }
      }

      return retPanel
    }

    showPanel(param) {
      const panel = this.getPanel(param);
      if (panel === null) {
        return false
      }
      panel.show();
    }
  }

  Component.register(TabContent);

  class TabItem extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'a',
        url: null,
        icon: null,
        text: null,
        subtext: null,
        selectable: {
          byClick: true,
        },
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.firstShow = true;
    }

    _config() {
      const { icon, text, subtext } = this.props;
      this.setProps({
        attrs: {
          href: this.getItemUrl(this.props.url),
        },
        children: [
          icon && { component: 'Icon', type: icon },
          text && { tag: 'span', children: text },
          subtext && { tag: 'span', children: subtext },
        ],
      });
    }

    _select() {
      setTimeout(() => {
        const tabContent = this.list.getTabContent();
        tabContent.showPanel(this.key);
        !this.list.firstSelect && this.list.triggerChange();
        this.list.firstSelect = false;
      }, 0);
    }

    getItemUrl(url) {
      if (url) {
        return url
      }

      return 'javascript:void(0);'
    }
  }

  Component.register(TabItem);

  class TabList extends List {
    constructor(props, ...mixins) {
      const defaults = {
        itemDefaults: {
          component: TabItem,
        },
        tabContent: null,
        uistyle: 'plain',
        itemSelectable: {
          byClick: true,
        },
        onTabSelectionChange: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();

      this.firstSelect = true;
    }

    _config() {
      this._addPropStyle('direction', 'fit');
      this.setProps({
        selectedItems: this.props.selectedTab,
      });

      super._config();
    }

    getTabContent() {
      return this.props.tabContent.call(this)
    }

    selectTab(param, selectOptions) {
      this.selectItems(param, selectOptions);
    }

    triggerChange() {
      if (this.parent.componentType && this.parent.componentType === 'Tabs') {
        this._callHandler(this.parent.props.onTabSelectionChange);
      } else {
        this._callHandler(this.props.onTabSelectionChange);
      }
    }
  }

  Component.register(TabList);

  class Tabs extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tabs: [],
        // selectedTab: 'tab0',
        uistyle: 'plain', // hat,card,line,pill
        onTabSelectionChange: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this._addPropStyle('fit');
      const that = this;
      const tabItems = [];
      const tabPanles = [];
      const { tabs, uistyle } = this.props;
      let { selectedTab } = this.props;
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const key = tab.key || `tab${i}`;
        tab.item.key = key;
        tab.panel.key = key;
        tabItems.push(tab.item);
        tabPanles.push(tab.panel);
      }

      if (selectedTab === undefined) {
        selectedTab = tabItems[0] && tabItems[0].key;
      }

      this.setProps({
        tabList: {
          component: TabList,
          name: 'tabList',
          items: tabItems,
          uistyle: uistyle,
          selectedTab: selectedTab,
          _created: function () {
            this.tabs = that;
            that.tabList = this;
          },
          tabContent: function () {
            return that.tabContent
          },
        },
        tabContent: {
          component: TabContent,
          panels: tabPanles,
          _created: function () {
            that.tabContent = this;
          },
        },
      });

      this.setProps({
        children: [this.props.tabList, this.props.tabContent],
      });
    }

    getSelectedTab() {
      return this.tabList.getSelectedItem()
    }

    selectTab(key) {
      return this.tabList.selectItem(key)
    }

    updatePanel(key, newPanelProps) {
      const panel = this.tabContent.getPanel(key);
      panel.update(newPanelProps);
    }
  }

  Component.register(Tabs);

  class Tag extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        key: null,
        tag: 'span',
        type: 'square',
        color: null,
        text: null,
        icon: null,
        number: null,
        overflowCount: 99,
        removable: false,
        size: 'sm',
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      this._propStyleClasses = ['size', 'color'];
      const { icon, text, type, number, overflowCount, removable } = this.props;

      const that = this;
      if (icon) {
        this.setProps({
          classes: {
            'p-with-icon': true,
          },
        });
      }

      if (type === 'round') {
        this.setProps({
          classes: {
            'u-shape-round': true,
          },
        });
      }

      this.setProps({
        children: [
          Component.normalizeIconProps(icon),
          text && { tag: 'span', children: text },
          number && { tag: 'span', children: number > overflowCount ? `${overflowCount}+` : number },
          removable &&
            Component.normalizeIconProps({
              type: 'times',
              classes: {
                'nom-tag-remove': true,
                'nom-tag-remove-basic': !that.props.styles,
              },
              onClick: function () {
                that.props.removable(that.props.key);
              },
            }),
        ],
      });
    }

    _disable() {
      this.element.setAttribute('disabled', 'disabled');
    }
  }

  Component.register(Tag);

  class TimelineItem extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'li',
        color: 'blue', // 指定圆圈颜色 blue, red, green, gray，或自定义的色值
        dot: null, // 自定义时间轴点
        label: null, // 设置标签
        pending: false, // 是否是幽灵节点
        children: null, // 内容
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const { dot, color, label, pending, children } = this.props;

      this.setProps({
        classes: {
          'nom-timeline-item': true,
          'nom-timeline-item-pending': pending,
        },
        children: [
          label && {
            tag: 'div',
            classes: {
              'nom-timeline-item-label': true,
            },
            children: label,
          },
          {
            tag: 'div',
            classes: {
              'nom-timeline-item-tail': true,
            },
          },
          {
            tag: 'div',
            classes: {
              'nom-timeline-item-head': true,
              'nom-timeline-item-head-custom': !!dot,
              [`nom-timeline-item-head-${color}`]: true,
            },
            attrs: {
              style: {
                'border-color': /blue|red|green|gray/.test(color || '') ? undefined : color,
              },
            },
            children: [dot],
          },
          {
            tag: 'div',
            classes: {
              'nom-timeline-item-content': true,
            },
            children,
          },
        ],
      });
    }
  }

  Component.register(TimelineItem);

  class Timeline extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'ul',
        mode: 'left', // 通过设置 mode 可以改变时间轴和内容的相对位置 left | alternate | right
        pending: false, // 指定最后一个幽灵节点是否存在或内容,也可以是一个自定义的子元素
        // 当最后一个幽灵节点存在時，指定其时间图点
        pendingDot: {
          component: 'Icon',
          type: 'loading',
        },
        reverse: false, // 节点排序
        items: null, // 子元素项列表
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _getPositionClass(ele, index) {
      const { mode } = this.props;
      if (mode === 'alternate') {
        return index % 2 === 0 ? `nom-timeline-item-left` : `nom-timeline-item-right`
      }
      if (mode === 'left') {
        return `nom-timeline-item-left`
      }
      if (mode === 'right') {
        return `nom-timeline-item-right`
      }
      if (ele.props && ele.props.position === 'right') {
        return `nom-timeline-item-right`
      }
      return ''
    }

    _config() {
      const { reverse, pending, mode, pendingDot, items } = this.props;
      const that = this;
      const hasLabelItem = items && items.some((item) => item && item.label);

      // 生成pending节点
      const pendingItem = pending
        ? {
            component: TimelineItem,
            pending: !!pending,
            dot: pendingDot || { component: 'Icon', type: 'loading' },
            children: typeof pending === 'boolean' ? null : pending,
          }
        : null;

      // 获取position

      const children = [];
      if (Array.isArray(items) && items.length > 0) {
        const timeLineItems = [...items];
        if (pendingItem) {
          timeLineItems.push(pendingItem);
        }
        if (reverse) {
          timeLineItems.reverse();
        }
        const itemsCount = timeLineItems.length;
        const lastCls = 'nom-timeline-item-last';

        for (let i = 0; i < timeLineItems.length; i++) {
          const ele = timeLineItems[i];
          const positionCls = that._getPositionClass(ele, i);
          const pendingClass = i === itemsCount - 2 ? lastCls : '';
          const readyClass = i === itemsCount - 1 ? lastCls : '';
          children.push({
            component: TimelineItem,
            ...ele,
            classes: {
              ...ele.classes,
              [!reverse && !!pending ? pendingClass : readyClass]: true,
              [positionCls]: true,
            },
          });
        }
      }

      this.setProps({
        classes: {
          [`nom-timeline-pending`]: !!pending,
          [`nom-timeline-reverse`]: !!reverse,
          [`nom-timeline-${mode}`]: !!mode && !hasLabelItem,
          [`nom-timeline-label`]: hasLabelItem,
        },
        children,
      });
    }
  }

  Component.register(Timeline);

  class SelectList$1 extends List {
    constructor(props, ...mixins) {
      const defaults = {
        gutter: 'sm',
        cols: 1,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();

      this.scroller = this.parent;
      this.timeWrapper = this.parent.parent.parent.parent.parent;
      this.pickerControl = this.timeWrapper.parentPopup.pickerControl;
      this.pickerControl.timeList[this.props.type] = this;
    }

    _config() {
      let items = [];
      const selected = [];

      if (this.props.type === 'hour') {
        items = this.pickerControl.getHour();
        !this.pickerControl.empty && selected.push(this.pickerControl.time.hour);
      } else if (this.props.type === 'minute') {
        items = this.pickerControl.getMinute();
        !this.pickerControl.empty && selected.push(this.pickerControl.time.minute);
      } else if (this.props.type === 'second') {
        items = this.pickerControl.getSecond();
        !this.pickerControl.empty && selected.push(this.pickerControl.time.second);
      }

      this.setProps({
        styles: {
          padding: '3px',
        },

        items: items,
        itemSelectable: {
          multiple: false,
          byClick: true,
        },
        selectedItems: selected,

        onItemSelectionChange: () => {
          this.onChange();
        },
      });

      super._config();
    }

    onChange() {
      this.scrollToKey();
      this.setTime();
    }

    setTime() {
      const key = this.getSelectedItem().key || '00';
      this.pickerControl.setTime({
        type: this.props.type,
        value: key,
      });
    }

    resetTime() {
      if (this.pickerControl.defaultValue) {
        const t = this.pickerControl.defaultValue.split(':');
        if (this.props.type === 'hour') {
          this.selectItem(t[0]);
        } else if (this.props.type === 'minute') {
          this.selectItem(t[1]);
        } else {
          this.selectItem(t[2]);
        }
      } else {
        this.unselectAllItems();
      }
    }

    scrollToKey() {
      const top = this.getSelectedItem() ? this.getSelectedItem().element.offsetTop - 3 : 0;
      this.scroller.element.scrollTop = top;
    }
  }

  class TimePickerWrapper extends Component {
    constructor(props, ...mixins) {
      const defaults = {};

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.parentPopup = this.parent.parent.parent;
      this.pickerControl = this.parentPopup.pickerControl;
    }

    _config() {
      const that = this;
      this.setProps({
        children: {
          component: 'Rows',
          gutter: null,
          items: [
            {
              component: 'Cols',
              gutter: null,
              classes: {
                'timepicker-group': true,
              },
              fills: true,
              align: 'stretch',
              children: [
                {
                  hidden: !this.pickerControl.props.format.includes('HH'),
                  children: {
                    component: SelectList$1,
                    type: 'hour',
                  },
                },
                {
                  hidden: !this.pickerControl.props.format.includes('mm'),
                  children: {
                    component: SelectList$1,
                    type: 'minute',
                  },
                },
                {
                  hidden: !this.pickerControl.props.format.includes('ss'),
                  children: {
                    component: SelectList$1,
                    type: 'second',
                  },
                },
              ],
            },
            {
              component: 'Cols',
              justify: 'between',
              attrs: {
                style: {
                  padding: '5px',
                  'border-top': '1px solid #ddd',
                },
              },
              items: [
                {
                  component: 'Button',
                  size: 'small',
                  text: '此刻',
                  onClick: function () {
                    that.pickerControl.setNow();
                    that.pickerControl.confirm = true;
                    that.pickerControl.popup.hide();
                    that.pickerControl.handleChange();
                  },
                },
                {
                  component: 'Button',
                  type: 'Primary',
                  size: 'small',
                  text: '确定',
                  onClick: function () {
                    that.pickerControl.confirm = true;
                    that.pickerControl.popup.hide();
                    that.pickerControl.handleChange();
                    that.pickerControl.defaultValue = that.pickerControl.props.value;
                  },
                },
              ],
            },
          ],
        },
      });
    }
  }

  Component.register(TimePickerWrapper);

  class TimePickerPopup extends Popup {
    constructor(props, ...mixins) {
      const defaults = {};

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();
      this.pickerControl = this.opener.parent.parent;
    }

    _config() {
      this.setProps({
        children: {
          component: Layout,
          body: {
            children: {
              component: TimePickerWrapper,
            },
          },
        },
      });

      super._config();
    }
  }

  Component.register(TimePickerPopup);

  class TimePicker extends Textbox {
    constructor(props, ...mixins) {
      const defaults = {
        allowClear: true,
        value: null,
        format: 'HH:mm:ss',
        hourStep: 0,
        minuteStep: 0,
        secondStep: 0,
        readOnly: true,
        placeholder: null,
        showNow: true,
        minValue: '10:10:10',
        maxValue: '20:20:20',
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();
      this.defaultValue = this.props.value;
      this.timeList = [];

      this.confirm = false;
      this.empty = !this.props.value;

      this.time = {
        hour: '00',
        minute: '00',
        second: '00',
      };

      if (this.props.value) {
        const t = this.props.value.split(':');
        this.time.hour = t[0] || '00';
        this.time.minute = t[1] || '00';
        this.time.second = t[2] || '00';
      }

      this.defaultTime = this.time;
    }

    _config() {
      this.setProps({
        leftIcon: 'clock',
        rightIcon: {
          type: 'times',
          hidden: !this.props.allowClear,
          onClick: (args) => {
            this.clearTime();
            args.event && args.event.stopPropagation();
          },
        },
      });

      super._config();
    }

    _rendered() {
      const that = this;
      this.popup = new TimePickerPopup({
        trigger: this.control,
        onHide: () => {
          if (this.confirm === false) {
            this.setValue(this.defaultValue);
            this.resetList();
          }
        },
        onShown: () => {
          this.confirm = false;
          Object.keys(this.timeList).forEach(function (key) {
            that.timeList[key].scrollToKey();
          });
        },
      });
    }

    getHour() {
      const hour = [];
      if (this.props.hourStep) {
        hour.push({
          children: '00',
        });
        for (let i = 0; i < 24; i++) {
          if ((i + 1) % this.props.hourStep === 0 && i !== 23) {
            if (i < 9) {
              hour.push({
                key: `0${i + 1}`,
                children: `0${i + 1}`,
              });
            } else {
              hour.push({
                key: `${i + 1}`,
                children: `${i + 1}`,
              });
            }
          }
        }
        return hour
      }
      for (let i = 0; i < 24; i++) {
        if (i < 10) {
          hour.push({
            key: `0${i}`,
            children: `0${i}`,
          });
        } else {
          hour.push({
            key: `${i}`,
            children: `${i}`,
          });
        }
      }
      return hour
    }

    getMinute() {
      const minute = [];
      if (this.props.minuteStep) {
        minute.push({
          children: '00',
        });
        for (let i = 0; i < 60; i++) {
          if ((i + 1) % this.props.minuteStep === 0 && i !== 59) {
            if (i < 9) {
              minute.push({
                key: `0${i + 1}`,
                children: `0${i + 1}`,
              });
            } else {
              minute.push({
                key: `${i + 1}`,
                children: `${i + 1}`,
              });
            }
          }
        }
        return minute
      }
      for (let i = 0; i < 60; i++) {
        if (i < 10) {
          minute.push({
            key: `0${i}`,
            children: `0${i}`,
          });
        } else {
          minute.push({
            key: `${i}`,
            children: `${i}`,
          });
        }
      }
      return minute
    }

    getSecond() {
      const second = [];
      if (this.props.secondStep) {
        second.push({
          children: '00',
        });
        for (let i = 0; i < 60; i++) {
          if ((i + 1) % this.props.secondStep === 0 && i !== 59) {
            if (i < 9) {
              second.push({
                key: `0${i + 1}`,
                children: `0${i + 1}`,
              });
            } else {
              second.push({
                key: `${i + 1}`,
                children: `${i + 1}`,
              });
            }
          }
        }
        return second
      }
      for (let i = 0; i < 60; i++) {
        if (i < 10) {
          second.push({
            key: `0${i}`,
            children: `0${i}`,
          });
        } else {
          second.push({
            key: `${i}`,
            children: `${i}`,
          });
        }
      }
      return second
    }

    setTime(data) {
      this.time[data.type] = data.value;

      const realTime = this.props.format
        .replace('HH', this.time.hour)
        .replace('mm', this.time.minute)
        .replace('ss', this.time.second);
      this.setValue(realTime);
    }

    resetList() {
      const that = this;
      Object.keys(this.timeList).forEach(function (key) {
        that.timeList[key].resetTime();
      });
    }

    clearTime() {
      this.setValue(null);
      this.empty = true;
      this.defaultValue = null;
      this.time = {
        hour: '00',
        minute: '00',
        second: '00',
      };
      this.resetList();
      this.popup.hide();
    }

    setNow() {
      const c = new Date().format('HH:mm:ss');
      this.setValue(c);
      this.defaultValue = c;
      const t = c.split(':');
      this.time.hour = t[0] || '00';
      this.time.minute = t[1] || '00';
      this.time.second = t[2] || '00';

      this.empty = false;
      this.resetList();
    }

    handleChange() {
      this.props.onChange && this._callHandler(this.props.onChange);
    }

    showPopup() {
      this.popup.show();
    }
  }

  Component.register(TimePicker);

  class TimeRangePicker extends Group {
    constructor(props, ...mixins) {
      const defaults = {
        allowClear: false,
        value: null,
        format: 'HH:mm:ss',
        hourStep: 0,
        minuteStep: 0,
        secondStep: 0,
        readOnly: true,
        placeholder: null,
        showNow: true,
        onChange: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();
    }

    _config() {
      const that = this;
      const { format, hourStep, minuteStep, secondStep, allowClear } = this.props;

      this.setProps({
        inline: true,
        fields: [
          {
            component: 'TimePicker',
            name: 'start',
            ref: (c) => {
              that.startPicker = c;
            },
            onChange: () => {
              that.endPicker.focus();
              that.endPicker.showPopup();
            },
            format,
            hourStep,
            minuteStep,
            secondStep,
            allowClear,
          },
          {
            component: 'StaticText',
            value: '-',
          },
          {
            component: 'TimePicker',
            name: 'end',
            ref: (c) => {
              that.endPicker = c;
            },
            onChange: () => {
              that.handleChange();
            },
            format,
            hourStep,
            minuteStep,
            secondStep,
            allowClear,
          },
        ],
      });

      super._config();
    }

    handleChange() {
      this.props.onChange && this._callHandler(this.props.onChange);
    }
  }

  Component.register(TimeRangePicker);

  class TreeNode extends List {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'div',
        indent: false,
        key: null,
        title: null,
        value: null,
        status: 0,
        collapsed: false,
        checked: false,
        checkChild: false,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.wrapper = this.parent;
      this.wrapper.item = this;
      this.tree = this.wrapper.tree;

      this.wrapper.treeNode = this;
      this.hasSubtree = !!this.subTree;

      this.tree.itemRefs[this.key] = this;

      if (!this.wrapper.isRoot && !this.wrapper.parentWrapper.isLeaf) {
        this.wrapper.parentWrapper.subTree.checkStatus[this.key] = this;
      }
    }

    _config() {
      const { value, title, key, indent, checked } = this.props;
      const that = this;

      let checkIcon = null;
      if (checked) {
        checkIcon = 'checked-square';
      } else {
        checkIcon = 'blank-square';
      }

      this.setProps({
        value: value,
        title: title,
        classes: {
          'nom-tree-node-disabled': that.tree.props.leafOnly && !that.wrapper.isLeaf,
        },
        key: key,
        children: {
          tag: 'span',
          classes: {
            'nom-tree-node-name': true,
            indent: indent,
          },
          children: [
            (that.wrapper.isLeaf || !that.tree.props.leafOnly) &&
              Component.normalizeIconProps({
                type: checkIcon,
                onClick: function () {
                  that.handleClick();
                },
              }),
            {
              tag: 'span',
              children: title,
            },
          ],
        },
      });
    }

    getSubtreeStatus() {
      if (this.hasSubtree) {
        const sub = this.subTree.checkStatus;
        let x = 0;
        let y = 0;

        Object.keys(sub).forEach((key) => {
          y += 1;
          if (!sub[key].props.checked) {
            x += 1;
          }
        });

        if (x === 0) {
          this.subTree.check = 'all';
        } else if (x > 0 && x < y) {
          this.subTree.check = 'part';
        } else {
          this.subTree.check = 'none';
        }
      }
    }

    getSiblingStatus() {
      if (this.wrapper.isRoot) {
        return
      }
      const sib = this.wrapper.parentWrapper.subTree.checkStatus;
      let x = 0;
      let y = 0;

      Object.keys(sib).forEach((key) => {
        y += 1;
        if (!sib[key].props.checked) {
          x += 1;
        }
      });

      if (x === 0) {
        this.wrapper.parentWrapper.subTree.check = 'all';
      } else if (x > 0 && x < y) {
        this.wrapper.parentWrapper.subTree.check = 'part';
      } else {
        this.wrapper.parentWrapper.subTree.check = 'none';
      }
    }

    checkDown(status, self) {
      if (!self) {
        this.props.checked = status !== null ? status : !this.props.checked;
        this.update(this.props.checked);
      }
      this.getSubtreeStatus();
      if (this.wrapper.isLeaf) {
        return
      }

      if (this.props.checked) {
        if (this.subTree.check === 'all') {
          return
        }
        const t = this.subTree.children;

        for (let i = 0; i < t.length; i++) {
          t[i].treeNode.checkDown(true, false);
        }
      }
      if (!this.props.checked) {
        if (this.subTree.check === 'none') {
          return
        }

        if (this.subTree.check === 'part') {
          this.props.checked = true;

          const t = this.subTree.children;
          for (let i = 0; i < t.length; i++) {
            t[i].treeNode.checkDown(true, false);
          }
        } else {
          const t = this.subTree.children;
          for (let i = 0; i < t.length; i++) {
            t[i].treeNode.checkDown(false, false);
          }
        }
      }
      this.update(this.props.checked);
    }

    checkUp(status, self) {
      if (!self) {
        this.props.checked = status !== null ? status : !this.props.checked;
        this.update(this.props.checked);
      }

      this.getSiblingStatus();
      if (this.wrapper.isRoot) {
        return
      }
      if (status) {
        this.props.checked = status;
      }

      if (this.props.checked && this.wrapper.parentWrapper.subTree.check === 'all') {
        this.wrapper.parentWrapper.treeNode.checkUp(true, false);
      }
      if (!this.props.checked && this.wrapper.parentWrapper.subTree.check !== 'all') {
        this.wrapper.parentWrapper.treeNode.checkUp(false, false);
      }
    }

    setCheck(status) {
      this.props.checked = status;
      this.update(this.props.checked);
    }

    handleClick(status) {
      if (this.tree.props.leafOnly) {
        if (!this.wrapper.isLeaf) {
          return
        }
        if (!this.tree.props.multiple) {
          this.tree.unCheckAll(true);
        }
      }

      this.props.checked = status || !this.props.checked;
      this.update(this.props.checked);

      if (!this.tree.props.leafOnly) {
        this.checkDown(null, true);
        this.checkUp(null, true);
      }

      this.tree.triggerCheck(this);
    }
  }

  Component.register(TreeNode);

  class TreeSub extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'ul',
        items: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.wrapper = this.props.wrapper || this.parent;
      this.wrapper.subTree = this;
      this.tree = this.wrapper.tree;

      this.wrapper.treeNode.subTree = this.wrapper.subTree;
      this.wrapper.treeNode.hasSubtree = true;
      this.check = null;
      this.checkStatus = [];
    }

    _config() {
      const { items } = this.props;

      this.setProps({
        children: items,
      });
    }

    _disable() {
      this.element.setAttribute('disabled', 'disabled');
    }
  }

  Component.register(TreeSub);

  class TreeWrapper extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        tag: 'li',
        key: null,
        title: null,
        value: null,
        checked: null,
        items: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.isLeaf = !this.props.items;

      this.isRoot = false;
      this.level = 0;
      this.parentWrapper = null;

      if (this.parent.parent instanceof Component.components.Tree) {
        this.tree = this.parent.parent;
        this.isRoot = true;
      } else if (this.parent instanceof Component.components.TreeSub) {
        this.tree = this.parent.tree;
        this.parentWrapper = this.parent.wrapper;
      }

      if (this.parentWrapper) {
        this.level = this.parentWrapper.level + 1;
      }
    }

    _config() {
      const that = this;

      const { key, title, value, checked, items, collapsed } = this.props;

      this.setProps({
        children: [
          Component.normalizeIconProps({
            type: collapsed ? 'down' : 'right',
            hidden: !items,
            onClick: function () {
              that.props.collapsed = !that.props.collapsed;
              that.update(collapsed);
            },
          }),
          {
            component: TreeNode,
            key: key,
            title: title,
            value: value,
            checked: checked,
            indent: !items,
          },
          items && {
            component: TreeSub,
            hidden: collapsed,
            items: items,
          },
        ],
      });
    }
  }

  Component.register(TreeWrapper);

  class Tree extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        treeData: null,
        leafOnly: false,
        multiple: true,
        selectedNodes: null,
        onCheck: null,
        showLine: false,
        toolbar: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      this.itemRefs = [];
      this.selectedList = [];
    }

    _config() {
      const that = this;
      const { treeData, selectedNodes, showline } = this.props;

      if (selectedNodes) {
        if (typeof selectedNodes === 'string') {
          this.selectedList.push(selectedNodes);
        } else {
          this.selectedList = selectedNodes;
        }
      }

      function mapTree(data) {
        return data.map(function (item) {
          if (item.children && item.children.length > 0) {
            const c = mapTree(item.children);
            return {
              component: TreeWrapper,
              key: item.value,
              title: item.title,
              value: item.value,
              checked: that.selectedList.indexOf(item.value) !== -1,
              items: c,
            }
          }
          return {
            component: TreeWrapper,
            key: item.value,
            title: item.title,
            value: item.value,
            checked: that.selectedList.indexOf(item.value) !== -1,
          }
        })
      }

      const children = mapTree(treeData);

      this.setProps({
        children: [
          this.props.toolbar && this.props.toolbar.placement === 'before' && this.props.toolbar.item,
          {
            tag: 'ul',
            classes: {
              'nom-tree-container': true,
              'nom-tree-showline': showline,
            },
            children: children,
          },
          this.props.toolbar && this.props.toolbar.placement === 'after' && this.props.toolbar.item,
        ],
      });
    }

    getSelected() {
      return Object.keys(this.itemRefs).filter((key) => {
        return this.itemRefs[key].props.checked === true
      })
    }

    checkAll() {
      const that = this;
      Object.keys(this.itemRefs).forEach(function (key) {
        that.itemRefs[key].setCheck(true);
      });
      const data = { items: this.getSelected() };
      this.props.onCheck && this._callHandler(this.props.onCheck, data);
    }

    unCheckAll() {
      const that = this;
      Object.keys(this.itemRefs).forEach(function (key) {
        that.itemRefs[key].setCheck(false);
      });
    }

    triggerCheck(item) {
      const data = {
        items: this.getSelected(),
        key: item.key,
        status: item.props.checked,
      };

      this.props.onCheck && this._callHandler(this.props.onCheck, data);
    }
  }

  Component.register(Tree);

  class TreeSelectPopup extends Popup {
    constructor(props, ...mixins) {
      const defaults = {};

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();
      this.selectControl = this.opener.parent.parent.parent;
    }

    _config() {
      const that = this;

      this.setProps({
        attrs: {
          style: {
            width: `${this.selectControl.offsetWidth()}px`,
          },
        },
        children: {
          component: Layout,
          body: {
            children: {
              component: 'Tree',
              treeData: that.selectControl.props.treeData,
              selectedNodes: that.props.selectedNodes,
              multiple: that.selectControl.props.multiple,
              leafOnly: that.selectControl.props.leafOnly,
              onCheck: function (data) {
                that.selectControl.setValue(data);
              },
              _created: function () {
                that.selectControl.tree = this;
              },
            },
          },
        },
      });

      super._config();
    }
  }

  Component.register(TreeSelectPopup);

  class TreeSelect extends Field {
    constructor(props, ...mixins) {
      const defaults = {
        treeData: null,

        multiple: true,
        leafOnly: false,
        showArrow: true,
        selectedNodes: null,
      };

      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();
      this.items = [];
    }

    _config() {
      const { showArrow, selectedNodes } = this.props;
      const items = [];
      const that = this;
      if (typeof selectedNodes === 'string') {
        const temp = [];
        temp.push(selectedNodes);
        that.props.selectedNodes = temp;
      }

      if (selectedNodes) {
        that.getList().forEach(function (item) {
          that.props.selectedNodes.forEach(function (key) {
            if (key === item.key) {
              items.push({
                component: 'Tag',
                type: 'round',
                size: 'xs',
                text: item.title,
                key: item.key,
                removable: function (param) {
                  that.props.selectedNodes = that.props.selectedNodes.filter(function (k) {
                    return k !== param
                  });
                  that.update(that.props.selectedNodes);
                },
              });
            }
          });
        });
      }
      let children = [];
      const badges = { children: items };

      if (showArrow) {
        children = [
          badges,
          {
            component: Icon,
            type: 'down',
            _created: function () {
              that.arrow = this;
            },
            classes: {
              'nom-tree-select-arrow': true,
            },
          },
        ];
      }

      this.setProps({
        control: {
          children: children,
        }
      });

      super._config();
    }

    _rendered() {
      this.popup = new TreeSelectPopup({
        trigger: this.arrow,
        selectedNodes: this.props.selectedNodes,
      });
    }

    getList() {
      const list = [];
      function mapTree(data) {
        return data.forEach(function (item) {
          list.push({
            key: item.value,
            title: item.title,
            value: item.value,
          });
          if (item.children && item.children.length > 0) {
            mapTree(item.children);
          }
        })
      }

      mapTree(this.props.treeData);
      return list
    }

    setValue(data) {
      this.props.selectedNodes = data.items;
      this.update(this.props.selectedNodes);
    }

    _getValue() {
      return this.props.selectedNodes
    }
  }

  Component.register(TreeSelect);

  // 正整数
  const POSITIVE_INTEGER = /^[1-9]\d*$/;

  const DEFAULT_ACCEPT =
    'image/*,application/msword,application/pdf,application/x-rar-compressed,application/vnd.ms-excel,application/vnd.ms-powerpoint,application/vnd.ms-works,application/zip,audio/*,video/*,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.wordprocessingml.template,application/vnd.ms-word.document.macroEnabled.12,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.spreadsheetml.template,application/vnd.ms-excel.sheet.macroEnabled.12,application/vnd.ms-excel.template.macroEnabled.12,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.presentationml.template,application/vnd.openxmlformats-officedocument.presentationml.slideshow,application/vnd.ms-powerpoint.addin.macroEnabled.12,application/vnd.ms-powerpoint.presentation.macroEnabled.12,application/vnd.ms-powerpoint.slideshow.macroEnabled.12,application/csv';

  function getUUID() {
    return `nom-upload-${Math.random().toString().substr(2)}`
  }

  function getDate(timestamp) {
    if (isNumeric(timestamp) && POSITIVE_INTEGER.test(timestamp.toString())) {
      const date = new Date(timestamp);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${date.getFullYear()}-${month > 9 ? month : `0${month}`}-${day > 9 ? day : `0${day}`}`
    }
    return null
  }

  function getFileSize(number) {
    if (!isNumeric(number)) {
      return 'NA bytes'
    }
    if (number < 1024) {
      return `${number} bytes`
    }
    if (number > 1024 && number < 1048576) {
      return `${(number / 1024).toFixed(2)} KB`
    }
    if (number > 1048576) {
      return `${(number / 1048576).toFixed(2)} MB`
    }
  }

  function isPromiseLike(promiseLike) {
    return (
      promiseLike !== null &&
      (typeof promiseLike === 'object' || typeof promiseLike === 'function') &&
      typeof promiseLike.then === 'function'
    )
  }

  function isBlobFile(file) {
    const ft = Object.prototype.toString.call(file);
    return ft === '[object File]' || ft === '[object Blob]'
  }

  function getFileFromList(file, fileList) {
    return fileList.find((e) => e.uuid === file.uuid)
  }

  function cloneFileWithInfo(file) {
    return {
      ...file,
      lastModified: file.lastModified,
      lastModifiedDate: file.lastModifiedDate,
      name: file.name,
      size: file.size,
      type: file.type,
      uuid: file.uuid,
      percent: 0,
      originFile: file,
    }
  }

  function removeFile(file, fileList) {
    const remains = fileList.filter((item) => item.uuid !== file.uuid);
    if (remains.lenth === fileList.length) {
      return null
    }
    return remains
  }

  class FileItem extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        disabled: false,
        file: null,
      };
      super(Component.extendProps(defaults, props), ...mixins);
    }

    _config() {
      const { file, onRemove, extraAction } = this.props;
      const { name, size, uploadTime, uuid, status } = file;

      if (uuid) {
        let imgDisplay = {};
        if (status === 'error') {
          imgDisplay = {
            children: [
              {
                component: 'Icon',
                type: 'file-error',
                classes: {
                  'file-img': true,
                },
              },
            ],
          };
        } else {
          imgDisplay =
            status === 'done'
              ? this.renderUploadedFile(file)
              : {
                  children: [
                    {
                      component: 'Icon',
                      type: 'loading',
                      classes: {
                        'file-img': true,
                      },
                    },
                  ],
                };
        }

        const actions = [];
        if (onRemove) {
          actions.push({
            tag: 'a',
            children: onRemove.text || '删除',
            attrs: {
              href: 'javascript:void(0)',
              onclick: (e) => {
                e.preventDefault();
                status !== 'removing' && onRemove.action(e, file);
              },
            },
          });
        }

        if (Array.isArray(extraAction) && extraAction.length > 0) {
          extraAction.forEach(({ text, action }) => {
            actions.push({
              tag: 'a',
              children: text,
              attrs: {
                href: 'javascript:void(0)',
                onclick: (e) => {
                  e.preventDefault();
                  isFunction$1(action) && action(e, file);
                },
              },
            });
          });
        }

        this.setProps({
          tag: 'div',
          children: [
            {
              tag: 'div',
              _config() {
                this.setProps({
                  children: [
                    {
                      ...imgDisplay,
                    },
                  ],
                });
                this.setProps({
                  classes: { 'upload-img-container': true },
                });
              },
            },
            {
              tag: 'div',
              _config() {
                this.setProps({
                  children: [
                    {
                      tag: 'div',
                      _config() {
                        this.setProps({
                          children: [
                            {
                              tag: 'span',
                              children: [
                                {
                                  tag: 'a',
                                  children: name,
                                  _config() {
                                    this.setProps({
                                      classes: { 'upload-file-name': true },
                                    });
                                  },
                                  // attrs: {
                                  //   href: 'javascript:void(0)',
                                  //   onclick: (e) => {
                                  //     e.preventDefault()
                                  //     if (isFunction(onPreview)) onPreview(file)
                                  //   },
                                  // },
                                },
                              ],
                            },
                            {
                              tag: 'span',
                              children: getFileSize(size),
                            },
                            {
                              tag: 'span',
                              children: `更新日期 : ${
                              getDate(uploadTime) ? getDate(uploadTime) : 'NA'
                            }`,
                              _config() {
                                this.setProps({
                                  classes: {
                                    'upload-file-update': true,
                                    'u-border-left ': true,
                                  },
                                });
                              },
                            },
                          ],
                        });
                      },
                    },
                    {
                      tag: 'div',
                      _config() {
                        this.setProps({
                          classes: {
                            'upload-opt-btn': true,
                            'upload-opt-removing': status === 'removing',
                          },
                        });
                      },
                      children: actions,
                    },
                  ],
                });
                this.setProps({
                  classes: { 'upload-info-container': true },
                });
              },
            },
          ],
        });

        this.setProps({
          classes: {
            'u-flex-row': true,
          },
        });
      }
    }

    renderUploadedFile(file) {
      // const { name } = file
      const renderer = this.props.renderer;
      if (isFunction$1(renderer)) {
        return {
          ...renderer(file),
          classes: {
            'file-img': true,
          },
        }
      }
      return {
        component: 'Icon',
        type: 'default',
        classes: {
          'file-img': true,
        },
      }
      // const suffix = getFileExtension(name)
      // if (fileType.has(suffix)) {
      //   return {
      //     component: 'Icon',
      //     type: suffix,
      //     classes: {
      //       'file-img': true,
      //     },
      //   }
      // }
      // return {
      //   component: 'Icon',
      //   type: 'default',
      //   classes: {
      //     'file-img': true,
      //   },
      // }
    }
  }

  class FileList extends Component {
    constructor(props, ...mixins) {
      const defaults = {
        disabled: false,
        files: null,
      };
      super(Component.extendProps(defaults, props), ...mixins);
    }

    _created() {
      super._created();

      this.uploaderControl = this.parent.parent.parent.control;
      this.uploaderControl.list = this;
    }

    _config() {
      const { files, onRemove, extraAction, initializing, renderer } = this.props;
      const children = [];
      if (Array.isArray(files) && files.length > 0) {
        files.forEach((file) => {
          children.push({ component: FileItem, file, onRemove, extraAction, renderer });
        });
      }

      if (initializing) {
        this.setProps({
          tag: 'div',
          children: {
            component: 'Icon',
            type: 'loading',
            classes: {
              'file-img': true,
            },
          },
        });
      } else {
        this.setProps({
          tag: 'div',
          children,
        });
      }
    }
  }

  function getError(option, xhr) {
    const msg = `Can't ${option.method} ${option.action} ${xhr.status}`;
    const err = new Error(msg);
    return {
      ...err,
      status: xhr.status,
      method: option.method,
      url: option.action,
    }
  }

  function getBody(xhr) {
    const text = xhr.responseText || xhr.response;
    if (!text) {
      return text
    }

    try {
      return JSON.parse(text)
    } catch (e) {
      return text
    }
  }

  function upload(option) {
    const xhr = new XMLHttpRequest();

    if (option.onProgress && xhr.upload) {
      xhr.upload.onprogress = function progress(e) {
        if (e.total > 0) {
          e.percent = (e.loaded / e.total) * 100;
        }
        option.onProgress(e);
      };
    }

    const formData = new FormData();

    if (option.data) {
      Object.keys(option.data).forEach((key) => {
        const value = option.data[key];
        if (Array.isArray(value)) {
          value.forEach((item) => {
            formData.append(`${key}[]`, item);
          });
          return
        }

        formData.append(key, option.data[key]);
      });
    }

    if (option.file instanceof Blob) {
      formData.append(option.filename, option.file, option.file.name);
    } else {
      formData.append(option.filename, option.file);
    }

    xhr.onerror = function error(e) {
      option.onError(e);
    };

    xhr.onload = function onload() {
      if (xhr.status < 200 || xhr.status >= 300) {
        return option.onError(getError(option, xhr), getBody(xhr))
      }

      return option.onSuccess(getBody(xhr), xhr)
    };

    xhr.open(option.method, option.action, true);

    if (option.withCredentials && 'withCredentials' in xhr) {
      xhr.withCredentials = true;
    }

    const headers = option.headers || {};

    if (headers['X-Requested-With'] !== null) {
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }

    Object.keys(headers).forEach((header) => {
      if (headers[header] !== null) {
        xhr.setRequestHeader(header, headers[header]);
      }
    });

    xhr.send(formData);

    return {
      abort() {
        xhr.abort();
      },
    }
  }

  class Uploader extends Field {
    constructor(props, ...mixins) {
      const defaults = {
        // 测试地址
        action: '',
        disabled: false,
        beforeUpload: null,
        button: null,
        defaultFileList: [],
        multiple: true,
        name: 'file',
        display: true,
        data: {},
        // request option
        method: 'post',
        headers: {},
        withCredentials: false,
        onRemove: null,
        renderer: null,
        extraAction: [],
      };
      super(Component.extendProps(defaults, props), ...mixins);
      this.reqs = {};
    }

    _created() {
      this.fileList = this.props.defaultFileList;
    }

    _config() {
      const that = this;
      // const { disabled, accept, button: cButton, multiple, files } = this.props;
      const {
        disabled,
        accept,
        button: cButton,
        multiple,
        extraAction,
        display,
        onRemove,
        renderer,
      } = this.props;

      let initializing = true;
      if (isPromiseLike(this.fileList)) {
        this.fileList.then((fs) => {
          initializing = false;
          this.fileList = fs;

          if (!disabled && this.button) {
            this.button._enable();
          }
          this.list.update({ initializing: false, files: this.fileList });
        });
      } else {
        initializing = false;
      }
      const children = [];

      const defaultButtonProps = {
        component: 'Button',
        text: '上传',
        icon: 'upload',
      };

      const inputUploader = {
        tag: 'input',
        hidden: true,
        _created() {
          that.inputFile = this;
        },
        attrs: {
          type: 'file',
          multiple: multiple,
          accept: accept || DEFAULT_ACCEPT,
          onchange: that._onChange.bind(that),
          onclick: (e) => {
            e.stopPropagation();
          },
        },
      };

      children.push(inputUploader);

      let button = cButton;
      if (!button && button !== false) button = defaultButtonProps;

      if (button !== false) {
        button = {
          ...button,
          disabled: disabled || initializing,
          // disabled,
          ref: (c) => {
            this.button = c;
          },
          attrs: {
            onclick() {
              that._handleClick();
            },
            onKeyDown(e) {
              that._onKeyDowne(e);
            },
          },
        };
        children.push(button);
      }

      // if (display && files && files.length > 0) {
      //   console.log('display')
      //   children.push({
      //     component: FileList,
      //     initializing,
      //     files,
      //     onRemove: this.handleRemove.bind(that),
      //     extraAction,
      //   })
      // }
      if (display) {
        if (initializing || (this.fileList && this.fileList.length > 0)) {
          children.push({
            component: FileList,
            classes: {
              'nom-file-list-only': button === false,
            },
            ref: (c) => {
              this.list = c;
            },
            initializing,
            files: this.fileList,
            renderer,
            onRemove: onRemove &&
              isFunction$1(onRemove.action) && {
                ...onRemove,
                action: that.handleRemove.bind(that),
              },
            extraAction,
          });
        }
      }

      this.setProps({
        control: {
          children,
        },
      });

      super._config();
    }

    _onChange(e) {
      const { files } = e.target;
      const uploadedFiles = this.fileList;
      this.uploadFiles(files, uploadedFiles);
    }

    uploadFiles(files, uploadedFiles) {
      // 转为数组
      let fileList = Array.from(files);
      const uploadedFileList = Array.from(uploadedFiles);
      fileList = fileList.map((e) => {
        if (!e.uuid) {
          e.uuid = getUUID();
        }
        e.uploadTime = new Date().getTime();
        return e
      });

      fileList.forEach((file) => {
        this.upload(file, [...uploadedFileList, ...fileList]);
      });
    }

    upload(file, fileList) {
      const beforeUpload = this.props.beforeUpload;
      if (!beforeUpload) {
        Promise.resolve().then(() => this.post(file));
        return
      }

      const before = beforeUpload(file, fileList);
      if (isPromiseLike(before)) {
        before.then((pFile) => {
          if (isBlobFile(pFile)) {
            this.post(pFile);
            return
          }
          this.post(file);
        });
      } else if (before !== false) {
        Promise.resolve().then(() => {
          this.post(file);
        });
      }
    }

    post(file) {
      if (!this.rendered) {
        return
      }

      const that = this;
      const { props } = this;
      new Promise((resolve) => {
        const actionRet = this.props.action;
        resolve(isFunction$1(actionRet) ? actionRet(file) : actionRet);
      }).then((action) => {
        const { data, method, headers, withCredentials } = props;
        const option = {
          action,
          data,
          file,
          filename: props.name,
          method,
          headers,
          withCredentials,
          onProgress: (e) => {
            that.onProgress(e, file);
          },
          onSuccess: (ret, xhr) => {
            that.onSuccess(ret, file, xhr);
          },
          onError: (err, ret) => {
            that.onError(err, ret, file);
          },
        };
        this.onStart(file);
        this.reqs[file.uuid] = upload(option);
      });
    }

    onChange(info) {
      // 更新列表
      this.fileList = info.fileList;

      const { onChange: onChangeProp } = this.props;
      this.update({ fileList: [...info.fileList] });

      if (this.button) {
        const disableBtn = this.fileList.some((file) =>
          ['removing', 'uploading'].includes(file.status),
        );

        if (!this.props.disabled) {
          disableBtn ? this.button._disable() : this.button._enable();
        }
      }

      if (onChangeProp) {
        onChangeProp({
          ...info,
          fileList: [...this.fileList],
        });
      }
    }

    onStart(file) {
      const uploadFile = cloneFileWithInfo(file);
      uploadFile.status = 'uploading';

      // 这里要改
      const nextFileList = Array.from(this.fileList);

      const findIndex = nextFileList.findIndex((f) => f.uuid === uploadFile.uuid);
      if (findIndex === -1) {
        nextFileList.push(uploadFile);
      } else {
        nextFileList[findIndex] = uploadFile;
      }

      this.onChange({
        file: uploadFile,
        fileList: nextFileList,
      });
    }

    onProgress(e, file) {
      const uploadingFile = getFileFromList(file, this.fileList);
      if (!uploadingFile) {
        return
      }

      uploadingFile.percent = e.percent;
      this.onChange({
        event: e,
        file: uploadingFile,
        fileList: [...this.fileList],
      });
    }

    onSuccess(response, file, xhr) {
      try {
        if (typeof response === 'string') {
          response = JSON.parse(response);
        }
      } catch (e) {
        /* do nothing */
      }

      const uploadFile = getFileFromList(file, this.fileList);
      if (!uploadFile) {
        return
      }

      uploadFile.response = response;
      uploadFile.status = 'done';
      uploadFile.xhr = xhr;

      this.onChange({
        file: uploadFile,
        fileList: [...this.fileList],
      });
    }

    onError(error, response, file) {
      const uploadFile = getFileFromList(file, this.fileList);
      if (!uploadFile) {
        return
      }

      uploadFile.error = error;
      uploadFile.status = 'error';
      uploadFile.response = response;

      this.onChange({
        file: uploadFile,
        fileList: [...this.fileList],
      });
    }

    handleRemove(e, file) {
      const {
        onRemove: { action },
      } = this.props;
      // removing
      file.status = 'removing';
      this.fileList = this.fileList.map((f) =>
        f.uuid === file.uuid ? { ...f, status: 'removing' } : f,
      );

      this.onChange({
        file,
        fileList: this.fileList,
      });

      Promise.resolve(isFunction$1(action) ? action(e, file) : action).then((ret) => {
        if (ret === false) {
          return
        }

        const remainsFileList = removeFile(file, this.fileList);
        if (remainsFileList) {
          file.status = 'removed';
          this.fileList = remainsFileList;
          if (this.reqs[file.uuid]) {
            this.reqs[file.uuid].abort();
            delete this.reqs[file.uuid];
          }
        }

        this.onChange({
          file,
          fileList: remainsFileList,
        });
      });
    }

    _handleClick() {
      if (this.inputFile) {
        this.inputFile.element.click();
      }
    }

    _onkeyDown(e) {
      if (e.eky === 'Enter') {
        this._handleClick();
      }
    }
  }

  Component.register(Uploader);

  exports.Alert = Alert;
  exports.App = App;
  exports.Avatar = Avatar;
  exports.AvatarGroup = AvatarGroup;
  exports.Badge = Badge;
  exports.Button = Button;
  exports.Caption = Caption;
  exports.Cascader = Cascader;
  exports.Checkbox = Checkbox;
  exports.CheckboxList = CheckboxList;
  exports.Collapse = Collapse;
  exports.Cols = Cols;
  exports.Component = Component;
  exports.Confirm = Confirm;
  exports.Container = Container;
  exports.DatePicker = DatePicker;
  exports.Ellipsis = Ellipsis;
  exports.Field = Field;
  exports.Form = Form;
  exports.Grid = Grid;
  exports.Group = Group;
  exports.GroupList = GroupList;
  exports.Icon = Icon;
  exports.Layer = Layer;
  exports.Layout = Layout;
  exports.List = List;
  exports.ListItemMixin = ListItemMixin;
  exports.Loading = Loading;
  exports.MaskInfo = MaskInfo;
  exports.Menu = Menu;
  exports.Message = Message;
  exports.Modal = Modal;
  exports.MultilineTextbox = MultilineTextbox;
  exports.Navbar = Navbar;
  exports.Numberbox = Numberbox;
  exports.Pager = Pager;
  exports.Panel = Panel;
  exports.Password = Password;
  exports.Popup = Popup;
  exports.RadioList = RadioList;
  exports.Router = Router;
  exports.Rows = Rows;
  exports.Select = Select;
  exports.SlideCaptcha = SlideCaptcha;
  exports.Spinner = Spinner;
  exports.StaticText = StaticText;
  exports.Switch = Switch;
  exports.Table = Table;
  exports.Tabs = Tabs;
  exports.Tag = Tag;
  exports.Textbox = Textbox;
  exports.TimePicker = TimePicker;
  exports.TimeRangePicker = TimeRangePicker;
  exports.Timeline = Timeline;
  exports.Tooltip = Tooltip;
  exports.Tree = Tree;
  exports.TreeSelect = TreeSelect;
  exports.Uploader = Uploader;
  exports.n = n;
  exports.util = index;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
