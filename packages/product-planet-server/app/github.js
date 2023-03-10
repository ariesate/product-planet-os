/*
 * @Description: git授权
 * @Author: fanglin05
 * @Date: 2022-02-21 10:17:25
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-02-22 16:22:02
 */

import axios from 'axios'
import config from '../config/index.js'

const { clientId, clientSecret, appName, authUrl, authTokenUrl, homePage, backPage } = config.github

async function getToken ({ code, state }) {
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
 * @description 提交commit
 * @param {API.ER_APIs} token
 * @param {{projectId: number, branch: string, message: string, actions: array, options: object}} param
 * @return {Object}
 */
async function createGitCommit (octokit, { owner, repo, branch, message, files = {}, filesToDelete = [] }) {
  const res = await octokit.repos.createOrUpdateFiles({
    owner,
    repo,
    branch,
    createBranch: false,
    changes: [
      {
        message,
        files,
        filesToDelete
      }
    ]
  })
  return res
}

/**
 * @description 创建MR
 * @param {API.ER_APIs} token
 * @param {{projectId: number, sourceBranch: string, targetBranch: string, title: string}} param
 * @return {*}
 */
async function createMR (
  octokit, { owner, repo, head, base, title }
) {
  const res = await octokit.request(`POST /repos/${owner}/${repo}/pulls`, {
    owner,
    repo,
    head,
    base,
    title
  })
  return res.data
}

/**
 * @description 获取全部MR
 * @param {API.ER_APIs} token
 * @param {{projectId: number, sourceBranch: string, targetBranch:string, state: 'opened'|'closed'|'locked'|'merged'}} param
 * @return {*}
 */
async function listMergeRequest (
  octokit, { owner, repo, head, base, state = 'open' }
) {
  const res = await octokit.request(`GET /repos/${owner}/${repo}/pulls`, {
    owner,
    repo,
    state,
    head,
    base
  })
  return res.data
}

/**
 * @description 创建分支
 * @param {API.ER_APIs} token
 * @param {{projectId: number, branchName: string, ref: string}} param
 * @return {*}
 */
async function createBranch (
  octokit, { owner, repo, branch, sha }
) {
  const res = await octokit.request(`POST /repos/${owner}/${repo}/git/refs`, {
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha
  })
  return res.data
}

/**
 * @description 列出所有分支
 * @param {API.ER_APIs} token
 * @param {{projectId: number}} param
 * @return {*}
 */
async function listBranches (
  octokit, { owner, repo }
) {
  const res = await octokit.request(`GET /repos/${owner}/${repo}/branches`, {
    owner,
    repo
  })
  return res.data
}

/**
 * @description 获取仓库文件目录
 * @param {API.ER_APIs} token
 * @param {project: number} param
 * @return {Array}
 */
async function getRepositoryTree (octokit, { owner, repo, branch }) {
  const res = await octokit.request(`GET /repos/${owner}/${repo}/branches/master`, {
    owner,
    repo,
    branch
  })
  const sha = res.data?.commit?.sha
  const tree = await octokit.request(`GET /repos/${owner}/${repo}/git/trees/${sha}`, {
    owner,
    repo,
    ref: branch,
    path: '/',
    recursive: 1
  })
  return tree.data?.tree
}

/**
 * @description 获取仓库列表
 * @param {API.ER_APIs} token
 * @param {project: number} param
 * @return {Array}
 */
async function listRepos (octokit) {
  const res = await octokit.request('GET /user/repos')
  return res.data
}

export {
  getToken,
  createGitCommit,
  getRepositoryTree,
  createMR,
  createBranch,
  listBranches,
  listMergeRequest,
  listRepos
}
