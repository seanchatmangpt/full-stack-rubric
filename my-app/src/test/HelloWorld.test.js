import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import HelloWorld from '../components/HelloWorld.vue'

describe('HelloWorld', () => {
  it('renders with default message prop', () => {
    const msg = 'Hello Vue 3!'
    const wrapper = mount(HelloWorld, {
      props: {
        msg
      }
    })
    
    expect(wrapper.find('h1').text()).toBe(msg)
  })

  it('displays count initially as 0', () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Test' }
    })
    
    expect(wrapper.find('button').text()).toBe('count is 0')
  })

  it('increments count when button is clicked', async () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Test' }
    })
    
    const button = wrapper.find('button')
    expect(button.text()).toBe('count is 0')
    
    await button.trigger('click')
    expect(button.text()).toBe('count is 1')
    
    await button.trigger('click')
    expect(button.text()).toBe('count is 2')
  })

  it('demonstrates Vue reactivity through ref', async () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Test' }
    })
    
    // Test that reactive ref updates the UI
    expect(wrapper.vm.count).toBe(0)
    
    await wrapper.find('button').trigger('click')
    expect(wrapper.vm.count).toBe(1)
    expect(wrapper.find('button').text()).toContain('1')
  })

  it('accepts string props correctly', () => {
    const testMessage = 'Custom test message'
    const wrapper = mount(HelloWorld, {
      props: {
        msg: testMessage
      }
    })
    
    expect(wrapper.props('msg')).toBe(testMessage)
    expect(wrapper.find('h1').text()).toBe(testMessage)
  })

  it('contains educational links', () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Test' }
    })
    
    const links = wrapper.findAll('a')
    expect(links.length).toBeGreaterThan(0)
    
    // Check Vue official links are present
    expect(links.some(link => link.attributes('href')?.includes('vuejs.org'))).toBe(true)
  })

  it('has scoped styling', () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Test' }
    })
    
    const readDocsElement = wrapper.find('.read-the-docs')
    expect(readDocsElement.exists()).toBe(true)
  })
})