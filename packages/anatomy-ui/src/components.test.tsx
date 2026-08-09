import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Button, ProgressBar, Toggle, VirtualList } from './index';

// vitest globals are off, so react-testing-library cannot register auto-cleanup.
afterEach(cleanup);

describe('VirtualList', () => {
  const items = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);

  function renderList() {
    return render(
      <VirtualList
        items={items}
        itemHeight={24}
        height={240}
        renderItem={(item) => <span>{item}</span>}
        getKey={(item) => item}
      />,
    );
  }

  it('renders only the windowed subset of a 1000-item list', () => {
    const { container } = renderList();
    const rows = container.querySelectorAll('.aui-vlist__row');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(50);
    expect(screen.getByText('Item 0')).toBeTruthy();
    expect(screen.getByText('Item 9')).toBeTruthy();
    expect(screen.queryByText('Item 500')).toBeNull();
  });

  it('moves the window on scroll', () => {
    const { container } = renderList();
    const outer = container.querySelector('.aui-vlist');
    if (!(outer instanceof HTMLElement)) throw new Error('missing .aui-vlist');
    outer.scrollTop = 2400;
    fireEvent.scroll(outer);
    expect(screen.queryByText('Item 0')).toBeNull();
    expect(screen.getByText('Item 100')).toBeTruthy();
  });

  it('does not break with zero items', () => {
    const { container } = render(
      <VirtualList<string>
        items={[]}
        itemHeight={24}
        height={240}
        renderItem={(item) => <span>{item}</span>}
        getKey={(item) => item}
      />,
    );
    expect(container.querySelectorAll('.aui-vlist__row').length).toBe(0);
  });
});

describe('Toggle', () => {
  it('flips aria-checked through the onChange wiring', () => {
    function Harness() {
      const [checked, setChecked] = useState(false);
      return <Toggle checked={checked} onChange={setChecked} label="Show labels" />;
    }
    render(<Harness />);
    const toggle = screen.getByRole('switch');
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it('calls onChange with the inverted value', () => {
    const onChange = vi.fn();
    render(<Toggle checked={true} onChange={onChange} label="Pins" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
  });
});

describe('Button', () => {
  it('sets aria-pressed when active is true', () => {
    render(<Button active={true}>Layer</Button>);
    const button = screen.getByRole('button', { name: 'Layer' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.className).toContain('is-active');
  });

  it('omits aria-pressed when active is undefined', () => {
    render(<Button>Plain</Button>);
    expect(screen.getByRole('button', { name: 'Plain' }).hasAttribute('aria-pressed')).toBe(false);
  });
});

describe('ProgressBar', () => {
  it('exposes aria-valuenow as a rounded percentage', () => {
    render(<ProgressBar value={0.42} label="Quiz progress" />);
    const bar = screen.getByRole('progressbar', { name: 'Quiz progress' });
    expect(bar.getAttribute('aria-valuenow')).toBe('42');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });
});
