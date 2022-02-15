import knex from 'knex'
import jwt from 'jsonwebtoken'
import { randomBytes, pbkdf2Sync } from 'crypto'

class UnAuthorized extends Error {
  constructor () {
    super('未授权')
  }
}

export default function auth ({
  database,
  jwtSecret,
  exclude,
  cookieName = 'jwt_token'
}) {
  const db = knex(database)

  const hashPassword = (password, salt) => {
    return pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  }

  const createSalt = () => {
    return randomBytes(16).toString('hex')
  }

  /**
   * @param {import('koa').Context} ctx
   */
  const login = async (ctx) => {
    const { email, password } = ctx.request.body
    if (!email || !password) {
      ctx.status = 400
      ctx.body = '邮箱及密码不能为空'
      return
    }
    const [user] = await db
      .select(
        'id',
        'name',
        'avatar',
        'email',
        'displayName',
        'password',
        'salt'
      )
      .from('user')
      .where({ email })
      .limit(1)
    if (!user) {
      ctx.status = 400
      ctx.body = '用户未注册'
      return
    }
    const { password: hash, salt, ...profile } = user
    if (!hash || !salt) {
      ctx.status = 400
      ctx.body = '用户未初始化'
      return
    }
    const compareHash = hashPassword(password, salt)
    if (hash !== compareHash) {
      ctx.status = 400
      ctx.body = '邮箱或密码错误'
    }
    const token = jwt.sign(profile, jwtSecret, { expiresIn: '7d' })
    ctx.status = 200
    ctx.cookies.set(cookieName, token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      overwrite: true
    })
    ctx.body = {
      token
    }
  }

  /**
   * @param {import('koa').Context} ctx
   */
  const register = async (ctx) => {
    const { email, password, name, displayName } = ctx.request.body
    if (!email || !password) {
      ctx.status = 400
      ctx.body = '邮箱及密码不能为空'
      return
    }
    const [user] = await db.select('id').from('user').where({ email }).limit(1)
    if (user) {
      ctx.status = 400
      ctx.body = '邮箱不可用'
      return
    }
    const salt = createSalt()
    const hash = hashPassword(password, salt)
    const [id] = await db
      .insert({
        email,
        password: hash,
        salt,
        name,
        displayName
      })
      .into('user')
    const [profile] = await db
      .select('id', 'name', 'avatar', 'email', 'displayName')
      .from('user')
      .where({ id })
      .limit(1)
    const token = jwt.sign(profile, jwtSecret, { expiresIn: '7d' })
    ctx.status = 201
    ctx.cookies.set(cookieName, token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      overwrite: true
    })
    ctx.body = {
      token
    }
  }

  /**
   * @param {import('koa').Context} ctx
   */
  const revive = async (ctx) => {
    const header = ctx.header.authorization
    const cookie = ctx.cookies.get(cookieName)
    let token
    if (header && header.startsWith('Bearer ')) {
      token = header.slice(7)
    } else if (cookie) {
      token = cookie
    }
    if (!ctx) {
      throw new UnAuthorized()
    }
    let data
    try {
      data = jwt.verify(token, jwtSecret)
    } catch (e) {
      throw new UnAuthorized()
    }
    ctx.state.user = data
    ctx.state.userInfo = {
      avatar: data.avatar,
      displayName: data.displayName || data.name || data.email,
      mail: data.email,
      userName: data.name || data.email
    }
  }

  /**
   * @param {import('koa').Context} ctx
   */
  const logout = (ctx) => {
    ctx.cookies.set(cookieName, null, {
      maxAge: 0,
      httpOnly: true,
      overwrite: true
    })
    ctx.status = 204
  }

  /**
   * @param {import('koa').Context} ctx
   * @param {import('koa').Next} next
   */
  return async function middleware (ctx, next) {
    if (ctx.path === '/api/login') {
      return login(ctx)
    }
    if (ctx.path === '/api/register') {
      return register(ctx)
    }
    if (ctx.path === '/api/logout') {
      return logout(ctx)
    }
    if (exclude) {
      if (exclude instanceof RegExp) {
        if (exclude.test(ctx.path)) {
          return next()
        }
      }
    }
    try {
      await revive(ctx)
      return next()
    } catch (e) {
      if (e instanceof UnAuthorized) {
        ctx.status = 401
        ctx.body = '未授权'
      } else {
        throw e
      }
    }
  }
}
