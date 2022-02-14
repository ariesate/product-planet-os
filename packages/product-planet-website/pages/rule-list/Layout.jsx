import { createElement, createComponent, atom, Fragment } from 'axii'
import RuleDetail from './RuleDetail'
import RuleList from './RuleList'

/**
 * @type {import('axii').FC}
 */
function Layout () {
  const ruleId = atom()
  return (
    <rule-list-container block block-padding-24px>
      {() =>
        ruleId.value ? <RuleDetail id={ruleId} /> : <RuleList ruleId={ruleId} />
      }
    </rule-list-container>
  )
}

export default createComponent(Layout)
