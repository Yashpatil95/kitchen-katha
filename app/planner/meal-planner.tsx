"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- vinext's Next Link shim currently loads a second React renderer. */

import { useMemo, useState } from "react";
import type { Recipe } from "../../db/recipes";
import { buildMealPlan } from "../meal-plan.mjs";

type Goal = "balanced" | "weight-loss" | "weight-gain";

const goals: Record<Goal, { title: string; description: string; signal: string }> = {
  balanced: {
    title: "Balanced eating",
    description: "Rotate varied meals and favour fibre, protein and recipes you already trust.",
    signal: "Protein + fibre + variety",
  },
  "weight-loss": {
    title: "Weight loss",
    description: "Prioritise filling protein and fibre while gently preferring lower-energy meals.",
    signal: "Protein + fibre, with an energy check",
  },
  "weight-gain": {
    title: "Weight gain",
    description: "Prioritise energy-dense meals with protein, without treating the biggest surplus as best.",
    signal: "Energy + protein + gradual progress",
  },
};

const evidence = [
  {
    title: "Ultra-processed diets drive higher intake",
    citation: "Hall et al., Cell Metabolism (2019)",
    finding: "In a controlled inpatient crossover trial, people ate about 500 kcal/day more and gained weight on an ultra-processed diet than on a matched unprocessed diet.",
    href: "https://pubmed.ncbi.nlm.nih.gov/31105044/",
  },
  {
    title: "Healthy low-fat and low-carb patterns can both work",
    citation: "Gardner et al., JAMA (2018), DIETFITS",
    finding: "Among 609 adults, healthy low-fat and healthy low-carbohydrate approaches produced no significant difference in 12-month weight loss; food quality and adherence mattered.",
    href: "https://pubmed.ncbi.nlm.nih.gov/29466592/",
  },
  {
    title: "Higher fibre and whole-grain intake supports long-term health",
    citation: "Reynolds et al., The Lancet (2019)",
    finding: "A large systematic review and meta-analysis found lower non-communicable disease risk with higher fibre and whole-grain intake, with dose-response evidence.",
    href: "https://pubmed.ncbi.nlm.nih.gov/30638909/",
  },
  {
    title: "Mediterranean-style eating reduced cardiovascular events",
    citation: "Estruch et al., New England Journal of Medicine (2018)",
    finding: "In PREDIMED's revised analysis of high-risk adults, Mediterranean diets supplemented with olive oil or nuts reduced major cardiovascular events versus a reduced-fat control.",
    href: "https://www.nejm.org/doi/full/10.1056/NEJMoa1800389",
  },
  {
    title: "Protein supports resistance-training gains",
    citation: "Morton et al., British Journal of Sports Medicine (2018)",
    finding: "A systematic review and meta-analysis found protein supplementation improved strength and lean-mass gains during prolonged resistance training in healthy adults.",
    href: "https://pubmed.ncbi.nlm.nih.gov/28698222/",
  },
  {
    title: "Bigger energy surpluses mostly increased fat gain",
    citation: "Helms et al., Sports Medicine - Open (2023)",
    finding: "In a small resistance-trained sample, faster body-mass gain mainly increased skinfold thickness without clear extra muscle or strength benefit.",
    href: "https://pubmed.ncbi.nlm.nih.gov/37914977/",
  },
  {
    title: "Body weight responds dynamically to energy imbalance",
    citation: "Hall et al., The Lancet (2011)",
    finding: "A validated mathematical model shows weight change slows and adapts over time, so simple fixed calorie-to-weight rules are misleading.",
    href: "https://pubmed.ncbi.nlm.nih.gov/21872751/",
  },
  {
    title: "Diet composition alone did not decide weight-loss success",
    citation: "Sacks et al., New England Journal of Medicine (2009)",
    finding: "In 811 adults, reduced-calorie diets varying in fat, protein and carbohydrate produced similar average weight loss; attendance and adherence predicted outcomes.",
    href: "https://pubmed.ncbi.nlm.nih.gov/19246357/",
  },
];

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function MealPlanner({ recipes }: { recipes: Recipe[] }) {
  const [goal, setGoal] = useState<Goal>("balanced");
  const [diet, setDiet] = useState("All");
  const [version, setVersion] = useState(0);
  const diets = ["All", ...new Set(recipes.map((recipe) => recipe.diet))];
  const eligible = useMemo(
    () => recipes.filter((recipe) => diet === "All" || recipe.diet === diet),
    [diet, recipes],
  );
  const plan = useMemo(() => buildMealPlan(eligible, goal, 7, version), [eligible, goal, version]);
  const nutritionCount = eligible.filter((recipe) => recipe.calories !== null && recipe.proteinGrams !== null && recipe.fibreGrams !== null).length;

  return <main>
    <header className="topbar">
      <a className="brand" href="/" aria-label="Kitchen Katha home"><span className="brand-mark">र</span><span>Kitchen Katha</span></a>
      <nav className="topbar-actions" aria-label="Primary navigation">
        <a className="nav-link" href="/">Home</a>
        <a className="nav-link" href="/recipes">Recipe drawer</a>
      </nav>
    </header>

    <section className="planner-hero">
      <div>
        <p className="eyebrow"><span /> A plan built from your drawer</p>
        <h1>Plan a week that fits your goal.</h1>
        <p>Choose a direction and Kitchen Katha will arrange your saved meals using the nutrition you record per serving. You stay in charge of portions and swaps.</p>
      </div>
      <aside className="planner-note"><strong>Planning, not prescribing</strong><p>This tool does not set personal calorie targets or replace a dietitian. It ranks your own recipes using transparent signals.</p></aside>
    </section>

    <section className="planner-workspace" aria-labelledby="planner-title">
      <div className="planner-controls">
        <div>
          <p className="eyebrow"><span /> Your direction</p>
          <h2 id="planner-title">Choose a planning goal</h2>
        </div>
        <label className="field planner-diet">Diet filter
          <select value={diet} onChange={(event) => setDiet(event.target.value)}>{diets.map((item) => <option key={item}>{item}</option>)}</select>
        </label>
      </div>

      <div className="goal-grid">
        {(Object.entries(goals) as [Goal, typeof goals[Goal]][]).map(([value, item]) => <button
          key={value}
          type="button"
          className={goal === value ? "goal-card active" : "goal-card"}
          aria-pressed={goal === value}
          onClick={() => { setGoal(value); setVersion(0); }}
        ><span>{item.signal}</span><strong>{item.title}</strong><p>{item.description}</p></button>)}
      </div>

      <div className="plan-summary">
        <div><strong>{goals[goal].title}</strong><span>{eligible.length} suitable drawer recipes · {nutritionCount} with complete nutrition</span></div>
        <button className="button button-outline" type="button" onClick={() => setVersion((value) => value + 1)}>Shuffle the week</button>
      </div>

      {eligible.length ? <div className="week-grid">
        {plan.map((day, index) => <article className="day-card" key={`${goal}-${version}-${day.day}`}>
          <header><span>Day {day.day}</span><h3>{weekdays[index]}</h3></header>
          <div>{day.meals.map(({ slot, recipe }) => <section className="planned-meal" key={slot}>
            <span>{slot}</span>
            {recipe ? <><a href={`/recipes#recipe-${recipe.id}`}>{recipe.title}</a><small>
              {recipe.calories !== null ? `${recipe.calories} kcal` : "Energy not added"}
              {recipe.proteinGrams !== null ? ` · ${recipe.proteinGrams}g protein` : ""}
              {recipe.fibreGrams !== null ? ` · ${recipe.fibreGrams}g fibre` : ""}
            </small></> : <><b>Open slot</b><small>Add a {slot.toLowerCase()} recipe to your drawer</small></>}
          </section>)}</div>
        </article>)}
      </div> : <div className="empty-state"><span aria-hidden="true">🥗</span><h3>No recipes fit this filter yet</h3><p>Add recipes or choose another diet, then return to build the week.</p><a className="button button-primary" href="/recipes">Go to recipe drawer</a></div>}

      <div className="planner-method">
        <h3>How Kitchen Katha sorts the drawer</h3>
        <p>Weight loss favours protein and fibre and applies a gentle penalty above 550 kcal per serving. Weight gain favours energy plus protein. Balanced eating favours protein, fibre and a moderate per-meal energy range. Keeper and tried recipes receive a small reliability boost; the week rotates candidates to support variety.</p>
        <p><strong>Important:</strong> these are organisational rules, not clinical formulas. Nutrition values are only as accurate as what you enter, and a complete diet also depends on portions, sides, cooking fats, drinks and individual needs.</p>
      </div>
    </section>

    <section className="evidence-section" aria-labelledby="evidence-title">
      <div className="evidence-heading"><p className="eyebrow"><span /> Research behind the guardrails</p><h2 id="evidence-title">Why the planner thinks this way</h2><p>The studies inform broad principles, not a personalised treatment plan. Open each paper to see its population, methods and limitations.</p></div>
      <div className="evidence-grid">{evidence.map((paper) => <article className="evidence-card" key={paper.href}><span>{paper.citation}</span><h3>{paper.title}</h3><p>{paper.finding}</p><a href={paper.href} target="_blank" rel="noreferrer">Read the paper <span aria-hidden="true">↗</span></a></article>)}</div>
      <aside className="health-guardrail">
        <div><strong>Practical public-health guardrails</strong><p>Build meals mostly from varied, minimally processed foods; include vegetables, fruit, pulses and whole grains; and aim for gradual, sustainable change.</p></div>
        <div><a href="https://www.who.int/news-room/fact-sheets/detail/healthy-diet" target="_blank" rel="noreferrer">WHO healthy diet guidance ↗</a><a href="https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/healthy-ways-to-gain-weight/" target="_blank" rel="noreferrer">NHS healthy weight gain ↗</a><a href="https://www.nhs.uk/conditions/overweight-and-obesity/" target="_blank" rel="noreferrer">NHS weight management ↗</a></div>
      </aside>
      <p className="medical-note">Speak with a GP or registered dietitian before changing weight if you are pregnant, under 18, have diabetes, kidney or digestive disease, an eating disorder, unexplained weight loss, or take medicines affected by diet.</p>
    </section>

    <footer><span className="brand-mark">र</span><p>Made for recipes worth repeating.</p></footer>
  </main>;
}
