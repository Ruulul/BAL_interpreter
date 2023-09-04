import { Tonic } from '@socketsupply/tonic'

class BalProgram extends Tonic {
  constructor () {
    super()
    this.state.delay = 10
    this.state.program = undefined
    this.state.input = ''
    this.state.output = ''
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
      'change-input': handleInput
    }
    handlers[event]?.call(this)

    function handleDelay () {
      this.state.delay = e.target.value
      this.reRender()
    }

    function handleFile () {
      e.target.files[0].arrayBuffer().then(program => {
        this.state.program = program
        this.querySelector('bal-memory').loadProgram(program)
      })
    }

    function handleInput () {
      this.state.input = e.target.value
      this.reRender()
    }
  }

  input (e) {
    const el = Tonic.match(e.target, '[data-event]')
    if (!el) return
    const event = el.dataset.event
    if (event === 'change-delay') this.querySelector('output[data-contains=delay]').textContent = e.target.value
  }

  render () {
    console.log(this.state)
    return this.html`
      <label class="grid p-3 gap-2">
        Insert your compiled BAL program here
        <input type=file data-event=input-file>
      </label>
      <label class="flex gap-2">
        Delay: <output data-contains=delay>${this.state.delay.toString()}</output> 
        <input data-event=change-delay type=range 
        min=0 
        max=500 
        step=10
        value=${this.state.delay.toString()}> ms
      </label>
      <label class="grid">
        <div>
          Input: <input value="${this.state.input}" data-event=change-input class="border-solid border-b-2 border-yellow-500 rounded w-1/2">
        </div>
      </label>
      <label class="grid whitespace-pre-wrap">
        Output:
        <output data-contains=output id=${this.id}-output></output>
      </label>
      <bal-memory id="${this.id}-memory" 
      input="${this.state.input}" 
      delay="${this.state.delay}"></bal-memory>
    `
  }
}
Tonic.add(BalProgram)

class BalMemory extends Tonic {
  constructor () {
    super()
    this.state.memory = this.state.memory ?? new Uint8Array(this.props.memoryLength || 256)
    this.state.dp = this.state.dp ?? 0
    this.state.ip = this.state.ip ?? 0
  }

  connected () {
    this.state.input = Array(...(this.props.input || ''))
    if (this.state.running) this.startRunCycle()
  }

  loadProgram (program) {
    new Uint8Array(program).forEach((cell, index) => (this.state.memory[index] = cell))
    this.state.dp = 0
    this.state.ip = 0
    this.reRender()
    this.state.running = true
    this.startRunCycle()
  }

  startRunCycle () {
    const instructions = [increment, decrement, goForward, goBack, jumpForward, jumpBack, input, output]
    setTimeout(cycle.bind(this), this.props.delay || 10)
    function cycle () {
      const instruction = this.state.memory[this.state.ip]
      const op = instruction >> 5
      const arg = instruction & 0b00011111
      const opFn = instructions[op]
      opFn.call(this, arg)
      this.reRender()
      if (instruction !== 0b011100000) {
        setTimeout(cycle.bind(this), this.props.delay)
        this.state.ip += 1
      }
    }

    function increment (x) {
      this.state.memory[this.state.dp] += x + 1
    }
    function decrement (x) {
      this.state.memory[this.state.dp] -= x + 1
    }
    function goForward (x) {
      this.state.dp += x + 1
      if (this.state.dp >= this.state.memory.length) this.state.dp = ((this.state.dp % this.state.memory.length) + this.state.memory.length) % this.state.memory.length
    }
    function goBack (x) {
      this.state.dp -= x + 1
      if (this.state.dp < 0) this.state.dp = ((this.state.dp % this.state.memory.length) + this.state.memory.length) % this.state.memory.length
    }
    function jumpForward (x) {
      if (this.state.memory[this.state.dp] === 0) this.state.ip += x
      if (this.state.ip >= this.state.memory.length) this.state.ip = ((this.state.ip % this.state.memory.length) + this.state.memory.length) % this.state.memory.length
    }
    function jumpBack (x) {
      if (this.state.memory[this.state.dp] !== 0) this.state.ip -= x + 2
      if (this.state.ip < 0) this.state.ip = ((this.state.ip % this.state.memory.length) + this.state.memory.length) % this.state.memory.length
    }
    function input () {
      console.log('input right before shift:', this.state.input)
      this.state.memory[this.state.dp] = this.state.input.shift()
    }
    function output () {
      this.parentElement.querySelector('[data-contains=output]').textContent += String.fromCharCode(this.state.memory[this.state.dp])
    }
  }

  render () {
    return this.html`
      ${[...this.state.memory].map((cell, i) => {
        const isUnderDP = this.state.dp === i
        const isUnderIP = this.state.ip === i
        return this.html`<div
        class="
          float-left
          p-4 m-1
          w-16 h-18
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
        ${cell.toString()}
      </div>`
    })}
    `
  }
}
Tonic.add(BalMemory)
