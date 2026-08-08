import { describe, expect, it } from 'vitest';
import {
  advance,
  createQuizSession,
  currentQuestion,
  getPublicQuestion,
  submitAnswer,
  summarize,
} from './quiz';
import { makeQuizQuestion } from './testing';

function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('expected value to be defined');
  return value;
}

describe('createQuizSession', () => {
  it('filters out questions whose targets or distractors are unavailable', () => {
    const questions = [
      makeQuizQuestion({ id: 'TEST-Q-KEEP-1', target_structure_ids: ['TEST-S-A'] }),
      makeQuizQuestion({ id: 'TEST-Q-DROP-TARGET', target_structure_ids: ['TEST-S-MISSING'] }),
      makeQuizQuestion({
        id: 'TEST-Q-DROP-DISTRACTOR',
        type: 'multiple_choice',
        target_structure_ids: ['TEST-S-A'],
        distractor_structure_ids: ['TEST-S-MISSING'],
      }),
      makeQuizQuestion({
        id: 'TEST-Q-KEEP-2',
        type: 'multiple_choice',
        target_structure_ids: ['TEST-S-A'],
        distractor_structure_ids: ['TEST-S-B'],
      }),
    ];
    const session = createQuizSession(questions, {
      sessionId: 'filtering',
      availableStructureIds: new Set(['TEST-S-A', 'TEST-S-B']),
    });
    expect(new Set(session.questions.map((q) => q.id))).toEqual(
      new Set(['TEST-Q-KEEP-1', 'TEST-Q-KEEP-2']),
    );
  });

  it('orders questions deterministically for a fixed seed', () => {
    const pool = ['TEST-Q-1', 'TEST-Q-2', 'TEST-Q-3', 'TEST-Q-4', 'TEST-Q-5', 'TEST-Q-6'].map(
      (id, i) => makeQuizQuestion({ id, target_structure_ids: [`TEST-S-${i}`] }),
    );
    const first = createQuizSession(pool, { sessionId: 'seeded-1', seed: 7 });
    const second = createQuizSession(pool, { sessionId: 'seeded-2', seed: 7 });
    expect(first.questions.map((q) => q.id)).toEqual(second.questions.map((q) => q.id));
    expect([...first.questions.map((q) => q.id)].sort()).toEqual(pool.map((q) => q.id).sort());
  });
});

describe('getPublicQuestion', () => {
  it('never leaks the target structure id for identify_on_model', () => {
    const question = makeQuizQuestion({
      id: 'TEST-Q-IDENT',
      prompt: 'Select the highlighted structure on the model.',
      target_structure_ids: ['SECRET-STRUCTURE-9'],
    });
    const session = createQuizSession([question], { sessionId: 'ident', seed: 1 });
    const publicQuestion = must(getPublicQuestion(session, (id) => id));
    expect(JSON.stringify(publicQuestion)).not.toContain('SECRET-STRUCTURE-9');
    expect(publicQuestion.options).toBeUndefined();
  });

  it('builds multiple_choice options from targets and distractors with no correctness marker', () => {
    const question = makeQuizQuestion({
      id: 'TEST-Q-MC',
      type: 'multiple_choice',
      prompt: 'Which structure is highlighted?',
      target_structure_ids: ['TEST-S-A'],
      distractor_structure_ids: ['TEST-S-B', 'TEST-S-C', 'TEST-S-D'],
    });
    const session = createQuizSession([question], { sessionId: 'mc', seed: 42 });
    const publicQuestion = must(getPublicQuestion(session, (id) => `Label ${id}`));
    const options = must(publicQuestion.options);

    expect(options).toHaveLength(4);
    expect(new Set(options.map((o) => o.structure_id))).toEqual(
      new Set(['TEST-S-A', 'TEST-S-B', 'TEST-S-C', 'TEST-S-D']),
    );
    for (const option of options) {
      expect(Object.keys(option).sort()).toEqual(['label', 'structure_id']);
      expect(option.label).toBe(`Label ${option.structure_id}`);
    }

    const again = createQuizSession([question], { sessionId: 'mc-again', seed: 42 });
    const againOptions = must(must(getPublicQuestion(again, (id) => `Label ${id}`)).options);
    expect(againOptions.map((o) => o.structure_id)).toEqual(options.map((o) => o.structure_id));
  });
});

describe('submitAnswer / advance / summarize', () => {
  it('grades by structure_id and honors accepted_structure_ids', () => {
    const question = makeQuizQuestion({
      id: 'TEST-Q-ACC',
      target_structure_ids: ['TEST-S-A'],
      accepted_structure_ids: ['TEST-S-A', 'TEST-S-ALT'],
    });
    const session = createQuizSession([question], { sessionId: 'grading', seed: 1 });

    const accepted = submitAnswer(session, 'TEST-S-ALT');
    expect(accepted.correct).toBe(true);
    expect(accepted.correct_structure_ids).toEqual(['TEST-S-A']);

    const wrong = submitAnswer(session, 'TEST-S-WRONG');
    expect(wrong.correct).toBe(false);
    expect(wrong.state.answers).toEqual([
      { question_id: 'TEST-Q-ACC', submitted_structure_id: 'TEST-S-WRONG', correct: false },
    ]);
  });

  it('transitions question -> feedback -> question -> feedback -> complete and counts correct answers', () => {
    const questions = [
      makeQuizQuestion({ id: 'TEST-Q-1', target_structure_ids: ['TEST-S-A'] }),
      makeQuizQuestion({ id: 'TEST-Q-2', target_structure_ids: ['TEST-S-B'] }),
    ];
    let state = createQuizSession(questions, { sessionId: 'phases', seed: 3 });
    expect(state.phase).toBe('question');

    const firstQuestion = must(currentQuestion(state));
    const correctSubmit = submitAnswer(state, must(firstQuestion.target_structure_ids[0]));
    expect(correctSubmit.correct).toBe(true);
    state = correctSubmit.state;
    expect(state.phase).toBe('feedback');

    state = advance(state);
    expect(state.phase).toBe('question');
    expect(state.current_index).toBe(1);

    const wrongSubmit = submitAnswer(state, 'TEST-S-NOT-AN-ANSWER');
    expect(wrongSubmit.correct).toBe(false);
    state = advance(wrongSubmit.state);
    expect(state.phase).toBe('complete');

    const summary = summarize(state);
    expect(summary.total).toBe(2);
    expect(summary.correct_count).toBe(1);
    expect(summary.answers).toHaveLength(2);
  });
});
