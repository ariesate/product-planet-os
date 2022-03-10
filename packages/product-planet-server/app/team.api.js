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
