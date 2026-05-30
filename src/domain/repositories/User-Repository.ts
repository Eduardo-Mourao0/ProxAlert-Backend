import { User } from "../entities/User";

export const USER_REPOSITORY = Symbol('USER_REPOSITORY')

export interface UserRepository {
  
  create(user: User): Promise<User>
  
  findByEmail(email: string): Promise<User | null>
  
  findById(id: string): Promise<User | null>
  
  update(user: User): Promise<User>
 
  findAll(): Promise<User[]>
  
  delete(id: string): Promise<void>
}
