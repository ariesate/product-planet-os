import Button from '@/components/Button'
import Input from '@/components/Input'
import { Org } from '@/models'
import api from '@/services/api'
import { createElement, createComponent, propTypes, atom } from 'axii'
import { useRequest } from 'axii-components'

/**
 * @type {import('axii').FC}
 */
function Members ({ org }) {
  const items = atom([])
  const email = atom('')
  const error = atom('')

  const handleAdd = async () => {
    if (!email.value) {
      error.value = '请输入邮箱'
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email.value)) {
      error.value = '请输入正确的邮箱'
      return
    }
    try {
      await api.orgs.addOrgMember(email.value)
    } catch (e) {
      error.value = e.message
      return
    }
    error.value = ''
    const res = await Org.findOne({
      where: {
        id: org.value.id
      },
      fields: {
        users: {
          id: true,
          email: true,
          avatar: true
        }
      }
    })
    items.value = res.users
  }

  useRequest(
    () => {
      return Org.findOne({
        where: {
          id: org.value.id
        },
        fields: {
          users: {
            id: true,
            email: true,
            avatar: true
          }
        }
      })
    },
    {
      data: items,
      processResponse: ({ data }, res) => {
        data.value = res.users
      }
    }
  )

  return (
    <div>
      <h3 block>成员管理({() => org.value.name})</h3>
      <div block block-margin-bottom-24px>
        <Input
          layout:block-width-200px
          layout:block-margin-right-4px
          value={email}
          error={error}
        />
        <Button primary onClick={handleAdd}>
          添加
        </Button>
      </div>
      <content block flex-display flex-direction-column>
        {() =>
          !items.value
            ? null
            : items.value.map((e) => (
                <user block flex-display flex-align-items-center key={e.id}>
                  <img
                    block
                    block-width-32px
                    block-height-32px
                    src={e.avatar}
                  />
                  <span block block-width-64px>
                    {e.displayName || '-'}
                  </span>
                  <span block>{e.email}</span>
                </user>
            ))
        }
      </content>
    </div>
  )
}

Members.propTypes = {
  orgId: propTypes.string.isRequired,
  org: propTypes.object.isRequired
}

Members.Style = (frag) => {
  frag.root.elements.content.style({
    gap: '8px'
  })
  frag.root.elements.user.style({
    gap: '16px'
  })
  frag.root.elements.img.style({
    borderRadius: '50%',
    backgroundColor: '#c4c4c4'
  })
}

export default createComponent(Members)
