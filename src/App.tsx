import AppShell from "./components/AppShell";
import FloorPanel from "./components/panels/FloorPanel";
import TodayPanel from "./components/panels/TodayPanel";
import InsightsPanel from "./components/panels/InsightsPanel";
import CarbonPanel from "./components/panels/CarbonPanel";
import ProfilePanel from "./components/panels/ProfilePanel";
import { useApp } from "./store";

export default function App() {
  const view = useApp((s) => s.view);

  return (
    <AppShell>
      {view === "floor" && <FloorPanel />}
      {view === "today" && <TodayPanel />}
      {view === "insights" && <InsightsPanel />}
      {view === "carbon" && <CarbonPanel />}
      {view === "profile" && <ProfilePanel />}
    </AppShell>
  );
}
