import {
  FuzzySet,
  MamdaniInferenceSystem,
  defuzzifyCentroid,
} from '/src/v1/libs/math/TinyMamdaniInferenceSystem.mjs';

// --- DOM Elements ---
const tempSlider = document.getElementById('tempSlider');
const tempValue = document.getElementById('tempValue');
const fuzzifiedOutput = document.getElementById('fuzzifiedOutput');
const defuzzifiedOutput = document.getElementById('defuzzifiedOutput');
const testConsole = document.getElementById('testConsole');
const runTestsBtn = document.getElementById('runTestsBtn');

// --- Engine Initialization ---
const engine = new MamdaniInferenceSystem();

// 1. Expanded Temperature Sets (-20 to 100)
engine.addVariable('temperature', [
  new FuzzySet('ExtremeCold', -20, -20, -5, 5),
  new FuzzySet('VeryCold', 0, 5, 10, 15),
  new FuzzySet('Cold', 10, 15, 20, 25),
  new FuzzySet('Warm', 20, 25, 30, 35),
  new FuzzySet('Hot', 30, 35, 45, 55),
  new FuzzySet('ExtremeHot', 50, 65, 100, 100),
]);

// 2. Expanded Fan Power Sets (0% to 100%)
const fanPowerSets = [
  new FuzzySet('Off', 0, 0, 0, 5),
  new FuzzySet('VeryLow', 0, 10, 20, 30),
  new FuzzySet('Low', 20, 30, 40, 50),
  new FuzzySet('Medium', 40, 50, 60, 70),
  new FuzzySet('High', 60, 70, 80, 90),
  new FuzzySet('Maximum', 80, 95, 100, 100),
];

/**
 * Updates the UI based on fuzzy calculations.
 * @param {number} currentTemp
 */
const updateDashboard = (currentTemp) => {
  tempValue.textContent = currentTemp.toFixed(1);

  // 1. Fuzzify
  const inputs = engine.fuzzify('temperature', currentTemp);
  fuzzifiedOutput.textContent = JSON.stringify(inputs, null, 2);

  // 2. Apply Rules (Mapping 6 inputs to 6 outputs)
  const fuzzyOutput = {
    Maximum: inputs['ExtremeHot'],
    High: inputs['Hot'],
    Medium: inputs['Warm'],
    Low: inputs['Cold'],
    VeryLow: inputs['VeryCold'],
    Off: inputs['ExtremeCold'],
  };

  // 3. Defuzzify
  const precisePower = defuzzifyCentroid(fuzzyOutput, fanPowerSets);
  defuzzifiedOutput.textContent = `${precisePower.toFixed(2)} %`;
};

// Initialize Dashboard
tempSlider.addEventListener('input', (e) => updateDashboard(parseFloat(e.target.value)));
updateDashboard(parseFloat(tempSlider.value));

// --- Testing Suite Logger ---
const logTest = (message, status = 'info') => {
  const line = document.createElement('div');
  line.className = `log-${status}`;
  line.textContent = `> ${message}`;
  testConsole.appendChild(line);
  testConsole.scrollTop = testConsole.scrollHeight;
};

/**
 * Executes all edge cases for the engine.
 */
const runFullTestSuite = () => {
  testConsole.innerHTML = '';
  logTest('Starting full test suite...', 'info');

  try {
    // Test 1: FuzzySet Getters and Setters
    logTest('Test 1: Testing FuzzySet Setters & Validation');
    const testSet = new FuzzySet('Test', 0, 1, 2, 3);
    testSet.name = 'UpdatedTest';
    testSet.a = -5;
    if (testSet.name === 'UpdatedTest' && testSet.a === -5) {
      logTest('SUCCESS: Getters and Setters working correctly.', 'pass');
    }

    // Test 2: Type Validation Error Handling
    logTest('Test 2: Testing Type Protections');
    try {
      testSet.b = 'invalid_string';
      logTest('FAIL: Should have thrown TypeError for invalid type.', 'fail');
    } catch (error) {
      logTest(`SUCCESS: Caught expected error: ${error.message}`, 'pass');
    }

    // Test 3: Engine Variable Management (hasVariable, getVariable)
    logTest('Test 3: Testing Engine Variable Management');
    const testEngine = new MamdaniInferenceSystem();
    testEngine.addVariable('humidity', [new FuzzySet('Dry', 0, 0, 20, 40)]);

    if (testEngine.hasVariable('humidity')) {
      logTest('SUCCESS: hasVariable detected existing variable.', 'pass');
    }

    const retrievedVar = testEngine.getVariable('humidity');
    if (retrievedVar.length === 1 && retrievedVar[0].name === 'Dry') {
      logTest('SUCCESS: getVariable returned correct cloned array.', 'pass');
    }

    // Test 4: Engine Variable Removal (removeVariable)
    logTest('Test 4: Testing Variable Removal');
    testEngine.removeVariable('humidity');
    if (!testEngine.hasVariable('humidity')) {
      logTest('SUCCESS: removeVariable successfully deleted the variable.', 'pass');
    }

    // Test 5: Error on getting non-existent variable
    logTest('Test 5: Retrieving non-existent variable');
    try {
      testEngine.getVariable('ghost_variable');
      logTest('FAIL: Should have thrown Error.', 'fail');
    } catch (error) {
      logTest(`SUCCESS: Caught expected error: ${error.message}`, 'pass');
    }

    logTest('--- ALL TESTS COMPLETED ---', 'info');

    // Test 6: Psychological Modeling (Multi-variable AND/OR)
    logTest('Test 6: Human Emotional State (Burnout Risk)');

    // 1. Defining Input 1: Mental Stress (0 to 100)
    testEngine.addVariable('stress', [
      new FuzzySet('Low', 0, 0, 30, 50),
      new FuzzySet('Moderate', 30, 50, 60, 80),
      new FuzzySet('Severe', 70, 85, 100, 100),
    ]);

    // 2. Defining Input 2: Physical Fatigue (0 to 100)
    testEngine.addVariable('fatigue', [
      new FuzzySet('Rested', 0, 0, 20, 40),
      new FuzzySet('Tired', 30, 50, 70, 85),
      new FuzzySet('Exhausted', 75, 90, 100, 100),
    ]);

    // 3. Defining Output: Burnout Risk Index (0 to 100%)
    const burnoutSets = [
      new FuzzySet('Safe', 0, 0, 20, 40),
      new FuzzySet('Warning', 30, 50, 60, 80),
      new FuzzySet('Critical', 70, 85, 100, 100),
    ];

    // 4. Simulating a patient state: High Stress (82) and Very Tired (86)
    const patientStress = 82;
    const patientFatigue = 86;

    const fuzzyStress = testEngine.fuzzify('stress', patientStress);
    const fuzzyFatigue = testEngine.fuzzify('fatigue', patientFatigue);

    // 5. Rule Evaluation using Fuzzy Operators
    const emotionalOutput = {
      // Rule 1: IF Severe Stress AND Exhausted Fatigue THEN Critical Risk
      // Operator AND translates to Math.min in Fuzzy Logic
      Critical: Math.min(fuzzyStress['Severe'], fuzzyFatigue['Exhausted']),

      // Rule 2: IF Moderate Stress OR Tired Fatigue THEN Warning Risk
      // Operator OR translates to Math.max in Fuzzy Logic
      Warning: Math.max(fuzzyStress['Moderate'], fuzzyFatigue['Tired']),

      // Rule 3: IF Low Stress AND Rested Fatigue THEN Safe
      Safe: Math.min(fuzzyStress['Low'], fuzzyFatigue['Rested']),
    };

    // 6. Defuzzification via Centroid
    const burnoutRiskIndex = defuzzifyCentroid(emotionalOutput, burnoutSets);

    logTest(`Patient Input -> Stress: ${patientStress}, Fatigue: ${patientFatigue}`);
    logTest(
      `SUCCESS: Patient Burnout Risk computed precisely at: ${burnoutRiskIndex.toFixed(2)}%`,
      'pass',
    );
  } catch (fatalError) {
    logTest(`FATAL ERROR DURING TESTS: ${fatalError.message}`, 'fail');
  }
};

runTestsBtn.addEventListener('click', runFullTestSuite);
