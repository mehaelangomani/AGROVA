# AGROVA — Crop Selection Optimizer

A single-page React + Vite application for an academic Design and Analysis of Algorithms project.

## Run locally

1. Extract this ZIP.
2. Open the extracted `flora-seedselect-landing-updated` folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL shown by Vite (usually `http://localhost:3000/`).

The included `.npmrc` enables legacy peer-dependency resolution for this starter's dependency tree. Keep it in the project root.

## App flow

- Landing hero → Start Growing scrolls to the farm input form.
- Inputs: land (acres), budget (₹ lakh), available water (lakh litres), and season.
- Calculate runs Brute Force, Divide and Conquer, Dynamic Programming, and Greedy.
- Select any algorithm card to inspect its crop allocation, profit, resource usage, explanation, complexity and measured execution time.
- A final section recommends the most efficient exact algorithm based on measured performance.

## Important data note

The built-in crop costs, water requirements and expected profits are illustrative values for demonstrating algorithm behavior. They are not verified location-specific agricultural recommendations or live market forecasts.
