export interface ShortcutHandler {
  (e: KeyboardEvent): void
}

export interface PreventCondition {
  (e: KeyboardEvent): boolean
}

export interface Shortcut {
  /**
   * 初始化，默认在 document 上绑定 keydown 事件（快捷键绑定在 document 上比较好，绑在某个节点上的话，要选中该节点才能触发事件）
   * @param target 目标节点，可空
   */
  init(target?: Element): void
  /**
   * 进入范围
   * @param scope 生效范围，一般是页面级别，或者弹窗，如果同一个页面的组件设置了不同的 scope，以最后调用的为准
   */
  enter(scope: string): void
  /**
   * 绑定快捷键
   * @param shortcuts 支持传数组，如['meta+s', 'ctrl+s']，表示多个等效快键键，也可以只传一个字符串
   * @param scope 生效范围，一般是页面级别，或者弹窗，如果同一个页面的组件设置了不同的 scope，以最后调用的为准
   * @param handler 处理事件
   * @param prevent 如果传了 prevent，会在快捷键按下后先调用 prevent(e)，若返回 true，则快捷键不生效
   * @param target 如果传了 target，就将事件绑定到目标节点上（默认是在 init 的时候绑在 document 上），并且返回解绑函数
   */
  bind(shortcuts: string | string[], scope: string, handler: ShortcutHandler, prevent?: PreventCondition, target?: Element): void | (() => void)
  /**
   * 退出 scope
   * @param scope
   */
  leave(scope: string): void
  destroy(target?: Element): void
}

export interface ShortcutFactory {
  (): Shortcut
}

interface ShortcutConfig {
  handler: ShortcutHandler
  prevent?: PreventCondition
  composed?: boolean
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}

type ShortcutMap = Record<string, Record<string, [ShortcutConfig]>>

export const SEPARATOR = '+'
const EVENT = 'keydown'
export const COMPOSED_KEYS = ['metaKey', 'ctrlKey', 'shiftKey', 'altKey']

const createShortcut: ShortcutFactory = () => {
  const scopeStack = []
  const shortcutMap: ShortcutMap = {}

  const createListener = (map: ShortcutMap) => (e: KeyboardEvent) => {
    if (!scopeStack.length) return

    const currentScope = scopeStack[scopeStack.length - 1]
    const currentMap = map[currentScope]
    if (!currentMap) return
    const configs = currentMap[e.key]
    if (!configs) return

    configs.forEach(config => {
      const { handler, prevent, composed } = config
      if (prevent && prevent(e)) return

      if (composed) {
        for (let i in COMPOSED_KEYS) {
          const key = COMPOSED_KEYS[i]
          if (e[key] !== !!config[key]) return
        }
        // CAUTION: config 中的 composedKeys 是子集，譬如 bind('meta+z')，config 里保存了 { metaKey: true }，如果只循环 composedKeys 的话，同时按下 meta+shift+z 也符合条件（shiftKey 压根没比较）
        // for (let key in composedKeys) {
        //   // 这里有点 trick, conifg 里存的 key 和 e 里的 key 是对应的（metaKey/ctrlKey/shiftKey/altKey）
        //   if (!e[key]) return
        // }
      }

      handler(e)
    })
  }

  const listener = createListener(shortcutMap)

  const init = (target?: Element) => {
    (target || document).addEventListener(EVENT, listener)
  }

  const destroy = (target?: Element) => {
    (target || document).removeEventListener(EVENT, listener)
  }

  const enter = (scope: string) => {
    scopeStack.push(scope)
  }
  const bind = (shortcuts: string | string[], scope: string, handler: ShortcutHandler, prevent?: PreventCondition, target?: Element) => {
    const bindShortcut = (map: ShortcutMap) => (shortcut: string) => {
      const config: ShortcutConfig = { handler, prevent }
      const keys = shortcut.split(SEPARATOR).map(x => x.trim())
      const mainKey = keys.pop()

      // CAUTION: 直接把组合键存为 key 处理会方便些，但这里有个顺序问题，例如 alt+shift+s 和 shift+alt+s 理论上应该是等价的，所以这里把组合键分开放到 config 里保存
      if (keys.length) {
        config.composed = true
        keys.forEach(composed => {
          config[`${composed}Key`] = true
        })
      }

      if (!map[scope]) {
        map[scope] = { [mainKey]: [config] }
      } else if (!map[scope][mainKey]) {
        map[scope][mainKey] = [config]
      } else {
        map[scope][mainKey].push(config)
      }
    }

    // 传了 target 的话，用一个临时 map，与全局数据隔离
    const map: ShortcutMap = target ? {} : shortcutMap

    if (Array.isArray(shortcuts)) {
      shortcuts.forEach(bindShortcut(map))
    } else {
      bindShortcut(map)(shortcuts)
    }

    if (target) {
      const listener = createListener(map)
      target.addEventListener(EVENT, listener)
      return () => target.removeEventListener(EVENT, listener)
    }
  }

  const leave = (scope: string) => {
    let lastScope = scopeStack.pop()
    while (scopeStack.length && scope !== lastScope) {
      lastScope = scopeStack.pop()
    }
    shortcutMap[scope] = null
  }

  return {
    init,
    enter,
    leave,
    bind,
    destroy
  }
}

const shortcut = createShortcut()

export default shortcut