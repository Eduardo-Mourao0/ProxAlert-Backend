import { DismissAlarmUseCase } from '../../../../../src/application/use-cases/alarm/dismiss-alarm-usecase'
import { Alarm } from '../../../../../src/domain/entities/Alarm'
import { AlarmProximityState } from '../../../../../src/domain/entities/AlarmProximityState'
import type { AlarmProximityStateRepository } from '../../../../../src/domain/repositories/alarm-proximity-state-repository'
import type { AlarmRepository } from '../../../../../src/domain/repositories/alarm-repository'

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

function makeAlarm(userId = 'user-id') {
  return Alarm.create({
    userId,
    title: 'Casa',
    description: null,
    latitude: -23.5505,
    longitude: -46.6333,
    radius: 500,
  })
}

describe('DismissAlarmUseCase', () => {
  let alarmRepository: FakeAlarmRepository
  let alarmProximityStateRepository: FakeAlarmProximityStateRepository
  let useCase: DismissAlarmUseCase

  beforeEach(() => {
    alarmRepository = new FakeAlarmRepository()
    alarmProximityStateRepository = new FakeAlarmProximityStateRepository()
    useCase = new DismissAlarmUseCase(
      alarmRepository,
      alarmProximityStateRepository,
    )
  })

  it('dismisses an alarm until the user exits its radius', async () => {
    const alarm = makeAlarm()
    alarmRepository.alarms.push(alarm)

    const result = await useCase.execute({
      alarmId: alarm.id,
      userId: 'user-id',
    })
    const state =
      await alarmProximityStateRepository.findByAlarmIdAndUserId(
        alarm.id,
        'user-id',
      )

    expect(result).toEqual({ dismissed: true })
    expect(state?.dismissedUntilExit).toBe(true)
    expect(state?.isInsideRadius).toBe(true)
    expect(state?.dismissedAt).toBeInstanceOf(Date)
  })

  it('does not allow dismissing another user alarm', async () => {
    const alarm = makeAlarm('another-user-id')
    alarmRepository.alarms.push(alarm)

    await expect(
      useCase.execute({
        alarmId: alarm.id,
        userId: 'user-id',
      }),
    ).rejects.toMatchObject({
      message: 'Alarm not found.',
      statusCode: 404,
    })
  })
})
