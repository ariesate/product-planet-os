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
  return await apis.find('Task', data, {}, {
    id: true,
    taskName: true,
    statusName: true,
    priorityName: true,
    taskClassName: true,
    labelModels: true,
    assignee: { name: true, avatar: true, email: true }
  })
}

export async function createTask (apis, data) {
  const { priority, assignee, reporter, title, ...values } = data
  return apis.create('Task', {
    ...values,
    priorityId: priority.id,
    priorityName: priority.name,
    statusName: '需求Idea',
    statusId: 1,
    taskName: title,
    assignee: assignee.id,
    reporter: reporter.id,
    creator: this.user.id,
    taskClassName: values.taskClass === 1 ? '需求' : '其它'
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

export async function getTaskInfos (apis, { taskIds }) {
  const data = await Promise.all(taskIds.map(async id => {
    const data = await apis.find('Task', { id }, {}, {
      id: true,
      taskName: true,
      statusName: true,
      assignee: { name: true, avatar: true, email: true }
    })
    return data[0]
  }))
  return data.filter(x => x)
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

export async function getTaskStatus (apis) {
  return [
    {
      name: '需求Idea',
      id: 1,
      order: 10000,
      phase: 'BEGIN'
    }
  ]
}

export async function getTaskLabels (apis) {
  return [
    {
      name: '页面',
      color: '#2D7AE1',
      id: 1
    },
    {
      name: '用例',
      color: '#1EC75F',
      id: 2
    }
  ]
}
