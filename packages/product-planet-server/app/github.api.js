/*
 * @Description: git授权
 * @Author: fanglin05
 * @Date: 2022-02-21 10:17:25
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-02-21 16:46:06
 */

import { Gitlab } from '@gitbeaker/node'
import axios from 'axios'
import config from '../config/index.js'
import { exec } from 'child_process'
import path from 'path'

const { host: GIT_HOST, accessToken: GIT_ACCESS_TOKEN, namespaceId: GIT_NAMESPACE_ID } = config.git
const { clientId, clientSecret, appName, authUrl, authTokenUrl, homePage, backPage } = config.github

// git 权限等级
const GIT_ACCESS_LEVE = {
  noAccess: 0,
  minimalAccess: 5,
  guest: 10,
  reporter: 20,
  developer: 30,
  maintainer: 40,
  owner: 50
}

const gitApi = new Gitlab({
  host: GIT_HOST,
  token: GIT_ACCESS_TOKEN
})

export async function getGithubToken (apis, { code, state }) {
  const { data: token } = await axios.post(authTokenUrl, {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: `${backPage}`,
    state
  })
  return token
}

/**
 * @description 通过id获取project
 * @param {API.ER_APIs} apis
 * @param {{projectId: number}} param
 * @return {Object}
 */
async function getGitProjectById (apis, { projectId }) {
  const project = await gitApi.Projects.show(projectId)
  return project
}

/**
 * @description 创建project
 * @param {API.ER_APIs} apis
 * @param {{name: string}} param
 * @return {Object}
 */
async function createGitProject (apis, { name }) {
  const project = await gitApi.Projects.create({
    name,
    namespaceId: GIT_NAMESPACE_ID
  })
  return project
}

/**
 * @description 提交commit
 * @param {API.ER_APIs} apis
 * @param {{projectId: number, branch: string, message: string, actions: array, options: object}} param
 * @return {Object}
 */
async function createGitCommit (apis, { projectId, branch, message, actions = [], options }) {
  const res = await gitApi.Commits.create(
    projectId,
    branch,
    message,
    actions,
    options
  )
  return res
}

/**
 * @description 获取git用户信息
 * @param {API.ER_APIs} apis
 * @param {{username: string}} param
 * @return {Object}
 */
async function getGitUserInfo (apis, { username }) {
  const user = await gitApi.Users.username(username)
  return user
}

/**
 * @description 获取git项目成员
 * @param {API.ER_APIs} apis
 * @param {{projectId: number}} param
 * @return {Array}
 */
async function getGitMembers (apis, { projectId }) {
  // 获取包含从组关系「继承」来的成员，git-node只能获取「非继承」成员，故直接用api
  const res = await axios({
    method: 'get',
    url: `${GIT_HOST}/api/v4/projects/${projectId}/members/all`,
    headers: {
      'PRIVATE-TOKEN': GIT_ACCESS_TOKEN
    }
  })
  return res?.data || []
}

/**
 * @description 添加git项目成员
 * @param {API.ER_APIs} apis
 * @param {{projectId: number, username: string, accessLevel: number, options: object}} param
 * @return {Array}
 */
async function addGitMemeber (
  apis,
  { projectId, username, accessLevel, options }
) {
  const members = await getGitMembers.call(this, apis, { projectId })
  const { id: userId } = (await getGitUserInfo.call(this, apis, { username }))[0]
  // 避免重复添加报错
  if (members.findIndex(m => m.id === userId) === -1) {
    const res = await gitApi.ProjectMembers.add(
      projectId,
      userId,
      GIT_ACCESS_LEVE[accessLevel] || 0,
      options
    )
    return res
  }
}

/**
 * @description 创建MR
 * @param {API.ER_APIs} apis
 * @param {{projectId: number, sourceBranch: string, targetBranch: string, title: string}} param
 * @return {*}
 */
async function createMR (
  apis,
  { projectId, sourceBranch, targetBranch, title = '' }
) {
  const mr = await gitApi.MergeRequests.create(projectId, sourceBranch, targetBranch, title)
  return mr
}

/**
 * @description 获取全部MR
 * @param {API.ER_APIs} apis
 * @param {{projectId: number, sourceBranch: string, targetBranch:string, state: 'opened'|'closed'|'locked'|'merged'}} param
 * @return {*}
 */
async function listMergeRequest (
  apis,
  { projectId, sourceBranch, targetBranch, state }
) {
  const mrs = await gitApi.MergeRequests.all({ projectId, sourceBranch, targetBranch, state })
  return mrs
}

/**
 * @description 创建分支
 * @param {API.ER_APIs} apis
 * @param {{projectId: number, branchName: string, ref: string}} param
 * @return {*}
 */
async function createBranch (
  apis,
  { projectId, branchName, ref }
) {
  const branches = await gitApi.Branches.create(projectId, branchName, ref)
  return branches
}

/**
 * @description 列出所有分支
 * @param {API.ER_APIs} apis
 * @param {{projectId: number}} param
 * @return {*}
 */
async function listBranches (
  apis,
  { projectId }
) {
  const branches = await gitApi.Branches.all(projectId)
  return branches
}

/**
 * @description 获取仓库文件目录
 * @param {API.ER_APIs} apis
 * @param {project: number} param
 * @return {Array}
 */
async function getRepositoryTree (apis, { projectId, page = 1, pageSize = 100, ref = 'master' }) {
  const res = await axios({
    method: 'get',
    url: `${GIT_HOST}/api/v4/projects/${projectId}/repository/tree?recursive=true&ref=${ref}&page=${page}&per_page=${pageSize}`,
    headers: {
      'PRIVATE-TOKEN': GIT_ACCESS_TOKEN
    }
  })
  return res?.data || []
}

/**
 * @description 从组里查询项目
 * @param {API.ER_APIs} apis
 * @param {{groupId: number, search: string}} param
 * @return {Array}
 */
async function searchProjectsFromGroup (apis, {
  groupId = GIT_NAMESPACE_ID,
  search
}) {
  const res = await axios({
    method: 'get',
    url: `${GIT_HOST}/api/v4/groups/${groupId}/search?scope=projects&search=${search}&per_page=1000`,
    headers: {
      'PRIVATE-TOKEN': GIT_ACCESS_TOKEN
    }
  })
  return res?.data || []
}

/**
 * @description 添加 git hook
 * @param {API.ER_APIs} apis
 * @param {{projectId: number, url: string}} param
 * @return {Array}
 */
async function addGitHook (apis, {
  projectId,
  url
}) {
  const res = await axios({
    method: 'post',
    url: `${GIT_HOST}/api/v4/projects/${projectId}/hooks`,
    data: {
      id: projectId,
      url
    },
    headers: {
      'PRIVATE-TOKEN': GIT_ACCESS_TOKEN
    }
  })
  return res?.data || []
}

// ---------------------------- 模板相关-------------------------------------
const templatePath = path.join(path.resolve(), '/template')
const templateName = 'template-react'

/**
 * @description clone模板
 */
function cloneTemplate () {
  const cmd = `
  if [ ! -d "${templatePath}" ];then
      mkdir ${templatePath}
  fi
  cd ${templatePath}
  if [ ! -d "${templateName}" ];then
      git clone https://oauth2:${GIT_ACCESS_TOKEN}@git.corp.kuaishou.com/product-planet-codebase/templates/${templateName}.git
  fi`
  exec(cmd)
}

/**
 * @description 更新本地模板
 */
function updateTemplate (callback = () => {}) {
  const cmd = `
  cd ${templatePath}/${templateName}
  git pull origin master`
  exec(cmd, callback)
}

export {
  getGitProjectById,
  createGitProject,
  createGitCommit,
  getGitUserInfo,
  getGitMembers,
  addGitMemeber,
  getRepositoryTree,
  searchProjectsFromGroup,
  addGitHook,
  createMR,
  cloneTemplate,
  updateTemplate,
  createBranch,
  listBranches,
  listMergeRequest
}
