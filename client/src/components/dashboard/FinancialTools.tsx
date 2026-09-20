import React from "react";
import BudgetCalculator from "./BudgetCalculator";
import GoalSetting from "./GoalSetting";

const FinancialTools = () => {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-neutral-800 mb-4">Financial Tools</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BudgetCalculator />
        <GoalSetting />
      </div>
    </section>
  );
};

export default FinancialTools;
