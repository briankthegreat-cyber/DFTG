import { useEffect, useId, useRef, useState } from 'react';
import { Badge } from '@anatomy/ui';
import type { SearchResult } from '@anatomy/core';
import { selectStructure } from '../controller';
import { useDataStore } from '../state/data';

const LATERALITY_SHORT: Record<string, string> = {
  left: 'L',
  right: 'R',
  midline: 'M',
  bilateral: 'B',
  not_applicable: '—',
  unknown: '?',
};

/** Global typeahead over canonical names, synonyms and source IDs. */
export function SearchBox() {
  const search = useDataStore((s) => s.search);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [geometryOnly, setGeometryOnly] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  useEffect(() => {
    if (!search || query.trim() === '') {
      setResults([]);
      setOpen(false);
      return;
    }
    const filters = geometryOnly ? { requireGeometry: true } : undefined;
    setResults(search.search(query, filters, 12));
    setActiveIndex(0);
    setOpen(true);
  }, [query, search, geometryOnly]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Global "/" shortcut focuses search (unless typing elsewhere).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const choose = (result: SearchResult) => {
    selectStructure(result.structure_id, 'search', { focus: true });
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const result = results[activeIndex];
      if (result) choose(result);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="searchbox" ref={containerRef}>
      <input
        ref={inputRef}
        type="search"
        className="searchbox__input"
        placeholder="Search structures…  ( / )"
        aria-label="Search anatomical structures"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-opt-${activeIndex}` : undefined}
        value={query}
        data-testid="search-input"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => query.trim() !== '' && setOpen(true)}
      />
      {open ? (
        <div className="searchbox__popup">
          <ul id={listId} role="listbox" className="searchbox__results" aria-label="Search results">
            {results.length === 0 ? (
              <li className="searchbox__empty">No structures match “{query}”.</li>
            ) : (
              results.map((result, index) => (
                <li key={result.structure_id} role="presentation">
                  <button
                    type="button"
                    id={`${listId}-opt-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`searchbox__result${index === activeIndex ? ' is-active' : ''}`}
                    data-testid="search-result"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(result)}
                  >
                    <span className="searchbox__result-name">{result.doc.display_name}</span>
                    <span className="searchbox__result-meta">
                      <Badge tone="neutral">{result.doc.system}</Badge>
                      <Badge tone="neutral" title={`Laterality: ${result.doc.laterality}`}>
                        {LATERALITY_SHORT[result.doc.laterality] ?? '?'}
                      </Badge>
                      {result.matched_field === 'synonym' ? (
                        <Badge tone="info" title="Matched a synonym">
                          syn: “{result.matched_text}”
                        </Badge>
                      ) : null}
                      {result.matched_field === 'fuzzy' ? (
                        <Badge tone="neutral">approximate</Badge>
                      ) : null}
                      {!result.doc.has_geometry ? (
                        <Badge tone="warning" title="This structure has no 3D geometry yet">
                          no geometry
                        </Badge>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <label className="searchbox__filter">
            <input
              type="checkbox"
              checked={geometryOnly}
              onChange={(event) => setGeometryOnly(event.target.checked)}
            />
            Only structures with 3D geometry
          </label>
        </div>
      ) : null}
    </div>
  );
}
