import { create } from 'zustand';
import {
  AnatomySearch,
  buildAnatomyIndex,
  buildSearchDocs,
  EducationFileSchema,
  LessonsFileSchema,
  OntologyFileSchema,
  QuizFileSchema,
  type AnatomyIndex,
  type EducationalRecord,
  type Lesson,
  type MasterIndex,
  type QuizQuestion,
} from '@anatomy/core';
import type { AnatomyAssetRegistry } from '@anatomy/viewer';
import type { z, ZodTypeAny } from 'zod';
import { ASSET_BASE_URL } from '../config';

/**
 * Ontology, bindings metadata, education, lessons and quiz data — everything
 * the shell needs BEFORE any geometry loads. Bundle manifests are small JSON
 * and are all loaded up front; GLB bytes stay lazy.
 */

export type DataStatus = 'idle' | 'loading' | 'ready' | 'error';

interface DataState {
  status: DataStatus;
  errorMessage: string | null;
  index: MasterIndex | null;
  anatomy: AnatomyIndex | null;
  education: Map<string, EducationalRecord>;
  lessons: Lesson[];
  quizQuestions: QuizQuestion[];
  search: AnatomySearch | null;
  load: (registry: AnatomyAssetRegistry) => Promise<void>;
}

async function fetchValidated<S extends ZodTypeAny>(
  path: string,
  schema: S,
  what: string,
): Promise<z.output<S>> {
  const url = `${ASSET_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${what} (HTTP ${response.status})`);
  }
  const raw: unknown = await response.json();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `${what} failed validation: ${parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}`,
    );
  }
  return parsed.data;
}

export const useDataStore = create<DataState>((set, get) => ({
  status: 'idle',
  errorMessage: null,
  index: null,
  anatomy: null,
  education: new Map(),
  lessons: [],
  quizQuestions: [],
  search: null,

  load: async (registry) => {
    if (get().status === 'loading' || get().status === 'ready') return;
    set({ status: 'loading', errorMessage: null });
    try {
      const index = await registry.loadMasterIndex();
      const [ontology, education, lessons, quiz, manifests] = await Promise.all([
        fetchValidated(index.ontology_path, OntologyFileSchema, 'anatomy ontology'),
        fetchValidated(index.education_path, EducationFileSchema, 'educational content'),
        fetchValidated(index.lessons_path, LessonsFileSchema, 'lessons'),
        fetchValidated(index.quiz_path, QuizFileSchema, 'quiz questions'),
        registry.loadAllManifests(),
      ]);
      const anatomy = buildAnatomyIndex({ structures: ontology.structures, manifests });
      const search = new AnatomySearch(buildSearchDocs(anatomy));
      set({
        status: 'ready',
        index,
        anatomy,
        education: new Map(education.records.map((r) => [r.structure_id, r])),
        lessons: lessons.lessons,
        quizQuestions: quiz.questions,
        search,
      });
    } catch (error) {
      set({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  },
}));
