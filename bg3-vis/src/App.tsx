import { abilities } from "./data/abilities";
import DataCircle from "./components/DataCircle";

function App() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>BG3 Visualization Prototype</h1>
      <p>Loaded abilities: {abilities.length}</p>
      <DataCircle />
    </div>
  );
}

export default App;