import { ALARM_REPOSITORY, type AlarmRepository } from "../../../domain/repositories/alarm-repository";
import { Injectable, Inject } from "@nestjs/common";
import { BusinessError } from "../../../domain/errors/business-error";

export interface DeleteAlarmRequest {
    alarmId: string;
    userId: string;
}

@Injectable()
export class DeleteAlarmUseCase {
    constructor(
        @Inject(ALARM_REPOSITORY)
        private readonly alarmRepository: AlarmRepository
    ) {}

    async execute(request: DeleteAlarmRequest): Promise<void> {
        const alarm = await this.alarmRepository.findById(request.alarmId); // Busca o alarme pelo ID

        if (!alarm || alarm.userId !== request.userId) { // Verifica se o alarme existe e se pertence ao usuário que está tentando deletá-lo
            throw new BusinessError('Alarm not found.', 404)
        }
        
        await this.alarmRepository.delete(request.alarmId); // Deleta o alarme caso ele exista e pertença ao usuário
    }
}
