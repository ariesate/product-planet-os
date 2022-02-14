function deepMerge<
  T1 extends Record<string, any>,
  T2 extends Record<string, any>
>(source: T1, target: T2): T1 & T2 {
  Object.keys(target).forEach((key) => {
    if (source[key] == null) {
      // @ts-ignore
      source[key] = target[key];
    } else if (typeof source[key] === "object") {
      if (typeof target[key] === "object") {
        deepMerge(source[key], target[key]);
      } else {
        // @ts-ignore
        source[key] = target[key];
      }
    } else {
      // @ts-ignore
      source[key] = target[key];
    }
  });

  return source as any;
}

function getChain(target: any, key: string | symbol): any {
  let meta = Reflect.getOwnMetadata(key, target);
  let proto = Reflect.getPrototypeOf(target);
  while (proto) {
    const m = Reflect.getOwnMetadata(key, proto);
    if (!meta) {
      meta = m;
    } else if (m) {
      meta = deepMerge(meta,  m);
    }
    proto = Reflect.getPrototypeOf(proto);
  }
  return meta;
}

/**
 * 在目标上添加metadata. 重复添加会进行深层merge
 *
 * @param target 目标
 * @param key 键值
 * @param data 数据
 */
export function add(target: any, key: string | symbol, data: any) {
  const metadata = get(target, key, true) || {};
  Reflect.defineMetadata(key, deepMerge(metadata, data), target);
}
/**
 * 获取目标上的metadata
 *
 * @param target 目标
 * @param key 键值
 * @param own 获取target自身或继承链合并
 */
export function get(target: any, key: string | symbol, own?: boolean): any {
  return own ? Reflect.getOwnMetadata(key, target) : getChain(target, key);
}

/**
 * 检查目标上是否有指定的metadata
 *
 * @param target 目标
 * @param key 键值
 * @param own 检查target自身
 */
export function has(target: any, key: string | symbol, own?: boolean): boolean {
  return own
    ? Reflect.hasOwnMetadata(key, target)
    : Reflect.hasMetadata(key, target);
}
