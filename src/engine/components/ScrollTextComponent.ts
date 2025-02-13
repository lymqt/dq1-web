import { InnerGameComponent } from '.'
import Component from '../component'
import { measureLocalPositionByGravity } from '../layout/layout'
import { AssetLoader } from '../resource'
import { delay, nextFrame } from '../time'
import { DefaultFont, DefaultLineHeightScale, TextData } from './TextComponent'

type ScrollTextData = {
  type: string
  speed?: number
  screenScrollSpeed?: number
  textSpeed?: number
} & TextData

const DefaultTextSpeed = 30
const DefaultScreenScrollSpeed = 3000
const DefaultShowMaxLines = 4

type TextLine = LineInfo & { prefix: string; prefixWidth: number }

@InnerGameComponent
export default class ScrollTextComponent extends Component {
  initText = ''
  screenSpeed = DefaultScreenScrollSpeed
  textSpeed = DefaultTextSpeed
  font: Required<Font> = DefaultFont
  textLines: TextLine[] = []
  lineHeight = DefaultLineHeightScale
  padding: Vector4 = [0, 0, 0, 0]

  start() {
    if (this.textLines.length === 0) this.showTextScroll(this.initText)
  }

  async showTextScroll(
    text: string,
    prefix = '',
    scrollLineCallback?: () => void,
    callback?: () => void
  ) {
    if (text.length === 0) return

    const prefixInfo = this.renderer.measureText(
      prefix,
      this.textMaxWidth,
      this.font
    )[0]
    const lineInfos = this.renderer.measureText(
      text,
      this.textMaxWidth - prefixInfo.width,
      this.font
    )
    let previousTextLineLenght = this.textLines.length
    for (let i = 0; i < lineInfos.length; i++) {
      if (this.textLines.length >= DefaultShowMaxLines) {
        const needScrollLineLength =
          this.textLines.length - DefaultShowMaxLines + 1
        await this.scrollLineLength(needScrollLineLength)
        previousTextLineLenght -= needScrollLineLength
      }
      const currentLine = lineInfos[i]
      this.textLines.push({
        ...currentLine,
        text: '',
        prefix: i == 0 ? prefix : '',
        prefixWidth: prefixInfo.width,
      })
      scrollLineCallback && scrollLineCallback()
      for (let i = 0; i < currentLine.text.length; i++) {
        this.textLines[this.textLines.length - 1].text = currentLine.text.slice(
          0,
          i + 1
        )
        await delay(this.textSpeed)
      }
    }
    if (previousTextLineLenght > 0) {
      await this.scrollLineLength(previousTextLineLenght)
    }
    callback && callback()
  }

  showText(text: string, prefix = '') {
    this.textLines = []
    this.appendText(text, prefix)
  }

  appendText(text: string, prefix = '') {
    const prefixInfo = this.renderer.measureText(
      prefix,
      this.textMaxWidth,
      this.font
    )[0]
    this.textLines.push(
      ...this.renderer
        .measureText(text, this.textMaxWidth - prefixInfo.width, this.font)
        .map((currentLine, i) => ({
          ...currentLine,
          prefix: i == 0 ? prefix : '',
          prefixWidth: prefixInfo.width,
        }))
    )
  }

  clearText() {
    this.textLines = []
  }

  async scrollClearText() {
    await this.scrollLineLength(this.textLines.length)
  }

  private async scrollLineLength(lineLenght: number) {
    let deltaScroll = 0
    const lineHeight = this.lineHeight * this.font.size
    const initLocalY = this.root.localY

    while (lineLenght > 0) {
      deltaScroll += this.screenSpeed / 1000
      this.root.localY = initLocalY - deltaScroll
      if (deltaScroll >= lineHeight) {
        deltaScroll = 0
        this.textLines.shift()
        this.root.localY = initLocalY
        lineLenght--
      }
      await nextFrame()
    }
  }

  render() {
    const context = this.engine.renderer.selectedRendererContext
    context.save()
    context.rect(0, 0, this.width, this.height)
    context.clip()

    const lineHeight = this.lineHeight * this.font.size
    const offsetY =
      (this.padding[0] + Math.max(1, this.lineHeight - 1) * this.font.size) >> 1
    this.textLines.forEach((line, i) => {
      const offsetX =
        measureLocalPositionByGravity(
          this.font.align,
          this.textMaxWidth,
          line.width
        ) + this.padding[3]
      if (line.text.length > 0) {
        this.renderer.drawTextOneLine(
          line.prefix,
          this.cameraPosition[0] + offsetX,
          this.cameraPosition[1] + offsetY + i * lineHeight,
          this.font,
          this.textMaxWidth,
          this.root.alpha
        )
      }
      this.renderer.drawTextOneLine(
        line.text,
        this.cameraPosition[0] + offsetX + line.prefixWidth,
        this.cameraPosition[1] + offsetY + i * lineHeight,
        this.font,
        this.textMaxWidth,
        this.root.alpha
      )
    })

    context.restore()
  }

  get textMaxWidth() {
    return this.width - this.padding[1] - this.padding[3]
  }

  parseData(_: AssetLoader, data: ScrollTextData): void {
    this.initText = data.text ?? this.initText
    this.screenSpeed = data.screenScrollSpeed ?? this.screenSpeed
    this.textSpeed = data.textSpeed ?? this.textSpeed
    if (data.font) this.font = { ...this.font, ...data.font }
    this.padding = data.padding ?? this.padding
    this.lineHeight = data.lineHeight ?? this.lineHeight
    this.padding = data.padding ?? this.padding
  }
}
