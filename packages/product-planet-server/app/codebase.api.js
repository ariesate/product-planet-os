import util from 'util'
import _ from 'lodash'
import {
  getToken,
  createGitCommit,
  getRepositoryTree,
  createMR,
  createBranch,
  listBranches,
  listMergeRequest,
  listRepos
} from './github.js'
import { getProductERModel } from './product.api.js'
import {
  firstChartToUpperCase,
  flattenChildren
} from './util.js'

import { Octokit } from '@octokit/rest'
import octokitCommitMultipleFiles from 'octokit-commit-multiple-files'
const Octokit2 = Octokit.plugin(octokitCommitMultipleFiles)

// 产品星球代码提交分支
const PRODUCT_PLANET_BRANCH = 'feat/product'

/**
 * @description 更新codebase
 * @param {API.ER_APIs} apis
 * @param {Object} param
 * @param {{productId: number, productName: string, versionId: number, codebaseId: number}} param
 * @return {Object}
 */
export async function updateCodebase (
  apis,
  { token, productId, productName, versionId },
  {
    projectName,
    targetBranch,
    pageType = 'tsx',
    pagePath = '/pages',
    metadataPath = '/'
  }
) {
  const octokit = new Octokit2({
    auth: token,
    userAgent: 'product-planet',
    baseUrl: 'https://api.github.com'
  })

  const [owner, repo] = projectName.split('/')

  // ----------------检查分支---------------------------
  const branches = await listBranches(octokit, { owner, repo })
  let targetBranchSha = (_.find(branches, ['name', targetBranch]))?.commit?.sha
  let planetBranchSha = (_.find(branches, ['name', PRODUCT_PLANET_BRANCH]))?.commit?.sha
  const masterBranchSha = (_.find(branches, ['name', 'master']))?.commit?.sha
  if (!targetBranchSha && masterBranchSha) {
    const res = await createBranch(octokit, { owner, repo, branch: targetBranch, sha: masterBranchSha })
    targetBranchSha = res.object?.sha
  } else if (!targetBranch) {
    return 'Target branch dose not exist!'
  }
  if (!planetBranchSha && targetBranchSha) {
    const res = await createBranch(octokit, { owner, repo, branch: PRODUCT_PLANET_BRANCH, sha: targetBranchSha })
    planetBranchSha = res.object?.sha
  }
  // TODO:暂时没有很好的前后端都能读取的方案，元数据先全部放到前端
  const METADATA_DIR = `${_.trim(metadataPath, '/')}/metadata`
  // ----------------获取基础信息---------------------------
  const navs = (await getNavs.call(this, apis, versionId))[0]?.children || []
  const pages = await apis.find('Page', { version: versionId })
  const menuFromNavs = generateMenuData(navs)

  const gitFileTree = await getRepositoryTree(octokit, { owner, repo, branch: PRODUCT_PLANET_BRANCH })
  const rules = await apis.find('Rule', { version: versionId })

  // ----------------组装commit内容------------------------
  const actions = []
  // 新增页面内容
  const { actions: newPageActions, menu: menuFromPages, links } = await createPageActions(apis, {
    gitFileTree,
    navs,
    pages,
    pageType,
    pagePath
  })
  actions.push(...newPageActions)

  // 页面链接
  if (links.length) {
    actions.push({
      filePath: `${METADATA_DIR}/links.js`,
      content: `export const links = ${util.inspect(
          links,
          false,
          Infinity
        )};`
    })
  }

  // 产品基础信息
  const productData = {
    productId,
    productName,
    versionId,
    codebase: projectName
  }
  actions.push({
    filePath: `${METADATA_DIR}/product.js`,
    content: `export const product = ${util.inspect(
        productData,
        false,
        Infinity
      )};`
  })

  // 路由信息
  const menuData = [...menuFromNavs, ...menuFromPages]
  actions.push({
    filePath: `${METADATA_DIR}/router.js`,
    content: `export const router = ${util.inspect(menuData, false, Infinity)};`
  })

  // 新增or修改元数据
  const ruleData = getRuleContent(rules)
  Object.keys(ruleData).forEach((key) => {
    const { key: ruleKey, content } = ruleData[key]
    const rule = rules.find((item) => item.key === ruleKey) || {}
    actions.push({
      filePath: `${METADATA_DIR}/${key}.js`,
      content: `//元数据名称: ${rule.name || ''}\n//元数据描述: ${
          rule.description || ''
        }\n//元数据key: ${rule.key || ''}\n
  export const ${key} = %%--${JSON.stringify(content, null, 2)}--%%;`
    })
  })

  // 生成ER内容
  const ERData = await getProductERModel.call(this, apis, productId)
  if (ERData && ERData['entities'] && ERData['relations']) {
    actions.push({
      filePath: `${METADATA_DIR}/er.storage.json`,
      content: JSON.stringify(ERData, null, 4)
    })
  }

  // 删除废弃的元数据文件
  gitFileTree.forEach((file) => {
    if (
      file.path &&
        file.path.includes(`${METADATA_DIR}/`) &&
        actions.findIndex((action) => action.filePath === file.path) === -1
    ) {
      actions.push({
        action: 'delete',
        filePath: file.path
      })
    }
  })

  const { files, filesToDelete } = repairCommits(actions)
  try {
    // 提交代码
    const commit = await createGitCommit(octokit, { owner, repo, branch: PRODUCT_PLANET_BRANCH, message: 'feat: sync data from product planet', files, filesToDelete })
    // 提MR
    const mrs = await listMergeRequest(octokit, { owner, repo, head: PRODUCT_PLANET_BRANCH, base: targetBranch })
    let mr = Array.isArray(mrs) && mrs[0]
    if (!mr) {
      mr = await createMR(octokit, { owner, repo, head: PRODUCT_PLANET_BRANCH, base: targetBranch, title: 'Sync data from product planet' })
    }
    return { commit, files, filesToDelete, mr }
  } catch (e) {
    return { e, files, filesToDelete }
  }
}

/**
 * @description 获取全部导航
 * @param {API.ER_APIs} apis
 * @param {Number} versionId
 * @return {Array}
 */
async function getNavs (apis, versionId) {
  const getSubNavs = async (parentId) => {
    const navs = await apis.find(
      'Navigation',
      { parent: parentId },
      {},
      {
        id: true,
        name: true,
        type: true,
        page: { id: true, name: true, key: true, path: true }
      }
    )
    for (let i = 0; i < navs.length; i++) {
      const nav = navs[i]
      if (nav.type === 'group') {
        nav.children = await getSubNavs(nav.id)
      }
    }
    return navs
  }
  const rootNavs = await apis.find(
    'Navigation',
    { type: 'root', version: versionId },
    {},
    { children: true, id: true, name: true, type: true }
  )
  for (let i = 0; i < rootNavs.length; i++) {
    const rootNav = rootNavs[i]
    for (let j = 0; j < rootNav.children.length; j++) {
      const nav = rootNav.children[j]
      if (nav.type === 'group') {
        nav.children = await getSubNavs(nav.id)
      } else if (nav.type === 'page' && !nav.page_id) {
        // 修复一级页面导航缺失page信息
        const navDetail = await apis.find(
          'Navigation',
          { id: nav.id },
          {},
          {
            id: true,
            name: true,
            type: true,
            page: { id: true, name: true, key: true, path: true }
          }
        )
        Object.assign(nav, navDetail[0] || {})
      }
    }
  }
  return rootNavs
}

/**
 * @description 从导航创建左侧菜单
 * @param {Array} navs
 * @return {*}
 */
function generateMenuData (navs = []) {
  const getMenuFromNav = (nav) => {
    const menu = {
      name: nav.name
    }
    if (nav.type === 'group' && nav.children?.length) {
      const children = nav.children.map((child) => getMenuFromNav(child))
      menu.path = `/group-${nav.id}`
      menu.redirect = children[0]?.path || children[0]?.redirect
      menu.children = children
    } else if (nav.type === 'page') {
      const fileName = nav.page_key || `page-${nav.page_id}`
      menu.path = nav.page_path || `/${fileName}`
      menu.pageKey = nav.page_key
      menu.pageId = nav.page_id
    }
    return menu
  }
  const menuData = navs.map((nav) => getMenuFromNav(nav))
  return menuData
}

/**
 * @description 获取新增页面的commit actions
 * @param {Array} fileTree git的文件目录数
 * @param {Array} navs 导航数据
 * @param {Array} pages 页面数据
 * @return {Array}
 */
async function createPageActions (
  apis,
  { gitFileTree = [], navs = [], pages = [], pageType, pagePath }
) {
  const actions = []
  const menu = []
  // 扁平化navs
  const flattenNavs = flattenChildren(navs)
  // 全部链接
  const allLinks = []
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const fileName = page.key || `page-${page.id}`
    const filePath = `${_.trim(pagePath, '/')}/${fileName}/index.${pageType}`
    const inGitTree = gitFileTree.findIndex((file) => file.path === filePath) > -1
    const inNav = flattenNavs.findIndex((nav) => nav.page_id === page.id) > -1
    // 页面链接
    const links = (await apis.find(
      'Link',
      { page: page.id },
      {},
      { name: true, type: true, target: { page: true } }
    )).map(link => {
      const targetId = link.target_page
      const targetPage = pages.find(page => page.id === targetId)
      return { name: link.name, type: link.type, source: { name: page.name, path: page.path }, target: { name: targetPage.name, path: targetPage.path } }
    })
    allLinks.push(...links)
    // 创建页面文件
    const normalContent = getPageTemplate(pageType, {
      exportName: fileName,
      pageName: page.name,
      links
    })
    if (!inGitTree) {
      actions.push({
        action: 'create',
        filePath: filePath,
        content: normalContent
      })
    }

    // 添加页面到menu
    if (!inNav) {
      menu.push({
        path: page.path || `/${fileName}`,
        name: page.name,
        pageKey: page.key,
        pageId: page.id,
        notOnMenu: true
      })
    }
  }
  return { actions, menu, links: allLinks }
}

/**
 * @description 获取元数据内容
 * @param {Array} rules
 */
function getRuleContent (rules = []) {
  const ruleMap = {}
  rules.forEach((rule) => {
    const { type, key: ruleKey, name, content } = rule
    const key = `${ruleKey || name}${firstChartToUpperCase(type)}`
    let ruleContent
    if (type !== 'map') {
      try {
        ruleContent = JSON.parse(content)
      } catch (e) {
        ruleContent = content
      }
    } else {
      const { columns = [], rows = [], data: rules } = JSON.parse(content) || {}
      ruleContent = {}
      rows.forEach((row, rowIdx) => {
        const obj = {}
        const rule = rules[rowIdx] || {}
        columns.forEach((col, coldex) => {
          obj[col.key] = rule[coldex]
        })
        ruleContent[row.key] = obj
      })
    }
    ruleMap[key] = {
      key: ruleKey,
      content: ruleContent
    }
  })
  return ruleMap
}

/**
 * @description 修复commit,根据文件是否已经存在,修改update和create
 * @param {Array} fileTree
 * @param {Array} actions
 * @return {Array}
 */
function repairCommits (actions) {
  const files = {}; const filesToDelete = []
  actions.forEach((item) => {
    // 去除content中的模板标识
    if (typeof item.content === 'string') {
      let content = item.content
      content = content.replace(/"%%--/g, '')
      content = content.replace(/--%%"/g, '')
      content = content.replace(/%%--/g, '')
      content = content.replace(/--%%/g, '')
      item.content = content
    }
    if (item.action === 'update' || item.action === 'create') {
      files[item.filePath] = item.content
    } else if (item.action === 'delete') {
      filesToDelete.push(item.filePath)
    }
  })
  return { files, filesToDelete }
}

/**
 * @description 获取页面模板
 * @param {string} type jsx|tsx
 * @param {{exportName: string, pageName: string}} param
 * @return {*}
 */
function getPageTemplate (type, { exportName, pageName, links = [] }) {
  const linkStrArr = links.map(link => {
    const target = link.target
    return `<div><a href='${target.path || '/'}' target="_blank" rel="noreferrer">${target.name}</a></div>`
  })
  const template = {
    tsx: `
import React from 'react';
const ${firstChartToUpperCase(
      _.camelCase(exportName)
    )}: React.FC<any> = props => {
    return (
    <div className="container">
    <h1>${pageName}</h1>
    ${linkStrArr.length ? linkStrArr.join('\n') : ''}
    </div>
    );
    };
export default ${firstChartToUpperCase(_.camelCase(exportName))};
`,
    jsx: `
import React from 'react';
const ${firstChartToUpperCase(_.camelCase(exportName))} = props => {
    return (
    <div className="container">
    <h1>${pageName}</h1>
    ${linkStrArr.length ? linkStrArr.join('\n') : ''}
    </div>
    );
    };
export default ${firstChartToUpperCase(_.camelCase(exportName))};
`
  }
  return template[type] || ''
}

export async function getGithubToken (apis, { code, state }) {
  const token = await getToken({ code, state })
  return token
}

export async function listGithubRepos (apis, { token }) {
  const octokit = new Octokit2({
    auth: token,
    userAgent: 'product-planet',
    baseUrl: 'https://api.github.com'
  })
  const list = await listRepos(octokit)
  return list
}
