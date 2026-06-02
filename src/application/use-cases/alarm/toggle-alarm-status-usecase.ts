import { Inject, Injectable } from '@nestjs/common'
import { AlarmDTO, toAlarmDTO } from '../../dtos/alarm-dto'
import { BusinessError } from '../../../domain/errors/business-error'
import { ALARM_REPOSITORY, type AlarmRepository } from '../../../domain/repositories/alarm-repository'

export interface ToggleAlarmStatusRequest {
  alarmId: string
  userId: string
}

@Injectable()
export class ToggleAlarmStatusUseCase {
  constructor(
    @Inject(ALARM_REPOSITORY)
    private readonly alarmRepository: AlarmRepository,
  ) {}

  async execute(request: ToggleAlarmStatusRequest): Promise<AlarmDTO> {
    const alarm = await this.alarmRepository.findById(request.alarmId) // Busca o alarme pelo ID

    if (!alarm || alarm.userId !== request.userId) { // Verifica se o alarme existe e se pertence ao usuário que está tentando alterá-lo
      throw new BusinessError('Alarm not found.', 404)
    }

    alarm.toggleStatus() // Alterna o status do alarme (on/off)

    const updatedAlarm = await this.alarmRepository.update(alarm) // Atualiza o alarme no repositório

    return toAlarmDTO(updatedAlarm) // Retorna o alarme atualizado como um DTO
  }
}
