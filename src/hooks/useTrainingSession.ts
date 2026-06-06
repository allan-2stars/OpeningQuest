import { useState, useCallback, useRef } from "react";
import { getLesson, getOpeningLine } from "../lib/repositories/curriculumRepo.ts";
import { initSession, submitMove } from "../features/training/trainingEngine.ts";
import { processTrainingResult } from "../services/processTrainingResult.ts";
import type { TrainingSessionState, TrainingSessionResult } from "../features/training/types.ts";
import type { LessonProgress, PracticeMode } from "../types/domain.ts";

type UseTrainingSessionResult = {
  state: TrainingSessionState | null;
  lessonTitle: string | null;
  isLoading: boolean;
  error: string | null;
  handleMove: (san: string) => void;
  result: TrainingSessionResult | null;
  resultProgress: LessonProgress | null;
  startSession: (lessonId: string, mode: PracticeMode) => void;
};

export function useTrainingSession(): UseTrainingSessionResult {
  const [state, setState] = useState<TrainingSessionState | null>(null);
  const [lessonTitle, setLessonTitle] = useState<string | null>(null);
  const [sanMoves, setSanMoves] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrainingSessionResult | null>(null);
  const [resultProgress, setResultProgress] = useState<LessonProgress | null>(null);
  const activeLessonRef = useRef<string | null>(null);

  const startSession = useCallback((lessonId: string, mode: PracticeMode) => {
    activeLessonRef.current = lessonId;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setResultProgress(null);
    setState(null);

    (async () => {
      try {
        const lesson = await getLesson(lessonId);
        if (activeLessonRef.current !== lessonId) return;
        if (!lesson) {
          setError(`Lesson not found: ${lessonId}`);
          return;
        }

        const line = await getOpeningLine(lesson.lineId);
        if (activeLessonRef.current !== lessonId) return;
        if (!line) {
          setError(`Opening line not found: ${lesson.lineId}`);
          return;
        }

        setLessonTitle(lesson.title);
        setSanMoves(line.sanMoves);
        setState(initSession(line.sanMoves, lesson.side, mode));
        setError(null);
        setResult(null);
      } catch (e) {
        if (activeLessonRef.current !== lessonId) return;
        setError(e instanceof Error ? e.message : "Failed to load lesson");
      } finally {
        if (activeLessonRef.current === lessonId) {
          setIsLoading(false);
        }
      }
    })();
  }, []);

  const handleMove = useCallback(
    (san: string) => {
      if (!state) return;
      const lessonId = activeLessonRef.current ?? "";
      try {
        const { state: next, result: sessionResult } = submitMove(state, san, sanMoves, lessonId);
        setState(next);
        if (sessionResult) {
          setResult(sessionResult);
          // Persist progression on session completion/failure
          const capturedLessonId = activeLessonRef.current;
          processTrainingResult(sessionResult).then(({ progress }) => {
            if (activeLessonRef.current === capturedLessonId) {
              setResultProgress(progress);
            }
          }).catch(() => {
            // Progression persistence is best-effort; training result is still displayed
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occurred during practice");
      }
    },
    [state, sanMoves],
  );

  return { state, lessonTitle, isLoading, error, handleMove, result, resultProgress, startSession };
}
