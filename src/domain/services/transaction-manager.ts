export const TRANSACTION_MANAGER = Symbol('TRANSACTION_MANAGER')

export interface TransactionManager {
  run<T>(callback: () => Promise<T>): Promise<T>
}
