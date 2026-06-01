export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE')

export interface TokenService {
  signAccessToken(payload: { sub: string }): Promise<string>
  signRefreshToken(payload: { sub: string }): Promise<string>
  verify(token: string): Promise<{ sub: string; tokenType?: 'access' | 'refresh' }>
  verifyRefreshToken(token: string): Promise<{ sub: string }>
}
