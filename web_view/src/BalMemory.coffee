{ Tonic } = require '@socketsupply/tonic'
{ processEvent } = require './.env.coffee'

module.exports = exports = class BalMemory extends Tonic
  @RENDER_MODE:
    data: 'data'
    code: 'code'
    text: 'text'
  @OPS: '+-><[],.'
  constructor: ->
    super()
    @state.dp ?= 0
    @state.ip ?= 0
    @state.renderMode ?= BalMemory.RENDER_MODE.data
  
  toggleRun: ->
    @state.running = !@state.running
    if @state.running then @startRunCycle() else clearInterval @state.runCycleId

  click: processEvent (event, el) ->
    switch event
      when 'edit-cell'
        if @state.running 
          @state.running = off
          clearInterval @state.runCycleId

        {RENDER_MODE} = BalMemory
        index = el.dataset.index
        new_value = prompt "Insert the new value (based on the render mode: #{@state.renderMode})"
        switch @state.renderMode
          when RENDER_MODE.code
            @state.memory[index] = @OPS.indexOf(new_value[0] << 5) + ((parseInt new_value.slice 1) & 0b11111)
          when RENDER_MODE.data
            @state.memory[index] = parseInt(new_value)
          when RENDER_MODE.text
            @state.memory[index] = new_value.charCodeAt(0)
        @reRender()

  changeRenderMode: (newRenderMode) ->
    @state.renderMode = newRenderMode
    @reRender()

  willConnect: -> 
    @state.memory ?= new Uint8Array @props.memoryLength
    if @state.memory.length != @props.memoryLength
      @state.memory = new Uint8Array(@props.memoryLength)

    @state.input = Array (this.props.input || '')...

  connected: -> @startRunCycle() if @state.running

  disconnected: -> clearTimeout @state.runCycleId

  loadProgram: (program) ->
    @state.memory.fill(0)
    @state.memory[index] = cell for cell, index in new Uint8Array program.slice 0, @state.memory.length
    @state.dp = 0
    @state.ip = 0
    @reRender()

  startRunCycle: ->
    increment = (x) => @state.memory[@state.dp] += x + 1
    decrement = (x) => @state.memory[@state.dp] -= x + 1
    goForward = (x) -> @state.dp += x + 1
    goBack = (x) -> @state.dp -= x + 1
    jumpForward = (x) -> this.state.ip += x if @state.memory[@state.dp] is 0 
    jumpBack = (x) -> this.state.ip -= x + 2 if @state.memory[@state.dp] isnt 0
    input = ->
      @state.input = Array.from (prompt 'Insert input') + '\n' if @state.input.length == 0
      @state.memory[@state.dp] = @state.input.shift().charCodeAt(0)
    output = -> @props.handleOutput String.fromCharCode @state.memory[@state.dp]

  
    instructions = [increment, decrement, goForward, goBack, jumpForward, jumpBack, input, output]
    memLength = @state.memory.length
    @state.runCycleId = 
      setInterval =>
        @state.dp %%= memLength
        @state.ip %%= memLength
        instruction = @state.memory[@state.ip]
        op = instruction >> 5
        arg = instruction & 0b00011111
        opFn = instructions[op]
        opFn.call(this, arg)
        @.reRender()
        if instruction isnt 0b011100000
          @state.ip += 1
        else clearInterval(@state.runCycleId)
      , @props.delay || 10


  render: ->
    @html"""
      #{if @state.memory? then @renderCell cell, i for cell, i in @state.memory else 'No memory'}
    """

  renderCell: (cell, i) ->
    { RENDER_MODE, OPS } = BalMemory
    isUnderDP = @state.dp == i
    isUnderIP = @state.ip == i
    op = cell >> 5
    args = cell & 0b00011111
    cellRendering = switch @state.renderMode
      when RENDER_MODE.data then cell
      when RENDER_MODE.code
        if op <= 5 then OPS[op] + (args + 1)  else OPS[op] + args
      when RENDER_MODE.text
        String.fromCharCode cell

    @html"""<div
    data-event=edit-cell
    data-index=#{i.toString()}
    class="
      box-border
      float-left
      pt-2
      w-[6vw] h-12
      text-2xl
      text-center
      #{
        if isUnderDP and isUnderIP 
        then 'bg-orange-600 text-white'
        else if isUnderDP
        then 'bg-yellow-500'
        else if isUnderIP
        then 'bg-red-800 text-white'
        else ''
      }
      transition duration-500
      border-solid border-cyan-800 border-2
    ">
    #{cellRendering.toString()}
  </div>"""

Tonic.add BalMemory
