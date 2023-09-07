import { Tonic } from '@socketsupply/tonic'

const buttonStyle = 'p-2 text-xl hover:bg-slate-200 transition w-fit rounded shadow-lg'

class BalProgram extends Tonic {
  constructor () {
    super()
    this.state.delay = 110
    this.state.program = undefined
    this.state.input = ''
    this.state.output = ''
    this.state.memoryLength = 256
  }

  /**
   *
   * @param {InputEvent} e
   * @returns
   */
  change (e) {
    const el = Tonic.match(e.target, '[data-event]')
    if (!el) return
    const event = el.dataset.event
    const handlers = {
      'input-file': handleFile,
      'change-delay': handleDelay,
      'change-input': handleInput,
      'change-memory': handleMemory
    }
    handlers[event]?.call(this)

    function handleDelay () {
      this.state.delay = e.target.value
      this.reRender()
    }

    function handleFile () {
      e.target.files[0].arrayBuffer().then(program => {
        this.state.program = program
        this.reloadProgram()
      })
    }

    function handleInput () {
      this.state.input = e.target.value + '\n'
      this.reRender()
    }

    function handleMemory () {
      this.state.memoryLength = parseInt(e.target.value)
      this.reRender()
    }
  }

  input (e) {
    const el = Tonic.match(e.target, '[data-event]')
    if (!el) return
    const event = el.dataset.event
    if (event === 'change-delay') this.querySelector('output[data-contains=delay]').textContent = e.target.value
  }

  click (e) {
    const el = Tonic.match(e.target, '[data-event]')
    if (!el) return
    const event = el.dataset.event
    if (event === 'reload-program') {
      this.reloadProgram()
    }
  }

  reloadProgram () {
    this.querySelector('bal-memory').loadProgram(this.state.program)
    this.state.output = ''
    this.reRender()
  }

  handleBalOutput (output) {
    this.state.output += output
    this.querySelector('output[data-contains=output]').textContent += output
  }

  render () {
    let restartButton
    if (this.state.program) {
      restartButton = this.html`
      <button data-event=reload-program class="${buttonStyle}">Restart execution</button>
    `
    }
    return this.html`
      <div class="grid m-auto p-2">
        <label class="${buttonStyle}">
          Insert your compiled BAL program here
          <input class=hidden type=file data-event=input-file>
        </label>
        ${restartButton}
      </div>
      <label class="flex gap-2 p-2">
        Delay: <output data-contains=delay>${this.state.delay.toString()}</output> 
        <input data-event=change-delay type=range 
        min=0 
        max=500 
        step=10
        value=${this.state.delay.toString()}> ms
      </label>
      <label class="flex p-2">
          Memory Length: <input value="${this.state.memoryLength.toString()}" type=number data-event=change-memory class="border-solid border-b-2 border-yellow-500 rounded w-4">
      </label>
      <label class="p-2">
          Input: <input value="${this.state.input}" data-event=change-input class="border-solid border-b-2 border-yellow-500 rounded w-1/2">
      </label>
      <label class="whitespace-pre-wrap m-3">
        Output:
        <output data-contains=output id=${this.id}-output>${this.state.output}</output>
      </label>
      <bal-memory 
      id="${this.id}-memory" 
      input="${this.state.input}"
      handle-output="${this.handleBalOutput.bind(this)}"
      memory-length="${this.state.memoryLength}"
      delay="${this.state.delay}"></bal-memory>
    `
  }
}
Tonic.add(BalProgram)

class BalMemory extends Tonic {
  RENDER_MODE = Object.freeze({
    data: 'data',
    code: 'code',
    text: 'text'
  })

  constructor () {
    super()
    this.state.dp = this.state.dp ?? 0
    this.state.ip = this.state.ip ?? 0
    this.state.renderMode = this.state.renderMode ?? this.RENDER_MODE.data
    console.log(this.props, this.state)
  }

  click (e) {
    const el = Tonic.match(e.target, '[data-event]')
    if (!el) return
    const event = el.dataset.event
    if (event === 'toggle-run') {
      this.state.running = !this.state.running
      if (this.state.running) this.startRunCycle()
      else clearInterval(this.state.runCycleId)
      this.reRender()
    }
  }

  change (e) {
    const el = Tonic.match(e.target, '[data-event]')
    if (!el) return
    const event = el.dataset.event
    console.log(event)
    if (event === 'change-render-mode') {
      this.state.renderMode = el.value
      this.reRender()
    }
  }

  willConnect () {
    this.state.memory = this.state.memory ?? new Uint8Array(this.props.memoryLength)
    if (this.state.memory.length !== this.props.memoryLength) {
      this.state.memory = new Uint8Array(this.props.memoryLength)
    }
    this.state.input = Array(...(this.props.input || ''))
  }

  connected () {
    if (this.state.running) this.startRunCycle()
  }

  disconnected () {
    clearTimeout(this.state.runCycleId)
  }

  loadProgram (program) {
    this.state.memory.fill(0)
    new Uint8Array(program.slice(0, this.state.memory.length)).forEach((cell, index) => (this.state.memory[index] = cell))
    this.state.dp = 0
    this.state.ip = 0
    this.reRender()
  }

  startRunCycle () {
    const instructions = [increment, decrement, goForward, goBack, jumpForward, jumpBack, input, output]
    const memLength = this.state.memory.length
    this.state.runCycleId = setInterval(cycle.bind(this), this.props.delay || 10)
    function cycle () {
      if (this.state.dp >= memLength || this.state.dp < 0) this.state.dp = ((this.state.dp % memLength) + memLength) % memLength
      if (this.state.ip >= memLength || this.state.ip < 0) this.state.ip = ((this.state.ip % memLength) + memLength) % memLength
      const instruction = this.state.memory[this.state.ip]
      const op = instruction >> 5
      const arg = instruction & 0b00011111
      const opFn = instructions[op]
      opFn.call(this, arg)
      this.reRender()
      if (instruction !== 0b011100000) {
        this.state.ip += 1
      } else clearInterval(this.state.runCycleId)
    }

    function increment (x) {
      this.state.memory[this.state.dp] += x + 1
    }
    function decrement (x) {
      this.state.memory[this.state.dp] -= x + 1
    }
    function goForward (x) {
      this.state.dp += x + 1
    }
    function goBack (x) {
      this.state.dp -= x + 1
    }
    function jumpForward (x) {
      if (this.state.memory[this.state.dp] === 0) this.state.ip += x
    }
    function jumpBack (x) {
      if (this.state.memory[this.state.dp] !== 0) this.state.ip -= x + 2
    }
    function input () {
      if (this.state.input.length === 0) this.state.input = [...Array(...prompt('Insert input')), '\n'] // eslint-disable-line no-undef
      this.state.memory[this.state.dp] = this.state.input.shift().charCodeAt(0)
    }
    function output () {
      this.props.handleOutput(String.fromCharCode(this.state.memory[this.state.dp]))
    }
  }

  render () {
    return this.html`
      <button class="${buttonStyle}" data-event=toggle-run>${this.state.running ? 'Stop' : 'Start'}</button>
      <label class="grid ml-3"> render mode: 
        <select class=w-1/3 data-event=change-render-mode>
          ${Object.keys(this.RENDER_MODE).map(renderMode => this.html`
          <option value=${renderMode} ${renderMode === this.state.renderMode ? 'selected' : ''}>${
            [renderMode[0].toUpperCase(), ...renderMode.slice(1)].join('')
          }</option>
          `)}
        </select>
      </label>
      ${this.state.memory && [...this.state.memory].map(this.renderCell, this) || 'No memory'}
    `
  }

  renderCell (cell, i) {
    const isUnderDP = this.state.dp === i
    const isUnderIP = this.state.ip === i
    const ops = '+-><[],.'
    const op = cell >> 5
    const args = cell & 0b00011111
    let cellRendering
    switch (this.state.renderMode) {
      case this.RENDER_MODE.data:
        cellRendering = cell
        break
      case this.RENDER_MODE.code:
        if (op <= 5) cellRendering = ops[op] + (args + 1)
        else cellRendering = ops[op] + args
        break
      case this.RENDER_MODE.text:
        cellRendering = String.fromCharCode(cell)
    }

    return this.html`<div
    class="
      box-border
      float-left
      pt-2
      w-[6vw] h-12
      text-2xl
      text-center
      ${
        isUnderDP && isUnderIP
          ? 'bg-orange-600 text-white'
          : isUnderDP
          ? 'bg-yellow-500'
          : isUnderIP
          ? 'bg-red-800 text-white'
          : ''
      }
      border-solid border-cyan-800 border-2
    ">
    ${cellRendering.toString()}
  </div>`
  }
}
Tonic.add(BalMemory)
