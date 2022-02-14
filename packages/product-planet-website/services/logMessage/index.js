import request from '@/tools/request'
import { ObjectToFormData } from '@/tools/transform'

/**
 * 上报
 */
export async function log (d) {
  const { data } = await request.post('/api/logMessage/log', ObjectToFormData({
    ...d,
    type: 'log'
  }))
  return data.result
}
export async function monitor (d) {
  const { data } = await request.post('/api/logMessage/log', ObjectToFormData({
    ...d,
    type: 'monitor'
  }))
  return data.result
}
export async function project (d) {
  const { data } = await request.post('/api/logMessage/log', ObjectToFormData({
    ...d,
    type: 'project'
  }))
  return data.result
}

/**
 * 读取
 */
export async function read (query) {
  const { data } = await request.post('/api/logMessage/readLog', ObjectToFormData(query))
  return data.result
}
/**
 * 读取log
 */
export async function readLog (query) {
  const { data } = await request.post('/api/logMessage/readLog', ObjectToFormData({
    ...query,
    type: 'log'
  }))
  return data.result
}
/**
 * 读取monitor
 */
export async function readMonitor (query) {
  const { data } = await request.post('/api/logMessage/readLog', ObjectToFormData({
    ...query,
    type: 'monitor'
  }))
  return data.result
}
/**
 * 读取project
 */
export async function readProject (query) {
  const { data } = await request.post('/api/logMessage/readLog', ObjectToFormData({
    ...query,
    type: 'project'
  }))
  return data.result
}
