import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import TestList from '../components/TestList.vue'

describe('TestList', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(TestList)
  })

  it('renders todo input field', () => {
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('New todo')
    expect(input.attributes('autofocus')).toBeDefined()
  })

  it('renders add todo button', () => {
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Add Todo')
  })

  it('displays initial todos', () => {
    const todos = wrapper.findAll('li')
    expect(todos.length).toBe(3)
    
    expect(todos[0].text()).toContain('Learn HTML')
    expect(todos[1].text()).toContain('Learn JavaScript')
    expect(todos[2].text()).toContain('Learn Vue')
  })

  it('displays remove buttons for each todo', () => {
    const removeButtons = wrapper.findAll('li button')
    expect(removeButtons.length).toBe(3)
    
    removeButtons.forEach(button => {
      expect(button.text()).toBe('X')
    })
  })

  it('adds new todo when button is clicked', async () => {
    const input = wrapper.find('input')
    const addButton = wrapper.find('button')
    
    await input.setValue('New test todo')
    await addButton.trigger('click')
    
    const todos = wrapper.findAll('li')
    expect(todos.length).toBe(4)
    expect(todos[3].text()).toContain('New test todo')
  })

  it('adds new todo when Enter key is pressed', async () => {
    const input = wrapper.find('input')
    
    await input.setValue('Todo via Enter key')
    await input.trigger('keydown.enter')
    
    const todos = wrapper.findAll('li')
    expect(todos.length).toBe(4)
    expect(todos[3].text()).toContain('Todo via Enter key')
  })

  it('removes todo when X button is clicked', async () => {
    // Initially 3 todos
    expect(wrapper.findAll('li').length).toBe(3)
    
    // Click first remove button
    const firstRemoveButton = wrapper.findAll('li button')[0]
    await firstRemoveButton.trigger('click')
    
    // Should now have 2 todos
    const remainingTodos = wrapper.findAll('li')
    expect(remainingTodos.length).toBe(2)
    
    // First todo should no longer be 'Learn HTML'
    expect(remainingTodos[0].text()).toContain('Learn JavaScript')
  })

  it('demonstrates Vue reactivity with todos array', async () => {
    const initialLength = wrapper.vm.todos.length
    expect(initialLength).toBe(3)
    
    // Add a todo programmatically
    wrapper.vm.newTodo = 'Reactive test'
    await wrapper.vm.addTodo({ target: { value: 'Reactive test' } })
    
    expect(wrapper.vm.todos.length).toBe(initialLength + 1)
    expect(wrapper.findAll('li').length).toBe(4)
  })

  it('demonstrates v-model binding', async () => {
    const input = wrapper.find('input')
    
    await input.setValue('Test v-model')
    expect(wrapper.vm.newTodo).toBe('Test v-model')
    
    // Change via component data
    wrapper.vm.newTodo = 'Changed from component'
    await wrapper.vm.$nextTick()
    expect(input.element.value).toBe('Changed from component')
  })

  it('demonstrates v-for with proper key binding', () => {
    const listItems = wrapper.findAll('li')
    
    // Check that each list item has proper keys (Vue Test Utils doesn't expose keys directly,
    // but we can verify the structure is correct)
    listItems.forEach((item, index) => {
      expect(item.exists()).toBe(true)
      // Each item should contain todo text and remove button
      expect(item.find('button').exists()).toBe(true)
    })
  })

  it('displays JSON representation of todos', () => {
    const preElement = wrapper.find('pre')
    expect(preElement.exists()).toBe(true)
    
    const todosText = preElement.text()
    expect(todosText).toContain('Learn HTML')
    expect(todosText).toContain('Learn JavaScript')
    expect(todosText).toContain('Learn Vue')
  })

  it('maintains proper data structure for todos', () => {
    wrapper.vm.todos.forEach(todo => {
      expect(todo).toHaveProperty('id')
      expect(todo).toHaveProperty('text')
      expect(typeof todo.id).toBe('number')
      expect(typeof todo.text).toBe('string')
    })
  })

  it('increments id counter for new todos', async () => {
    const initialMaxId = Math.max(...wrapper.vm.todos.map(todo => todo.id))
    
    const input = wrapper.find('input')
    await input.setValue('Test ID increment')
    await wrapper.find('button').trigger('click')
    
    const newTodos = wrapper.vm.todos
    const newMaxId = Math.max(...newTodos.map(todo => todo.id))
    
    expect(newMaxId).toBeGreaterThan(initialMaxId)
  })

  it('handles empty input gracefully', async () => {
    const input = wrapper.find('input')
    const initialTodoCount = wrapper.vm.todos.length
    
    // Try to add empty todo
    await input.setValue('')
    await wrapper.find('button').trigger('click')
    
    // Should add empty todo (component doesn't prevent it)
    expect(wrapper.vm.todos.length).toBe(initialTodoCount + 1)
    expect(wrapper.vm.todos[wrapper.vm.todos.length - 1].text).toBe('')
  })
})