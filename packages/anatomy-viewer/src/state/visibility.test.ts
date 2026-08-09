import { beforeEach, describe, expect, it } from 'vitest';
import {
  EMPTY_VISIBILITY,
  isStructureVisible,
  snapshotVisibility,
  useVisibilityStore,
} from './visibility';

function reset() {
  useVisibilityStore.setState({
    ...EMPTY_VISIBILITY,
    past: [],
    future: [],
  });
}

describe('visibility store', () => {
  beforeEach(reset);

  it('hide, isolate and fade are explicit reversible state with undo/redo', () => {
    const store = () => useVisibilityStore.getState();

    store().hideStructures(['S-1']);
    expect(store().hiddenStructures).toEqual(['S-1']);

    store().isolate(['S-2']);
    expect(store().isolatedStructureIds).toEqual(['S-2']);

    store().setFade(true, 0.3);
    expect(store().fadeOthers).toBe(true);
    expect(store().fadeOpacity).toBe(0.3);

    // Undo unwinds in reverse order.
    store().undo();
    expect(store().fadeOthers).toBe(false);
    store().undo();
    expect(store().isolatedStructureIds).toBeNull();
    store().undo();
    expect(store().hiddenStructures).toEqual([]);

    // Redo replays.
    store().redo();
    expect(store().hiddenStructures).toEqual(['S-1']);
    store().redo();
    expect(store().isolatedStructureIds).toEqual(['S-2']);
  });

  it('a new action clears the redo stack', () => {
    const store = () => useVisibilityStore.getState();
    store().hideStructures(['S-1']);
    store().undo();
    store().toggleSystem('skeletal');
    expect(store().future).toHaveLength(0);
    store().redo();
    expect(store().hiddenStructures).toEqual([]);
  });

  it('resetAll restores defaults but stays undoable', () => {
    const store = () => useVisibilityStore.getState();
    store().hideStructures(['S-1']);
    store().setXray(true);
    store().resetAll();
    expect(store().hiddenStructures).toEqual([]);
    expect(store().xray).toBe(false);
    store().undo();
    expect(store().xray).toBe(true);
  });

  it('a fade slider gesture costs one undo entry, not one per tick', () => {
    const store = () => useVisibilityStore.getState();
    store().setFade(true, 0.2); // 1 history entry

    const before = snapshotVisibility(store());
    store().previewFade(0.25);
    store().previewFade(0.3);
    store().previewFade(0.35); // transient: no history entries
    store().commitSnapshot(before); // gesture end: exactly one entry

    expect(store().fadeOpacity).toBe(0.35);
    expect(store().past).toHaveLength(2);
    store().undo();
    expect(store().fadeOpacity).toBe(0.2);
    store().redo();
    expect(store().fadeOpacity).toBe(0.35);
  });

  it('effective visibility respects overrides, ancestors, isolation and systems', () => {
    const base = { ...EMPTY_VISIBILITY };

    expect(isStructureVisible(base, 'S-child', 'skeletal', ['S-parent'])).toBe(true);
    expect(
      isStructureVisible({ ...base, hiddenStructures: ['S-parent'] }, 'S-child', 'skeletal', [
        'S-parent',
      ]),
    ).toBe(false);
    expect(
      isStructureVisible({ ...base, hiddenSystems: ['skeletal'] }, 'S-x', 'skeletal', []),
    ).toBe(false);
    // Isolation keeps the isolated structure and its descendants only.
    const isolated = { ...base, isolatedStructureIds: ['S-parent'] };
    expect(isStructureVisible(isolated, 'S-parent', 'skeletal', [])).toBe(true);
    expect(isStructureVisible(isolated, 'S-child', 'skeletal', ['S-parent'])).toBe(true);
    expect(isStructureVisible(isolated, 'S-other', 'skeletal', [])).toBe(false);
  });
});
