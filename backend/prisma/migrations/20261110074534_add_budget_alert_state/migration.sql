-- CreateTable
CREATE TABLE "budget_alert_states" (
    "id" SERIAL NOT NULL,
    "budgetId" INTEGER NOT NULL,
    "warningActive" BOOLEAN NOT NULL DEFAULT false,
    "exceededActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_alert_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "budget_alert_states_budgetId_key" ON "budget_alert_states"("budgetId");

-- AddForeignKey
ALTER TABLE "budget_alert_states" ADD CONSTRAINT "budget_alert_states_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
