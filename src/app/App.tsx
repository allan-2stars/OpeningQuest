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
import DesignSystem from "../features/design-system/DesignSystem";

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
        {import.meta.env.DEV && <Route path="/design-system" element={<DesignSystem />} />}
      </Routes>
    </AppShell>
  );
}
