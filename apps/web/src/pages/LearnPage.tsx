import { useState } from 'react';
import { Badge, Button, EmptyState, Panel } from '@anatomy/ui';
import type { Lesson } from '@anatomy/core';
import { selectStructure } from '../controller';
import { useDataStore } from '../state/data';
import { useStudyStore } from '../state/study';
import { ViewerStage } from '../viewer/ViewerStage';
import { DetailsPanel } from '../components/DetailsPanel';

function LessonRunner({ lesson, onExit }: { lesson: Lesson; onExit: () => void }) {
  const study = useStudyStore();
  const savedIndex = study.data.lesson_progress[lesson.lesson_id] ?? 0;
  const [stepIndex, setStepIndex] = useState(Math.min(savedIndex, lesson.steps.length - 1));
  const step = lesson.steps[stepIndex];

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, lesson.steps.length - 1));
    setStepIndex(clamped);
    study.setLessonProgress(lesson.lesson_id, clamped);
    const target = lesson.steps[clamped];
    if (target) selectStructure(target.structure_id, 'hierarchy', { focus: true });
  };

  return (
    <Panel
      title={lesson.title}
      aria-label={`Lesson: ${lesson.title}`}
      actions={
        <Button size="sm" onClick={onExit}>
          All lessons
        </Button>
      }
    >
      {lesson.development_fixture ? <Badge tone="warning">development fixture</Badge> : null}
      <ol className="lesson-steps">
        {lesson.steps.map((entry, index) => (
          <li key={entry.step_id}>
            <Button
              size="sm"
              active={index === stepIndex}
              onClick={() => goTo(index)}
              aria-current={index === stepIndex ? 'step' : undefined}
            >
              {index + 1}. {entry.title}
            </Button>
          </li>
        ))}
      </ol>
      {step ? (
        <div className="lesson-step" data-testid="lesson-step">
          <h3>{step.title}</h3>
          <p>{step.instruction}</p>
          <div className="lesson-step__nav">
            <Button disabled={stepIndex === 0} onClick={() => goTo(stepIndex - 1)}>
              Previous
            </Button>
            <Button
              variant="primary"
              onClick={() => goTo(stepIndex + 1)}
              disabled={stepIndex >= lesson.steps.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

export function LearnPage() {
  const lessons = useDataStore((s) => s.lessons);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const activeLesson = lessons.find((l) => l.lesson_id === activeLessonId) ?? null;

  return (
    <div className="layout layout--left layout--right">
      <aside className="layout__left" aria-label="Lessons">
        {activeLesson ? (
          <LessonRunner lesson={activeLesson} onExit={() => setActiveLessonId(null)} />
        ) : (
          <Panel title="Lessons" aria-label="Lesson list">
            {lessons.length === 0 ? (
              <EmptyState title="No lessons yet" hint="Lesson content is loaded from data files." />
            ) : (
              <ul className="lesson-list">
                {lessons.map((lesson) => (
                  <li key={lesson.lesson_id}>
                    <Button
                      onClick={() => {
                        setActiveLessonId(lesson.lesson_id);
                        const first = lesson.steps[0];
                        if (first)
                          selectStructure(first.structure_id, 'hierarchy', { focus: true });
                      }}
                      data-testid={`lesson-${lesson.lesson_id}`}
                    >
                      {lesson.title}
                    </Button>
                    {lesson.description ? <p>{lesson.description}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </aside>
      <main className="layout__center" aria-label="3D viewer">
        <ViewerStage />
      </main>
      <aside className="layout__right" aria-label="Structure details">
        <DetailsPanel />
      </aside>
    </div>
  );
}
