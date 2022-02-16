import { fetchFromTeamOpenapi } from '../utils/openapi.js'
import { findOrgMembers } from './orgs.api.js'

export async function getProjectsOfMembers (apis, params) {
  return await fetchFromTeamOpenapi({
    method: 'get',
    url: 'pm/api/no-ba/external/project/member/projects',
    params: {
      operator: this.sso.userName,
      ...params
    }
  })
}

export async function getGroupsByPage (apis, data) {
  return await fetchFromTeamOpenapi({
    method: 'post',
    url: 'pm/api/no-ba/external/task/getGroupsByPage',
    data: {
      ...data,
      groupField: 'sectionId',
      operator: this.sso.userName,
      pageNo: 1,
      pageSize: 50,
      externalTaskQueryModel: {
        pageNo: 1,
        pageSize: 1,
        excludeChildren: true,
        ...(data.externalTaskQueryModel)
      }
    }
  })
}

export async function getGroupTasks (apis, data) {
  return await apis.find('Task', {
    ...data
  })
}

export async function getTaskInfo (apis, params) {
  return await fetchFromTeamOpenapi({
    method: 'get',
    url: 'pm/api/no-ba/external/task/taskInfo',
    params: {
      operator: this.sso.userName,
      ...params
    }
  })
}

export async function createTask (apis, data) {
  const { priority, ...values } = data
  return apis.create('Task', {
    ...values,
    priorityId: priority.id,
    priorityName: priority.name,
    statusName: '需求Idea',
    statusId: 1
  })
}

export async function getFields (apis, params) {
  return await fetchFromTeamOpenapi({
    method: 'get',
    url: 'pm/api/no-ba/external/task/getFields',
    params: {
      operator: this.sso.userName,
      ...params
    }
  })
}

/**
 * @description 创建分组
 * @param {API.ER_APIs} apis
 * @param {Number} productId
 * @param {Number} versionId
 * @param {String} versionName
 * @param {String} teamProjectId
 * @return {*}
 */
export async function createGroup (apis, { productId, versionId, teamSectionName, teamProjectId }) {
  if (!(productId && versionId && teamProjectId)) return
  try {
    // 更新项目
    await apis.update('Product', productId, { teamProjectId })
    // 创建分组
    const group = await fetchFromTeamOpenapi({
      method: 'post',
      url: 'pm/api/no-ba/external/task/createSection',
      params: {
        operator: this.sso.userName,
        projectId: teamProjectId,
        sectionName: teamSectionName
      }
    })
    await apis.update('ProductVersion', versionId, { teamSectionId: group.sectionId })
    return group
  } catch (e) {
    return e
  }
}

export async function getProjects (apis) {
  return await fetchFromTeamOpenapi({
    method: 'get',
    url: 'pm/api/no-ba/external/project/member/projects',
    params: {
      operator: this.sso.userName,
      username: this.sso.userName
    }
  })
}

export async function getMembersOfProjects (apis, params) {
  return await fetchFromTeamOpenapi({
    method: 'get',
    url: 'pm/api/no-ba/external/project/members',
    params: {
      operator: this.sso.userName,
      ...params
    }
  })
}

export async function getTaskClass (apis, params) {
  return await fetchFromTeamOpenapi({
    method: 'get',
    url: 'pm/api/no-ba/external/task/listTaskClasses',
    params: {
      operator: this.sso.userName,
      ...params
    }
  })
}

export async function getTaskInfos (apis, data) {
  return await fetchFromTeamOpenapi({
    method: 'post',
    url: 'pm/api/no-ba/external/task/simple',
    data: {
      operator: this.sso.userName,
      ...data
    }
  })
}

export async function deleteTask (apis, data) {
  return await fetchFromTeamOpenapi({
    method: 'post',
    url: 'pm/api/no-ba/external/task/deleteTask',
    params: {
      operator: this.sso.userName,
      ...data
    }
  })
}

export async function modifyTask (apis, data) {
  return await fetchFromTeamOpenapi({
    method: 'post',
    url: 'pm/api/no-ba/external/task/modify',
    data: {
      operator: this.sso.userName,
      ...data
    }
  })
}

export async function getPriority (apis) {
  return [
    {
      name: '最高优',
      id: '63'
    },
    {
      name: '高优',
      id: '64'
    },
    {
      name: '中等',
      id: '65'
    },
    {
      name: '较低',
      id: '66'
    },
    {
      name: '极低',
      id: '67'
    }
  ]
}

export async function getStatus (apis) {
  return [
    {
      name: '需求Idea',
      id: '1'
    }
  ]
}
