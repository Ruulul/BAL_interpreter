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
var Tonic;

({Tonic} = require('@socketsupply/tonic'));

exports.buttonStyle = 'p-2 text-xl hover:bg-slate-200 transition w-fit rounded shadow-lg';

exports.capitalize = function(string) {
  return [string[0].toUpperCase(), ...string.slice(1)].join('');
};

exports.processEvent = (fn, dataField = 'event') => {
  return function(e) {
    var el, event;
    el = Tonic.match(e.target, `[data-${dataField}]`);
    if (el == null) {
      return;
    }
    event = el.dataset[dataField];
    return fn.call(this, event, el);
  };
};


},{"@socketsupply/tonic":1}],3:[function(require,module,exports){
var BalMemory, Tonic, exports, processEvent,
  modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

({Tonic} = require('@socketsupply/tonic'));

({processEvent} = require('./.env.coffee'));

module.exports = exports = BalMemory = (function() {
  class BalMemory extends Tonic {
    constructor() {
      var base, base1, base2;
      super();
      if ((base = this.state).dp == null) {
        base.dp = 0;
      }
      if ((base1 = this.state).ip == null) {
        base1.ip = 0;
      }
      if ((base2 = this.state).renderMode == null) {
        base2.renderMode = BalMemory.RENDER_MODE.data;
      }
    }

    toggleRun() {
      this.state.running = !this.state.running;
      if (this.state.running) {
        return this.startRunCycle();
      } else {
        return clearInterval(this.state.runCycleId);
      }
    }

    changeRenderMode(newRenderMode) {
      this.state.renderMode = newRenderMode;
      return this.reRender();
    }

    willConnect() {
      var base;
      if ((base = this.state).memory == null) {
        base.memory = new Uint8Array(this.props.memoryLength);
      }
      if (this.state.memory.length !== this.props.memoryLength) {
        this.state.memory = new Uint8Array(this.props.memoryLength);
      }
      return this.state.input = Array(...(this.props.input || ''));
    }

    connected() {
      if (this.state.running) {
        return this.startRunCycle();
      }
    }

    disconnected() {
      return clearTimeout(this.state.runCycleId);
    }

    loadProgram(program) {
      var cell, index, j, len, ref;
      this.state.memory.fill(0);
      ref = new Uint8Array(program.slice(0, this.state.memory.length));
      for (index = j = 0, len = ref.length; j < len; index = ++j) {
        cell = ref[index];
        this.state.memory[index] = cell;
      }
      this.state.dp = 0;
      this.state.ip = 0;
      return this.reRender();
    }

    startRunCycle() {
      var decrement, goBack, goForward, increment, input, instructions, jumpBack, jumpForward, memLength, output;
      increment = (x) => {
        return this.state.memory[this.state.dp] += x + 1;
      };
      decrement = (x) => {
        return this.state.memory[this.state.dp] -= x + 1;
      };
      goForward = function(x) {
        return this.state.dp += x + 1;
      };
      goBack = function(x) {
        return this.state.dp -= x + 1;
      };
      jumpForward = function(x) {
        if (this.state.memory[this.state.dp] === 0) {
          return this.state.ip += x;
        }
      };
      jumpBack = function(x) {
        if (this.state.memory[this.state.dp] !== 0) {
          return this.state.ip -= x + 2;
        }
      };
      input = function() {
        if (this.state.input.length === 0) {
          this.state.input = Array.from((prompt('Insert input')) + '\n');
        }
        return this.state.memory[this.state.dp] = this.state.input.shift().charCodeAt(0);
      };
      output = function() {
        return this.props.handleOutput(String.fromCharCode(this.state.memory[this.state.dp]));
      };
      instructions = [increment, decrement, goForward, goBack, jumpForward, jumpBack, input, output];
      memLength = this.state.memory.length;
      return this.state.runCycleId = setInterval(() => {
        var arg, base, base1, instruction, op, opFn;
        (base = this.state).dp = modulo(base.dp, memLength);
        (base1 = this.state).ip = modulo(base1.ip, memLength);
        instruction = this.state.memory[this.state.ip];
        op = instruction >> 5;
        arg = instruction & 0b00011111;
        opFn = instructions[op];
        opFn.call(this, arg);
        this.reRender();
        if (instruction !== 0b011100000) {
          return this.state.ip += 1;
        } else {
          return clearInterval(this.state.runCycleId);
        }
      }, this.props.delay || 10);
    }

    render() {
      var cell, i;
      return this.html`${(function() {
        var j, len, ref, results;
        if (this.state.memory != null) {
          ref = this.state.memory;
          results = [];
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            cell = ref[i];
            results.push(this.renderCell(cell, i));
          }
          return results;
        } else {
          return 'No memory';
        }
      }).call(this)}`;
    }

    renderCell(cell, i) {
      var OPS, RENDER_MODE, args, cellRendering, isUnderDP, isUnderIP, op;
      ({RENDER_MODE, OPS} = BalMemory);
      isUnderDP = this.state.dp === i;
      isUnderIP = this.state.ip === i;
      op = cell >> 5;
      args = cell & 0b00011111;
      cellRendering = (function() {
        switch (this.state.renderMode) {
          case RENDER_MODE.data:
            return cell;
          case RENDER_MODE.code:
            if (op <= 5) {
              return OPS[op] + (args + 1);
            } else {
              return OPS[op] + args;
            }
            break;
          case RENDER_MODE.text:
            return String.fromCharCode(cell);
        }
      }).call(this);
      return this.html`<div
  data-event=edit-cell
  data-index=${i.toString()}
  class="
    box-border
    float-left
    pt-2
    w-[6vw] h-12
    text-2xl
    text-center
    ${isUnderDP && isUnderIP ? 'bg-orange-600 text-white' : isUnderDP ? 'bg-yellow-500' : isUnderIP ? 'bg-red-800 text-white' : ''}
    transition duration-500
    border-solid border-cyan-800 border-2
  ">
  ${cellRendering.toString()}
</div>`;
    }

  };

  BalMemory.RENDER_MODE = {
    data: 'data',
    code: 'code',
    text: 'text'
  };

  BalMemory.OPS = '+-><[],.';

  BalMemory.prototype.click = processEvent(function(event, el) {
    var RENDER_MODE, index, new_value;
    switch (event) {
      case 'edit-cell':
        if (this.state.running) {
          this.state.running = false;
          clearInterval(this.state.runCycleId);
        }
        ({RENDER_MODE} = BalMemory);
        index = el.dataset.index;
        new_value = prompt(`Insert the new value (based on the render mode: ${this.state.renderMode})`);
        switch (this.state.renderMode) {
          case RENDER_MODE.code:
            this.state.memory[index] = this.OPS.indexOf(new_value[0] << 5) + ((parseInt(new_value.slice(1))) & 0b11111);
            break;
          case RENDER_MODE.data:
            this.state.memory[index] = parseInt(new_value);
            break;
          case RENDER_MODE.text:
            this.state.memory[index] = new_value.charCodeAt(0);
        }
        return this.reRender();
    }
  });

  return BalMemory;

}).call(this);

Tonic.add(BalMemory);


},{"./.env.coffee":2,"@socketsupply/tonic":1}],4:[function(require,module,exports){
var BalProgram, RENDER_MODE, Tonic, buttonStyle, capitalize, processEvent;

({Tonic} = require('@socketsupply/tonic'));

({RENDER_MODE} = require('./BalMemory.coffee'));

({buttonStyle, capitalize, processEvent} = require('./.env.coffee'));

BalProgram = (function() {
  class BalProgram extends Tonic {
    constructor() {
      super();
      this.state = {
        delay: 110,
        program: void 0,
        input: '',
        output: '',
        memoryLength: 256,
        running: 'Start'
      };
    }

    reloadProgram() {
      this.querySelector('bal-memory').loadProgram(this.state.program);
      this.state.output = '';
      return this.reRender();
    }

    handleBalOutput(output) {
      this.state.output += output;
      return this.querySelector('output[data-contains=output]').textContent += output;
    }

    render() {
      var restartButton;
      if (this.state.program != null) {
        restartButton = this.html`<button data-event=reload-program class='${buttonStyle}'>Restart execution</button>`;
      }
      return this.html`<div class="grid m-auto p-2">
  <label class="${buttonStyle}">
    Insert your compiled BAL program here
    <input class=hidden type=file data-event=input-file>
  </label>
  ${restartButton}
</div>
${this.renderDelayDial()}
<label class="flex p-2">
    Memory Length: <input value="${this.state.memoryLength.toString()}" type=number data-event=change-memory class="border-solid border-b-2 border-yellow-500 rounded w-fit">
</label>
${this.renderIO()}
<button class="${buttonStyle}" data-event="toggle-run">${this.state.running}</button>
${this.renderRenderModeSelect()}
<bal-memory 
id="${this.id}-memory" 
input="${this.state.input}"
handle-output="${this.handleBalOutput.bind(this)}"
memory-length="${this.state.memoryLength}"
delay="${this.state.delay}"></bal-memory>`;
    }

    renderRenderModeSelect() {
      var balMemory, renderMode;
      balMemory = this.querySelector('bal-memory');
      return this.html`<label class="grid ml-3"> render mode: 
  <select class=w-1/3 data-event=change-render-mode>
    ${(function() {
        var results;
        results = [];
        for (renderMode in RENDER_MODE) {
          results.push(this.html`<option value="${renderMode}" ${renderMode === (balMemory != null ? balMemory.state.renderMode : void 0) ? 'selected' : void 0}>
  ${capitalize(renderMode)}
</option>`);
        }
        return results;
      }).call(this)}
  </select>
</label>`;
    }

    renderDelayDial() {
      return this.html`<label class="flex gap-2 p-2">
  Delay: <output data-contains=delay>${this.state.delay.toString()}</output> 
  <input data-event=change-delay type=range 
  min=0 
  max=500 
  step=10
  value=${this.state.delay.toString()}> ms
</label>`;
    }

    renderIO() {
      return this.html`<label class="p-2">
    Input: <input value="${this.state.input}" data-event=change-input class="border-solid border-b-2 border-yellow-500 rounded w-1/2">
</label>
<label class="whitespace-pre-wrap m-3">
  Output:
  <output data-contains=output id=${this.id}-output>${this.state.output}</output>
</label>`;
    }

  };

  BalProgram.prototype.change = processEvent(function(event, el) {
    switch (event) {
      case 'input-file':
        return el.files[0].arrayBuffer().then((program) => {
          this.state.program = program;
          return this.reloadProgram();
        });
      case 'change-delay':
        this.state.delay = el.value;
        return this.reRender();
      case 'change-input':
        this.state.input = el.value + '\n';
        return this.reRender();
      case 'change-memory':
        this.state.memoryLength = parseInt(el.value);
        return this.reRender();
    }
  });

  BalProgram.prototype.input = processEvent(function(event, el) {
    if (event === 'change-delay') {
      return this.querySelector('output[data-contains=delay]').textContent = el.value;
    }
  });

  BalProgram.prototype.click = processEvent(function(event) {
    var memory;
    switch (event) {
      case 'reload-program':
        return this.reloadProgram();
      case 'toggle-run':
        memory = this.querySelector('bal-memory');
        memory.toggleRun();
        this.state.running = memory.state.running === true ? 'Stop' : 'Start';
        return this.reRender();
    }
  });

  return BalProgram;

}).call(this);

Tonic.add(BalProgram);


},{"./.env.coffee":2,"./BalMemory.coffee":3,"@socketsupply/tonic":1}],5:[function(require,module,exports){
"use strict";

require("./BalProgram.coffee");
require("./BalMemory.coffee");

},{"./BalMemory.coffee":3,"./BalProgram.coffee":4}]},{},[5]);
