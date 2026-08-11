import { CheckAlarmProximityUseCase } from '../../../../../src/application/use-cases/alarm/check-alarm-proximity-usecase'
import { Alarm } from '../../../../../src/domain/entities/Alarm'
import { AlarmProximityState } from '../../../../../src/domain/entities/AlarmProximityState'
import { AlarmTrigger } from '../../../../../src/domain/entities/AlarmTrigger'
import type { AlarmProximityStateRepository } from '../../../../../src/domain/repositories/alarm-proximity-state-repository'
import type { AlarmRepository } from '../../../../../src/domain/repositories/alarm-repository'
import type { AlarmTriggerRepository } from '../../../../../src/domain/repositories/alarm-trigger-repository'

class FakeAlarmRepository implements AlarmRepository {
  alarms: Alarm[] = []

  async create(alarm: Alarm): Promise<Alarm> {
    this.alarms.push(alarm)
    return alarm
  }

  async findById(id: string): Promise<Alarm | null> {
    return this.alarms.find((alarm) => alarm.id === id) ?? null
  }

  async findByUserId(userId: string): Promise<Alarm[]> {
    return this.alarms.filter((alarm) => alarm.userId === userId)
  }

  async countByUserId(userId: string): Promise<number> {
    return this.alarms.filter((alarm) => alarm.userId === userId).length
  }

  async update(alarm: Alarm): Promise<Alarm> {
    this.alarms = this.alarms.map((currentAlarm) =>
      currentAlarm.id === alarm.id ? alarm : currentAlarm,
    )
    return alarm
  }

  async delete(id: string): Promise<void> {
    this.alarms = this.alarms.filter((alarm) => alarm.id !== id)
  }
}

class FakeAlarmProximityStateRepository
  implements AlarmProximityStateRepository
{
  states: AlarmProximityState[] = []

  async findByAlarmIdAndUserId(
    alarmId: string,
    userId: string,
  ): Promise<AlarmProximityState | null> {
    return (
      this.states.find(
        (state) => state.alarmId === alarmId && state.userId === userId,
      ) ?? null
    )
  }

  async save(state: AlarmProximityState): Promise<AlarmProximityState> {
    const currentState = await this.findByAlarmIdAndUserId(
      state.alarmId,
      state.userId,
    )

    if (!currentState) {
      this.states.push(state)
      return state
    }

    this.states = this.states.map((storedState) =>
      storedState.id === state.id ? state : storedState,
    )
    return state
  }
}

class FakeAlarmTriggerRepository implements AlarmTriggerRepository {
  triggers: AlarmTrigger[] = []

  async create(alarmTrigger: AlarmTrigger): Promise<AlarmTrigger> {
    this.triggers.push(alarmTrigger)
    return alarmTrigger
  }

  async findByAlarmId(alarmId: string): Promise<AlarmTrigger[]> {
    return this.triggers.filter((trigger) => trigger.alarmId === alarmId)
  }
}

function makeAlarm(props?: Partial<Parameters<typeof Alarm.create>[0]>) {
  return Alarm.create({
    userId: 'user-id',
    title: 'Casa',
    description: null,
    address: 'Av. Paulista, 1000 - Sao Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
    radius: 500,
    ...props,
  })
}

describe('CheckAlarmProximityUseCase', () => {
  let alarmRepository: FakeAlarmRepository
  let alarmProximityStateRepository: FakeAlarmProximityStateRepository
  let alarmTriggerRepository: FakeAlarmTriggerRepository
  let useCase: CheckAlarmProximityUseCase

  beforeEach(() => {
    alarmRepository = new FakeAlarmRepository()
    alarmProximityStateRepository = new FakeAlarmProximityStateRepository()
    alarmTriggerRepository = new FakeAlarmTriggerRepository()
    useCase = new CheckAlarmProximityUseCase(
      alarmRepository,
      alarmProximityStateRepository,
      alarmTriggerRepository,
    )
  })

  it('returns active alarms inside the configured radius', async () => {
    alarmRepository.alarms.push(makeAlarm())

    const result = await useCase.execute({
      userId: 'user-id',
      latitude: -23.5506,
      longitude: -46.6334,
    })

    expect(result.triggeredAlarms).toHaveLength(1)
    expect(result.triggeredAlarms[0].title).toBe('Casa')
    expect(alarmTriggerRepository.triggers).toHaveLength(1)
    expect(alarmTriggerRepository.triggers[0].distanceInMeters).toEqual(
      expect.any(Number),
    )
  })

  it('does not return alarms outside the configured radius', async () => {
    alarmRepository.alarms.push(makeAlarm({ radius: 50 }))

    const result = await useCase.execute({
      userId: 'user-id',
      latitude: -23.56,
      longitude: -46.64,
    })

    expect(result.triggeredAlarms).toEqual([])
    expect(alarmTriggerRepository.triggers).toEqual([])
  })

  it('does not return inactive alarms', async () => {
    alarmRepository.alarms.push(makeAlarm({ isActive: false }))

    const result = await useCase.execute({
      userId: 'user-id',
      latitude: -23.5505,
      longitude: -46.6333,
    })

    expect(result.triggeredAlarms).toEqual([])
    expect(alarmTriggerRepository.triggers).toEqual([])
  })

  it('returns an empty array when the user has no alarms', async () => {
    const result = await useCase.execute({
      userId: 'user-id',
      latitude: -23.5505,
      longitude: -46.6333,
    })

    expect(result.triggeredAlarms).toEqual([])
  })

  it('does not trigger dismissed alarms until the user exits and enters again', async () => {
    const alarm = makeAlarm()
    alarmRepository.alarms.push(alarm)

    const firstCheck = await useCase.execute({
      userId: 'user-id',
      latitude: -23.5506,
      longitude: -46.6334,
    })
    const state =
      await alarmProximityStateRepository.findByAlarmIdAndUserId(
        alarm.id,
        'user-id',
      )

    state?.dismissUntilExit()
    await alarmProximityStateRepository.save(state!)

    const stillInsideCheck = await useCase.execute({
      userId: 'user-id',
      latitude: -23.5506,
      longitude: -46.6334,
    })

    await useCase.execute({
      userId: 'user-id',
      latitude: -23.7,
      longitude: -46.8,
    })

    const reentryCheck = await useCase.execute({
      userId: 'user-id',
      latitude: -23.5506,
      longitude: -46.6334,
    })

    expect(firstCheck.triggeredAlarms).toHaveLength(1)
    expect(stillInsideCheck.triggeredAlarms).toEqual([])
    expect(reentryCheck.triggeredAlarms).toHaveLength(1)
    expect(alarmTriggerRepository.triggers).toHaveLength(2)
  })
})
