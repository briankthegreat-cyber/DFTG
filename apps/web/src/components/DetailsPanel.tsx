import { Badge, Button, EmptyState, KeyValueList, Panel } from '@anatomy/ui';
import { getAncestors, isBindingAllowed, type EducationalRecord } from '@anatomy/core';
import {
  useCameraStore,
  useRegistryStore,
  useSelectionStore,
  useVisibilityStore,
} from '@anatomy/viewer';
import { RELEASE_POLICY } from '../config';
import {
  hideSelected,
  isolateSelected,
  labelFor,
  peelSelected,
  revealChildren,
  revealParent,
  selectStructure,
} from '../controller';
import { useAppStore, useUiStore } from '../state/app';
import { useDataStore } from '../state/data';
import { useQuizStore } from '../state/quiz';
import { useStudyStore } from '../state/study';

function EducationSection({ record }: { record: EducationalRecord }) {
  const lists: { title: string; items: string[] | undefined }[] = [
    { title: 'Function', items: record.function },
    { title: 'Anatomical relations', items: record.anatomical_relations },
    { title: 'Innervation', items: record.innervation },
    { title: 'Blood supply', items: record.blood_supply },
    { title: 'Drainage', items: record.drainage },
    { title: 'Clinical notes', items: record.clinical_notes },
    { title: 'Quiz facts', items: record.quiz_facts },
  ];
  return (
    <div className="details__education">
      {record.short_description ? (
        <p className="details__lede">{record.short_description}</p>
      ) : null}
      {record.overview ? <p>{record.overview}</p> : null}
      {lists.map((section) =>
        section.items && section.items.length > 0 ? (
          <div key={section.title}>
            <h3 className="details__subhead">{section.title}</h3>
            <ul className="details__list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      <div className="details__provenance">
        <Badge tone={record.reviewed_status === 'approved' ? 'success' : 'warning'}>
          content: {record.reviewed_status}
        </Badge>
        {record.development_fixture ? <Badge tone="warning">development fixture</Badge> : null}
        <ul className="details__citations">
          {record.citations.map((citation) => (
            <li key={citation.label}>{citation.label}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Right-hand structure information panel + actions + dev diagnostics. */
export function DetailsPanel() {
  const anatomy = useDataStore((s) => s.anatomy);
  const education = useDataStore((s) => s.education);
  const selectedStructureId = useSelectionStore((s) => s.selectedStructureId);
  const bundles = useRegistryStore((s) => s.bundles);
  const visibility = useVisibilityStore();
  const diagnosticsOpen = useAppStore((s) => s.diagnosticsOpen);
  const setMode = useAppStore((s) => s.setMode);
  const labeled = useUiStore((s) => s.labeledStructureIds);
  const toggleLabel = useUiStore((s) => s.toggleLabel);
  const study = useStudyStore();
  const startQuiz = useQuizStore((s) => s.start);
  const requestFocus = useCameraStore((s) => s.requestFocus);

  if (!anatomy || !selectedStructureId) {
    return (
      <Panel title="Structure" aria-label="Selected structure details">
        <EmptyState
          title="Nothing selected"
          hint="Click a structure on the model, pick one from the hierarchy, or search by name or synonym."
        />
      </Panel>
    );
  }

  const structure = anatomy.structuresById.get(selectedStructureId);
  if (!structure) return null;

  const bindings = anatomy.bindingsByStructureId.get(selectedStructureId) ?? [];
  const bundleIds = anatomy.bundleIdsByStructureId.get(selectedStructureId) ?? [];
  const loaded = bundleIds.some((b) => bundles[b]?.state === 'ready');
  const loading = bundleIds.some((b) =>
    ['queued', 'loadingManifest', 'loadingGeometry'].includes(bundles[b]?.state ?? ''),
  );
  const blockedByPolicy =
    bindings.length > 0 && bindings.every((b) => !isBindingAllowed(b, RELEASE_POLICY));
  const hiddenByOverride = visibility.hiddenStructures.includes(selectedStructureId);
  const ancestors = getAncestors(anatomy, selectedStructureId);
  const children = anatomy.childrenByParentId.get(selectedStructureId) ?? [];
  const record = education.get(selectedStructureId);
  const bookmarked = study.data.bookmarks.includes(selectedStructureId);

  let geometryStatus: { text: string; tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' };
  if (bindings.length === 0) {
    geometryStatus = { text: 'No 3D geometry available yet', tone: 'warning' };
  } else if (blockedByPolicy) {
    geometryStatus = { text: `Excluded by release policy (${RELEASE_POLICY})`, tone: 'danger' };
  } else if (hiddenByOverride) {
    geometryStatus = { text: 'Hidden', tone: 'neutral' };
  } else if (loaded) {
    geometryStatus = { text: 'Loaded', tone: 'success' };
  } else if (loading) {
    geometryStatus = { text: 'Loading…', tone: 'info' };
  } else {
    geometryStatus = { text: 'Not loaded', tone: 'neutral' };
  }

  return (
    <Panel
      title="Structure"
      aria-label="Selected structure details"
      actions={
        <Button
          size="sm"
          onClick={() => study.toggleBookmark(selectedStructureId)}
          active={bookmarked}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark this structure'}
        >
          {bookmarked ? '★' : '☆'}
        </Button>
      }
    >
      <div data-testid="details-panel">
        <h2 className="details__name" data-testid="details-name">
          {structure.display_name ?? structure.canonical_name}
        </h2>
        {ancestors.length > 0 ? (
          <nav className="details__breadcrumb" aria-label="Parent structures">
            {[...ancestors].reverse().map((ancestorId) => (
              <Button
                key={ancestorId}
                size="sm"
                onClick={() => selectStructure(ancestorId, 'relationship', { focus: true })}
              >
                {labelFor(ancestorId)}
              </Button>
            ))}
          </nav>
        ) : null}
        <KeyValueList
          items={[
            { key: 'Canonical name', value: structure.canonical_name },
            ...(structure.synonyms.length > 0
              ? [{ key: 'Synonyms', value: structure.synonyms.join(', ') }]
              : []),
            { key: 'System', value: structure.system },
            ...(structure.region ? [{ key: 'Region', value: structure.region }] : []),
            { key: 'Laterality', value: structure.laterality },
            ...(structure.ta2_id ? [{ key: 'TA2', value: structure.ta2_id }] : []),
            { key: 'Structure ID', value: <code>{structure.structure_id}</code> },
            {
              key: 'Geometry',
              value: (
                <Badge tone={geometryStatus.tone}>
                  <span data-testid="details-geometry-status">{geometryStatus.text}</span>
                </Badge>
              ),
            },
          ]}
        />
        {children.length > 0 ? (
          <div className="details__children">
            <h3 className="details__subhead">Contains</h3>
            <div className="details__chips">
              {children.map((childId) => (
                <Button
                  key={childId}
                  size="sm"
                  onClick={() => selectStructure(childId, 'relationship', { focus: true })}
                >
                  {labelFor(childId)}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="details__actions">
          <Button
            onClick={() => requestFocus(selectedStructureId)}
            disabled={bindings.length === 0}
            title="Fly the camera to this structure (F)"
          >
            Focus
          </Button>
          <Button onClick={isolateSelected} data-testid="btn-isolate-details">
            Isolate
          </Button>
          <Button
            onClick={() =>
              hiddenByOverride ? visibility.showStructures([selectedStructureId]) : hideSelected()
            }
          >
            {hiddenByOverride ? 'Show' : 'Hide'}
          </Button>
          <Button onClick={peelSelected} title="Peel this layer away (undoable)">
            Peel
          </Button>
          <Button onClick={revealParent} disabled={!structure.parent_id}>
            Reveal parent
          </Button>
          <Button onClick={revealChildren} disabled={children.length === 0}>
            Reveal children
          </Button>
          <Button
            onClick={() => toggleLabel(selectedStructureId)}
            active={labeled.includes(selectedStructureId)}
          >
            {labeled.includes(selectedStructureId) ? 'Remove label' : 'Add label'}
          </Button>
          <Button
            onClick={() => {
              startQuiz({ targetStructureId: selectedStructureId });
              setMode('quiz');
            }}
          >
            Quiz me on this
          </Button>
        </div>
        {record ? (
          <EducationSection record={record} />
        ) : (
          <p className="details__no-content">
            No educational content exists for this structure yet.
          </p>
        )}
        {diagnosticsOpen ? (
          <div className="details__diagnostics" data-testid="diagnostics-panel">
            <h3 className="details__subhead">Diagnostics (dev)</h3>
            {bindings.length === 0 ? (
              <p>No geometry bindings.</p>
            ) : (
              bindings.map((binding) => (
                <dl key={binding.geometry_id} className="diag">
                  <dt>geometry_id</dt>
                  <dd>
                    <code>{binding.geometry_id}</code>
                  </dd>
                  <dt>bundle / node</dt>
                  <dd>
                    {bundleIds.join(', ')} · node {binding.gltf_node.index} (“
                    {binding.gltf_node.name}”, mesh {binding.gltf_node.mesh_index})
                  </dd>
                  <dt>laterality / mapping</dt>
                  <dd>
                    {binding.laterality} · {binding.mapping_status ?? 'unknown'}
                  </dd>
                  <dt>license</dt>
                  <dd>
                    {binding.license.status} → [{binding.license.allowed_policies.join(', ')}]
                  </dd>
                  <dt>qa_status</dt>
                  <dd>
                    <code>{JSON.stringify(binding.qa_status)}</code>
                  </dd>
                </dl>
              ))
            )}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
