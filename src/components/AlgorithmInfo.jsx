import React, { useState } from "react";
import "./AlgorithmInfo.css";

function AlgorithmInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="algorithm-info">
      <div className="info-header" onClick={() => setIsOpen(!isOpen)}>
        <button className="btn btn-link text-decoration-none text-start w-100 p-3">
          <span className="info-title">
            📚 How It Works: Micro-Sector Architecture {isOpen ? "▼" : "▶"}
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="info-content p-4 bg-light border-top">
          <div className="row g-4">
            {/* Algorithm Overview */}
            <div className="col-lg-6">
              <h6 className="fw-bold mb-3">🏗️ The Algorithm (4-Pass System)</h6>
              <div className="algorithm-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <strong>Prep Pass</strong>
                    <small>Calculate total distance and target time based on your pace</small>
                  </div>
                </div>
                <div className="step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <strong>Physics & Strategy Pass</strong>
                    <small>For each point-to-point segment: apply effort multiplier (grade) and strategy multiplier (pacing)</small>
                  </div>
                </div>
                <div className="step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <strong>Normalize Pass</strong>
                    <small>Scale all times to hit your exact target total running time</small>
                  </div>
                </div>
                <div className="step">
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <strong>Aggregate Pass</strong>
                    <small>Group micro-sectors into 1km segments for display</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Parameter Explanations */}
            <div className="col-lg-6">
              <h6 className="fw-bold mb-3">⚙️ Understanding the Parameters</h6>
              <div className="parameters-explained">
                <div className="param">
                  <strong className="text-primary">C1 (Linear Coefficient)</strong>
                  <p>
                    Controls how much steepness affects your pace in the basic case. Think of it as the "sensitivity" to grade:
                    <br />
                    <code>E(grade) = 1 + C1×grade + C2×grade²</code>
                    <br />
                    <small>Higher = harder climbs slow you more (1.5 = default, 3.0 = very steep)</small>
                  </p>
                </div>

                <div className="param">
                  <strong className="text-primary">C2 (Quadratic Coefficient)</strong>
                  <p>
                    Amplifies the effect of very steep grades (the "²" term). This makes extreme grades exponentially harder:
                    <br />
                    <small>Higher = extreme grades become disproportionately harder (6.5 = default, 12 = ultra-aggressive)</small>
                  </p>
                </div>

                <div className="param">
                  <strong className="text-primary">Split Variance</strong>
                  <p>
                    Enables negative split strategy: run slow early, fast late to manage energy:
                    <br />
                    <small>0% = even pace, 5% = moderate split, 15% = aggressive (run second half ~20 sec/km faster)</small>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="mt-4 pt-4 border-top">
            <h6 className="fw-bold mb-3">💡 Example</h6>
            <p className="mb-2">
              <small>
                On a 10 km run with 300m elevation gain and 5:30/km base pace:
              </small>
            </p>
            <ul className="small">
              <li><strong>Default (c1=1.5, c2=6.5, split=5%):</strong> Steep sections get ~15-20 sec/km slower, then normalized. Early km: 5:40, Late km: 5:20.</li>
              <li><strong>Race Mode (c1=2.0, c2=8.0, split=2%):</strong> More aggressive effort multiplier + minimal split = stay fast throughout.</li>
              <li><strong>Ultra Mode (c1=1.8, c2=7.0, split=10%):</strong> Strong negative split = run very conservative early, aggressive finish when you have energy left.</li>
            </ul>
          </div>

          {/* Key Insight */}
          <div className="mt-4 p-3 bg-info bg-opacity-10 rounded">
            <strong>🎯 Key Insight:</strong> The algorithm respects physics (grade makes you slower) AND strategy
            (pacing throughout the race). It always hits your exact target time by normalizing point-to-point calculations
            into 1km segments.
          </div>
        </div>
      )}
    </div>
  );
}

export default AlgorithmInfo;
