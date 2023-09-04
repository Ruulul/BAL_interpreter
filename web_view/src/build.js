(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Tonic = void 0;
class TonicTemplate {
  constructor(rawText, templateStrings, unsafe) {
    this.isTonicTemplate = true;
    this.unsafe = unsafe;
    this.rawText = rawText;
    this.templateStrings = templateStrings;
  }
  valueOf() {
    return this.rawText;
  }
  toString() {
    return this.rawText;
  }
}
class Tonic extends window.HTMLElement {
  static _tags = "";
  static _refIds = [];
  static _data = {};
  static _states = {};
  static _children = {};
  static _reg = {};
  static _stylesheetRegistry = [];
  static _index = 0;
  // eslint-disable-next-line no-undef
  static get version() {
    return "15.1.1";
  }
  static get SPREAD() {
    return /\.\.\.\s?(__\w+__\w+__)/g;
  }
  static get ESC() {
    return /["&'<>`/]/g;
  }
  static get AsyncFunctionGenerator() {
    return async function* () {}.constructor;
  }
  static get AsyncFunction() {
    return async function () {}.constructor;
  }
  static get MAP() {
    return {
      '"': "&quot;",
      "&": "&amp;",
      "'": "&#x27;",
      "<": "&lt;",
      ">": "&gt;",
      "`": "&#x60;",
      "/": "&#x2F;"
    };
  }
  constructor() {
    super();
    const state = Tonic._states[super.id];
    delete Tonic._states[super.id];
    this._state = state || {};
    this.preventRenderOnReconnect = false;
    this.props = {};
    this.elements = [...this.children];
    this.elements.__children__ = true;
    this.nodes = [...this.childNodes];
    this.nodes.__children__ = true;
    this._events();
  }
  get isTonicComponent() {
    return true;
  }
  static _createId() {
    return `tonic${Tonic._index++}`;
  }
  static _normalizeAttrs(o, x = {}) {
    [...o].forEach(o2 => x[o2.name] = o2.value);
    return x;
  }
  _checkId() {
    const _id = super.id;
    if (!_id) {
      const html = this.outerHTML.replace(this.innerHTML, "...");
      throw new Error(`Component: ${html} has no id`);
    }
    return _id;
  }
  get state() {
    return this._checkId(), this._state;
  }
  set state(newState) {
    this._state = (this._checkId(), newState);
  }
  _events() {
    const hp = Object.getOwnPropertyNames(window.HTMLElement.prototype);
    for (const p of this._props) {
      if (hp.indexOf("on" + p) === -1) continue;
      this.addEventListener(p, this);
    }
  }
  _prop(o) {
    const id = this._id;
    const p = `__${id}__${Tonic._createId()}__`;
    Tonic._data[id] = Tonic._data[id] || {};
    Tonic._data[id][p] = o;
    return p;
  }
  _placehold(r) {
    const id = this._id;
    const ref = `placehold:${id}:${Tonic._createId()}__`;
    Tonic._children[id] = Tonic._children[id] || {};
    Tonic._children[id][ref] = r;
    return ref;
  }
  static match(el, s) {
    if (!el.matches) el = el.parentElement;
    return el.matches(s) ? el : el.closest(s);
  }
  static getTagName(camelName) {
    return camelName.match(/[A-Z][a-z0-9]*/g).join("-").toLowerCase();
  }
  static getPropertyNames(proto) {
    const props = [];
    while (proto && proto !== Tonic.prototype) {
      props.push(...Object.getOwnPropertyNames(proto));
      proto = Object.getPrototypeOf(proto);
    }
    return props;
  }
  static add(c, htmlName) {
    const hasValidName = htmlName || c.name && c.name.length > 1;
    if (!hasValidName) {
      throw Error("Mangling. https://bit.ly/2TkJ6zP");
    }
    if (!htmlName) htmlName = Tonic.getTagName(c.name);
    if (!Tonic.ssr && window.customElements.get(htmlName)) {
      throw new Error(`Cannot Tonic.add(${c.name}, '${htmlName}') twice`);
    }
    if (!c.prototype || !c.prototype.isTonicComponent) {
      const tmp = {
        [c.name]: class extends Tonic {}
      }[c.name];
      tmp.prototype.render = c;
      c = tmp;
    }
    c.prototype._props = Tonic.getPropertyNames(c.prototype);
    Tonic._reg[htmlName] = c;
    Tonic._tags = Object.keys(Tonic._reg).join();
    window.customElements.define(htmlName, c);
    if (typeof c.stylesheet === "function") {
      Tonic.registerStyles(c.stylesheet);
    }
    return c;
  }
  static registerStyles(stylesheetFn) {
    if (Tonic._stylesheetRegistry.includes(stylesheetFn)) return;
    Tonic._stylesheetRegistry.push(stylesheetFn);
    const styleNode = document.createElement("style");
    if (Tonic.nonce) styleNode.setAttribute("nonce", Tonic.nonce);
    styleNode.appendChild(document.createTextNode(stylesheetFn()));
    if (document.head) document.head.appendChild(styleNode);
  }
  static escape(s) {
    return s.replace(Tonic.ESC, c => Tonic.MAP[c]);
  }
  static unsafeRawString(s, templateStrings) {
    return new TonicTemplate(s, templateStrings, true);
  }
  dispatch(eventName, detail = null) {
    const opts = {
      bubbles: true,
      detail
    };
    this.dispatchEvent(new window.CustomEvent(eventName, opts));
  }
  html(strings, ...values) {
    const refs = o => {
      if (o && o.__children__) return this._placehold(o);
      if (o && o.isTonicTemplate) return o.rawText;
      switch (Object.prototype.toString.call(o)) {
        case "[object HTMLCollection]":
        case "[object NodeList]":
          return this._placehold([...o]);
        case "[object Array]":
          {
            if (o.every(x => x.isTonicTemplate && !x.unsafe)) {
              return new TonicTemplate(o.join("\n"), null, false);
            }
            return this._prop(o);
          }
        case "[object Object]":
        case "[object Function]":
        case "[object Set]":
        case "[object Map]":
        case "[object WeakMap]":
          return this._prop(o);
        case "[object NamedNodeMap]":
          return this._prop(Tonic._normalizeAttrs(o));
        case "[object Number]":
          return `${o}__float`;
        case "[object String]":
          return Tonic.escape(o);
        case "[object Boolean]":
          return `${o}__boolean`;
        case "[object Null]":
          return `${o}__null`;
        case "[object HTMLElement]":
          return this._placehold([o]);
      }
      if (typeof o === "object" && o && o.nodeType === 1 && typeof o.cloneNode === "function") {
        return this._placehold([o]);
      }
      return o;
    };
    const out = [];
    for (let i = 0; i < strings.length - 1; i++) {
      out.push(strings[i], refs(values[i]));
    }
    out.push(strings[strings.length - 1]);
    const htmlStr = out.join("").replace(Tonic.SPREAD, (_, p) => {
      const o = Tonic._data[p.split("__")[1]][p];
      return Object.entries(o).map(([key, value]) => {
        const k = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
        if (value === true) return k;else if (value) return `${k}="${Tonic.escape(String(value))}"`;else return "";
      }).filter(Boolean).join(" ");
    });
    return new TonicTemplate(htmlStr, strings, false);
  }
  scheduleReRender(oldProps) {
    if (this.pendingReRender) return this.pendingReRender;
    this.pendingReRender = new Promise(resolve => setTimeout(() => {
      if (!this.isInDocument(this.shadowRoot || this)) return;
      const p = this._set(this.shadowRoot || this, this.render);
      this.pendingReRender = null;
      if (p && p.then) {
        return p.then(() => {
          this.updated && this.updated(oldProps);
          resolve(this);
        });
      }
      this.updated && this.updated(oldProps);
      resolve(this);
    }, 0));
    return this.pendingReRender;
  }
  reRender(o = this.props) {
    const oldProps = {
      ...this.props
    };
    this.props = typeof o === "function" ? o(oldProps) : o;
    return this.scheduleReRender(oldProps);
  }
  handleEvent(e) {
    this[e.type](e);
  }
  _drainIterator(target, iterator) {
    return iterator.next().then(result => {
      this._set(target, null, result.value);
      if (result.done) return;
      return this._drainIterator(target, iterator);
    });
  }
  _set(target, render, content = "") {
    this.willRender && this.willRender();
    for (const node of target.querySelectorAll(Tonic._tags)) {
      if (!node.isTonicComponent) continue;
      const id = node.getAttribute("id");
      if (!id || !Tonic._refIds.includes(id)) continue;
      Tonic._states[id] = node.state;
    }
    if (render instanceof Tonic.AsyncFunction) {
      return render.call(this, this.html, this.props).then(content2 => this._apply(target, content2));
    } else if (render instanceof Tonic.AsyncFunctionGenerator) {
      return this._drainIterator(target, render.call(this));
    } else if (render === null) {
      this._apply(target, content);
    } else if (render instanceof Function) {
      this._apply(target, render.call(this, this.html, this.props) || "");
    }
  }
  _apply(target, content) {
    if (content && content.isTonicTemplate) {
      content = content.rawText;
    } else if (typeof content === "string") {
      content = Tonic.escape(content);
    }
    if (typeof content === "string") {
      if (this.stylesheet) {
        content = `<style nonce=${Tonic.nonce || ""}>${this.stylesheet()}</style>${content}`;
      }
      target.innerHTML = content;
      if (this.styles) {
        const styles = this.styles();
        for (const node of target.querySelectorAll("[styles]")) {
          for (const s of node.getAttribute("styles").split(/\s+/)) {
            Object.assign(node.style, styles[s.trim()]);
          }
        }
      }
      const children = Tonic._children[this._id] || {};
      const walk = (node, fn) => {
        if (node.nodeType === 3) {
          const id = node.textContent.trim();
          if (children[id]) fn(node, children[id], id);
        }
        const childNodes = node.childNodes;
        if (!childNodes) return;
        for (let i = 0; i < childNodes.length; i++) {
          walk(childNodes[i], fn);
        }
      };
      walk(target, (node, children2, id) => {
        for (const child of children2) {
          node.parentNode.insertBefore(child, node);
        }
        delete Tonic._children[this._id][id];
        node.parentNode.removeChild(node);
      });
    } else {
      target.innerHTML = "";
      target.appendChild(content.cloneNode(true));
    }
  }
  connectedCallback() {
    this.root = this.shadowRoot || this;
    if (super.id && !Tonic._refIds.includes(super.id)) {
      Tonic._refIds.push(super.id);
    }
    const cc = s => s.replace(/-(.)/g, (_, m) => m.toUpperCase());
    for (const {
      name: _name,
      value
    } of this.attributes) {
      const name = cc(_name);
      const p = this.props[name] = value;
      if (/__\w+__\w+__/.test(p)) {
        const {
          1: root
        } = p.split("__");
        this.props[name] = Tonic._data[root][p];
      } else if (/\d+__float/.test(p)) {
        this.props[name] = parseFloat(p, 10);
      } else if (p === "null__null") {
        this.props[name] = null;
      } else if (/\w+__boolean/.test(p)) {
        this.props[name] = p.includes("true");
      } else if (/placehold:\w+:\w+__/.test(p)) {
        const {
          1: root
        } = p.split(":");
        this.props[name] = Tonic._children[root][p][0];
      }
    }
    this.props = Object.assign(this.defaults ? this.defaults() : {}, this.props);
    this._id = this._id || Tonic._createId();
    this.willConnect && this.willConnect();
    if (!this.isInDocument(this.root)) return;
    if (!this.preventRenderOnReconnect) {
      if (!this._source) {
        this._source = this.innerHTML;
      } else {
        this.innerHTML = this._source;
      }
      const p = this._set(this.root, this.render);
      if (p && p.then) return p.then(() => this.connected && this.connected());
    }
    this.connected && this.connected();
  }
  isInDocument(target) {
    const root = target.getRootNode();
    return root === document || root.toString() === "[object ShadowRoot]";
  }
  disconnectedCallback() {
    this.disconnected && this.disconnected();
    delete Tonic._data[this._id];
    delete Tonic._children[this._id];
  }
}
exports.Tonic = Tonic;
var _default = Tonic;
exports.default = _default;

},{}],2:[function(require,module,exports){
"use strict";

var _tonic = require("@socketsupply/tonic");
class BalProgram extends _tonic.Tonic {
  constructor() {
    super();
    this.state.delay = 110;
    this.state.program = undefined;
    this.state.input = '';
    this.state.output = '';
  }

  /**
   *
   * @param {InputEvent} e
   * @returns
   */
  change(e) {
    const el = _tonic.Tonic.match(e.target, '[data-event]');
    if (!el) return;
    const event = el.dataset.event;
    const handlers = {
      'input-file': handleFile,
      'change-delay': handleDelay,
      'change-input': handleInput
    };
    handlers[event]?.call(this);
    function handleDelay() {
      this.state.delay = e.target.value;
      this.reRender();
    }
    function handleFile() {
      e.target.files[0].arrayBuffer().then(program => {
        this.state.program = program;
        this.reloadProgram();
      });
    }
    function handleInput() {
      this.state.input = e.target.value + '\n';
      this.reRender();
    }
  }
  input(e) {
    const el = _tonic.Tonic.match(e.target, '[data-event]');
    if (!el) return;
    const event = el.dataset.event;
    if (event === 'change-delay') this.querySelector('output[data-contains=delay]').textContent = e.target.value;
  }
  click(e) {
    const el = _tonic.Tonic.match(e.target, '[data-event]');
    if (!el) return;
    const event = el.dataset.event;
    if (event === 'reload-program') {
      this.reloadProgram();
    }
  }
  reloadProgram() {
    this.querySelector('bal-memory').loadProgram(this.state.program);
    this.state.output = '';
    this.reRender();
  }
  handleBalOutput(output) {
    this.state.output += output;
    this.querySelector('output[data-contains=output]').textContent += output;
  }
  render() {
    let restartButton;
    if (this.state.program) {
      restartButton = this.html`
      <button data-event=reload-program class="hover:bg-slate-200 w-fit p-3 flex">Restart execution</button>
    `;
    }
    return this.html`
      <div class=grid>
      <label class="grid p-3 gap-2">
        Insert your compiled BAL program here
        <input type=file data-event=input-file>
      </label>
      ${restartButton}
      </div>
      <label class="flex gap-2">
        Delay: <output data-contains=delay>${this.state.delay.toString()}</output> 
        <input data-event=change-delay type=range 
        min=0 
        max=500 
        step=10
        value=${this.state.delay.toString()}> ms
      </label>
      <label>
        <div>
          Input: <input value="${this.state.input}" data-event=change-input class="border-solid border-b-2 border-yellow-500 rounded w-1/2">
        </div>
      </label>
      <label class="whitespace-pre-wrap m-3">
        Output:
        <output data-contains=output id=${this.id}-output>${this.state.output}</output>
      </label>
      <bal-memory 
      id="${this.id}-memory" 
      input="${this.state.input}"
      handle-output="${this.handleBalOutput.bind(this)}"
      delay="${this.state.delay}"></bal-memory>
    `;
  }
}
_tonic.Tonic.add(BalProgram);
class BalMemory extends _tonic.Tonic {
  RENDER_MODE = Object.freeze({
    data: 'data',
    code: 'code',
    text: 'text'
  });
  constructor() {
    super();
    this.state.memory = this.state.memory ?? new Uint8Array(this.props.memoryLength || 256);
    this.state.dp = this.state.dp ?? 0;
    this.state.ip = this.state.ip ?? 0;
    this.state.renderMode = this.state.renderMode ?? this.RENDER_MODE.data;
  }
  click(e) {
    const el = _tonic.Tonic.match(e.target, '[data-event]');
    if (!el) return;
    const event = el.dataset.event;
    if (event === 'toggle-run') {
      this.state.running = !this.state.running;
      if (this.state.running) this.startRunCycle();else clearInterval(this.state.runCycleId);
      this.reRender();
    }
  }
  change(e) {
    const el = _tonic.Tonic.match(e.target, '[data-event]');
    if (!el) return;
    const event = el.dataset.event;
    console.log(event);
    if (event === 'change-render-mode') {
      this.state.renderMode = el.value;
      this.reRender();
    }
  }
  connected() {
    this.state.input = Array(...(this.props.input || ''));
    if (this.state.running) this.startRunCycle();
  }
  disconnected() {
    clearTimeout(this.state.runCycleId);
  }
  loadProgram(program) {
    this.state.memory.fill(0);
    new Uint8Array(program).forEach((cell, index) => this.state.memory[index] = cell);
    this.state.dp = 0;
    this.state.ip = 0;
    this.reRender();
  }
  startRunCycle() {
    const instructions = [increment, decrement, goForward, goBack, jumpForward, jumpBack, input, output];
    this.state.runCycleId = setInterval(cycle.bind(this), this.props.delay || 10);
    function cycle() {
      const instruction = this.state.memory[this.state.ip];
      const op = instruction >> 5;
      const arg = instruction & 0b00011111;
      const opFn = instructions[op];
      opFn.call(this, arg);
      this.reRender();
      if (instruction !== 0b011100000) {
        this.state.ip += 1;
      } else clearInterval(this.state.runCycleId);
    }
    function increment(x) {
      this.state.memory[this.state.dp] += x + 1;
    }
    function decrement(x) {
      this.state.memory[this.state.dp] -= x + 1;
    }
    function goForward(x) {
      this.state.dp += x + 1;
      if (this.state.dp >= this.state.memory.length) this.state.dp = (this.state.dp % this.state.memory.length + this.state.memory.length) % this.state.memory.length;
    }
    function goBack(x) {
      this.state.dp -= x + 1;
      if (this.state.dp < 0) this.state.dp = (this.state.dp % this.state.memory.length + this.state.memory.length) % this.state.memory.length;
    }
    function jumpForward(x) {
      if (this.state.memory[this.state.dp] === 0) this.state.ip += x;
      if (this.state.ip >= this.state.memory.length) this.state.ip = (this.state.ip % this.state.memory.length + this.state.memory.length) % this.state.memory.length;
    }
    function jumpBack(x) {
      if (this.state.memory[this.state.dp] !== 0) this.state.ip -= x + 2;
      if (this.state.ip < 0) this.state.ip = (this.state.ip % this.state.memory.length + this.state.memory.length) % this.state.memory.length;
    }
    function input() {
      if (this.state.input.length === 0) this.state.input = [...Array(...prompt('Insert input')), '\n']; // eslint-disable-line no-undef
      this.state.memory[this.state.dp] = this.state.input.shift().charCodeAt(0);
    }
    function output() {
      this.props.handleOutput(String.fromCharCode(this.state.memory[this.state.dp]));
    }
  }
  render() {
    return this.html`
      <button class="
        p-2 text-xl hover:bg-slate-200
      " data-event=toggle-run>${this.state.running ? 'Stop' : 'Start'}</button>
      <label class="grid ml-3"> render mode: 
        <select class=w-1/3 data-event=change-render-mode>
          ${Object.keys(this.RENDER_MODE).map(renderMode => this.html`
          <option value=${renderMode} ${renderMode === this.state.renderMode ? 'selected' : ''}>${[renderMode[0].toUpperCase(), ...renderMode.slice(1)].join('')}</option>
          `)}
        </select>
      </label>
      ${[...this.state.memory].map(this.renderCell, this)}
    `;
  }
  renderCell(cell, i) {
    const isUnderDP = this.state.dp === i;
    const isUnderIP = this.state.ip === i;
    const ops = '+-><[],.';
    const op = cell >> 5;
    const args = cell & 0b00011111;
    let cellRendering;
    switch (this.state.renderMode) {
      case this.RENDER_MODE.data:
        cellRendering = cell;
        break;
      case this.RENDER_MODE.code:
        if (op <= 5) cellRendering = ops[op] + (args + 1);else cellRendering = ops[op] + args;
        break;
      case this.RENDER_MODE.text:
        cellRendering = String.fromCharCode(cell);
    }
    return this.html`<div
    class="
      box-border
      float-left
      pt-2
      w-[6vw] h-12
      text-2xl
      text-center
      ${isUnderDP && isUnderIP ? 'bg-orange-600 text-white' : isUnderDP ? 'bg-yellow-500' : isUnderIP ? 'bg-red-800 text-white' : ''}
      border-solid border-cyan-800 border-2
    ">
    ${cellRendering.toString()}
  </div>`;
  }
}
_tonic.Tonic.add(BalMemory);

},{"@socketsupply/tonic":1}]},{},[2]);
