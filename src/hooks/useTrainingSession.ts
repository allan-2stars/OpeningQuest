import { useState, useCallback, useRef } from "react";
import { getLesson, getOpeningLine } from "../lib/repositories/curriculumRepo.ts";
import { initSession, submitMove } from "../features/training/trainingEngine.ts";
import { processTrainingResult } from "../services/processTrainingResult.ts";
import type { TrainingSessionState, TrainingSessionResult } from "../features/training/types.ts";
import type { LessonProgress, PracticeMode } from "../types/domain.ts";
import type { RewardSummary } from "../services/rewardCalculator.ts";

type UseTrainingSessionResult = {
  state: TrainingSessionState | null;
  lessonTitle: string | null;
  isLoading: boolean;
  error: string | null;
  handleMove: (san: string) => void;
  expectedSan: string | null;
  result: TrainingSessionResult | null;
  resultProgress: LessonProgress | null;
  rewardSummary: RewardSummary | null;
  rewardError: string | null;
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
  const [rewardSummary, setRewardSummary] = useState<RewardSummary | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const activeLessonRef = useRef<string | null>(null);

  const startSession = useCallback((lessonId: string, mode: PracticeMode) => {
    activeLessonRef.current = lessonId;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setResultProgress(null);
    setRewardSummary(null);
    setRewardError(null);
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
          // Persist progression + rewards
          const capturedLessonId = activeLessonRef.current;
          processTrainingResult(sessionResult).then(({ progress, rewardSummary: summary, rewardError: rerr }) => {
            if (activeLessonRef.current !== capturedLessonId) return;
            setResultProgress(progress);
            if (summary) setRewardSummary(summary);
            if (rerr) setRewardError(rerr);
          }).catch(() => {
            // Persistence failure — the training result is still visible
            if (activeLessonRef.current !== capturedLessonId) return;
            setRewardError("Failed to save progress.");
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occurred during practice");
      }
    },
    [state, sanMoves],
  );

  return {
    state,
    lessonTitle,
    isLoading,
    error,
    handleMove,
    expectedSan: state ? (sanMoves[state.currentMoveIndex] ?? null) : null,
    result,
    resultProgress,
    rewardSummary,
    rewardError,
    startSession,
  };
}
