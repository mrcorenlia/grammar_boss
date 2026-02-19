import "./App.css";

// A React "function component" is a JavaScript function that returns JSX.
// JSX looks like HTML, but it is compiled into JavaScript function calls.
function App() {
  return (
    // className maps to the HTML class attribute.
    // React uses className because class is a reserved JavaScript keyword.
    <main className="app">
      {/* These nodes render like normal HTML elements in the browser. */}
      <h1>Grammar Boss Battle</h1>
      <p>Iteration 0 scaffold is ready.</p>
    </main>
  );
}

// Default export lets other files import this component as:
// import App from "./App";
export default App;
