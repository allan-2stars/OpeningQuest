import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../../components/PageShell.tsx";
import Card from "../../components/Card.tsx";
import Button from "../../components/Button.tsx";
import Badge from "../../components/Badge.tsx";
import ProgressBar from "../../components/ProgressBar.tsx";
import EmptyState from "../../components/EmptyState.tsx";
import FeedbackBanner from "../../components/FeedbackBanner.tsx";
import {
  getDashboardStats,
  getWorldProgress,
  getRecentActivity,
} from "./statisticsService.ts";
import type {
  DashboardStats,
  WorldProgress,
  RecentActivityItem,
} from "./statisticsService.ts";

export default function Statistics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [worlds, setWorlds] = useState<WorldProgress[]>([]);
  const [activity, setActivity] = useState<RecentActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [s, w, a] = await Promise.all([
          getDashboardStats(),
          getWorldProgress(),
          getRecentActivity(),
        ]);
        if (cancelled) return;
        setStats(s);
        setWorlds(w);
        setActivity(a);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load statistics");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (isLoading) {
    return (
      <PageShell title="Statistics">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-secondary border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Statistics">
        <FeedbackBanner type="error" message={error} />
      </PageShell>
    );
  }

  if (!stats) {
    return (
      <PageShell title="Statistics">
        <EmptyState
          icon="📊"
          title="Welcome to Opening Quest"
          description="Complete your first lesson to start building statistics."
          actionLabel="Go to Adventure"
          onAction={() => navigate("/adventure")}
        />
      </PageShell>
    );
  }

  const isNewUser = stats.lessonsCompleted === 0 && stats.perfectRuns === 0;

  return (
    <PageShell title="Statistics">
      {isNewUser && (
        <FeedbackBanner
          type="info"
          message="Welcome! Complete your first lesson to start building statistics."
          className="mb-4"
        />
      )}

      <div className="flex flex-col gap-6 max-w-5xl">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatCard label="Total XP" value={stats.totalXp.toLocaleString()} color="text-secondary" />
          <StatCard label="Keys" value={stats.totalKeys.toLocaleString()} color="text-warning" />
          <StatCard label="Lessons Completed" value={`${stats.lessonsCompleted}`} color="text-success" />
          <StatCard label="Reviews" value={`${stats.reviewsCompleted}`} color="text-blue-300" />
        </div>

        {/* Progress section */}
        <Card header="Progress">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
            <div>
              <p className="text-text-muted text-xs">Lessons</p>
              <p className="text-text-primary font-bold text-lg">
                {stats.lessonsCompleted}<span className="text-text-muted text-sm font-normal"> / {stats.lessonsTotal}</span>
              </p>
              <ProgressBar
                value={stats.lessonsTotal > 0 ? (stats.lessonsCompleted / stats.lessonsTotal) * 100 : 0}
                size="sm"
                className="mt-1"
              />
            </div>
            <div>
              <p className="text-text-muted text-xs">Worlds</p>
              <p className="text-text-primary font-bold text-lg">
                {stats.worldsCompleted}<span className="text-text-muted text-sm font-normal"> / {stats.worldsTotal}</span>
              </p>
              <ProgressBar
                value={stats.worldsTotal > 0 ? (stats.worldsCompleted / stats.worldsTotal) * 100 : 0}
                size="sm"
                variant="success"
                className="mt-1"
              />
            </div>
            <div>
              <p className="text-text-muted text-xs">Average Mastery</p>
              <p className="text-text-primary font-bold text-lg">
                {stats.masteryAverage}<span className="text-text-muted text-sm font-normal"> / 4</span>
              </p>
              <ProgressBar
                value={(stats.masteryAverage / 4) * 100}
                size="sm"
                variant="warning"
                className="mt-1"
              />
            </div>
            <div>
              <p className="text-text-muted text-xs">Due Reviews</p>
              <p className="text-text-primary font-bold text-lg">{stats.dueReviews}</p>
              {stats.dueReviews > 0 && (
                <Button size="sm" variant="ghost" className="mt-1 text-xs" onClick={() => navigate("/adventure")}>
                  Start Review
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* World breakdown */}
        {worlds.length > 0 && (
          <Card header="World Progress">
            <div className="space-y-3">
              {worlds.map((w) => (
                <div key={w.worldId} className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-primary font-semibold">{w.worldName}</span>
                    <span className="text-text-muted text-xs tabular-nums">
                      {w.lessonsCompleted}/{w.lessonsTotal} · Avg {w.averageMastery}/4
                    </span>
                  </div>
                  <ProgressBar
                    value={w.completionPercent}
                    size="sm"
                    variant={w.completionPercent >= 100 ? "success" : "primary"}
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Daily quest summary */}
        <Card header="Daily Quests">
          <div className="flex items-center justify-between text-sm">
            <p className="text-text-secondary">
              {stats.dailyQuestsCompletedToday === 3
                ? "All completed for today!"
                : `${stats.dailyQuestsCompletedToday} of 3 completed`}
            </p>
            <Button size="sm" variant="ghost" onClick={() => navigate("/adventure")}>
              View Quests
            </Button>
          </div>
        </Card>

        {/* Recent activity */}
        <Card header="Recent Activity">
          {activity.length === 0 ? (
            <p className="text-sm text-text-muted">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {activity.slice(0, 20).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      size="sm"
                      variant={
                        item.type === "lesson_completed"
                          ? "success"
                          : item.type === "review_completed"
                          ? "warning"
                          : item.type === "quest_completed"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {item.type === "lesson_completed"
                        ? "Lesson"
                        : item.type === "review_completed"
                        ? "Review"
                        : item.type === "quest_completed"
                        ? "Quest"
                        : "Achievement"}
                    </Badge>
                    <span className="text-text-primary truncate">{item.title}</span>
                  </div>
                  <span className="text-text-muted tabular-nums shrink-0 ml-2">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "just now";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
