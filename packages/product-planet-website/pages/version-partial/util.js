export const versionStatusMap = {
  INIT: 'init',
  DONE: 'done',
  UNDONE: 'undone',
  HOLD: 'hold',
  DRAFT: 'draft',
  ARCHIVE: 'archive'
}
/**
 * 判断当前版本是否完成，兼容历史数据的currentStatus为空的情况
 */
export function isVersionDone (version = {}) {
  return ![versionStatusMap.UNDONE, versionStatusMap.HOLD, versionStatusMap.DRAFT].includes(version.currentStatus)
}

export function isUndone (version = {}) {
  return [versionStatusMap.UNDONE, versionStatusMap.HOLD].includes(version.currentStatus)
}

export function mapStatusText (s, ignoreINIT) {
  if (!s) {
    return '初始'
  }
  const m = {
    [versionStatusMap.DONE]: '已结束',
    [versionStatusMap.UNDONE]: '进行中',
    [versionStatusMap.HOLD]: '暂停',
    [versionStatusMap.DRAFT]: '未来计划',
    [versionStatusMap.ARCHIVE]: '已归档',
    [versionStatusMap.INIT]: '初始'
  }
  if (ignoreINIT) {
    delete m[versionStatusMap.INIT]
  }
  return m[s] ? m[s] : ''
}
