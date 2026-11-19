import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, CheckCircle2, ChevronDown, Clock3, Droplets, Leaf, LandPlot, Sprout, Wallet, X } from 'lucide-react';

const BG_IMAGE_1 =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85';
const BG_IMAGE_2 =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_201152_bba90a12-bf12-459f-91f0-51f237dbaf3b.png&w=1280&q=85';

const SPOTLIGHT_R = 260;
type Season = 'Kharif' | 'Rabi' | 'Zaid';
type AlgorithmId = 'brute' | 'divideconquer' | 'dp' | 'greedy';
type Inputs = { land: number; budget: number; water: number; season: Season };
type Crop = { name: string; seasons: Season[]; cost: number; water: number; profit: number; note: string };
type Plan = { crop: Crop; acres: number };
type Result = {
  id: AlgorithmId; title: string; plans: Plan[]; profit: number; cost: number; water: number;
  explored: number; elapsed: number; exact: boolean; status: 'completed' | 'heuristic' | 'rejected'; explanation: string[]; complexity: string; space: string;
};

const CROPS: Crop[] = [
  { name: 'Rice', seasons: ['Kharif', 'Rabi'], cost: 0.42, water: 12, profit: 0.62, note: 'High water demand' },
  { name: 'Maize', seasons: ['Kharif', 'Rabi'], cost: 0.28, water: 5, profit: 0.43, note: 'Moderate water demand' },
  { name: 'Groundnut', seasons: ['Kharif', 'Rabi'], cost: 0.35, water: 4, profit: 0.52, note: 'Oilseed crop' },
  { name: 'Millets', seasons: ['Kharif', 'Rabi'], cost: 0.22, water: 3, profit: 0.34, note: 'Lower water demand' },
  { name: 'Cotton', seasons: ['Kharif'], cost: 0.40, water: 7, profit: 0.59, note: 'Longer growing period' },
  { name: 'Green gram', seasons: ['Kharif', 'Rabi', 'Zaid'], cost: 0.19, water: 3.5, profit: 0.32, note: 'Short-duration pulse' },
  { name: 'Watermelon', seasons: ['Zaid'], cost: 0.31, water: 5.5, profit: 0.49, note: 'Warm-season crop' },
  { name: 'Sesame', seasons: ['Kharif', 'Zaid'], cost: 0.24, water: 3.2, profit: 0.38, note: 'Drought-tolerant oilseed' },
];

const money = (value: number) => `₹${value.toFixed(2)} lakh`;
const num = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);

function RevealLayer({ image, cursorX, cursorY }: { image: string; cursorX: number; cursorY: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1440, height: typeof window !== 'undefined' ? window.innerHeight : 900 });

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth, height = window.innerHeight;
      if (canvasRef.current) { canvasRef.current.width = width; canvasRef.current.height = height; }
      setSize({ width, height });
    };
    updateSize(); window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current, revealEl = revealRef.current;
    if (!canvas || !revealEl) return;
    if (canvas.width !== size.width || canvas.height !== size.height) { canvas.width = size.width; canvas.height = size.height; }
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, SPOTLIGHT_R);
    gradient.addColorStop(0, 'rgba(255,255,255,1)'); gradient.addColorStop(0.4, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.75)'); gradient.addColorStop(0.75, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(0.88, 'rgba(255,255,255,0.12)'); gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2); ctx.fill();
    const maskValue = `url("${canvas.toDataURL()}")`;
    revealEl.style.maskImage = maskValue; revealEl.style.webkitMaskImage = maskValue;
    revealEl.style.maskSize = '100% 100%'; revealEl.style.webkitMaskSize = '100% 100%';
    revealEl.style.maskRepeat = 'no-repeat'; revealEl.style.webkitMaskRepeat = 'no-repeat';
  }, [cursorX, cursorY, size]);

  return <>
    <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ display: 'none' }} />
    <div ref={revealRef} className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
      style={{ backgroundImage: `url("${image}")`, maskImage: 'linear-gradient(transparent, transparent)', WebkitMaskImage: 'linear-gradient(transparent, transparent)', maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }} />
  </>;
}

function totals(plans: Plan[]) {
  return plans.reduce((acc, item) => ({
    land: acc.land + item.acres,
    cost: acc.cost + item.crop.cost * item.acres,
    water: acc.water + item.crop.water * item.acres,
    profit: acc.profit + item.crop.profit * item.acres,
  }), { land: 0, cost: 0, water: 0, profit: 0 });
}

function makeResult(id: AlgorithmId, title: string, plans: Plan[], explored: number, started: number, exact: boolean, status: 'completed' | 'heuristic' | 'rejected', explanation: string[], complexity: string, space: string): Result {
  const t = totals(plans);
  return { id, title, plans: plans.filter(p => p.acres > 0), profit: t.profit, cost: t.cost, water: t.water, explored, elapsed: performance.now() - started, exact, status, explanation, complexity, space };
}

function bruteForce(crops: Crop[], input: Inputs): Result {
  const started = performance.now();
  let explored = 0;

  type SelectionUnit = { cropIndex: number; cost: number; water: number; profit: number };

  const units: SelectionUnit[] = [];
  const maxAcresPerCrop: number[] = [];
  for (let i = 0; i < crops.length; i++) {
    const crop = crops[i];
    const maxAcres = Math.max(0, Math.min(
      input.land,
      Math.floor((input.budget + 1e-9) / crop.cost),
      Math.floor((input.water + 1e-9) / crop.water)
    ));
    maxAcresPerCrop[i] = maxAcres;
    for (let a = 0; a < maxAcres; a++) {
      units.push({ cropIndex: i, cost: crop.cost, water: crop.water, profit: crop.profit });
    }
  }

  const totalCombinations = units.length >= 63 ? Infinity : Math.pow(2, units.length);
  const BINARY_LIMIT = Math.pow(2, 20);
  const RECURSIVE_STATE_LIMIT = 500000;

  let estimatedRecursiveStates = 1;
  for (const maxAcres of maxAcresPerCrop) {
    estimatedRecursiveStates *= (maxAcres + 1);
    if (estimatedRecursiveStates > RECURSIVE_STATE_LIMIT) break;
  }

  if (crops.length === 0 || units.length === 0) {
    const elapsed = performance.now() - started;
    return makeResult('brute', 'Brute Force', [], 0, started, true, 'completed',
      ['No eligible crops or no feasible acre-units.'],
      'O(1)', 'O(1)');
  }

  if (totalCombinations <= BINARY_LIMIT) {
    let bestProfit = 0;
    let bestAllocation: number[] = [];

    for (let mask = 0; mask < totalCombinations; mask++) {
      explored++;
      let tempLand = 0;
      let tempCost = 0;
      let tempWater = 0;
      let tempProfit = 0;
      const tempAllocation = Array(crops.length).fill(0);

      for (let i = 0; i < units.length; i++) {
        if ((mask >> i) & 1) {
          const unit = units[i];
          tempLand += 1;
          tempCost += unit.cost;
          tempWater += unit.water;
          tempProfit += unit.profit;
          tempAllocation[unit.cropIndex] += 1;
        }
      }

      if (tempLand <= input.land && tempCost <= input.budget + 1e-9 && tempWater <= input.water + 1e-9) {
        if (tempProfit > bestProfit) {
          bestProfit = tempProfit;
          bestAllocation = tempAllocation;
        }
      }
    }

    const plans = bestAllocation.map((acres, i) => ({ crop: crops[i], acres })).filter(p => p.acres > 0);

    return makeResult('brute', 'Brute Force', plans, explored, started, true, 'completed',
      [
        'Generate all possible binary combinations (2^n possibilities) where n = total potential acres across crops.',
        'For each combination, compute total land, budget, water, and profit from selected acre-units.',
        'Check whether the combination satisfies all three capacity constraints.',
        'If feasible and profit exceeds current maximum, update maxValue and bestCombination.',
        `Executed ${totalCombinations.toLocaleString()} combinations (${units.length} binary units).`
      ],
      `O(2^{${units.length}}) = O(2^{ΣmaxAcres})`, `O(${crops.length})`);
  }

  if (estimatedRecursiveStates > RECURSIVE_STATE_LIMIT) {
    const elapsed = performance.now() - started;
    return makeResult('brute', 'Brute Force', [], 0, started, false, 'rejected',
      [
        `Search space too large for exhaustive Brute Force.`,
        `Binary combinations: ${totalCombinations === Infinity ? 'infinite' : totalCombinations.toLocaleString()} (${units.length} units).`,
        `Estimated recursive allocation vectors: more than ${RECURSIVE_STATE_LIMIT.toLocaleString()} (exceeds limit).`,
        `Brute Force cannot guarantee an exact result within practical time limits.`,
        `Reduce land, budget, or water limits, or use Dynamic Programming or Divide and Conquer for an exact solution.`
      ],
      `O(2^{ΣmaxAcres}) binary / O(Π(maxAcres_i + 1)) recursive`, `O(${crops.length})`);
  }

  let best: Plan[] = [];
  let bestProfit = 0;
  const allocation = Array(crops.length).fill(0);

  const visit = (index: number, land: number, budget: number, water: number, profit: number) => {
    if (index === crops.length) {
      explored++;
      if (profit > bestProfit) {
        bestProfit = profit;
        best = allocation.map((acres, i) => ({ crop: crops[i], acres }));
      }
      return;
    }
    const crop = crops[index];
    const max = Math.max(0, Math.min(
      input.land - land,
      Math.floor((input.budget - budget + 1e-9) / crop.cost),
      Math.floor((input.water - water + 1e-9) / crop.water)
    ));
    for (let qty = 0; qty <= max; qty++) {
      allocation[index] = qty;
      visit(index + 1, land + qty, budget + qty * crop.cost, water + qty * crop.water, profit + qty * crop.profit);
    }
    allocation[index] = 0;
  };

  visit(0, 0, 0, 0, 0);

  return makeResult('brute', 'Brute Force', best, explored, started, true, 'completed',
    [
      'Generate every feasible whole-acre allocation across the eligible crops.',
      'Check land, budget and water limits for each combination.',
      'Keep the combination with the highest total expected profit.',
      `Binary 0/1 representation would require ${totalCombinations === Infinity ? 'infinite' : totalCombinations.toLocaleString()} combinations (${units.length} units).`,
      `Recursive enumeration of acre counts used instead (mathematically equivalent for this bounded knapsack variant).`
    ],
    'O(Π(maxAcres_i + 1)) ⊆ O((L + 1)^C)', 'O(C) recursion');
}

function greedy(crops: Crop[], input: Inputs): Result {
  const started = performance.now(); let land = 0, budget = 0, water = 0, explored = 0;
  const plans: Plan[] = [];
  const ranked = [...crops].sort((a, b) => (b.profit / (b.cost + b.water * 0.01)) - (a.profit / (a.cost + a.water * 0.01)));
  for (const crop of ranked) {
    explored++;
    const qty = Math.max(0, Math.min(input.land - land, Math.floor((input.budget - budget + 1e-9) / crop.cost), Math.floor((input.water - water + 1e-9) / crop.water)));
    if (qty > 0) {
      plans.push({ crop, acres: qty }); land += qty; budget += qty * crop.cost; water += qty * crop.water;
    }
  }
  return makeResult('greedy', 'Greedy', plans, explored, started, false, 'heuristic',
    ['Rank eligible crops by a profit-to-resource score.', 'Allocate as many acres as possible to the highest-ranked crop.', 'Move to the next crop until no land or resources remain.', 'This is a fast heuristic; a locally attractive choice can block a better overall combination.'],
    'O(C log C + C)', 'O(C)');
}

function dynamicProgramming(crops: Crop[], input: Inputs): Result {
  const started = performance.now(); let explored = 0;
  const MAX_DP_STATES = 300000;
  const BUDGET_SCALE = 100;
  const WATER_SCALE = 10;
  const PROFIT_SCALE = 100;

  if (crops.length === 0) {
    const elapsed = performance.now() - started;
    return makeResult('dp', 'Dynamic Programming', [], 0, started, true, 'completed',
      ['No eligible crops for the selected season.'],
      'O(1)', 'O(1)');
  }

  const scaledCrops = crops.map(c => ({
    name: c.name,
    costInt: Math.round(c.cost * BUDGET_SCALE),
    waterInt: Math.round(c.water * WATER_SCALE),
    profitInt: Math.round(c.profit * PROFIT_SCALE),
  }));

  const budgetLimit = Math.round(input.budget * BUDGET_SCALE);
  const waterLimit = Math.round(input.water * WATER_SCALE);
  const landLimit = input.land;

  type State = { land: number; budget: number; water: number; profit: number; counts: number[] };
  let states = new Map<string, State>();
  states.set('0|0|0', { land: 0, budget: 0, water: 0, profit: 0, counts: Array(crops.length).fill(0) });

  for (let i = 0; i < crops.length; i++) {
    const crop = scaledCrops[i];
    const next = new Map<string, State>();

    for (const state of states.values()) {
      const maxQty = Math.max(0, Math.min(
        landLimit - state.land,
        Math.floor((budgetLimit - state.budget) / crop.costInt),
        Math.floor((waterLimit - state.water) / crop.waterInt)
      ));

      for (let qty = 0; qty <= maxQty; qty++) {
        explored++;
        const newLand = state.land + qty;
        const newBudget = state.budget + qty * crop.costInt;
        const newWater = state.water + qty * crop.waterInt;
        const key = `${newLand}|${newBudget}|${newWater}`;
        const newProfit = state.profit + qty * crop.profitInt;

        const existing = next.get(key);
        if (!existing) {
          if (next.size >= MAX_DP_STATES) {
            const elapsed = performance.now() - started;
            return makeResult('dp', 'Dynamic Programming', [], explored, started, false, 'rejected',
              [
                `DP state limit exceeded (${MAX_DP_STATES.toLocaleString()} states).`,
                `The resource combination space grew too large for exact bottom-up tabulation.`,
                `Layer ${i + 1} (${crop.name}) reached the limit while generating state ${key}.`,
                `Reduce land, budget, or water limits, or use Divide and Conquer for an exact solution.`
              ],
              `O(C × min(S, ${MAX_DP_STATES}))`, `O(min(S, ${MAX_DP_STATES}) × C)`);
          }
          const counts = [...state.counts];
          counts[i] = qty;
          next.set(key, { land: newLand, budget: newBudget, water: newWater, profit: newProfit, counts });
        } else if (newProfit > existing.profit) {
          const counts = [...state.counts];
          counts[i] = qty;
          next.set(key, { land: newLand, budget: newBudget, water: newWater, profit: newProfit, counts });
        }
      }
    }

    states = next;
  }

  let best: State | undefined;
  for (const state of states.values()) if (!best || state.profit > best.profit) best = state;

  const plans = (best?.counts ?? []).map((acres, i) => ({ crop: crops[i], acres })).filter(p => p.acres > 0);

  return makeResult('dp', 'Dynamic Programming', plans, explored, started, true, 'completed',
    ['Build solutions crop by crop, keeping the best profit for each distinct resource-use state.',
     'Resources are tracked in integer units: acres, budget×100, water×10 — no floating-point accumulation.',
     'Reuse the stored best state instead of recomputing the same resource combination.',
     'Choose the feasible final state with the highest profit.'],
    `O(C × S × L) capped at ${MAX_DP_STATES} states`, `O(S × C) capped at ${MAX_DP_STATES} states`);
}

function divideAndConquer(crops: Crop[], input: Inputs): Result {
  const started = performance.now();
  let explored = 0;

  type Allocation = { land: number; cost: number; water: number; profit: number; counts: number[] };

  const generateAllocations = (cropList: Crop[], baseIndex: number): Allocation[] => {
    const results: Allocation[] = [];
    const allocation = Array(cropList.length).fill(0);

    const visit = (index: number, land: number, cost: number, water: number, profit: number) => {
      if (index === cropList.length) {
        explored++;
        results.push({ land, cost, water, profit, counts: [...allocation] });
        return;
      }
      const crop = cropList[index];
      const max = Math.max(0, Math.min(input.land - land, Math.floor((input.budget - cost + 1e-9) / crop.cost), Math.floor((input.water - water + 1e-9) / crop.water)));
      for (let qty = 0; qty <= max; qty++) {
        allocation[index] = qty;
        visit(index + 1, land + qty, cost + qty * crop.cost, water + qty * crop.water, profit + qty * crop.profit);
      }
      allocation[index] = 0;
    };
    visit(0, 0, 0, 0, 0);
    return results;
  };

  const mid = Math.floor(crops.length / 2);
  const leftCrops = crops.slice(0, mid);
  const rightCrops = crops.slice(mid);

  const leftAllocations = generateAllocations(leftCrops, 0);
  const rightAllocations = generateAllocations(rightCrops, mid);

  rightAllocations.sort((a, b) => a.cost - b.cost || a.water - b.water || a.land - b.land);

  const rightBest = new Map<string, Allocation>();
  for (const alloc of rightAllocations) {
    const key = `${alloc.land}|${Math.round(alloc.cost * 100)}|${Math.round(alloc.water * 10)}`;
    const existing = rightBest.get(key);
    if (!existing || alloc.profit > existing.profit) {
      rightBest.set(key, alloc);
    }
  }
  const rightUnique = Array.from(rightBest.values());

  let bestProfit = 0;
  let bestLeft: Allocation | null = null;
  let bestRight: Allocation | null = null;

  for (const left of leftAllocations) {
    const remLand = input.land - left.land;
    const remCost = input.budget - left.cost;
    const remWater = input.water - left.water;
    if (remLand < 0 || remCost < 0 || remWater < 0) continue;

    for (const right of rightUnique) {
      if (right.land > remLand || right.cost > remCost + 1e-9 || right.water > remWater + 1e-9) continue;
      const totalProfit = left.profit + right.profit;
      if (totalProfit > bestProfit) {
        bestProfit = totalProfit;
        bestLeft = left;
        bestRight = right;
      }
    }
  }

  const finalCounts = [...(bestLeft?.counts ?? Array(leftCrops.length).fill(0)), ...(bestRight?.counts ?? Array(rightCrops.length).fill(0))];
  const plans = finalCounts.map((acres, i) => ({ crop: crops[i], acres })).filter(p => p.acres > 0);

  return makeResult('divideconquer', 'Divide and Conquer', plans, explored, started, true, 'completed',
    ['Split the crop list into two halves.', 'Generate all feasible allocations for each half independently (conquer).', 'For the right half, keep only the best profit for each distinct resource-use state.', 'Combine by pairing each left allocation with the best compatible right allocation that fits the remaining land, budget and water.', 'Select the combined allocation with the highest total profit.'],
    'O(2^(C/2) × S)', 'O(2^(C/2) × S)');
}

function runAlgorithms(input: Inputs): Result[] {
  const eligible = CROPS.filter(c => c.seasons.includes(input.season));
  return [
    bruteForce(eligible, input),
    divideAndConquer(eligible, input),
    dynamicProgramming(eligible, input),
    greedy(eligible, input),
  ];
}

const ALGORITHM_INFO: { id: AlgorithmId; number: string; description: string; icon: string }[] = [
  { id: 'brute', number: '01', description: 'Checks every feasible crop allocation to find the maximum profit.', icon: '⌕' },
  { id: 'divideconquer', number: '02', description: 'Splits crops into halves, solves each independently, then combines optimal subsolutions.', icon: '⊞' },
  { id: 'dp', number: '03', description: 'Stores best results for repeated land, budget and water states.', icon: '▦' },
  { id: 'greedy', number: '04', description: 'Makes the best immediate resource-efficiency choice at each step.', icon: '↗' },
];

export default function App() {
  const mouse = useRef({ x: -999, y: -999 });
  const smooth = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });
  const [inputs, setInputs] = useState<Inputs>({ land: 5, budget: 2, water: 25, season: 'Kharif' });
  const [inputStrings, setInputStrings] = useState<{ land: string; budget: string; water: string }>({
    land: '5',
    budget: '2',
    water: '25',
  });
  const [results, setResults] = useState<Result[] | null>(null);
  const [selected, setSelected] = useState<AlgorithmId>('divideconquer');
  const [error, setError] = useState('');

  const updateInput = (key: keyof Inputs, value: string) => {
    if (key === 'season') {
      setInputs(prev => ({ ...prev, season: value as Season }));
    } else {
      setInputStrings(prev => ({ ...prev, [key]: value }));
    }
    setError('');
  };

  const handleBlur = (key: 'land' | 'budget' | 'water') => {
    const str = inputStrings[key].trim();
    const num = str === '' ? 0 : Number(str);
    if (Number.isFinite(num)) {
      setInputs(prev => ({ ...prev, [key]: num }));
      setInputStrings(prev => ({ ...prev, [key]: String(num) }));
    }
  };

  const validateAndSyncInputs = () => {
    let hasError = false;
    const newInputs = { ...inputs };
    const newStrings = { ...inputStrings };

    if (inputStrings.land.trim() === '' || !Number.isInteger(Number(inputStrings.land)) || Number(inputStrings.land) < 1 || Number(inputStrings.land) > 100) {
      setError('Value must be less than or equal to 100.');
      hasError = true;
    } else {
      newInputs.land = Number(inputStrings.land);
      newStrings.land = inputStrings.land;
    }

    if (inputStrings.budget.trim() === '' || Number(inputStrings.budget) <= 0 || Number(inputStrings.budget) > 500) {
      setError('Value must be less than or equal to 500 lakh.');
      hasError = true;
    } else {
      newInputs.budget = Number(inputStrings.budget);
      newStrings.budget = inputStrings.budget;
    }

    if (inputStrings.water.trim() === '' || Number(inputStrings.water) <= 0 || Number(inputStrings.water) > 1000) {
      setError('Value must be less than or equal to 1000.');
      hasError = true;
    } else {
      newInputs.water = Number(inputStrings.water);
      newStrings.water = inputStrings.water;
    }

    if (hasError) return null;

    setInputs(newInputs);
    setInputStrings(newStrings);
    return newInputs;
  };

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    const syncedInputs = validateAndSyncInputs();
    if (!syncedInputs) return;
    const output = runAlgorithms(syncedInputs);
    setResults(output); setSelected('divideconquer');
    window.setTimeout(() => document.getElementById('algorithm-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const selectedResult = results?.find(r => r.id === selected);
  const exactResults = results?.filter(r => r.exact) ?? [];
  const bestExact = exactResults.reduce<Result | null>((best, current) => !best || current.profit > best.profit ? current : best, null);

  const allExactOptimal = exactResults.length >= 2 && exactResults.every(r => Math.abs(r.profit - bestExact!.profit) < 1e-9);
  let recommendation = 'Divide and Conquer';
  let recommendationReason = 'It splits the problem into independent halves, solves each exactly, and combines results — delivering the optimal profit with far fewer explored states than brute force.';

  if (allExactOptimal && exactResults.length === 3) {
    const brute = exactResults.find(r => r.id === 'brute')!;
    const dc = exactResults.find(r => r.id === 'divideconquer')!;
    const dp = exactResults.find(r => r.id === 'dp')!;
    const fastest = [brute, dc, dp].reduce((best, current) => current.elapsed < best.elapsed ? current : best);
    const fewestStates = [brute, dc, dp].reduce((best, current) => current.explored < best.explored ? current : best);
    if (fastest.id === fewestStates.id) {
      recommendation = ALGORITHM_INFO.find(a => a.id === fastest.id)!.number === '02' ? 'Divide and Conquer' : (fastest.id === 'dp' ? 'Dynamic Programming' : 'Brute Force');
      recommendationReason = `All exact methods found the same optimal profit. ${recommendation} explored the fewest states (${fewestStates.explored.toLocaleString('en-IN')}) and ran fastest (${fastest.elapsed.toFixed(3)} ms).`;
    } else {
      recommendation = 'Divide and Conquer';
      recommendationReason = `All exact methods found the same optimal profit. Divide and Conquer offers the best trade-off: it explores exponentially fewer states than brute force (${dc.explored.toLocaleString('en-IN')} vs ${brute.explored.toLocaleString('en-IN')}) while remaining exact.`;
    }
  } else if (!allExactOptimal && exactResults.length > 0) {
    recommendation = bestExact!.id === 'dp' ? 'Dynamic Programming' : (bestExact!.id === 'divideconquer' ? 'Divide and Conquer' : 'Brute Force');
    recommendationReason = 'It achieved the highest profit among exact methods for this input.';
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white tracking-[-0.02em]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <section id="top" className="relative w-full overflow-hidden h-screen bg-black" style={{ height: '100dvh' }}>
        <div className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom" style={{ backgroundImage: `url("${BG_IMAGE_1}")` }} />
        <RevealLayer image={BG_IMAGE_2} cursorX={cursorPos.x} cursorY={cursorPos.y} />
        <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
          <h1 className="text-white leading-[0.95]">
            <span className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal" style={{ letterSpacing: '-0.05em', animationDelay: '0.25s' }}>Choose wisely</span>
            <span className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal" style={{ letterSpacing: '-0.08em', animationDelay: '0.42s' }}>grow abundantly</span>
          </h1>
        </div>
<div className="absolute bottom-10 sm:bottom-24 left-1/2 -translate-x-1/2 w-[min(300px,calc(100%-2.5rem))] flex flex-col items-center text-center gap-4 z-50 hero-anim hero-fade" style={{ animationDelay: '0.85s' }}>
            <button type="button" onClick={() => document.getElementById('farm-inputs')?.scrollIntoView({ behavior: 'smooth' })} className="bg-[#D35A25] hover:bg-[#B94718] text-white text-sm font-medium px-8 py-3.5 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#D35A25]/30 cursor-pointer">
            Start Growing <ArrowDown className="inline w-4 h-4 ml-1" />
          </button>
        </div>
      </section>

      <section id="farm-inputs" className="relative px-5 py-20 sm:py-28 bg-[#0b0b0b]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-[#D35A25] uppercase tracking-[0.24em] text-xs font-semibold mb-4">01 / Farm details</p>
            <h2 className="font-playfair italic text-4xl sm:text-6xl font-normal mb-4">Every acre has potential.</h2>
            <p className="text-white/60 text-sm sm:text-base leading-relaxed">Share your available resources and growing season. AGROVA will compare crop combinations against your farm's limits.</p>
          </div>

          <form onSubmit={calculate} className="rounded-[2rem] border border-white/10 bg-[#151515] p-5 sm:p-9 md:p-12 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-[#D35A25]/15 flex items-center justify-center"><Sprout className="text-[#D35A25] w-5 h-5" /></div>
              <div><h3 className="text-xl sm:text-2xl font-semibold">Tell us about your farm</h3><p className="text-white/45 text-xs sm:text-sm mt-1">All four fields are required to calculate a result.</p></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
              <label className="input-field">
                <span><LandPlot className="w-4 h-4 text-[#D35A25]" /> Available land</span>
                <div className="input-wrap"><input type="number" min="1" max="100" step="1" value={inputStrings.land} onChange={e => updateInput('land', e.target.value)} onBlur={() => handleBlur('land')} required /><b>acres</b></div>
                <small>Whole acres, between 1 and 100.</small>
              </label>
              <label className="input-field">
                <span><Wallet className="w-4 h-4 text-[#D35A25]" /> Total budget</span>
                <div className="input-wrap"><input type="number" min="0.01" max="500" step="0.01" value={inputStrings.budget} onChange={e => updateInput('budget', e.target.value)} onBlur={() => handleBlur('budget')} required /><b>₹ lakh</b></div>
                <small>Available spending budget in lakh rupees.</small>
              </label>
              <label className="input-field">
                <span><Droplets className="w-4 h-4 text-[#D35A25]" /> Available water</span>
                <div className="input-wrap"><input type="number" min="0.1" max="1000" step="0.1" value={inputStrings.water} onChange={e => updateInput('water', e.target.value)} onBlur={() => handleBlur('water')} required /><b>lakh litres</b></div>
                <small>Total water available for the growing period.</small>
              </label>
              <label className="input-field">
                <span><Leaf className="w-4 h-4 text-[#D35A25]" /> Growing season</span>
                <div className="input-wrap select-wrap"><select value={inputs.season} onChange={e => updateInput('season', e.target.value)}><option value="Kharif">Kharif (Monsoon)</option><option value="Rabi">Rabi (Winter)</option><option value="Zaid">Zaid (Summer)</option></select><ChevronDown className="w-4 h-4 text-white/50 pointer-events-none" /></div>
                <small>Only crops suitable for this season are considered.</small>
              </label>
            </div>
            {error && <p className="mt-6 text-sm text-red-300" role="alert">{error}</p>}
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-between gap-5 border-t border-white/10 pt-7">
              <p className="text-xs text-white/40 max-w-md leading-relaxed">Demo model: crop costs, water needs and expected profits are illustrative values, not live market or agronomy data.</p>
              <button type="submit" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#D35A25] hover:bg-[#B94718] text-white font-semibold px-8 py-4 rounded-full transition-all hover:shadow-lg hover:shadow-[#D35A25]/20">Calculate crop plan <ArrowRight className="w-4 h-4" /></button>
            </div>
          </form>
        </div>
      </section>

      <section id="algorithm-results" className="px-5 py-20 sm:py-28 bg-[#101010] scroll-mt-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-[#D35A25] uppercase tracking-[0.24em] text-xs font-semibold mb-4">02 / Compare approaches</p>
            <h2 className="font-playfair italic text-4xl sm:text-6xl font-normal mb-4">Four ways to find the best fit.</h2>
            <p className="text-white/60 text-sm sm:text-base leading-relaxed">Each algorithm solves the same crop-selection problem using a different strategy. Select a card to inspect its result and reasoning.</p>
          </div>
          {!results ? (
            <div className="rounded-[2rem] border border-dashed border-white/20 bg-white/[0.03] py-16 px-6 text-center">
              <Sprout className="w-9 h-9 text-[#D35A25] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your crop plan will appear here</h3>
              <p className="text-sm text-white/50">Enter your farm details above and select Calculate crop plan to compare all four algorithms.</p>
              <button onClick={() => document.getElementById('farm-inputs')?.scrollIntoView({ behavior: 'smooth' })} className="mt-6 text-[#F08A4B] text-sm font-semibold hover:text-white">Go to farm details <ArrowRight className="inline w-4 h-4 ml-1" /></button>
            </div>
          ) : <>
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              {ALGORITHM_INFO.map(info => {
                const result = results.find(r => r.id === info.id)!;
                const active = selected === info.id;
                const isRejected = result.status === 'rejected';
                return <button key={info.id} onClick={() => setSelected(info.id)} className={`text-left rounded-2xl sm:rounded-3xl border p-4 sm:p-6 transition-all duration-200 ${active ? 'border-[#D35A25] bg-[#D35A25]/10 shadow-lg shadow-[#D35A25]/10' : 'border-white/10 bg-[#181818] hover:border-white/30 hover:bg-[#202020]'}`}>
                  <div className="flex items-start justify-between mb-5"><span className="text-[#D35A25] font-playfair italic text-2xl sm:text-3xl">{info.number}</span><span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${active ? 'bg-[#D35A25] text-white' : 'bg-white/10 text-white/60'}`}>{active ? <CheckCircle2 className="w-4 h-4" /> : info.icon}</span></div>
                  <h3 className="font-semibold text-base sm:text-xl mb-2">{result.title}</h3>
                  <p className="text-xs sm:text-sm text-white/50 leading-relaxed min-h-[42px]">{info.description}</p>
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[10px] sm:text-xs text-white/40 mb-1">{isRejected ? 'Status' : 'Expected profit'}</p>
                      {isRejected ? <p className="text-lg sm:text-2xl font-semibold text-amber-300">Search limit exceeded</p> : <p className="text-lg sm:text-2xl font-semibold text-white">{money(result.profit)}</p>}
                    </div>
                    <span className="text-[10px] sm:text-xs text-[#D35A25]">{active ? 'Selected' : 'View output →'}</span>
                  </div>
                </button>;
              })}
            </div>

            {selectedResult && <div className="mt-7 sm:mt-9 rounded-[2rem] border border-white/10 bg-[#181818] overflow-hidden">
              <div className="p-5 sm:p-8 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><p className="text-[#D35A25] text-xs uppercase tracking-[0.2em] font-semibold mb-2">Selected algorithm / {ALGORITHM_INFO.find(a => a.id === selected)?.number}</p><h3 className="font-playfair italic text-3xl sm:text-4xl">{selectedResult.title}</h3></div>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs w-fit ${
                  selectedResult.status === 'rejected' ? 'bg-amber-500/10 text-amber-300' :
                  selectedResult.exact ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
                }`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{
                  selectedResult.status === 'rejected' ? 'Search limit exceeded' :
                  selectedResult.exact ? 'Exact optimization' : 'Heuristic result'
                }</span>
              </div>
              {selectedResult.status === 'rejected' ? (
                <div className="p-5 sm:p-8">
                  <div className="space-y-3">
                    {selectedResult.explanation.map((line, i) => <p key={i} className="text-sm text-white/70 leading-relaxed">{line}</p>)}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-3 gap-px bg-white/10">
                    <div className="bg-[#181818] p-5 sm:p-6"><p className="text-xs text-white/45 mb-2">Expected profit</p><p className="text-2xl sm:text-3xl font-semibold">{money(selectedResult.profit)}</p></div>
                    <div className="bg-[#181818] p-5 sm:p-6"><p className="text-xs text-white/45 mb-2">Budget used</p><p className="text-2xl sm:text-3xl font-semibold">{money(selectedResult.cost)}</p></div>
                    <div className="bg-[#181818] p-5 sm:p-6"><p className="text-xs text-white/45 mb-2">Water used</p><p className="text-2xl sm:text-3xl font-semibold">{num(selectedResult.water)} <span className="text-sm font-normal text-white/50">lakh L</span></p></div>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-0">
                    <div className="p-5 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/10">
                      <h4 className="font-semibold text-lg mb-4">Crop allocation</h4>
                      {selectedResult.plans.length ? <div className="space-y-3">{selectedResult.plans.map(p => <div key={p.crop.name} className="flex items-center justify-between gap-4 bg-white/[0.04] rounded-xl px-4 py-3"><div><p className="font-medium">{p.crop.name}</p><p className="text-xs text-white/40 mt-1">{money(p.crop.cost)} cost / acre · {num(p.crop.water)} lakh L / acre</p></div><span className="text-[#D35A25] font-semibold whitespace-nowrap">{p.acres} {p.acres === 1 ? 'acre' : 'acres'}</span></div>)}</div> : <p className="text-sm text-white/50 bg-white/[0.04] rounded-xl p-4">No crop fits all the entered resource constraints. Increase the budget or water availability and calculate again.</p>}
                      <div className="mt-5 text-xs text-white/45 flex justify-between border-t border-white/10 pt-4"><span>Land allocated</span><b className="text-white">{num(totals(selectedResult.plans).land)} / {inputs.land} acres</b></div>
                    </div>
                    <div className="p-5 sm:p-8">
                      <h4 className="font-semibold text-lg mb-4">How it works</h4>
                      <ol className="space-y-3">{selectedResult.explanation.map((line, i) => <li key={i} className="flex gap-3 text-sm text-white/65 leading-relaxed"><span className="text-[#D35A25] font-semibold tabular-nums">{String(i + 1).padStart(2, '0')}</span><span>{line}</span></li>)}</ol>
                      <div className="grid grid-cols-2 gap-3 mt-7">
                        <div className="rounded-xl bg-white/[0.04] p-4"><p className="text-[11px] text-white/40 mb-2">Time complexity</p><p className="text-sm font-semibold">{selectedResult.complexity}</p></div>
                        <div className="rounded-xl bg-white/[0.04] p-4"><p className="text-[11px] text-white/40 mb-2">Space complexity</p><p className="text-sm font-semibold">{selectedResult.space}</p></div>
                      </div>
                      <div className="mt-3 rounded-xl bg-white/[0.04] p-4 flex items-center justify-between gap-3"><span className="text-xs text-white/45 flex items-center gap-2"><Clock3 className="w-4 h-4" /> Execution time</span><b className="text-sm">{selectedResult.elapsed.toFixed(3)} ms</b></div>
                      <p className="mt-3 text-xs text-white/40">States / combinations explored: <b className="text-white/70">{selectedResult.explored.toLocaleString('en-IN')}</b></p>
                    </div>
                  </div>
                </>
              )}
            </div>}

            <div className="mt-8 text-center">
              <button onClick={() => document.getElementById('farm-inputs')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-white/50 hover:text-white underline underline-offset-4">Change farm inputs and recalculate</button>
            </div>
          </>}
        </div>
      </section>

      {results && <section id="recommendation" className="px-5 py-20 sm:py-28 bg-[#080808]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10"><p className="text-[#D35A25] uppercase tracking-[0.24em] text-xs font-semibold mb-4">03 / Final recommendation</p><h2 className="font-playfair italic text-4xl sm:text-6xl font-normal">The smartest way forward.</h2></div>
          <div className="rounded-[2rem] border border-[#D35A25]/40 bg-gradient-to-br from-[#D35A25]/10 via-[#17120f] to-[#141414] p-6 sm:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl"><div className="inline-flex items-center gap-2 text-[#D35A25] text-xs uppercase tracking-[0.18em] font-semibold mb-4"><CheckCircle2 className="w-4 h-4" /> Recommended approach</div><h3 className="font-playfair italic text-3xl sm:text-5xl mb-4">{recommendation}</h3><p className="text-sm sm:text-base text-white/65 leading-relaxed">{recommendationReason}</p></div>
              <div className="rounded-2xl bg-black/30 border border-white/10 p-5 min-w-[190px]"><p className="text-xs text-white/45 mb-2">Best exact profit</p><p className="text-2xl sm:text-3xl font-semibold">{money(bestExact?.profit ?? 0)}</p><p className="text-xs text-white/45 mt-2">Same optimal target across exact methods</p></div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 grid sm:grid-cols-3 gap-5 text-sm">
              <div><p className="text-white/40 text-xs mb-1">Why it fits</p><p className="text-white/80">Finds the optimal feasible combination under multiple resource constraints.</p></div>
              <div><p className="text-white/40 text-xs mb-1">Compared with Greedy</p><p className="text-white/80">Does not sacrifice global profit for a locally attractive crop.</p></div>
              <div><p className="text-white/40 text-xs mb-1">Compared with exhaustive search</p><p className="text-white/80">Reuses resource states rather than repeatedly solving equivalent subproblems.</p></div>
            </div>
          </div>
          <p className="text-center text-[11px] text-white/30 mt-8 leading-relaxed">AGROVA — CROP SELECTION OPTIMIZER<br />Illustrative academic prototype. Actual crop suitability, costs, water needs and returns vary by location, soil, variety and market conditions.</p>
        </div>
      </section>}
    </main>
  );
}
