import { createElement, render, reactive, atom, useViewEffect } from 'axii'
import { Select, message } from 'axii-components'
import { historyLocation } from '@/router'
import { UserProduct } from '@/models'
import ButtonNew from '@/components/Button.new'

import {
  getSearch,
  addMember
} from '@/services/member'

import styles from './style.module.less'

export default function ProductMember () {
  const options = reactive([])
  const input = atom({ name: '' })
  const productId = Number(historyLocation.pathname.split('/')[2])
  const memberList = reactive([])

  useViewEffect(() => {
    updateMemberList()
  })

  const updateMemberList = async () => {
    const list = await UserProduct.getMembers(productId)
    if (Array.isArray(list)) {
      memberList.splice(0, memberList.length, ...list)
    }
  }

  const handleInputChange = async (a, b, c, e) => {
    if (e?.type === 'input') {
      // 输入
      const value = e.target?.value
      input.value = value
      const users = (await getSearch(value)) || []
      options.splice(0, options.length, ...users)
    }
  }

  const handleAddMember = async () => {
    const { id, name } = input.value
    if (id) {
      try {
        const res = await addMember({
          userName: id,
          productId,
          role: ''
        })
        updateMemberList()
        message.success('添加成功')
      } catch (e) {
        const msg = typeof e === 'object' ? e.message : e
        message.error(msg)
      }
    }
  }

  const handleDeleteMember = async (member) => {
    const { id } = member
    if (id) {
      try {
        await UserProduct.remove(id)
        updateMemberList()
        message.success('删除成功')
      } catch (e) {
        const msg = typeof e === 'object' ? e.message : e
        message.error(msg)
      }
    }
  }

  const renderHeader = () => {
    return (
      <div className={styles.header}>
        <div className={styles.title}>成员</div>
        <div className={styles.add}>
          <Select
            options={options}
            value={input}
            onChange={handleInputChange}
            renderOption={(option) => `${option.name} (${option.id})`}
            recommendMode
          />
          <ButtonNew primary onClick={handleAddMember}>
            添加成员
          </ButtonNew>
        </div>
      </div>
    )
  }

  const renderList = () => {
    return (
      <div className={styles.list}>
        {() =>
          memberList.map((member) => {
            let { name, displayName: dname, role } = member
            name = dname || name || ''
            return (
              <div key={member.id} className={styles.member}>
                {member.avatar
                  ? (
                  <img className={styles.img} src={member.avatar}></img>
                    )
                  : (
                  <div className={styles.img}>
                    {(name[0] || '').toLocaleUpperCase()}
                  </div>
                    )}
                <div className={styles.info}>
                  <div>{name}</div>
                  <div>{role || '成员'}</div>
                </div>
                {() =>
                  role === 'admin'
                    ? null
                    : (
                    <div
                      className={styles.delete}
                      onClick={handleDeleteMember.bind(this, member)}>
                      <i className="iconfont icon-delete-btn-icon"></i>
                    </div>
                      )
                }
              </div>
            )
          })
        }
      </div>
    )
  }
  return (
    <div className={styles.container}>
      {renderHeader()}
      {renderList()}
    </div>
  )
}
