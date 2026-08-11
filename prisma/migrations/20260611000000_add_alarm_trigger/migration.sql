-- CreateTable
CREATE TABLE "AlarmTrigger" (
    "id" TEXT NOT NULL,
    "alarmId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distanceInMeters" DOUBLE PRECISION NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlarmTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlarmTrigger_alarmId_idx" ON "AlarmTrigger"("alarmId");

-- CreateIndex
CREATE INDEX "AlarmTrigger_userId_idx" ON "AlarmTrigger"("userId");

-- CreateIndex
CREATE INDEX "AlarmTrigger_triggeredAt_idx" ON "AlarmTrigger"("triggeredAt");

-- AddForeignKey
ALTER TABLE "AlarmTrigger" ADD CONSTRAINT "AlarmTrigger_alarmId_fkey" FOREIGN KEY ("alarmId") REFERENCES "Alarm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlarmTrigger" ADD CONSTRAINT "AlarmTrigger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
