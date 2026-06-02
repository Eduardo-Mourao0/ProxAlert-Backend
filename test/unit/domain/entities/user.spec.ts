import { InvalidEmailError } from '../../../../src/domain/errors/invalid-email-error'
import { InvalidNameError } from '../../../../src/domain/errors/invalid-name-error'
import { InvalidPasswordError } from '../../../../src/domain/errors/invalid-password-error'
import { Plan, User } from '../../../../src/domain/entities/User'

describe('User entity', () => {
  it('creates a free user with normalized name and email', () => {
    const user = User.create({
      name: ' Eduardo ',
      email: ' EDUARDO@EMAIL.COM ',
      password: '1234',
    })

    expect(user.id).toEqual(expect.any(String))
    expect(user.name).toBe('Eduardo')
    expect(user.email).toBe('eduardo@email.com')
    expect(user.plan).toBe(Plan.FREE)
    expect(user.refreshTokenHash).toBeNull()
    expect(user.isPremium()).toBe(false)
  })

  it('identifies premium users', () => {
    const user = User.create({
      name: 'Eduardo',
      email: 'eduardo@email.com',
      password: '1234',
      plan: Plan.PREMIUM,
    })

    expect(user.isPremium()).toBe(true)
  })

  it('rejects empty names', () => {
    expect(() =>
      User.create({
        name: '   ',
        email: 'eduardo@email.com',
        password: '1234',
      }),
    ).toThrow(InvalidNameError)
  })

  it('rejects invalid emails', () => {
    expect(() =>
      User.create({
        name: 'Eduardo',
        email: 'invalid-email',
        password: '1234',
      }),
    ).toThrow(InvalidEmailError)
  })

  it('rejects short passwords', () => {
    expect(() =>
      User.create({
        name: 'Eduardo',
        email: 'eduardo@email.com',
        password: '123',
      }),
    ).toThrow(InvalidPasswordError)
  })
})
