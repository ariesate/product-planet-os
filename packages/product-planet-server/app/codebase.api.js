import { readFile, readdir, lstat } from 'fs/promises'
import path from 'path'
import util from 'util'
import _ from 'lodash'
import { now } from '../dependence/util.js'
import { getCurrentUserInfo } from './user.api.js'
import {
  createGitProject,
  createGitCommit,
  addGitMemeber,
  updateTemplate,
  searchProjectsFromGroup,
  getRepositoryTree,
  addGitHook,
  createMR,
  createBranch,
  listBranches,
  listMergeRequest
} from './git.js'
import { getProductERModel } from './product.api.js'
import {
  getEnName,
  includeChinese,
  firstChartToUpperCase,
  flattenChildren
} from './util.js'
import { generateLCDP } from './lcdp.api.js'
import { sendMessage } from './kim.api.js'

const __dirname = path.resolve()
// 初始化模板相关
const defaultTemplate = {
  path: path.join(__dirname, '/template/template-react'),
  pagePath: 'packages/website/src/modules',
  metadataPath: 'packages/website',
  appPath: 'packages/server/app',
  branch: 'master'
}
// project负责人权限maintainer，避免其删除项目
const CREATOR_ACCESS_LEVEL = 'maintainer'
// hook: push_events
const HOOK_URL = 'https://product-planet.corp.kuaishou.com/webhooks/gitlab'
// 产品星球代码提交分支
const PRODUCT_PLANET_BRANCH = 'feat/product'

/**
 * @description 创建codebase
 * @param {API.ER_APIs} apis
 * @param {{name: string, id: number}} param
 * @return {*}
 */
export async function createCodebase (apis, { name, id }) {
  try {
    // 名称规范：若名称包含中文，则仓库名为 project-id
    const enName = includeChinese(name)
      ? getEnName({ name, id }, { identifyKey: 'project' })
      : name
    const products = await searchProjectsFromGroup.call(this, apis, {
      search: enName
    })
    const index = products.findIndex((pro) => pro.name === enName)
    let codebaseName = enName
    // 处理重名情况
    if (index >= 0) {
      codebaseName = /^project-\d+$/.test(enName)
        ? `${enName}-${now()}`
        : getEnName({ name, id }, { identifyKey: 'project' }, true)
    }
    // 创建git 仓库
    const project = await createGitProject.call(this, apis, {
      name: codebaseName
    })
    if (!(project && project.id)) return null
    // 添加creator为管理员
    const { name: username } = await getCurrentUserInfo.call(this, apis)
    await addGitMemeber.call(this, apis, {
      projectId: project.id,
      username,
      accessLevel: CREATOR_ACCESS_LEVEL
    })
    // 添加hook
    await addGitHook.call(this, apis, {
      projectId: project.id,
      url: HOOK_URL
    })
    // 提交初始化代码
    updateTemplate(async () => {
      const actions = await getActions(codebaseName)
      const commit = await createGitCommit.call(this, apis, {
        projectId: project.id,
        branch: defaultTemplate.branch,
        message: 'init project',
        actions
      })
    })
    // const project = { id: 50772, web_url: 'https://git.corp.kuaishou.com/product-planet-codebase/product-local/test1223' }
    const codebase = await apis.create('Codebase', {
      product: id,
      projectId: project.id,
      projectName: name,
      projectUrl: project.web_url,
      targetBranch: defaultTemplate.branch,
      pageType: 'tsx',
      pagePath: defaultTemplate.pagePath,
      metadataPath: defaultTemplate.metadataPath
    })
    return {
      project,
      codebase
    }
  } catch (e) {
    console.error(e)
    return e?.message
  }
}

/**
 * @description 更新codebase
 * @param {API.ER_APIs} apis
 * @param {Object} param
 * @param {{productId: number, productName: string, versionId: number, codebaseId: number}} param
 * @return {Object}
 */
export async function updateCodebase (
  apis,
  { productId, productName, versionId },
  {
    projectId,
    targetBranch = 'master',
    pageType = 'tsx',
    pagePath = 'packages/website/src/modules',
    metadataPath = '/'
  }
) {
  // ----------------检查分支---------------------------
  const branches = await listBranches.call(this, apis, { projectId })
  const hasProductBranch =
    Array.isArray(branches) &&
    _.findIndex(branches, ['name', PRODUCT_PLANET_BRANCH]) > -1
  const hasTargetBranch =
    Array.isArray(branches) &&
    _.findIndex(branches, ['name', targetBranch]) > -1
  if (!hasTargetBranch) {
    await createBranch.call(this, apis, {
      projectId,
      branchName: targetBranch,
      ref: 'master'
    })
  }
  if (!hasProductBranch) {
    await createBranch.call(this, apis, {
      projectId,
      branchName: PRODUCT_PLANET_BRANCH,
      ref: targetBranch
    })
  }

  // TODO:暂时没有很好的前后端都能读取的方案，元数据先全部放到前端
  const METADATA_DIR = `${_.trim(metadataPath, '/')}/metadata`
  // ----------------获取基础信息---------------------------
  const { name: username } = await getCurrentUserInfo.call(this, apis)
  const navs = (await getNavs.call(this, apis, versionId))[0]?.children || []
  const pages = await apis.find('Page', { version: versionId })
  const menuFromNavs = generateMenuData(navs)

  const gitFileTree = [] // 每次最大只能获取100条数据，可能会多次请求
  let page = 1
  const pageSize = 100
  while (page < 10) {
    const list = await getRepositoryTree.call(this, apis, {
      projectId,
      ref: PRODUCT_PLANET_BRANCH,
      pageSize,
      page
    })
    gitFileTree.push(...list)
    if (!Array.isArray(list) || list.length < pageSize) {
      break
    }
    ++page
  }

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
    codebaseId: projectId
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
  const defualtERPath = `${defaultTemplate.appPath}/planet.storage.json`
  const hasDefualtERFile =
    _.findIndex(gitFileTree, (file) => file.path === defualtERPath) > -1
  if (ERData && ERData['entities'] && ERData['relations']) {
    actions.push({
      filePath: hasDefualtERFile
        ? defualtERPath
        : `${METADATA_DIR}/er.storage.json`,
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

  const newActions = repairCommits(gitFileTree, actions)
  try {
    // 提交代码
    const commit = await createGitCommit.call(this, apis, {
      projectId,
      branch: PRODUCT_PLANET_BRANCH,
      message: 'feat: sync data from product planet',
      actions: newActions
    })
    // 提MR
    const mrs = await listMergeRequest.call(this, apis, {
      projectId,
      targetBranch,
      sourceBranch: PRODUCT_PLANET_BRANCH,
      state: 'opened'
    })
    let mr = Array.isArray(mrs) && mrs[0]
    if (!mr) {
      mr = await createMR.call(this, apis, {
        projectId,
        sourceBranch: PRODUCT_PLANET_BRANCH,
        targetBranch,
        title: 'Sync data from product planet'
      })
    }
    // 通知用户前去合并
    await sendMessage.call(
      this,
      {},
      {
        username: username,
        msgType: 'markdown',
        markdown: {
          content: `**【${productName}】同步代码通知**\n>状态：<font color=coral>待合并</font>\n>变更人：${username}\n>[<font color=blue>点击前往git合并代码>>></font>](${mr.web_url})`
        }
      }
    )
    return { commit, newActions, mr }
  } catch (e) {
    return { e, actions: newActions }
  }
}

/**
 * @description 从本地文件读取模板内容，生成commit actions
 * @param {String} dir 模板地址
 * @return {Array}
 */
async function loadTemplate (dir) {
  const actions = []
  const fileOrDirList = await readdir(dir)
  for (const fileOrDir of fileOrDirList) {
    if (
      fileOrDir.includes('.DS_Store') ||
      /\.git$/.test(fileOrDir) ||
      /\.log(\..*)?$/.test(fileOrDir)
    ) {
      continue
    }
    const fileOrDirPath = path.join(dir, fileOrDir)
    const cl = await lstat(fileOrDirPath)
    if (cl.isDirectory()) {
      const subActions = await loadTemplate(fileOrDirPath)
      actions.push(...subActions)
    } else {
      const content = await readFile(fileOrDirPath, 'base64')
      actions.push({
        action: 'create',
        filePath: fileOrDirPath,
        content,
        encoding: 'base64'
      })
    }
  }
  return actions
}

/**
 * @description 获取commit内容
 * @return {Array}
 */
async function getActions () {
  const actions = await loadTemplate(defaultTemplate.path)
  actions.forEach((item) => {
    item.filePath = item.filePath.replace(defaultTemplate.path, '')
  })
  return actions
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
        content: page.dollyId
          ? generateLCDP.call(this, null, page.dollyId)
          : normalContent
      })
    } else if (page.dollyId) {
      // 如果是千象页面，该页面几乎不会新增代码，且绑定的dollyId可能会变，需要每次执行更新
      actions.push({
        action: 'update',
        filePath: filePath,
        content: generateLCDP.call(this, null, page.dollyId)
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
function repairCommits (fileTree, actions) {
  if (Array.isArray(fileTree) && Array.isArray(actions)) {
    actions.forEach((item) => {
      const inGitTree =
        fileTree.findIndex((file) => file.path === item.filePath) > -1
      if (inGitTree && (!item.action || item.action === 'create')) {
        item.action = 'update'
      }
      if (!inGitTree && !item.action && typeof item.content === 'string') {
        item.action = 'create'
      }
      // 去除content中的模板标识
      if (typeof item.content === 'string') {
        let content = item.content
        content = content.replace(/"%%--/g, '')
        content = content.replace(/--%%"/g, '')
        content = content.replace(/%%--/g, '')
        content = content.replace(/--%%/g, '')
        item.content = content
      }
    })
  }
  return actions
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
