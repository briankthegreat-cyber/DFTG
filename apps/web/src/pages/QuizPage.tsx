import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, EmptyState, Panel } from '@anatomy/ui';
import { summarize } from '@anatomy/core';
import { useRegistryStore } from '@anatomy/viewer';
import { availableStructureIds, labelFor } from '../controller';
import { useDataStore } from '../state/data';
import { useQuizStore, usePublicQuestion } from '../state/quiz';
import { ViewerStage } from '../viewer/ViewerStage';

function QuizSetup() {
  const quizQuestions = useDataStore((s) => s.quizQuestions);
  const anatomy = useDataStore((s) => s.anatomy);
  const bundles = useRegistryStore((s) => s.bundles);
  const start = useQuizStore((s) => s.start);
  const [count, setCount] = useState(5);
  const [system, setSystem] = useState<string>('');

  const readyCount = Object.values(bundles).filter((b) => b.state === 'ready').length;

  return (
    <Panel title="Quiz setup" aria-label="Quiz setup">
      <p className="quiz-setup__note">
        Questions are limited to structures whose geometry is currently loaded ({readyCount} bundle
        {readyCount === 1 ? '' : 's'} ready), so every identify-on-model prompt is answerable on
        screen.
      </p>
      <label className="quiz-setup__row">
        Number of questions
        <select value={count} onChange={(event) => setCount(Number(event.target.value))}>
          <option value={3}>3</option>
          <option value={5}>5</option>
          <option value={10}>10</option>
        </select>
      </label>
      <label className="quiz-setup__row">
        System
        <select value={system} onChange={(event) => setSystem(event.target.value)}>
          <option value="">All systems</option>
          {(anatomy?.systems ?? []).map((s) => (
            <option key={s.system} value={s.system}>
              {s.display_name}
            </option>
          ))}
        </select>
      </label>
      <Button
        variant="primary"
        data-testid="quiz-start"
        onClick={() => start({ count, ...(system !== '' ? { system } : {}) })}
        disabled={quizQuestions.length === 0}
      >
        Start quiz
      </Button>
    </Panel>
  );
}

function QuizRunner() {
  const session = useQuizStore((s) => s.session);
  const lastResult = useQuizStore((s) => s.lastResult);
  const answerWith = useQuizStore((s) => s.answerWith);
  const next = useQuizStore((s) => s.next);
  const abort = useQuizStore((s) => s.abort);
  const publicQuestion = usePublicQuestion();
  const [listOpen, setListOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Answer buttons unmount on submit; move keyboard focus to the new card so
  // it is never dropped to <body> across phase transitions.
  const phase = session?.phase;
  const questionIndex = session?.current_index;
  useEffect(() => {
    cardRef.current?.focus();
  }, [phase, questionIndex]);

  const identifyCandidates = useMemo(() => {
    if (!publicQuestion || publicQuestion.type !== 'identify_on_model') return [];
    return [...availableStructureIds()]
      .map((structureId) => ({ structureId, label: labelFor(structureId) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [publicQuestion]);

  if (!session) return null;

  if (session.phase === 'complete') {
    const summary = summarize(session);
    return (
      <Panel title="Results" aria-label="Quiz results">
        <div data-testid="quiz-results" ref={cardRef} tabIndex={-1} role="status">
          {summary.total === 0 ? (
            <EmptyState
              title="No questions available"
              hint="Load a system bundle first (Explore → Systems), then start the quiz again."
            />
          ) : (
            <>
              <p className="quiz-results__score">
                {summary.correct_count} / {summary.total} correct
              </p>
              <ul className="quiz-results__list">
                {summary.answers.map((answer, index) => (
                  <li key={answer.question_id}>
                    <Badge tone={answer.correct ? 'success' : 'danger'}>
                      {answer.correct ? '✓' : '✗'}
                    </Badge>{' '}
                    Q{index + 1}:{' '}
                    {answer.submitted_structure_id
                      ? labelFor(answer.submitted_structure_id)
                      : 'no answer'}
                  </li>
                ))}
              </ul>
            </>
          )}
          <Button variant="primary" onClick={abort} data-testid="quiz-finish">
            Done
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <div className="quiz-runner">
      {publicQuestion && session.phase === 'question' ? (
        <div className="quiz-card" data-testid="quiz-prompt" ref={cardRef} tabIndex={-1}>
          <div className="quiz-card__header">
            <Badge tone="info">
              Question {publicQuestion.index + 1} / {publicQuestion.total}
            </Badge>
            {publicQuestion.difficulty ? (
              <Badge tone="neutral">{publicQuestion.difficulty}</Badge>
            ) : null}
            <Button size="sm" onClick={abort} aria-label="Abort quiz session">
              End quiz
            </Button>
          </div>
          <p className="quiz-card__prompt">{publicQuestion.prompt}</p>
          {publicQuestion.type === 'identify_on_model' ? (
            <>
              <p className="quiz-card__hint">Click the structure on the model.</p>
              <Button size="sm" onClick={() => setListOpen((o) => !o)} active={listOpen}>
                {listOpen ? 'Hide answer list' : 'Answer from a list instead'}
              </Button>
              {listOpen ? (
                <div className="quiz-card__options" role="group" aria-label="Answer choices">
                  {identifyCandidates.map((candidate) => (
                    <Button
                      key={candidate.structureId}
                      size="sm"
                      data-testid={`quiz-option-${candidate.structureId}`}
                      onClick={() => answerWith(candidate.structureId)}
                    >
                      {candidate.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="quiz-card__options" role="group" aria-label="Answer choices">
              {(publicQuestion.options ?? []).map((option) => (
                <Button
                  key={option.structure_id}
                  data-testid={`quiz-option-${option.structure_id}`}
                  onClick={() => answerWith(option.structure_id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      ) : null}
      {session.phase === 'feedback' && lastResult ? (
        <div className="quiz-card" data-testid="quiz-feedback" ref={cardRef} tabIndex={-1}>
          {/* role=status so screen readers announce the graded verdict. */}
          <div role="status">
            <p
              className={`quiz-card__verdict ${lastResult.correct ? 'is-correct' : 'is-incorrect'}`}
            >
              {lastResult.correct ? 'Correct' : 'Incorrect'}
            </p>
            <p>
              The answer is{' '}
              <strong>{lastResult.correct_structure_ids.map(labelFor).join(', ')}</strong> — now
              highlighted on the model.
            </p>
            {lastResult.explanation ? <p>{lastResult.explanation}</p> : null}
          </div>
          {lastResult.citations && lastResult.citations.length > 0 ? (
            <ul className="quiz-card__citations">
              {lastResult.citations.map((citation) => (
                <li key={citation.label}>{citation.label}</li>
              ))}
            </ul>
          ) : null}
          <Button variant="primary" onClick={next} data-testid="quiz-next">
            {session.current_index + 1 >= session.questions.length
              ? 'See results'
              : 'Next question'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function QuizPage() {
  const session = useQuizStore((s) => s.session);
  return (
    <div className="layout layout--left">
      <aside className="layout__left" aria-label="Quiz controls">
        {session ? <QuizRunner /> : <QuizSetup />}
      </aside>
      <main className="layout__center" aria-label="3D viewer">
        <ViewerStage quizMode />
      </main>
    </div>
  );
}
