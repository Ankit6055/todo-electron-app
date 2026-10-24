const form = document.getElementById('new-todo')
const input = document.getElementById('new-todo-text')
const list = document.getElementById('list')
const count = document.getElementById('count')
const empty = document.getElementById('empty')
const clearDone = document.getElementById('clear-done')
const filterButtons = document.querySelectorAll('[data-filter]')

const emptyMessages = {
  all: 'Nothing to do yet. Add a task above.',
  active: 'All caught up 🎉',
  done: 'Nothing completed yet.'
}

let todos = []
let filter = 'all'

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const visibleTodos = () => {
  if (filter === 'active') return todos.filter((todo) => !todo.done)
  if (filter === 'done') return todos.filter((todo) => todo.done)
  return todos
}

const removeTodo = (id) => {
  todos = todos.filter((todo) => todo.id !== id)
}

// Re-render and persist after every change
const update = () => {
  render()
  window.todoStore.save(todos)
}

const startEditing = (item, todo) => {
  const editor = document.createElement('input')
  editor.type = 'text'
  editor.className = 'edit'
  editor.value = todo.text
  item.querySelector('.text').replaceWith(editor)
  editor.focus()
  editor.select()

  let finished = false
  const finish = (commit) => {
    if (finished) return
    finished = true
    const text = editor.value.trim()
    if (commit && text) todo.text = text
    if (commit && !text) removeTodo(todo.id)
    update()
  }

  editor.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') finish(true)
    if (event.key === 'Escape') finish(false)
  })
  editor.addEventListener('blur', () => finish(true))
}

const createItem = (todo) => {
  const item = document.createElement('li')
  item.className = todo.done ? 'todo done' : 'todo'

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = todo.done
  checkbox.addEventListener('change', () => {
    todo.done = checkbox.checked
    update()
  })

  const text = document.createElement('span')
  text.className = 'text'
  text.textContent = todo.text
  text.addEventListener('dblclick', () => startEditing(item, todo))

  const remove = document.createElement('button')
  remove.type = 'button'
  remove.className = 'remove'
  remove.textContent = '×'
  remove.setAttribute('aria-label', 'Delete task')
  remove.addEventListener('click', () => {
    removeTodo(todo.id)
    update()
  })

  item.append(checkbox, text, remove)
  return item
}

const render = () => {
  list.replaceChildren(...visibleTodos().map(createItem))

  const left = todos.filter((todo) => !todo.done).length
  count.textContent = `${left} ${left === 1 ? 'task' : 'tasks'} left`

  empty.textContent = emptyMessages[filter]
  empty.hidden = list.children.length > 0
  clearDone.hidden = !todos.some((todo) => todo.done)
  filterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === filter)
  })
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const text = input.value.trim()
  if (!text) return
  todos.push({ id: newId(), text, done: false })
  input.value = ''
  update()
})

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filter = button.dataset.filter
    render()
  })
})

clearDone.addEventListener('click', () => {
  todos = todos.filter((todo) => !todo.done)
  update()
})

const init = async () => {
  todos = await window.todoStore.load()
  render()
}

init()
