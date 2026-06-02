import { ALARM_REPOSITORY, type AlarmRepository } from "../../../domain/repositories/alarm-repository";
import { Injectable, Inject } from "@nestjs/common";
import { BusinessError } from "../../../domain/errors/business-error";
import { AlarmDTO, toAlarmDTO } from "../../dtos/alarm-dto";

export interface UpdateAlarmRequest {
    alarmId: string;
    userId: string;
    title?: string;
    description?: string | null;
    latitude?: number;
    longitude?: number;
    radius?: number;
}

@Injectable()
export class UpdateAlarmUseCase {
    constructor(
        @Inject(ALARM_REPOSITORY)
        private readonly alarmRepository: AlarmRepository
    ) {}

    async execute(request: UpdateAlarmRequest): Promise<AlarmDTO> {
        const alarm = await this.alarmRepository.findById(request.alarmId); // Busca o alarme pelo ID

        if (!alarm || alarm.userId !== request.userId) { // Verifica se o alarme existe e se pertence ao usuário que está tentando alterá-lo
            throw new BusinessError('Alarm not found.', 404)
        }

        alarm.update({ // Atualiza os campos do alarme com os valores fornecidos na requisição, se eles existirem
            title: request.title,
            description: request.description,
            latitude: request.latitude,
            longitude: request.longitude,
            radius: request.radius,
        });

        const updatedAlarm = await this.alarmRepository.update(alarm) // Atualiza o alarme no repositório
        
        return toAlarmDTO(updatedAlarm)
    }
}
