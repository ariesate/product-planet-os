/*
 * @Description:
 * @Author: fanglin05
 * @Date: 2021-12-21 14:17:51
 * @LastEditors: fanglin05
 * @LastEditTime: 2022-01-13 14:32:27
 */
import axios from 'axios'
import _ from 'lodash'
import { getCurrentUserInfo } from './user.api.js'
import config from '../config/index.js'

const { lcdpDomain: baseUrl } = config.service

export function generateLCDP (apis, dollyId) {
  return `
import React, { Suspense, useEffect, useRef } from "react";
import { initPage, initLCPStore } from "@tangram/parser";

export default () => {
  async function initConfig() {
    const data = await initPage({
      pageId: ${dollyId}, // 千象平台中的页面dollyId
      // @ts-ignore
      env: 'production', // 确保千象页面发布线上
    });
    // @ts-ignore
    initLCPStore(data, document.querySelector("#lcdpContainer")!);
  }

  useEffect(() => {
    const init = async () => {
      initConfig();
    };
    init();
  }, []);

  return (
    <div id="lcdpContainer">
    </div>
  );
};
  `
}

async function getToken () {
  const data = await axios.get(`${baseUrl}/rest/open/fetch/token`)
  const { data: token, status } = data.data || {}
  return token
}

export async function createLcdp (apis, { versionId, pageId }) {
  const [{ lcdpId, path, name }] = await apis.find('Page', { id: pageId })
  if (lcdpId) return
  const [{ product_name: productName, product_id: productId, product_lcdpAppId: lcdpAppId, product_description: productDescription }] = await apis.find('ProductVersion', { id: versionId }, {}, { product: true })
  const { name: userName } = await getCurrentUserInfo.call(this, apis)
  const router = typeof path === 'string' ? `/${_.trim(path, '/')}` : '/'

  let appId = lcdpAppId
  if (!appId) {
    const token = await getToken()
    const { data: app } = await axios.post(`${baseUrl}/rest/open/app/create`, {
      name: productName,
      owner: userName,
      description: productDescription || productName || '',
      developers: [],
      token
    })
    appId = app?.data?.appId
    await apis.update('Product', productId, {
      lcdpAppId: appId
    })
  }
  const token = await getToken()
  const res = await axios.post(`${baseUrl}/rest/open/page/create`, {
    name,
    templateId: -1,
    appId,
    router,
    token,
    userName
  })
  await apis.update('Page', pageId, {
    lcdpId: res.data?.data?.pageId,
    dollyId: res.data?.data?.dollyId
  })
  return { appId, page: res.data?.data }
}
