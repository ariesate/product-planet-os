import {
  createElement,
  createComponent,
  propTypes,
  useViewEffect, atom
} from 'axii'
import ButtonNew from '@/components/Button.new'
import IatRecorder from './recorder'

Voice.propTypes = {
  onTextChange: propTypes.function.default(() => () => {})
}

let iatRecorder
let countInterval

function Voice ({ onTextChange }) {
  const time = atom('00: 00')
  const buttonText = atom('开始录音')
  const disabled = atom(true)

  useViewEffect(() => {
    iatRecorder = new IatRecorder()
    iatRecorder.onWillStatusChange = function (oldStatus, status) {
      let seconds = 0
      if (status === 'ing') {
        buttonText.value = '结束录音'
        countInterval = setInterval(() => {
          seconds++
          time.value = `0${Math.floor(seconds / 60)}：${Math.floor(seconds / 10)}${seconds % 10}`
          if (seconds >= 60) {
            this.stop()
            clearInterval(countInterval)
          }
        }, 1000)
      } else if (status === 'init') {
        buttonText.value = '开始录音'
        time.value = '00: 00'
      } else {
        time.value = '00: 00'
        buttonText.value = '识别中'
        disabled.value = true
        clearInterval(countInterval)
      }
    }
    iatRecorder.onTextChange = function (text) {
      disabled.value = false
      buttonText.value = '开始录音'
      onTextChange(text)
    }
    iatRecorder.verify = () => {
      disabled.value = false
    }
    iatRecorder.start()
    return () => {
      iatRecorder.stop()
      clearInterval(countInterval)
    }
  })

  const handleClick = () => {
    buttonText.value === '开始录音' ? iatRecorder.start() : iatRecorder.stop()
  }

  return (
    <container
      block
      flex-display
      flex-direction-column
      flex-align-items-center
      block-padding-top-20px
    >
        <div block block-padding-bottom-10px>
            <span><span>{() => time}</span> / 01: 00</span>
        </div>
        <ButtonNew onClick={handleClick} disabled={disabled}>{() => buttonText}</ButtonNew>
    </container>
  )
}

export default createComponent(Voice)
