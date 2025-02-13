import CanvasRenderer from './canvasRenderer'
import Resources from './resource'
import Time from './time'
import innerContainer from './components'
import './components/config'
import Input from './input'
import Camera from './camera'
import AudioManager from './audio'
import SceneManger from './sceneManager'
import I18N from './i18n'

export const GlobalTeamControllerMarker = '$TeamController'
export const GlobalSceneComponentMarker = '$GlobalSceneComponent'
export const GlobalWindowMarker = '$GlobalWindow'
export const GlobalFadingMarker = '$GlobalFading'
export const GlobalBattleInfo = '$GlobalBattleInfo'

class Engine {
  renderer: IRenderer
  resource: IResource
  time: Time
  input: Input
  camera: Camera
  audios: AudioManager
  i18n: I18N
  sceneManager: SceneManger
  componentContainer: Map<string, ComponentConstruct>
  private _globalVariables: Map<string, any> = new Map<string, any>()
  private _hoosTick?: Partial<Record<TickHook, HookFunc>>

  constructor(
    renderer: IRenderer,
    resources: IResource,
    audios: AudioManager,
    time: Time,
    input: Input,
    camera: Camera,
    i18n: I18N,
    componentContainer: Map<string, ComponentConstruct>
  ) {
    this.renderer = renderer
    this.resource = resources
    this.audios = audios
    this.time = time
    this.input = input
    this.camera = camera
    this.sceneManager = new SceneManger(this)
    this.i18n = i18n
    this.componentContainer = new Map<string, ComponentConstruct>([
      ...innerContainer,
      ...componentContainer,
    ])
  }

  init() {
    this.time.init()
    this.input.init()
    this.sceneManager.init()
  }

  run(hooksTick: Partial<Record<TickHook, HookFunc>>) {
    this._hoosTick = hooksTick
    this.init()
    requestAnimationFrame(() => this.tick())
  }

  tick() {
    this._hoosTick?.start && this._hoosTick.start(this)

    this._hoosTick?.beforeTime && this._hoosTick.beforeTime(this)
    this.time.tick()
    this._hoosTick?.afterTime && this._hoosTick.afterTime(this)

    this._hoosTick?.beforeInput && this._hoosTick.beforeInput(this)
    this.input.tick()
    this._hoosTick?.afterInput && this._hoosTick.afterInput(this)

    this._hoosTick?.beforeRender && this._hoosTick.beforeRender(this)
    this.renderer.render(() => {
      this.sceneManager.tick()
    })
    this._hoosTick?.afterRender && this._hoosTick.afterRender(this)
    this._hoosTick?.end && this._hoosTick.end(this)

    requestAnimationFrame(() => this.tick())
  }

  getVariable<T>(key: string): T {
    const value = this._globalVariables.get(key)
    if (!value) throw new Error(`Engine get variable error: not find ${key}`)
    return value as T
  }

  setVariable(key: string, value: any) {
    this._globalVariables.set(key, value)
  }
}

type EngineConfig = {
  renderer?: IRenderer
  resources?: IResource
  time?: Time
  input?: Input
  camera?: Camera
  componentContainer?: Map<string, ComponentConstruct>
  sceneManager?: SceneManger
  audios?: AudioManager
  i18n?: I18N
  postProcess?: IPostProcess[]
}

export function createEngine(config: EngineConfig = {}) {
  const renderer =
    config.renderer ?? new CanvasRenderer('core', config.postProcess || [])
  const resources = config.resources ?? new Resources()
  const audios = new AudioManager(resources)
  const time = config.time ?? new Time()
  const input = config.input ?? new Input(time)
  const camera = config.camera ?? new Camera(renderer.width, renderer.height)
  const i18n = config.i18n ?? new I18N()
  const componentContainer =
    config.componentContainer ?? new Map<string, ComponentConstruct>()

  return new Engine(
    renderer,
    resources,
    audios,
    time,
    input,
    camera,
    i18n,
    componentContainer
  )
}

export default Engine

type TickHook =
  | 'start'
  | 'beforeTime'
  | 'afterTime'
  | 'beforeInput'
  | 'afterInput'
  | 'beforeRender'
  | 'afterRender'
  | 'end'
type HookFunc = (engine: Engine) => void
