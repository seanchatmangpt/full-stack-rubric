// OLD STYLE: Traditional Vitest tests
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Calculator from '../../components/Calculator.vue';

describe('Calculator Component', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(Calculator, {
      props: {
        initialValue: 0
      }
    });
  });

  it('should display initial value', () => {
    expect(wrapper.find('[data-testid=\"display\"]').text()).toBe('0');
  });

  it('should add two numbers', async () => {
    await wrapper.find('[data-testid=\"number-5\"]').trigger('click');
    await wrapper.find('[data-testid=\"operator-plus\"]').trigger('click');
    await wrapper.find('[data-testid=\"number-3\"]').trigger('click');
    await wrapper.find('[data-testid=\"equals\"]').trigger('click');
    
    expect(wrapper.find('[data-testid=\"display\"]').text()).toBe('8');
  });

  it('should subtract two numbers', async () => {
    await wrapper.find('[data-testid=\"number-9\"]').trigger('click');
    await wrapper.find('[data-testid=\"operator-minus\"]').trigger('click');
    await wrapper.find('[data-testid=\"number-4\"]').trigger('click');
    await wrapper.find('[data-testid=\"equals\"]').trigger('click');
    
    expect(wrapper.find('[data-testid=\"display\"]').text()).toBe('5');
  });

  it('should handle division by zero', async () => {
    await wrapper.find('[data-testid=\"number-8\"]').trigger('click');
    await wrapper.find('[data-testid=\"operator-divide\"]').trigger('click');
    await wrapper.find('[data-testid=\"number-0\"]').trigger('click');
    await wrapper.find('[data-testid=\"equals\"]').trigger('click');
    
    expect(wrapper.find('[data-testid=\"display\"]').text()).toBe('Error');
  });

  it('should clear display when clear button is clicked', async () => {
    await wrapper.find('[data-testid=\"number-5\"]').trigger('click');
    await wrapper.find('[data-testid=\"clear\"]').trigger('click');
    
    expect(wrapper.find('[data-testid=\"display\"]').text()).toBe('0');
  });

  it('should handle decimal calculations', async () => {
    await wrapper.find('[data-testid=\"number-3\"]').trigger('click');
    await wrapper.find('[data-testid=\"decimal\"]').trigger('click');
    await wrapper.find('[data-testid=\"number-5\"]').trigger('click');
    await wrapper.find('[data-testid=\"operator-plus\"]').trigger('click');
    await wrapper.find('[data-testid=\"number-2\"]').trigger('click');
    await wrapper.find('[data-testid=\"decimal\"]').trigger('click');
    await wrapper.find('[data-testid=\"number-1\"]').trigger('click');
    await wrapper.find('[data-testid=\"equals\"]').trigger('click');
    
    expect(wrapper.find('[data-testid=\"display\"]').text()).toBe('5.6');
  });
});