import { Routes, Route } from "react-router-dom";
import AppShell from "../components/AppShell";
import Home from "../features/home/Home";
import Adventure from "../features/adventure/Adventure";
import Classic from "../features/classic/Classic";
import Practice from "../features/practice/Practice";
import Collection from "../features/collection/Collection";
import Profile from "../features/profile/Profile";
import Settings from "../features/settings/Settings";
import ImportExport from "../features/import-export/ImportExport";
import ReviewComplete from "../features/review/ReviewComplete.tsx";
import Statistics from "../features/statistics/Statistics.tsx";
import DesignSystem from "../features/design-system/DesignSystem";
import AnalysisPage from "../features/analysis/AnalysisPage.tsx";
import ReviewDemoPage from "../features/reviewAnalysis/ReviewDemoPage.tsx";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/adventure" element={<Adventure />} />
        <Route path="/classic" element={<Classic />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/practice/:lessonId" element={<Practice />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/import-export" element={<ImportExport />} />
        <Route path="/review/complete" element={<ReviewComplete />} />
        <Route path="/statistics" element={<Statistics />} />
        {import.meta.env.DEV && <Route path="/design-system" element={<DesignSystem />} />}
        {import.meta.env.DEV && <Route path="/analysis" element={<AnalysisPage />} />}
        {import.meta.env.DEV && <Route path="/review-demo" element={<ReviewDemoPage />} />}
      </Routes>
    </AppShell>
  );
}
