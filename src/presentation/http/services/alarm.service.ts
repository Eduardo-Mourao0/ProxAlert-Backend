import { Injectable } from '@nestjs/common'
import { CheckAlarmProximityRequest, CheckAlarmProximityUseCase } from '../../../application/use-cases/alarm/check-alarm-proximity-usecase'
import { CreateAlarmRequest, CreateAlarmUseCase } from '../../../application/use-cases/alarm/create-alarm-usecase'
import { DeleteAlarmRequest, DeleteAlarmUseCase } from '../../../application/use-cases/alarm/delete-alarm-usecase'
import { ListUserAlarmRequest, ListUserAlarmUseCase } from '../../../application/use-cases/alarm/list-user-alarm-usecase'
import { ToggleAlarmStatusRequest, ToggleAlarmStatusUseCase } from '../../../application/use-cases/alarm/toggle-alarm-status-usecase'
import { UpdateAlarmRequest, UpdateAlarmUseCase } from '../../../application/use-cases/alarm/update-alarm-usecase'

@Injectable()
export class AlarmService {
  constructor(
    private readonly createAlarmUseCase: CreateAlarmUseCase,
    private readonly listUserAlarmUseCase: ListUserAlarmUseCase,
    private readonly updateAlarmUseCase: UpdateAlarmUseCase,
    private readonly deleteAlarmUseCase: DeleteAlarmUseCase,
    private readonly toggleAlarmStatusUseCase: ToggleAlarmStatusUseCase,
    private readonly checkAlarmProximityUseCase: CheckAlarmProximityUseCase,
  ) {}

  create(data: CreateAlarmRequest) {
    return this.createAlarmUseCase.execute(data)
  }

  listByUser(data: ListUserAlarmRequest) {
    return this.listUserAlarmUseCase.execute(data)
  }

  update(data: UpdateAlarmRequest) {
    return this.updateAlarmUseCase.execute(data)
  }

  delete(data: DeleteAlarmRequest) {
    return this.deleteAlarmUseCase.execute(data)
  }

  toggleStatus(data: ToggleAlarmStatusRequest) {
    return this.toggleAlarmStatusUseCase.execute(data)
  }

  checkProximity(data: CheckAlarmProximityRequest) {
    return this.checkAlarmProximityUseCase.execute(data)
  }
}
