const AI = createAI({
  actions: {
    fetchUserData: async (userId) => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      return data;
    },
    updateUserSettings: async (settings) => {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    },
  },

  initialAIState: {
    userProfile: { name: "", email: "" },
    settings: { theme: "light", notifications: true },
  },

  initialUIState: {
    isSidebarOpen: false,
  },
});

const AppLayout = ({ children }) => {
  return (
    <AI.Provider>
      {" "}
      #D
      {children}
    </AI.Provider>
  );
};
