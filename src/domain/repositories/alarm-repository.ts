import { Alarm } from "../entities/Alarm";

export const ALARM_REPOSITORY = Symbol('ALARM_REPOSITORY')

export interface AlarmRepository {
    create(alarm: Alarm): Promise<Alarm>
    findById(id: string): Promise<Alarm | null>
    findByUserId(userId: string): Promise<Alarm[]>
    countByUserId(userId: string): Promise<number>
    update(alarm: Alarm): Promise<Alarm>
    delete(id: string): Promise<void>
}