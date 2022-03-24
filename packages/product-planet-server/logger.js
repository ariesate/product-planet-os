
process.on('uncaughtException', (error) => {
  console.error({
    message: 'uncaughtException',
    err: error
  })
})

export default console
