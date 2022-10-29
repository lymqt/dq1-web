/// <reference types="vite/client" />

type Color = string
type Sprite = HTMLImageElement
type Border = {
  width: number
  color?: Color
  radius?: number
}

type Background = {
  name: string
  sprite: Sprite | null
  color: Color
  scaleType: 'fit' | 'original'
  border: Border
  alpha: number
}

type Audio = HTMLAudioElement

// load sprite, audio, json
interface IResource {
  loadSprite(path: string): Promise<Sprite>
  loadAudio(): Promise<Audio>
  loadJson<T>(path: string): Promise<T>

  hasSprite(key: string): boolean
  getSprite(key: string): Sprite | null
}

// render
interface IRenderer {
  get width(): number
  get height(): number
  get context(): CanvasRenderingContext2D

  render(fn: () => void)

  drawSprite(sprite: Sprite, alpha: number, dx: number, dy: number): void
  drawSprite(
    sprite: Sprite,
    alpha: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void
  drawSprite(
    sprite: Sprite,
    alpha: number,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  )

  drawRectColorAndBorder(
    x: number,
    y: number,
    width: number,
    height: number,
    backgroundColor: Color,
    border: Border,
    alpha?: number
  )
}

interface ILayout {
  layout(): [number, number]
}

interface ITime {
  init(): void
  tick(delta: number | null): void
  get scaleDeltaTime(): number
}

interface LifeCycle {
  active: boolean
  start?(): void
  tick?: () => void
  update?: () => void
  render?: () => void
}

type ComponentData = {
  type: string
  [K in 'string']: any
}

type BackgroundData =
  | string
  | {
      sprite: string
      scaleType?: 'fit' | 'original'
      backgroundColor?: string
      borderWidth?: number
      borderColor?: string
      radius?: number
      alpha?: number
    }

type GameObjectData = {
  name?: string
  x: number
  y: number
  width: number
  height: number
  layout?: LayoutData
  active: boolean
  background?: BackgroundData
  alpha?: number
  children?: GameObjectData[]
  components?: ComponentData[]
}

type SceneData = {
  name: string
  root: GameObjectData
}

type LayoutGravity = HorizontalGravity | VerticalGaravity
type HorizontalGravity = 'center' | 'left' | 'right'
type VerticalGaravity = 'center' | 'top' | 'bottom'

type LayoutConfig =
  | { type: 'AbsoluteLayout' }
  | ({ type: 'VerticalLayout' } & VerticalLayoutConfig)
  | ({ type: 'GridLayout'; template: GameObjectData } & GridLayoutConfig)

type VerticalLayoutConfig = {
  gravity: HorizontalGravity
}

type GridLayoutConfig = {
  gravities: [HorizontalGravity, VerticalGaravity]
  cell: [number, number]
  col: number
  row: number
  spacing?: [number, number]
}
