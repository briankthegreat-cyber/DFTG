import { Button, EmptyState, Panel } from '@anatomy/ui';
import { labelFor, selectStructure } from '../controller';
import { useAppStore } from '../state/app';
import { useStudyStore } from '../state/study';

/** Bookmarks, recent structures and quiz history — local-first storage. */
export function SavedPage() {
  const study = useStudyStore();
  const setMode = useAppStore((s) => s.setMode);

  const openInExplore = (structureId: string) => {
    selectStructure(structureId, 'search', { focus: true });
    setMode('explore');
  };

  return (
    <div className="saved-page">
      <Panel title="Bookmarks" aria-label="Bookmarked structures">
        {study.data.bookmarks.length === 0 ? (
          <EmptyState
            title="No bookmarks"
            hint="Use the ☆ button in the structure panel to bookmark structures."
          />
        ) : (
          <ul className="saved-list">
            {study.data.bookmarks.map((structureId) => (
              <li key={structureId}>
                <Button onClick={() => openInExplore(structureId)}>{labelFor(structureId)}</Button>
                <Button
                  size="sm"
                  onClick={() => study.toggleBookmark(structureId)}
                  aria-label={`Remove bookmark ${labelFor(structureId)}`}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Recently viewed" aria-label="Recently viewed structures">
        {study.data.recents.length === 0 ? (
          <EmptyState title="Nothing viewed yet" />
        ) : (
          <ul className="saved-list">
            {study.data.recents.slice(0, 15).map((recent) => (
              <li key={recent.structure_id}>
                <Button onClick={() => openInExplore(recent.structure_id)}>
                  {labelFor(recent.structure_id)}
                </Button>
                <span className="saved-list__time">{new Date(recent.at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Quiz history" aria-label="Quiz history">
        {study.data.quiz_history.length === 0 ? (
          <EmptyState title="No quiz sessions yet" hint="Finish a quiz to record it here." />
        ) : (
          <ul className="saved-list">
            {[...study.data.quiz_history].reverse().map((entry, index) => (
              <li key={`${entry.at}-${index}`}>
                <span>
                  {entry.correct} / {entry.total} correct
                </span>
                <span className="saved-list__time">{new Date(entry.at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Data" aria-label="Stored data management">
        <p>Study data is stored locally in this browser only (versioned key, no account).</p>
        <Button variant="danger" onClick={() => study.clearAll()}>
          Clear all local study data
        </Button>
      </Panel>
    </div>
  );
}
