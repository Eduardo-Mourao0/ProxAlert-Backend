import { Alarm } from "../../../domain/entities/Alarm";
import { AlarmDTO, toAlarmDTO } from "../../dtos/alarm-dto";
import { ALARM_REPOSITORY, type AlarmRepository } from "../../../domain/repositories/alarm-repository";
import { BusinessError } from "../../../domain/errors/business-error";
import { FreeAlarmLimitReachedError } from "../../../domain/errors/free-alarm-limit-reached-error";
import { Injectable, Inject } from "@nestjs/common";
import { USER_REPOSITORY, type UserRepository } from "../../../domain/repositories/user-repository";

export interface CreateAlarmRequest {
    userId: string;
    title: string;
    description: string | null;
    latitude: number;
    longitude: number;
    radius: number;
}

@Injectable()
export class CreateAlarmUseCase {
    constructor(
        @Inject(ALARM_REPOSITORY)
        private readonly alarmRepository: AlarmRepository,
        
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepository,
    ) {}

    async execute(request: CreateAlarmRequest): Promise<AlarmDTO> {
        const user = await this.userRepository.findById(request.userId); // Busca o usuário para verificar se ele existe e para contar quantos alarms ele já possui

        if (!user) throw new BusinessError("User not found.", 404); // Verifica se o usuário existe

        const alarmsCount = await this.alarmRepository.countByUserId(request.userId); // Verifica quantos alarms o usuário possui

        if(!user.isPremium() && alarmsCount >= 3) { // Verifica se o usuário é do plano gratuito e se já possui 3 alarms, que é o limite para esse plano
            throw new FreeAlarmLimitReachedError();
        }

        const alarm = Alarm.create({
            userId: request.userId,
            title: request.title,
            description: request.description,
            latitude: request.latitude,
            longitude: request.longitude,
            radius: request.radius,
        });

        const createdAlarm = await this.alarmRepository.create(alarm);

        return toAlarmDTO(createdAlarm);
    }
}
