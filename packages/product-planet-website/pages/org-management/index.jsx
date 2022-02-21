import Button from '@/components/Button'
import useStore from '@/hooks/useStore'
import api from '@/services/api'
import { getUserInfo } from '@/store/UserInfo'
import {
  createElement,
  createComponent,
  atomComputed,
  reactive,
  useViewEffect,
  atom
} from 'axii'
import { Select } from 'axii-components'
import CreateOrg from './CreateOrg'
import Members from './Members'

/**
 * @type {import('axii').FC}
 */
function OrgManagement () {
  const user = useStore((root) => root.UserInfo)
  const currentOrg = atom()
  const orgs = reactive([])
  const selectedOrg = atom()
  const showOrgCreate = atom(false)
  const isOwner = atomComputed(() => user.value?.id === currentOrg.value?.owner)

  const fetchCurrent = async () => {
    const res = await api.orgs.getCurrentOrg()
    currentOrg.value = res
  }
  const fetchOrgs = async () => {
    const res = await api.orgs.getOrgs()
    orgs.splice(0, orgs.length, ...res)
    selectedOrg.value = orgs.find((e) => e.id === currentOrg.value.id)
  }
  const handleSwitch = async () => {
    await api.orgs.setCurrentOrg(selectedOrg.value.id)
    getUserInfo()
    fetchCurrent()
  }
  const handleCreated = async () => {
    getUserInfo()
    fetchCurrent()
    fetchOrgs()
  }

  useViewEffect(() => {
    fetchCurrent().then(() => {
      fetchOrgs()
    })
  })

  return (
    <container block block-width-100vw block-height="100%">
      <content
        inline
        inline-flex
        inline-padding-left-56px
        flex-direction-column>
        <div>
          <h3 block>当前组织</h3>
          <Select
            layout:block-width-200px
            layout:block-margin-right-4px
            options={orgs}
            value={selectedOrg}
            renderOption={(option) => option.name}
          />
          <Button
            primary
            disabled={atomComputed(
              () => currentOrg.value?.id === selectedOrg.value?.id
            )}
            onClick={handleSwitch}>
            切换
          </Button>
          <Button
            layout:inline
            layout:inline-margin-left-4px
            onClick={() => {
              showOrgCreate.value = true
            }}>
            创建
          </Button>
        </div>
        {() => (isOwner.value ? <Members orgId={currentOrg.value.id} /> : null)}
      </content>
      <CreateOrg visible={showOrgCreate} onCreated={handleCreated} />
    </container>
  )
}

OrgManagement.Style = (frag) => {
  frag.root.elements.container.style({
    backgroundColor: '#fff'
  })
}

export default createComponent(OrgManagement)
