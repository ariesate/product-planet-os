export default (search = location.search) => {
  if (!search) return {}
  return search.slice(1).split('&').reduce((last, currentPair) => {
    const current = currentPair.split('=')
    return {
      ...last,
      [current[0]]: current[1] || true
    }
  }, {})
}
