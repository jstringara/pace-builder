import React, { useState, useEffect } from "react";
import PacingForm from "./components/PacingForm";
import ResultsDisplay from "./components/ResultsDisplay";
import "./App.css";

function App() {
  const [pyodide, setPyodide] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for Pyodide to be available globally
    const initPyodideWhenReady = async () => {
      // Poll until loadPyodide is available (up to 30 seconds)
      let attempts = 0;
      while (!window.loadPyodide && attempts < 60) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;
      }

      if (!window.loadPyodide) {
        setError("Failed to load Pyodide. Please refresh the page.");
        return;
      }

      initPyodide();
    };

    initPyodideWhenReady();
  }, []);

  const initPyodide = async () => {
    try {
      const pyodideModule = await window.loadPyodide();
      await pyodideModule.loadPackage("micropip");
      await pyodideModule.loadPackage("matplotlib");

      // Load Python modules in order - all in one call to maintain scope
      const pacingScript = await fetch(
        import.meta.env.BASE_URL + "pacing_strategy.py",
      ).then((r) => r.text());
      const chartScript = await fetch(
        import.meta.env.BASE_URL + "chart_generator.py",
      ).then((r) => r.text());
      const calculatorScript = await fetch(
        import.meta.env.BASE_URL + "pace_calculator.py",
      ).then((r) => r.text());

      // Load all scripts in one call to maintain function scope
      pyodideModule.runPython(
        pacingScript + "\n" + chartScript + "\n" + calculatorScript,
      );

      setPyodide(pyodideModule);
      console.log("✓ Pyodide initialized successfully");
    } catch (err) {
      console.error("Pyodide initialization error:", err);
      setError("Failed to initialize Python runtime. Please refresh the page.");
    }
  };

  const handleCalculate = async (formData) => {
    if (!pyodide) {
      setError("Python runtime not ready");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        gpxContent,
        basePace,
        c1,
        c2,
        splitVariance,
        minPct,
        maxMult,
      } = formData;

      // Set Python globals
      pyodide.globals.set("gpx_content", gpxContent);
      pyodide.globals.set("base_pace", basePace);
      pyodide.globals.set("c1", c1);
      pyodide.globals.set("c2", c2);
      pyodide.globals.set("split_variance", splitVariance);
      pyodide.globals.set("min_pace_frac", minPct / 100);
      pyodide.globals.set("max_pace_mult", maxMult);

      // Run Python calculation
      const result = await pyodide.runPythonAsync(`
calculate_pacing_strategy(
    gpx_content,
    base_pace,
    c1,
    c2,
    split_variance,
    min_pace_frac,
    max_pace_mult
)
      `);

      const resultData = JSON.parse(result);
      setResults(resultData);
    } catch (err) {
      console.error("Calculation error:", err);
      setError("Error calculating pacing strategy: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar navbar-light bg-light border-bottom">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">🏃 Pace Builder</span>
        </div>
      </nav>

      <main className="container-lg py-5">
        <div className="row">
          <div className="col-xl-4">
            <PacingForm
              onSubmit={handleCalculate}
              loading={loading}
              error={error}
              onErrorDismiss={() => setError(null)}
            />
          </div>
          <div className="col-xl-8">
            {results && <ResultsDisplay results={results} />}
            {!results && !loading && (
              <div className="alert alert-info mt-4">
                <h5>📝 Getting Started</h5>
                <p className="mb-0">
                  Load a GPX file and enter your target pace to calculate an
                  intelligent pacing strategy based on elevation and terrain.
                  Adjust the advanced parameters for different race conditions
                  or training scenarios.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
