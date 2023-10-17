{ Tonic } = require '@socketsupply/tonic'
{ buttonStyle } = require './.env.js'

class BalProgram extends Tonic
  constructor: ->
    super()
    @state =
      delay: 110
      program: undefined
      input: ''
      output: ''
      memoryLength: 256
      running: 'Start'
  change: (e) ->
    el = Tonic.match e.target, '[data-event]'
    return unless el?
    event = el.dataset.event
    switch event
      when 'input-file'
        e.target.files[0].arrayBuffer()
        .then (program) =>
          @state.program = program
          @reloadProgram()
      when 'change-delay'
        @state.delay = e.target.value
        @reRender()
      when 'change-input'
        @state.input = e.target.value + '\n'
        @reRender()
      when 'change-memory'
        @state.memoryLength = parseInt e.target.value
        @reRender()
  
  input: (e) ->
    el = Tonic.match e.target, '[data-event]'
    return unless el?
    event = el.dataset.event
    @querySelector('output[data-contains=delay]').textContent = e.target.value if event == 'change-delay'

  click: (e) ->
    el = Tonic.match e.target, '[data-event]'
    return unless el?
    event = el.dataset.event
    switch event
      when 'reload-program'
        @reloadProgram()
      when 'toggle-run'
        memory = @querySelector('bal-memory') 
        memory.toggleRun()
        @state.running = if memory.state.running is on then 'Stop' else 'Start'
        @reRender()

  reloadProgram: -> 
    @querySelector 'bal-memory'
    .loadProgram @state.program
    @state.output = ''
    @reRender()

  handleBalOutput: (output) ->
    @state.output += output
    @querySelector('output[data-contains=output]').textContent += output

  render: -> 
    restartButton = this.html"<button data-event=reload-program class='#{buttonStyle}'>Restart execution</button>" if @state.program?
    return this.html"""
      <div class="grid m-auto p-2">
        <label class="#{buttonStyle}">
          Insert your compiled BAL program here
          <input class=hidden type=file data-event=input-file>
        </label>
        #{restartButton}
      </div>
      <label class="flex gap-2 p-2">
        Delay: <output data-contains=delay>#{this.state.delay.toString()}</output> 
        <input data-event=change-delay type=range 
        min=0 
        max=500 
        step=10
        value=#{@state.delay.toString()}> ms
      </label>
      <label class="flex p-2">
          Memory Length: <input value="#{@state.memoryLength.toString()}" type=number data-event=change-memory class="border-solid border-b-2 border-yellow-500 rounded w-fit">
      </label>
      <label class="p-2">
          Input: <input value="#{@state.input}" data-event=change-input class="border-solid border-b-2 border-yellow-500 rounded w-1/2">
      </label>
      <label class="whitespace-pre-wrap m-3">
        Output:
        <output data-contains=output id=#{@id}-output>#{@state.output}</output>
      </label>
      <button class="#{buttonStyle}" data-event="toggle-run">#{@state.running}</button>
      <bal-memory 
      id="#{@id}-memory" 
      input="#{@state.input}"
      handle-output="#{@handleBalOutput.bind(this)}"
      memory-length="#{@state.memoryLength}"
      delay="#{@state.delay}"></bal-memory>
    """

Tonic.add BalProgram
