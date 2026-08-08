import { useEffect, useMemo, useState } from 'react';
import { Badge, Panel, VirtualList } from '@anatomy/ui';
import {
  getAncestors,
  isBindingAllowed,
  type AnatomyIndex,
  type OntologyStructure,
} from '@anatomy/core';
import {
  isStructureVisible,
  useRegistryStore,
  useSelectionStore,
  useVisibilityStore,
} from '@anatomy/viewer';
import { RELEASE_POLICY } from '../config';
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

interface Row {
  structure: OntologyStructure;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
}

function flattenTree(anatomy: AnatomyIndex, expandedIds: ReadonlySet<string>): Row[] {
  const rows: Row[] = [];
  const visit = (structureId: string, depth: number) => {
    const structure = anatomy.structuresById.get(structureId);
    if (!structure) return;
    const children = anatomy.childrenByParentId.get(structureId) ?? [];
    const expanded = expandedIds.has(structureId);
    rows.push({ structure, depth, hasChildren: children.length > 0, expanded });
    if (expanded) for (const child of children) visit(child, depth + 1);
  };
  for (const root of anatomy.rootStructureIds) visit(root, 0);
  return rows;
}

/** Virtualized system/structure hierarchy browser sharing selection + visibility state. */
export function HierarchyTree() {
  const anatomy = useDataStore((s) => s.anatomy);
  const selectedStructureId = useSelectionStore((s) => s.selectedStructureId);
  const visibility = useVisibilityStore();
  const bundles = useRegistryStore((s) => s.bundles);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Roots start expanded so the first hierarchy level is immediately browsable.
  useEffect(() => {
    if (!anatomy) return;
    setExpandedIds((current) => {
      const next = new Set(current);
      for (const root of anatomy.rootStructureIds) next.add(root);
      return next;
    });
  }, [anatomy]);

  // A selection made anywhere (canvas, search, quiz) expands its ancestors here.
  useEffect(() => {
    if (!anatomy || !selectedStructureId) return;
    const ancestors = getAncestors(anatomy, selectedStructureId);
    if (ancestors.length === 0) return;
    setExpandedIds((current) => {
      const next = new Set(current);
      for (const ancestor of ancestors) next.add(ancestor);
      return next;
    });
  }, [anatomy, selectedStructureId]);

  const rows = useMemo(
    () => (anatomy ? flattenTree(anatomy, expandedIds) : []),
    [anatomy, expandedIds],
  );

  if (!anatomy) return null;

  const toggleExpanded = (structureId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(structureId)) next.delete(structureId);
      else next.add(structureId);
      return next;
    });
  };

  return (
    <Panel title="Hierarchy" aria-label="Anatomical hierarchy">
      {anatomy.issues.length > 0 ? (
        <p className="hierarchy__issues">
          {anatomy.issues.filter((i) => i.severity === 'error').length} data error(s),{' '}
          {anatomy.issues.filter((i) => i.severity === 'warning').length} warning(s) during
          ingestion — see diagnostics.
        </p>
      ) : null}
      <VirtualList
        items={rows}
        itemHeight={30}
        height={340}
        getKey={(row) => row.structure.structure_id}
        renderItem={(row) => {
          const id = row.structure.structure_id;
          const bindings = anatomy.bindingsByStructureId.get(id) ?? [];
          const hasGeometry = bindings.length > 0;
          const bundleIds = anatomy.bundleIdsByStructureId.get(id) ?? [];
          const loaded = bundleIds.some((b) => bundles[b]?.state === 'ready');
          const licenseBlocked = bindings.some((b) => !isBindingAllowed(b, RELEASE_POLICY));
          const restricted = bindings.some((b) => b.license.status === 'blocked_distribution');
          const ancestors = getAncestors(anatomy, id);
          const visible = isStructureVisible(visibility, id, row.structure.system, ancestors);
          const hiddenByOverride = visibility.hiddenStructures.includes(id);
          return (
            <div
              className={`tree-row${selectedStructureId === id ? ' is-selected' : ''}`}
              style={{ paddingLeft: `${row.depth * 16 + 4}px` }}
              data-testid={`tree-row-${id}`}
            >
              {row.hasChildren ? (
                <button
                  type="button"
                  className="tree-row__caret"
                  aria-label={`${row.expanded ? 'Collapse' : 'Expand'} ${row.structure.canonical_name}`}
                  aria-expanded={row.expanded}
                  onClick={() => toggleExpanded(id)}
                >
                  {row.expanded ? '▾' : '▸'}
                </button>
              ) : (
                <span className="tree-row__caret tree-row__caret--leaf" aria-hidden="true">
                  ·
                </span>
              )}
              <button
                type="button"
                className={`tree-row__name${visible ? '' : ' is-hidden-structure'}${loaded ? '' : ' is-unloaded'}`}
                onClick={() => selectStructure(id, 'hierarchy', { focus: true })}
                title={`${row.structure.canonical_name} — ${row.structure.system}`}
              >
                {row.structure.display_name ?? row.structure.canonical_name}
              </button>
              <span className="tree-row__badges">
                <Badge tone="neutral" title={`Laterality: ${row.structure.laterality}`}>
                  {LATERALITY_SHORT[row.structure.laterality] ?? '?'}
                </Badge>
                {!hasGeometry ? (
                  <Badge tone="warning" title="No 3D geometry available yet">
                    ∅
                  </Badge>
                ) : !loaded ? (
                  <Badge tone="neutral" title="Geometry not loaded">
                    ⤓
                  </Badge>
                ) : null}
                {licenseBlocked ? (
                  <Badge tone="danger" title="Geometry excluded by the current release policy">
                    ⛔
                  </Badge>
                ) : restricted ? (
                  <Badge
                    tone="warning"
                    title="License-restricted node (blocked for distribution builds)"
                  >
                    🔒
                  </Badge>
                ) : null}
                {hasGeometry ? (
                  <button
                    type="button"
                    className="tree-row__eye"
                    aria-label={`${hiddenByOverride ? 'Show' : 'Hide'} ${row.structure.canonical_name}`}
                    aria-pressed={hiddenByOverride}
                    onClick={() =>
                      hiddenByOverride
                        ? visibility.showStructures([id])
                        : visibility.hideStructures([id])
                    }
                  >
                    {hiddenByOverride ? '🚫' : '👁'}
                  </button>
                ) : null}
              </span>
            </div>
          );
        }}
      />
    </Panel>
  );
}
