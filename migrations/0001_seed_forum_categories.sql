-- Seed default community forum categories (idempotent: safe to re-run)
INSERT INTO "forum_categories" ("name", "description", "icon", "sort_order")
VALUES
  ('General Discussion', 'Chat about anything money related with the SavyFunds community', 'MessagesSquare', 1),
  ('Budgeting & Saving', 'Tips and questions about budgets, saving habits, and cutting costs', 'PiggyBank', 2),
  ('Investing', 'Stocks, retirement accounts, and growing your money over time', 'TrendingUp', 3),
  ('Debt Management', 'Strategies for paying down debt and staying debt free', 'CreditCard', 4),
  ('Success Stories', 'Share your financial wins and money milestones', 'Trophy', 5),
  ('Ask an Expert', 'Get answers to your trickiest money questions', 'GraduationCap', 6)
ON CONFLICT DO NOTHING;
