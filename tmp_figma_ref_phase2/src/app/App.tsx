import { HistoryModal } from "./components/HistoryModal";
import { BookmarksModal } from "./components/BookmarksModal";
import { PomodoroModal } from "./components/PomodoroModal";
import { AIAssistantModal } from "./components/AIAssistantModal";
import { SmartNotesPage } from "./components/SmartNotesPage";
import { useState } from "react";
import { BrowserSidebar } from "./components/BrowserSidebar";
import { BrowserTabBar } from "./components/BrowserTabBar";
import { BrowserNavBar } from "./components/BrowserNavBar";
import { NewTabPage } from "./components/NewTabPage";
import { ToastProvider } from "./components/ToastProvider";

// Browser application
interface Tab {
  id: string;
  title: string;
  url: string;
  isNewTab: boolean;
  history: string[];
  historyIndex: number;
}

let tabCounter = 1;

function createNewTab(): Tab {
  tabCounter++;
  return {
    id: `tab-${tabCounter}`,
    title: "New Tab",
    url: "",
    isNewTab: true,
    history: [],
    historyIndex: -1,
  };
}

const initialTab: Tab = {
  id: "tab-1",
  title: "New Tab",
  url: "",
  isNewTab: true,
  history: [],
  historyIndex: -1,
};

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);
  const [tabs, setTabs] = useState<Tab[]>([initialTab]);
  const [activeTabId, setActiveTabId] =
    useState<string>("tab-1");
  const [openModal, setOpenModal] = useState<string | null>(
    null,
  );
  const [showSmartNotes, setShowSmartNotes] = useState(false);

  const activeTab =
    tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  const handleNavigate = (url: string) => {
    let finalUrl = url.trim();
    if (!finalUrl) return;

    if (
      !finalUrl.startsWith("http://") &&
      !finalUrl.startsWith("https://") &&
      !finalUrl.includes(".")
    ) {
      finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
    } else if (
      !finalUrl.startsWith("http://") &&
      !finalUrl.startsWith("https://")
    ) {
      finalUrl = `https://${finalUrl}`;
    }

    const domain = (() => {
      try {
        return new URL(finalUrl).hostname.replace("www.", "");
      } catch {
        return finalUrl;
      }
    })();

    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== activeTabId) return tab;
        const newHistory = [
          ...tab.history.slice(0, tab.historyIndex + 1),
          finalUrl,
        ];
        return {
          ...tab,
          url: finalUrl,
          title: domain,
          isNewTab: false,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      }),
    );
  };

  const handleUrlChange = (url: string) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId ? { ...tab, url } : tab,
      ),
    );
  };

  const handleBack = () => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== activeTabId) return tab;
        if (tab.historyIndex <= 0) return tab;
        const newIndex = tab.historyIndex - 1;
        const newUrl = tab.history[newIndex];
        const domain = (() => {
          try {
            return new URL(newUrl).hostname.replace("www.", "");
          } catch {
            return "New Tab";
          }
        })();
        return {
          ...tab,
          url: newUrl,
          title: domain,
          historyIndex: newIndex,
          isNewTab: false,
        };
      }),
    );
  };

  const handleForward = () => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== activeTabId) return tab;
        if (tab.historyIndex >= tab.history.length - 1)
          return tab;
        const newIndex = tab.historyIndex + 1;
        const newUrl = tab.history[newIndex];
        const domain = (() => {
          try {
            return new URL(newUrl).hostname.replace("www.", "");
          } catch {
            return "New Tab";
          }
        })();
        return {
          ...tab,
          url: newUrl,
          title: domain,
          historyIndex: newIndex,
          isNewTab: false,
        };
      }),
    );
  };

  const handleRefresh = () => {
    // Visual feedback only in this mockup
  };

  const handleHome = () => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              url: "",
              title: "New Tab",
              isNewTab: true,
            }
          : tab,
      ),
    );
  };

  const handleNewTab = () => {
    const newTab = createNewTab();
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleTabClose = (id: string) => {
    if (tabs.length === 1) {
      const newTab = createNewTab();
      setTabs([newTab]);
      setActiveTabId(newTab.id);
      return;
    }
    const idx = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (id === activeTabId) {
      const nextIdx = Math.min(idx, newTabs.length - 1);
      setActiveTabId(newTabs[nextIdx].id);
    }
  };

  const canGoBack = (activeTab?.historyIndex ?? 0) > 0;
  const canGoForward =
    (activeTab?.historyIndex ?? 0) <
    (activeTab?.history.length ?? 0) - 1;

  return (
    <ToastProvider>
      <div
        className="flex h-screen w-screen overflow-hidden"
        style={{
          background: "#FFFFFF",
          fontFamily:
            "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Sidebar */}
        <BrowserSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
          onOpenModal={(id: string) => {
            if (id === "Smart Notes") {
              setShowSmartNotes(true);
              setOpenModal(null);
            } else {
              setOpenModal(id);
              setShowSmartNotes(false);
            }
          }}
        />

        {/* Main browser area */}
        <div className="flex flex-col flex-1 min-w-0 relative">
          {/* Tab bar */}
          <BrowserTabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabClick={setActiveTabId}
            onTabClose={handleTabClose}
            onNewTab={handleNewTab}
          />

          {/* Navigation bar */}
          <BrowserNavBar
            url={activeTab?.url ?? ""}
            onUrlChange={handleUrlChange}
            onNavigate={handleNavigate}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onBack={handleBack}
            onForward={handleForward}
            onRefresh={handleRefresh}
            onHome={handleHome}
            onNewTab={handleNewTab}
            onOpenModal={(id: string) => {
              if (id === "Smart Notes") {
                setShowSmartNotes(true);
                setOpenModal(null);
              } else {
                setOpenModal(id);
                setShowSmartNotes(false);
              }
            }}
          />

          {/* Content */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              border: "1px solid #ECECEC",
              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            }}
          >
            {activeTab?.isNewTab ? (
              <NewTabPage onSearch={handleNavigate} />
            ) : (
              <div
                className="flex-1 relative"
                style={{ background: "#FFFFFF" }}
              >
                <iframe
                  key={activeTab?.url}
                  src={activeTab?.url}
                  className="w-full h-full border-0"
                  title="browser-content"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                />
                {/* Overlay notice */}
                <div
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.90)",
                    border: "1px solid rgba(228,228,231,0.80)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    boxShadow:
                      "0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                  }}
                >
                  <span
                    style={{
                      color: "#9EA2A8",
                      fontSize: 12,
                      fontFamily:
                        "Inter, system-ui, sans-serif",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    External sites may be blocked by browser
                    security policies
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Smart Notes — slide-out workspace layer */}
          <SmartNotesPage
            open={showSmartNotes}
            onClose={() => setShowSmartNotes(false)}
          />
        </div>

        {/* Utility Modals */}
        <HistoryModal
          open={openModal === "History"}
          onClose={() => setOpenModal(null)}
        />
        <BookmarksModal
          open={openModal === "Bookmarks"}
          onClose={() => setOpenModal(null)}
        />
        <PomodoroModal
          open={openModal === "Pomodoro"}
          onClose={() => setOpenModal(null)}
        />
        <AIAssistantModal
          open={openModal === "AI Assistant"}
          onClose={() => setOpenModal(null)}
        />
      </div>
    </ToastProvider>
  );
}