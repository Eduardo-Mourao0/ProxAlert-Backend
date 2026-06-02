import { ALARM_REPOSITORY, type AlarmRepository } from "../../../domain/repositories/alarm-repository"
import { AlarmDTO, toAlarmDTO } from "../../dtos/alarm-dto"
import { Injectable, Inject } from "@nestjs/common"

export interface ListUserAlarmRequest {
    userId: string;
}

@Injectable()
export class ListUserAlarmUseCase {
    constructor(
        @Inject(ALARM_REPOSITORY)
        private readonly alarmRepository: AlarmRepository,
    ) {}

    async execute(request: ListUserAlarmRequest): Promise<AlarmDTO[]> {
        const alarms = await this.alarmRepository.findByUserId(request.userId); // Busca os alarmes do usuário pelo ID do usuário

        return alarms.map(toAlarmDTO); // Converte os alarmes para o formato DTO antes de retorná-los
    }
}
