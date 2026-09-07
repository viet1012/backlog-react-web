const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Exercise the real modules with a fixed local clock and minimal hook/grid adapters.
const RealDate = Date
class FixedDate extends RealDate {
  constructor(...args) {
    super(...(args.length ? args : [2026, 8, 7, 15, 30, 47, 123]))
  }
}

let slots = []
let cursor = 0
const react = {
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  useEffect: () => {},
  useRef: (value) => {
    const index = cursor++
    return slots[index] ??= { current: value }
  },
  useState: (initial) => {
    const index = cursor++
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
    return [slots[index], (value) => {
      slots[index] = typeof value === 'function' ? value(slots[index]) : value
    }]
  },
}
let hitCell
let savedRequest
const cache = new Map()
function load(relative) {
  const filename = path.resolve(__dirname, '..', relative)
  if (cache.has(filename)) return cache.get(filename)
  const exports = {}
  cache.set(filename, exports)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, {
    exports,
    Date: FixedDate,
    document: { elementFromPoint: () => hitCell },
    fetch: async (url, options) => {
      savedRequest = { url, ...options, body: JSON.parse(options.body) }
      return { ok: true, json: async () => ({ success: true, updatedCount: 1 }) }
    },
    require: (name) => {
      if (name === 'react') return react
      if (name === '../config/api') return { API_BASE_URL: 'http://test' }
      return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), name + '.ts')))
    },
  }, { filename })
  return exports
}

const dates = load('src/utils/facConfirmDateTime.ts')
const { useFacConfirmCellEditState: runEditHook } = load('src/components/facConfirm/hooks/useFacConfirmCellEditState.ts')
const { useFacConfirmFillHandle: runFillHook } = load('src/components/facConfirm/hooks/useFacConfirmFillHandle.ts')
const { saveFacConfirmProcessTimes } = load('src/services/facConfirmService.ts')
const base = { aufnr: 'test', zglobalCode: null, isDC53: false, isTD: false, heatStart: '07/09/2026 08:00', heatFinish: null }
const cases = [
  ['A', { isDC53: true }, '12/09/2026 07:59', false],
  ['B', { isDC53: true }, '12/09/2026 08:00', true],
  ['C', { isTD: true }, '09/09/2026 07:59', false],
  ['D', { isTD: true }, '09/09/2026 08:00', true],
  ['E', { isTD: true, heatStart: null }, '09/09/2026 15:29', false],
  ['F', { isTD: true, heatStart: null }, '09/09/2026 15:30', true],
  ['G', {}, '08/09/2026 08:00', true],
  ['H rejects 2 days', { isDC53: true, isTD: true }, '09/09/2026 08:00', false],
  ['H accepts 5 days', { isDC53: true, isTD: true }, '12/09/2026 08:00', true],
  ['blank start', { isTD: true, heatStart: ' ' }, '09/09/2026 15:30', true],
  ['normal past date', {}, '06/09/2026 23:59', false],
]
function editState() {
  cursor = 0
  return runEditHook({ activeProcess: 'Heat', confirmedProcesses: [] })
}
for (const [label, context, value, valid] of cases) {
  slots = []
  const oldRow = { ...base, ...context }
  const run = () => editState().processRowUpdate({ ...oldRow, heatFinish: value }, oldRow)
  if (valid) {
    run()
    assert.match(editState().pendingChanges[0].value, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    assert.equal(editState().pendingChanges[0].field, 'heatFinish')
  } else {
    assert.throws(run, /requires Heat Finish|Date cannot be in the past/)
    assert.equal(editState().pendingChanges.length, 0)
  }
  console.log(`PASS ${label}`)
}
assert.throws(() => dates.normalizeFacConfirmDateTimeForApi('09/09/2026 15:29', {
  field: 'heatFinish', isTD: true,
}), /TD requires Heat Finish to be at least 2 days after current time\. Minimum Heat Finish: 09\/09\/2026 15:30\./)

slots = []
const historical = { ...base, isDC53: true, heatFinish: '01/09/2026 08:00' }
editState().processRowUpdate({ ...historical, heatFinish: '12/09/2026 08:00' }, historical)
assert.equal(editState().pendingChanges[0].value, '2026-09-12T08:00:00')
console.log('PASS historical baseline')

slots = []
const original = { ...base, heatFinish: '2026-09-12T08:00:00' }
const changed = { ...original, heatFinish: '13/09/2026 08:00' }
editState().processRowUpdate(changed, original)
assert.equal(editState().getCellClassName({ row: changed, field: 'heatFinish' }), 'fac-confirm-edited-heat')
editState().processRowUpdate({ ...original, heatFinish: '12/09/2026 08:00' }, changed)
assert.equal(editState().pendingChanges.length, 0)
assert.equal(editState().getCellClassName({ row: original, field: 'heatFinish' }), '')
console.log('PASS normalized revert and highlighting')

function testFill(value, expectedCount) {
  slots = []
  const rows = new Map([
    ['source', { ...base, aufnr: 'source', heatFinish: value }],
    ['td', { ...base, aufnr: 'td', isTD: true }],
    ['dc53', { ...base, aufnr: 'dc53', isDC53: true, heatStart: '08/09/2026 10:00' }],
  ])
  const errors = []
  let captured = false
  const apiRef = { current: {
    getSortedRowIds: () => [...rows.keys()],
    getRow: (id) => rows.get(id),
    updateRows: ([row]) => rows.set(row.aufnr, row),
  } }
  function render() {
    const edits = editState()
    const fill = runFillHook({ activeProcess: 'Heat', apiRef, processRowUpdate: edits.processRowUpdate, onError: (error) => errors.push(error) })
    return { edits, fill }
  }
  const sourceCell = {
    dataset: { field: 'heatFinish' },
    closest: () => ({ dataset: { id: 'source' } }),
    getBoundingClientRect: () => ({ right: 100, bottom: 100 }),
  }
  const event = {
    button: 0, pointerId: 1, clientX: 99, clientY: 99,
    target: { closest: () => sourceCell },
    currentTarget: {
      setPointerCapture: () => { captured = true },
      hasPointerCapture: () => captured,
      releasePointerCapture: () => { captured = false },
    },
    preventDefault() {}, stopPropagation() {},
  }
  render().fill.handleCellClick({ id: 'source', field: 'heatFinish' })
  const { fill } = render()
  fill.handlePointerDown(event)
  hitCell = { closest: () => ({ dataset: { field: 'heatFinish' }, closest: () => ({ dataset: { id: 'dc53' } }) }) }
  fill.handlePointerMove({ ...event, clientY: 200 })
  fill.handlePointerUp(event)
  const result = render()
  assert.equal(result.edits.pendingChanges.length, expectedCount)
  assert.equal(errors.length, expectedCount === 2 ? 0 : 1)
  assert.equal(captured, false)
  assert.equal(result.fill.isDragging, false)
  for (const id of ['td', 'dc53']) {
    const pending = result.edits.pendingChanges.find((item) => item.aufnr === id)
    assert.equal(rows.get(id).heatFinish, pending ? value : null)
    assert.equal(result.edits.getCellClassName({ row: rows.get(id), field: 'heatFinish' }), pending ? 'fac-confirm-edited-heat' : '')
  }
  return result.edits.pendingChanges
}
testFill('10/09/2026 08:00', 1)
testFill('08/09/2026 08:00', 0)
const pending = testFill('13/09/2026 10:00', 2)
console.log('PASS mixed-row fill: first/later rejection, destination start, successful fill, cleanup and state consistency')

async function main() {
  await saveFacConfirmProcessTimes({ employeeId: '123', changes: pending })
  assert.equal(savedRequest.method, 'PATCH')
  assert.equal(savedRequest.url, 'http://test/api/fac-confirm/process-times')
  assert.deepEqual(savedRequest.body, {
    employeeId: '123',
    changes: ['td', 'dc53'].map((aufnr) => ({ aufnr, field: 'heatFinish', value: '2026-09-13T10:00:00' })),
  })
  console.log('PASS save API field/value payload')
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
