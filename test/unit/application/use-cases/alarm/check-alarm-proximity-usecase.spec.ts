import { CheckAlarmProximityUseCase } from '../../../../../src/application/use-cases/alarm/check-alarm-proximity-usecase'
import { Alarm } from '../../../../../src/domain/entities/Alarm'
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
    this.alarms = this.alarms.map((currentAlarm) =>
      currentAlarm.id === alarm.id ? alarm : currentAlarm,
    )
    return alarm
  }

  async delete(id: string): Promise<void> {
    this.alarms = this.alarms.filter((alarm) => alarm.id !== id)
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
  let useCase: CheckAlarmProximityUseCase

  beforeEach(() => {
    alarmRepository = new FakeAlarmRepository()
    useCase = new CheckAlarmProximityUseCase(alarmRepository)
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
  })

  it('does not return alarms outside the configured radius', async () => {
    alarmRepository.alarms.push(makeAlarm({ radius: 50 }))

    const result = await useCase.execute({
      userId: 'user-id',
      latitude: -23.56,
      longitude: -46.64,
    })

    expect(result.triggeredAlarms).toEqual([])
  })

  it('does not return inactive alarms', async () => {
    alarmRepository.alarms.push(makeAlarm({ isActive: false }))

    const result = await useCase.execute({
      userId: 'user-id',
      latitude: -23.5505,
      longitude: -46.6333,
    })

    expect(result.triggeredAlarms).toEqual([])
  })

  it('returns an empty array when the user has no alarms', async () => {
    const result = await useCase.execute({
      userId: 'user-id',
      latitude: -23.5505,
      longitude: -46.6333,
    })

    expect(result.triggeredAlarms).toEqual([])
  })
})
