import { useState } from "react";
import Login from "./pages/login/login";
import Home from "./pages/home/home";

function App() {
  const [page, setPage] = useState("login");

  if (page === "home") {
    return (
      <Home
        onNavigate={(nextPage) => {
          console.log("Navigate:", nextPage);
        }}
      />
    );
  }

  return (
    <Login
      onLogin={() => {
        setPage("home");
      }}
    />
  );
}

export default App;