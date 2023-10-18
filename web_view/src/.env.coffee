{Tonic} = require '@socketsupply/tonic'
exports.buttonStyle = 'p-2 text-xl hover:bg-slate-200 transition w-fit rounded shadow-lg'
exports.capitalize = (string) ->
  [string[0].toUpperCase(), string.slice(1)...]
  .join ''
exports.processEvent = 
  (fn, dataField = 'event') =>
    (e) ->
      el = Tonic.match e.target, "[data-#{dataField}]"
      return unless el?
      event = el.dataset[dataField]
      fn.call this, event, el