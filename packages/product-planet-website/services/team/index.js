import request from '@/tools/request'

/**
 * 根据成员查询项目
 *
 * @export
 * @returns {Promise<API.User.UserInfo>}
 */
export async function getProjectsOfMembers ({ username }) {
  const { data } = await request.post('/api/team/getProjectsOfMembers', {
    argv: [{
      username,
    }]
  })
  return data.result
}

export async function getGroupsByPage ({ projectId }) {
  const { data } = await request.post('/api/team/getGroupsByPage', {
    argv: [{
      externalTaskQueryModel: {
        projectId
      },
      projectId
    }]
  })
  return data.result
}

/**
 * 根据任务组查询任务
 *
 * @export
 * @returns {Promise<API.Team.ModelInfo>}
 */
export async function getGroupTasks ({ projectId, groupKeys, pageNo }) {
  const { data } = await request.post('/api/team/getGroupTasks', {
    argv: [{
      externalTaskQueryModel: {
        pageNo,
        projectId
      },
      projectId,
      groupKeys
    }]
  })
  return data.result
}

export async function getTaskInfo ({ taskId }) {
  const { data } = await request.post('/api/team/getTaskInfo', {
    argv: [{
      taskId,
    }]
  })
  return data.result
}

export async function createTask (data) {
  const { data: res } = await request.post('/api/team/createTask', {
    argv: [data]
  })
  return res.result
}

export async function getFields ({ taskClassId }) {
  const { data: res } = await request.post('/api/team/getFields', {
    argv: [{
      taskClassId
    }]
  })
  return res.result
}

export async function getProjects ({ username }) {
  const { data: res } = await request.post('/api/team/getProjects', {
    argv: [{
      username
    }]
  })
  return res.result
}
