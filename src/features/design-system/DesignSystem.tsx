import { useState } from "react";
import PageShell from "../../components/PageShell.tsx";
import Button from "../../components/Button.tsx";
import Card from "../../components/Card.tsx";
import Modal from "../../components/Modal.tsx";
import ProgressBar from "../../components/ProgressBar.tsx";
import Badge from "../../components/Badge.tsx";
import XPChip from "../../components/XPChip.tsx";
import KeyChip from "../../components/KeyChip.tsx";
import LessonNode from "../../components/LessonNode.tsx";
import WorldCard from "../../components/WorldCard.tsx";
import EmptyState from "../../components/EmptyState.tsx";
import FeedbackBanner from "../../components/FeedbackBanner.tsx";

export default function DesignSystem() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageShell title="Design System">
      <div className="space-y-10">

        {/* Buttons */}
        <section>
          <h3 className="text-xl font-bold text-text-primary mb-3">Button</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center mt-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center mt-2">
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Card */}
        <section>
          <h3 className="text-xl font-bold text-text-primary mb-3">Card</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card header="Card with header">Body content here.</Card>
            <Card footer={<Button size="sm">Action</Button>} hover>Hoverable card with footer.</Card>
          </div>
        </section>

        {/* ProgressBar */}
        <section>
          <h3 className="text-xl font-bold text-text-primary mb-3">ProgressBar</h3>
          <div className="space-y-3 max-w-md">
            <ProgressBar value={30} showLabel />
            <ProgressBar value={60} variant="success" showLabel />
            <ProgressBar value={85} variant="warning" showLabel />
            <ProgressBar value={100} variant="primary" showLabel animated={false} />
          </div>
          <div className="space-y-3 max-w-md mt-2">
            <ProgressBar value={40} size="sm" />
            <ProgressBar value={40} size="md" />
            <ProgressBar value={40} size="lg" />
          </div>
        </section>

        {/* Badge */}
        <section>
          <h3 className="text-xl font-bold text-text-primary mb-3">Badge</h3>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="secondary">Secondary</Badge>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
          </div>
        </section>

        {/* XPChip & KeyChip */}
        <section>
          <h3 className="text-xl font-bold text-text-primary mb-3">XPChip &amp; KeyChip</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <XPChip amount={100} />
            <XPChip amount={2500} size="lg" animated />
            <KeyChip amount={3} />
            <KeyChip amount={15} size="lg" />
          </div>
        </section>

        {/* LessonNode */}
        <section>
          <h3 className="text-xl font-bold text-text-primary mb-3">LessonNode</h3>
          <div className="flex flex-wrap gap-3 items-start">
            <LessonNode label="Locked" status="locked" depth={1} />
            <LessonNode label="Available" status="available" depth={2} />
            <LessonNode label="Learning" status="learning" depth={3} />
            <LessonNode label="Mastered" status="mastered" depth={4} />
            <LessonNode label="Review" status="review_due" depth={2} />
            <LessonNode label="Boss!" status="available" depth={5} isBoss />
          </div>
        </section>

        {/* WorldCard */}
        <section>
          <h3 className="text-xl font-bold text-text-primary mb-3">WorldCard</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <WorldCard
              name="Knight Meadows"
              description="Beginner-friendly grassland world."
              theme="grassland"
              progress={3}
              totalLessons={5}
              masteredLessons={2}
              unlocked
              current
            />
            <WorldCard
              name="Royal Castle"
              description="Master center control."
              theme="castle"
              progress={0}
              totalLessons={6}
              masteredLessons={0}
              unlocked={false}
            />
          </div>
        </section>

        {/* Modal */}
        <section>
          <h3 className="text-xl font-bold text-text-primary mb-3">Modal</h3>
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Example Modal"
            footer={
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Close</Button>
            }
          >
            <p className="text-text-secondary">This is a modal dialog with overlay and escape-to-close.</p>
          </Modal>
        </section>

        {/* EmptyState */}
        <section>
          <h3 className="text-xl font-bold text-text-primary mb-3">EmptyState</h3>
          <EmptyState
            icon="♞"
            title="Nothing here yet"
            description="Complete your first lesson to unlock rewards."
            actionLabel="Go Practice"
          />
        </section>

        {/* FeedbackBanner */}
        <section>
          <h3 className="text-xl font-bold text-text-primary mb-3">FeedbackBanner</h3>
          <div className="space-y-3 max-w-lg">
            <FeedbackBanner type="success" message="Correct move! Well played." />
            <FeedbackBanner type="error" message="That's not the right move. Try again." dismissible />
            <FeedbackBanner type="warning" message="This lesson is due for review." />
            <FeedbackBanner type="info" message="You earned 50 XP for completing the lesson." />
          </div>
        </section>

        {/* Typography / Design Tokens */}
        <section>
          <h3 className="text-xl font-bold text-text-primary mb-3">Design Tokens</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              ["Primary", "bg-primary"],
              ["Secondary", "bg-secondary"],
              ["Success", "bg-success"],
              ["Warning", "bg-warning"],
              ["Error", "bg-error"],
              ["Surface", "bg-surface"],
              ["Surface Light", "bg-surface-light"],
              ["Primary Light", "bg-primary-light"],
            ] as const).map(([label, bg]) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-md ${bg}`} />
                <span className="text-xs text-text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </PageShell>
  );
}
