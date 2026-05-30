import { User, Plan } from "../../domain/entities/User"

export interface UserDTO {
  id: string
  name: string
  email: string
  plan: Plan
}

export interface LoginUserDTO {
  token: string
}

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
  }
}