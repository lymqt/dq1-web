import { InnerGameComponent } from '.'
import Component from '../component'
import { DefaultInputCheckDelay } from '../input'
import GridLayout from '../layout/GridLayout'
import { AssetLoader } from '../resource'
import TextItemComponent from './TextItemComponent'

type ListComponentData = {
  type: string
  canSelect: boolean
}

@InnerGameComponent
export default class ListComponent extends Component {
  private _hoverListener: ListenerFunction[] = []
  private _selectListener: ListenerFunction[] = []
  private _cancelListener: ListenerFunction[] = []
  private _isCanSelect = false
  private _items: ListItem[] = []
  private _adapter?: Adapter<ItemData>
  private _col = 1
  private _row = 1

  private _previusIndex = -1
  private _currentIndex = 0
  private _selecting = true

  awake(): void {
    this._items = this.root.getComponentsInChildren(ListItem) as ListItem[]
    this.getRowAndColfromLayout()
  }

  private getRowAndColfromLayout() {
    if (this.root.configLayout instanceof GridLayout) {
      this._col = this.root.configLayout.col
      this._row = this.root.configLayout.row
    } else {
      this._row = this._items.length
      this._col = 1
    }
  }

  update(): void {
    if (!this._selecting || this._items.length === 0) return

    if (this.input.isConfirmPressed()) {
      this._items[this._currentIndex].select()
      this.trigger('select')
    } else if (this.input.isCancelPressed()) {
      this.trigger('cancel')
    } else {
      const hor = this.input.getHorizontalValue(DefaultInputCheckDelay)
      const ver = this.input.getVerticalValue(DefaultInputCheckDelay)
      let index = this._currentIndex
      if (
        (hor === 1 &&
          (this._currentIndex + hor) % this._col !== 0 &&
          this._currentIndex < this.dataLength - 1) ||
        (hor === -1 && this._currentIndex % this._col !== 0)
      ) {
        index += hor
      }
      if (
        this._currentIndex + ver * this._col >= 0 &&
        this._currentIndex + ver * this._col < this.dataLength
      ) {
        index += ver * this._col
      }
      if (index !== this._currentIndex) {
        this._items[this._currentIndex].unhover()
        this.setCursorIndex(index)
      }
    }
  }

  setCursorIndex(index: number) {
    this._currentIndex = index
    for (let i = 0; i < this._items.length; i++) {
      if (i === this._currentIndex) this._items[i].hover()
      else this._items[i].unhover()
    }
    this._items[this._currentIndex].hover()
    this.trigger('hover')
  }

  public setAdapter<T extends ItemData>(adapter: Adapter<T>) {
    this._adapter = adapter
    for (let i = 0; i < this._items.length; i++) {
      adapter.getView(this._items[i], adapter.getData(i), i)
    }
  }

  public addHoverListenner(listener: ListenerFunction) {
    this._hoverListener.push(listener)
  }

  public addSelectListener(listener: ListenerFunction) {
    this._selectListener.push(listener)
  }

  public addCancelListener(listener: ListenerFunction) {
    this._cancelListener.push(listener)
  }

  public removeHoverListenner(listener: ListenerFunction) {
    this._hoverListener = this._hoverListener.filter((l) => l !== listener)
  }

  public removeSelectListener(listener: ListenerFunction) {
    this._selectListener = this._selectListener.filter((l) => l !== listener)
  }

  public removeCancelListener(listener: ListenerFunction) {
    this._cancelListener = this._cancelListener.filter((l) => l !== listener)
  }

  public trigger(type: 'hover' | 'select' | 'cancel') {
    if (type === 'hover') {
      this._hoverListener.forEach((l) =>
        l(this.currentItem, this._currentIndex)
      )
    } else if (type === 'select') {
      this._selectListener.forEach((l) =>
        l(this.currentItem, this._currentIndex)
      )
    } else {
      this._cancelListener.forEach((l) => l())
    }
  }

  public get dataLength(): number {
    return this._adapter?.length ?? 0
  }

  public get currentItem() {
    return this._items[this._currentIndex]
  }

  parseData(_: AssetLoader, data: ListComponentData): void {
    this._isCanSelect =
      typeof data.canSelect === 'boolean' ? data.canSelect : this._isCanSelect
  }
}

export abstract class ListItem extends Component implements SelectListener {
  isCanSelect = false

  abstract select(...args: unknown[]): void
  abstract unselect(...args: unknown[]): void
  abstract hover(...args: unknown[]): void
  abstract unhover(...args: unknown[]): void
}

export type ItemData = Record<string, unknown>

export abstract class Adapter<T extends ItemData> {
  private _data: T[] = []

  constructor(data: T[]) {
    this._data = data
  }

  public getData(index: number) {
    return this._data[index]
  }

  public get length() {
    return this._data.length
  }

  abstract getView(view: ListItem, data: T, position: number): void
}

export class TextAdapter extends Adapter<{ text: string }> {
  getView(view: TextItemComponent, data: { text: string }): void {
    view.setText(data.text)
  }
}
