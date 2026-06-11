-- CreateTable
CREATE TABLE "AlarmProximityState" (
    "id" TEXT NOT NULL,
    "alarmId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isInsideRadius" BOOLEAN NOT NULL DEFAULT false,
    "dismissedUntilExit" BOOLEAN NOT NULL DEFAULT false,
    "lastDistanceInMeters" DOUBLE PRECISION,
    "lastTriggeredAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlarmProximityState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlarmProximityState_alarmId_userId_key" ON "AlarmProximityState"("alarmId", "userId");

-- CreateIndex
CREATE INDEX "AlarmProximityState_userId_idx" ON "AlarmProximityState"("userId");

-- AddForeignKey
ALTER TABLE "AlarmProximityState" ADD CONSTRAINT "AlarmProximityState_alarmId_fkey" FOREIGN KEY ("alarmId") REFERENCES "Alarm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlarmProximityState" ADD CONSTRAINT "AlarmProximityState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
