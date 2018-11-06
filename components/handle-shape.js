import Utils from '../utils'

import {
  HANDLER_MOVE,
  HANDLER_ROTATE,
  HANDLER_TOP_LEFT,
  HANDLER_TOP_MIDDLE,
  HANDLER_TOP_RIGHT,
  HANDLER_BOTTOM_LEFT,
  HANDLER_BOTTOM_MIDDLE,
  HANDLER_BOTTOM_RIGHT,
  HANDLER_MIDDLE_LEFT,
  HANDLER_MIDDLE_RIGHT
} from '../emun'

const THROTTLE_DELAY_TIME = 30
const MINIMUM_SIZE = 4

const resetSize = () => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  rotate: 0
})

/**
 * 获取旋转后的手柄坐标
 * @param  {Object} rect     形状的宽高坐标
 * @param  {Object} center   旋转中心的坐标
 * @param  {String} position 手柄名称
 * @return {Object}          旋转后的手柄坐标
 */
const getPoint = (rect, center, position) => {
  let point

  switch (position) {
    case HANDLER_TOP_LEFT:
      point = {
        x: rect.x,
        y: rect.y
      }
      return Utils.getRotatedPoint(point, center, rect.rotate)
    case HANDLER_TOP_MIDDLE:
      point = {
        x: rect.x + (rect.width / 2),
        y: rect.y
      }
      return Utils.getRotatedPoint(point, center, rect.rotate)
    case HANDLER_TOP_RIGHT:
      point = {
        x: rect.x + rect.width,
        y: rect.y
      }
      return Utils.getRotatedPoint(point, center, rect.rotate)
    case HANDLER_BOTTOM_LEFT:
      point = {
        x: rect.x,
        y: rect.y + rect.height
      }
      return Utils.getRotatedPoint(point, center, rect.rotate)
    case HANDLER_BOTTOM_MIDDLE:
      point = {
        x: rect.x + (rect.width / 2),
        y: rect.y + rect.height
      }
      return Utils.getRotatedPoint(point, center, rect.rotate)
    case HANDLER_BOTTOM_RIGHT:
      point = {
        x: rect.x + rect.width,
        y: rect.y + rect.height
      }
      return Utils.getRotatedPoint(point, center, rect.rotate)
    case HANDLER_MIDDLE_LEFT:
      point = {
        x: rect.x,
        y: rect.y + (rect.height / 2)
      }
      return Utils.getRotatedPoint(point, center, rect.rotate)
    case HANDLER_MIDDLE_RIGHT:
      point = {
        x: rect.x + rect.width,
        y: rect.y + (rect.height / 2)
      }
      return Utils.getRotatedPoint(point, center, rect.rotate)
    default:
      point = {
        x: rect.x,
        y: rect.y
      }
      return Utils.getRotatedPoint(point, center, rect.rotate)
  }
}

/**
 * 获取关键变量（计算尺寸调整逻辑用）
 * @param  {String} handler 手柄名称
 * @return {Object}         关键变量集合
 */
const getKeyVariable = function(handler) {
  const viewportRef = this.getViewportRef()
  const rect = {
    x: this.x,
    y: this.y,
    width: this.width,
    height: this.height,
    rotate: this.rotate
  }
  const center = {
    x: rect.x + (rect.width / 2),
    y: rect.y + (rect.height / 2)
  }
  const handlePoint = getPoint(rect, center, handler)
  const sPoint = {
    x: center.x + Math.abs(handlePoint.x - center.x) * (handlePoint.x < center.x ? 1 : -1),
    y: center.y + Math.abs(handlePoint.y - center.y) * (handlePoint.y < center.y ? 1 : -1)
  }
  const proportion = this.$parent.lockProportions ? (rect.width / rect.height) : 1

  return {
    viewportRef, // 页面SVG元素的引用（计算鼠标位置需要用到）
    rect, // 元素原始几何信息（xy宽高）
    center, // 元素原始中心点坐标
    handlePoint, // 当前拖动手柄的虚拟坐标（旋转后的坐标）
    sPoint, // 拖动手柄的对称点的坐标（假设拖动的是左上角手柄，那么他的对称点就是右下角的点）
    proportion // 宽高比
  }
}

const handleShape = {
  name: 'handle-shape',
  props: {
    name: String,
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    rotate: Number,

    movable: { // 是否可位移拖拽
      type: Boolean,
      default: true
    },
    resizeable: { // 是否可缩放
      type: Boolean,
      default: true
    },
    rotatable: { // 是否可旋转
      type: Boolean,
      default: true
    },

    // 修正值（格式为{x:0, y: 0, width: 0, height: 0}）
    correct: {
      type: Object,
      default: resetSize
    },

    // 获取svg画板dom的方法
    getViewportRef: Function,

    // 点击编辑区时的鼠标事件对象
    mouseEvent: window.MouseEvent
  },
  computed: {
    correctedShape() { // 修正后的宽高边距
      const correctedShape = {
        x: this.x + this.correct.x,
        y: this.y + this.correct.y,
        width: this.width + this.correct.width,
        height: this.height + this.correct.height,
        rotate: this.rotate
      }

      if (correctedShape.width < MINIMUM_SIZE || (correctedShape.height < MINIMUM_SIZE)) {
        return {
          x: this.x,
          y: this.y,
          width: this.width,
          height: this.height,
          rotate: this.rotate
        }
      }

      return correctedShape
    }
  },
  render() {
    const shape = this.correctedShape
    const dragHandler = this.movable ? { on: { mousedown: this.dragElement } } : {}

    return (
      <g transform={`rotate(${shape.rotate},${shape.x + shape.width / 2},${shape.y + shape.height / 2})`}>
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill="transparent"
          stroke-dasharray="1"
          stroke="#666"
          stroke-width="1"
          {...dragHandler}
        />
        <svg
          viewBox={`0 0 ${shape.width} ${shape.height}`}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          style="overflow:visible"
        >
          <g stroke="#000" stroke-width="1" fill="#fff">
            {
              this.rotatable && (
                <g>
                  <line x1="50%" x2="50%" y1="0" y2={-30} stroke-dasharray={1} />
                  <circle title={HANDLER_ROTATE} cx="50%" r={4} cy={-30} fill="#16ea00" onMousedown={this.dragRotateHandle} />
                </g>
              )
            }
            {
              this.resizeable && (
                <g>
                  <circle title={HANDLER_TOP_LEFT} cx="0" r={4} cy="0" fill="#fff" onMousedown={this.dragTopLeftHandle} />
                  <circle title={HANDLER_TOP_MIDDLE} cx="50%" r={4} cy="0" fill="#fff" onMousedown={this.dragTopMiddleHandle} />
                  <circle title={HANDLER_TOP_RIGHT} cx="100%" r={4} cy="0" fill="#fff" onMousedown={this.dragTopRightHandle} />
                  <circle title={HANDLER_BOTTOM_LEFT} cx="0" r={4} cy="100%" fill="#fff" onMousedown={this.dragBottomLeftHandle} />
                  <circle title={HANDLER_BOTTOM_MIDDLE} cx="50%" r={4} cy="100%" fill="#fff" onMousedown={this.dragBottomMiddleHandle} />
                  <circle title={HANDLER_BOTTOM_RIGHT} cx="100%" r={4} cy="100%" fill="#fff" onMousedown={this.dragBottomRightHandle} />
                  <circle title={HANDLER_MIDDLE_LEFT} cx="0%" r={4} cy="50%" fill="#fff" onMousedown={this.dragMiddleLeftHandle} />
                  <circle title={HANDLER_MIDDLE_RIGHT} cx="100%" r={4} cy="50%" fill="#fff" onMousedown={this.dragMiddleRightHandle} />
                </g>
              )
            }
          </g>
        </svg>
      </g>
    )
  },
  mounted() {
    this.dragElement(this.mouseEvent)
  },
  methods: {
    emitChanging(action, shape, handlerPosition) {
      const Shape = {
        x: shape.x === undefined ? this.x : shape.x,
        y: shape.y === undefined ? this.y : shape.y,
        width: shape.width === undefined ? this.width : shape.width,
        height: shape.height === undefined ? this.height : shape.height,
        rotate: shape.rotate === undefined ? this.rotate : shape.rotate
      }

      this.$emit('changing', action, Shape, handlerPosition)
    },
    emitChanged(action) {
      this.$emit('changed', action)
    },

    dragElement(e) {
      let draged = false
      let changed = false
      const viewportRef = this.getViewportRef()
      const mouseDownPosition = Utils.getPositionInSvg(viewportRef, e)
      const originPosition = {
        x: this.x,
        y: this.y
      }

      const dragMoveHandler = Utils.throttle(e => {
        draged = true
        const mousePosition = Utils.getPositionInSvg(viewportRef, e)
        const currentPosition = {
          x: originPosition.x + mousePosition.x - mouseDownPosition.x,
          y: originPosition.y + mousePosition.y - mouseDownPosition.y
        }

        !changed && this.emitChanging(HANDLER_MOVE, {
          x: currentPosition.x,
          y: currentPosition.y
        })
      }, THROTTLE_DELAY_TIME, true)

      const dragEndHandler = ev => {
        draged && this.emitChanged(HANDLER_MOVE)
        changed = true
        window.removeEventListener('mousemove', dragMoveHandler)
        window.removeEventListener('mouseup', dragEndHandler)
      }

      window.addEventListener('mousemove', dragMoveHandler)
      window.addEventListener('mouseup', dragEndHandler)
    },

    dragRotateHandle(e) {
      let draged = false
      let changed = false
      const viewportRef = this.getViewportRef()

      const originCenter = {
        x: this.x + (this.width / 2),
        y: this.y + (this.height / 2)
      }

      const mousemoveHandler = Utils.throttle(e => {
        draged = true
        const currentPosition = Utils.getPositionInSvg(viewportRef, e)

        const a = Math.abs(currentPosition.x - originCenter.x)
        const b = Math.abs(currentPosition.y - originCenter.y)
        const c = Math.sqrt(a * a + b * b)
        let rotate = Math.round((Math.asin(b / c) / Math.PI * 180))

        if (currentPosition.x >= originCenter.x && currentPosition.y <= originCenter.y) { // 第一象限
          rotate = 90 - rotate
        } else if (currentPosition.x <= originCenter.x && currentPosition.y <= originCenter.y) { // 第二象限
          rotate = 270 + rotate
        } else if (currentPosition.x <= originCenter.x && currentPosition.y >= originCenter.y) { // 第三象限
          rotate = 270 - rotate
        } else if (currentPosition.x >= originCenter.x && currentPosition.y >= originCenter.y) { // 第四象限
          rotate = 90 + rotate
        }

        rotate = rotate === 360 ? 0 : parseInt(rotate)
        !changed && this.emitChanging(HANDLER_ROTATE, { rotate })
      }, THROTTLE_DELAY_TIME, true)

      const mouseupHandler = ev => {
        draged && this.emitChanged(HANDLER_ROTATE)
        changed = true
        window.removeEventListener('mousemove', mousemoveHandler)
        window.removeEventListener('mouseup', mouseupHandler)
      }

      window.addEventListener('mousemove', mousemoveHandler)
      window.addEventListener('mouseup', mouseupHandler)
    },

    dragTopLeftHandle(e) {
      let draged = false
      let changed = false
      const { viewportRef, sPoint, rect, proportion } = getKeyVariable.call(this, 'top-left')

      const mousemoveHandler = Utils.throttle(e => {
        draged = true

        let currentPosition = Utils.getPositionInSvg(viewportRef, e)
        let newCenterPoint = Utils.getCenterPoint(currentPosition, sPoint)
        let newTopLeftPoint = Utils.getRotatedPoint(currentPosition, newCenterPoint, -rect.rotate)
        let newBottomRightPoint = Utils.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)

        let newWidth = newBottomRightPoint.x - newTopLeftPoint.x
        let newHeight = newBottomRightPoint.y - newTopLeftPoint.y

        if (this.$parent.lockProportions) {
          if (newWidth / newHeight > proportion) {
            newTopLeftPoint.x = newTopLeftPoint.x + Math.abs(newWidth - newHeight * proportion)
            newWidth = newHeight * proportion
          } else {
            newTopLeftPoint.y = newTopLeftPoint.y + Math.abs(newHeight - newWidth / proportion)
            newHeight = newWidth / proportion
          }

          let rotatedTopLeftPoint = Utils.getRotatedPoint(newTopLeftPoint, newCenterPoint, rect.rotate)
          newCenterPoint = Utils.getCenterPoint(rotatedTopLeftPoint, sPoint)
          newTopLeftPoint = Utils.getRotatedPoint(rotatedTopLeftPoint, newCenterPoint, -rect.rotate)
          newBottomRightPoint = Utils.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)

          newWidth = newBottomRightPoint.x - newTopLeftPoint.x
          newHeight = newBottomRightPoint.y - newTopLeftPoint.y
        }

        if (newWidth < MINIMUM_SIZE || (newHeight < MINIMUM_SIZE)) {
          return
        }

        !changed && this.emitChanging(HANDLER_TOP_LEFT, {
          x: newTopLeftPoint.x,
          y: newTopLeftPoint.y,
          width: newWidth,
          height: newHeight
        }, newTopLeftPoint)
      }, THROTTLE_DELAY_TIME, true)

      const mouseupHandler = ev => {
        draged && this.emitChanged(HANDLER_TOP_LEFT)
        changed = true
        window.removeEventListener('mousemove', mousemoveHandler)
        window.removeEventListener('mouseup', mouseupHandler)
      }

      window.addEventListener('mousemove', mousemoveHandler)
      window.addEventListener('mouseup', mouseupHandler)
    },

    dragTopMiddleHandle(e) {
      let draged = false
      let changed = false
      const { rect, viewportRef, sPoint, handlePoint } = getKeyVariable.call(this, 'top-middle')

      const mousemoveHandler = Utils.throttle(e => {
        draged = true
        const currentPosition = Utils.getPositionInSvg(viewportRef, e)

        const rotatedCurrentPosition = Utils.getRotatedPoint(currentPosition, handlePoint, -rect.rotate)
        const rotatedTopMiddlePoint = Utils.getRotatedPoint({
          x: handlePoint.x,
          y: rotatedCurrentPosition.y
        }, handlePoint, rect.rotate)

        const newHeight = Math.sqrt(Math.pow(rotatedTopMiddlePoint.x - sPoint.x, 2) + Math.pow(rotatedTopMiddlePoint.y - sPoint.y, 2), 2)
        const newCenter = {
          x: rotatedTopMiddlePoint.x - (Math.abs(sPoint.x - rotatedTopMiddlePoint.x) / 2) * (rotatedTopMiddlePoint.x > sPoint.x ? 1 : -1),
          y: rotatedTopMiddlePoint.y + (Math.abs(sPoint.y - rotatedTopMiddlePoint.y) / 2) * (rotatedTopMiddlePoint.y > sPoint.y ? -1 : 1)
        }

        if (newHeight < MINIMUM_SIZE) {
          return
        }

        if (!Utils.pointInRect(newCenter, handlePoint, sPoint)) {
          return
        }

        !changed && this.emitChanging(HANDLER_TOP_MIDDLE, {
          height: newHeight,
          y: newCenter.y - (newHeight / 2),
          x: newCenter.x - (rect.width / 2)
        }, rotatedTopMiddlePoint)
      }, THROTTLE_DELAY_TIME, true)

      const mouseupHandler = ev => {
        draged && this.emitChanged(HANDLER_TOP_MIDDLE)
        changed = true
        window.removeEventListener('mousemove', mousemoveHandler)
        window.removeEventListener('mouseup', mouseupHandler)
      }

      window.addEventListener('mousemove', mousemoveHandler)
      window.addEventListener('mouseup', mouseupHandler)
    },

    dragTopRightHandle(e) {
      let draged = false
      let changed = false
      const { viewportRef, sPoint, rect, proportion } = getKeyVariable.call(this, 'top-right')

      const mousemoveHandler = Utils.throttle(e => {
        draged = true
        let currentPosition = Utils.getPositionInSvg(viewportRef, e)
        let newCenterPoint = Utils.getCenterPoint(currentPosition, sPoint)

        let newTopRightPoint = Utils.getRotatedPoint(currentPosition, newCenterPoint, -rect.rotate)
        let newBottomLeftPoint = Utils.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)

        let newWidth = newTopRightPoint.x - newBottomLeftPoint.x
        let newHeight = newBottomLeftPoint.y - newTopRightPoint.y

        if (this.$parent.lockProportions) {
          if (newWidth / newHeight > proportion) {
            newTopRightPoint.x = newTopRightPoint.x - Math.abs(newWidth - newHeight * proportion)
            newWidth = newHeight * proportion
          } else {
            newTopRightPoint.y = newTopRightPoint.y + Math.abs(newHeight - newWidth / proportion)
            newHeight = newWidth / proportion
          }

          let rotatedTopRightPoint = Utils.getRotatedPoint(newTopRightPoint, newCenterPoint, rect.rotate)
          newCenterPoint = Utils.getCenterPoint(rotatedTopRightPoint, sPoint)
          newTopRightPoint = Utils.getRotatedPoint(rotatedTopRightPoint, newCenterPoint, -rect.rotate)
          newBottomLeftPoint = Utils.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)

          newWidth = newTopRightPoint.x - newBottomLeftPoint.x
          newHeight = newBottomLeftPoint.y - newTopRightPoint.y
        }

        if (newWidth < MINIMUM_SIZE || (newHeight < MINIMUM_SIZE)) {
          return
        }

        !changed && this.emitChanging(HANDLER_TOP_RIGHT, {
          x: newBottomLeftPoint.x,
          y: newTopRightPoint.y,
          height: newHeight,
          width: newWidth
        }, newTopRightPoint)
      }, THROTTLE_DELAY_TIME, true)

      const mouseupHandler = ev => {
        draged && this.emitChanged(HANDLER_TOP_RIGHT)
        changed = true
        window.removeEventListener('mousemove', mousemoveHandler)
        window.removeEventListener('mouseup', mouseupHandler)
      }

      window.addEventListener('mousemove', mousemoveHandler)
      window.addEventListener('mouseup', mouseupHandler)
    },

    dragBottomLeftHandle(e) {
      let draged = false
      let changed = false
      const { viewportRef, sPoint, rect, proportion } = getKeyVariable.call(this, 'bottom-left')

      const mousemoveHandler = Utils.throttle(e => {
        draged = true
        let currentPosition = Utils.getPositionInSvg(viewportRef, e)
        let newCenterPoint = Utils.getCenterPoint(currentPosition, sPoint)

        let newTopRightPoint = Utils.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)
        let newBottomLeftPoint = Utils.getRotatedPoint(currentPosition, newCenterPoint, -rect.rotate)

        let newWidth = newTopRightPoint.x - newBottomLeftPoint.x
        let newHeight = newBottomLeftPoint.y - newTopRightPoint.y

        if (this.$parent.lockProportions) {
          if (newWidth / newHeight > proportion) {
            newBottomLeftPoint.x = newBottomLeftPoint.x + Math.abs(newWidth - newHeight * proportion)
            newWidth = newHeight * proportion
          } else {
            newBottomLeftPoint.y = newBottomLeftPoint.y - Math.abs(newHeight - newWidth / proportion)
            newHeight = newWidth / proportion
          }

          let rotatedBottomLeftPoint = Utils.getRotatedPoint(newBottomLeftPoint, newCenterPoint, rect.rotate)
          newCenterPoint = Utils.getCenterPoint(rotatedBottomLeftPoint, sPoint)
          newBottomLeftPoint = Utils.getRotatedPoint(rotatedBottomLeftPoint, newCenterPoint, -rect.rotate)
          newTopRightPoint = Utils.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)

          newWidth = newTopRightPoint.x - newBottomLeftPoint.x
          newHeight = newBottomLeftPoint.y - newTopRightPoint.y
        }

        if (newWidth < MINIMUM_SIZE || (newHeight < MINIMUM_SIZE)) {
          return
        }

        !changed && this.emitChanging(HANDLER_BOTTOM_LEFT, {
          x: newBottomLeftPoint.x,
          y: newTopRightPoint.y,
          height: newHeight,
          width: newWidth
        }, newBottomLeftPoint)
      }, THROTTLE_DELAY_TIME, true)

      const mouseupHandler = ev => {
        draged && this.emitChanged(HANDLER_BOTTOM_LEFT)
        changed = true
        window.removeEventListener('mousemove', mousemoveHandler)
        window.removeEventListener('mouseup', mouseupHandler)
      }

      window.addEventListener('mousemove', mousemoveHandler)
      window.addEventListener('mouseup', mouseupHandler)
    },

    dragBottomMiddleHandle(e) {
      let draged = false
      let changed = false
      const { rect, viewportRef, sPoint, handlePoint } = getKeyVariable.call(this, 'bottom-middle')

      const mousemoveHandler = Utils.throttle(e => {
        draged = true
        const currentPosition = Utils.getPositionInSvg(viewportRef, e)

        const rotatedCurrentPosition = Utils.getRotatedPoint(currentPosition, handlePoint, -rect.rotate)
        const rotatedBottomMiddlePoint = Utils.getRotatedPoint({
          x: handlePoint.x,
          y: rotatedCurrentPosition.y
        }, handlePoint, rect.rotate)

        const newHeight = Math.sqrt(Math.pow(rotatedBottomMiddlePoint.x - sPoint.x, 2) + Math.pow(rotatedBottomMiddlePoint.y - sPoint.y, 2), 2)
        const newCenter = {
          x: rotatedBottomMiddlePoint.x - (Math.abs(sPoint.x - rotatedBottomMiddlePoint.x) / 2) * (rotatedBottomMiddlePoint.x > sPoint.x ? 1 : -1),
          y: rotatedBottomMiddlePoint.y + (Math.abs(sPoint.y - rotatedBottomMiddlePoint.y) / 2) * (rotatedBottomMiddlePoint.y > sPoint.y ? -1 : 1)
        }

        if (newHeight < MINIMUM_SIZE) {
          return
        }

        if (!Utils.pointInRect(newCenter, handlePoint, sPoint)) {
          return
        }

        !changed && this.emitChanging(HANDLER_BOTTOM_MIDDLE, {
          height: newHeight,
          y: newCenter.y - (newHeight / 2),
          x: newCenter.x - (rect.width / 2)
        }, rotatedBottomMiddlePoint)
      }, THROTTLE_DELAY_TIME, true)

      const mouseupHandler = ev => {
        draged && this.emitChanged(HANDLER_BOTTOM_MIDDLE)
        changed = true
        window.removeEventListener('mousemove', mousemoveHandler)
        window.removeEventListener('mouseup', mouseupHandler)
      }

      window.addEventListener('mousemove', mousemoveHandler)
      window.addEventListener('mouseup', mouseupHandler)
    },

    dragBottomRightHandle(e) {
      let draged = false
      let changed = false
      const { viewportRef, sPoint, rect, proportion } = getKeyVariable.call(this, 'bottom-right')

      const mousemoveHandler = Utils.throttle(e => {
        draged = true
        let currentPosition = Utils.getPositionInSvg(viewportRef, e)
        let newCenterPoint = Utils.getCenterPoint(currentPosition, sPoint)

        let newTopLeftPoint = Utils.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)
        let newBottomRightPoint = Utils.getRotatedPoint(currentPosition, newCenterPoint, -rect.rotate)

        let newWidth = newBottomRightPoint.x - newTopLeftPoint.x
        let newHeight = newBottomRightPoint.y - newTopLeftPoint.y

        if (this.$parent.lockProportions) {
          if (newWidth / newHeight > proportion) {
            newBottomRightPoint.x = newBottomRightPoint.x - Math.abs(newWidth - newHeight * proportion)
            newWidth = newHeight * proportion
          } else {
            newBottomRightPoint.y = newBottomRightPoint.y - Math.abs(newHeight - newWidth / proportion)
            newHeight = newWidth / proportion
          }

          let rotatedBottomRightPoint = Utils.getRotatedPoint(newBottomRightPoint, newCenterPoint, rect.rotate)
          newCenterPoint = Utils.getCenterPoint(rotatedBottomRightPoint, sPoint)
          newBottomRightPoint = Utils.getRotatedPoint(rotatedBottomRightPoint, newCenterPoint, -rect.rotate)
          newTopLeftPoint = Utils.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)

          newWidth = newBottomRightPoint.x - newTopLeftPoint.x
          newHeight = newBottomRightPoint.y - newTopLeftPoint.y
        }

        if (newWidth < MINIMUM_SIZE || (newHeight < MINIMUM_SIZE)) {
          return
        }

        !changed && this.emitChanging(HANDLER_BOTTOM_RIGHT, {
          x: newTopLeftPoint.x,
          y: newTopLeftPoint.y,
          height: newHeight,
          width: newWidth
        }, newBottomRightPoint)
      }, THROTTLE_DELAY_TIME, true)

      const mouseupHandler = ev => {
        draged && this.emitChanged(HANDLER_BOTTOM_RIGHT)
        changed = true
        window.removeEventListener('mousemove', mousemoveHandler)
        window.removeEventListener('mouseup', mouseupHandler)
      }

      window.addEventListener('mousemove', mousemoveHandler)
      window.addEventListener('mouseup', mouseupHandler)
    },

    dragMiddleLeftHandle(e) {
      let draged = false
      let changed = false
      const { rect, viewportRef, sPoint, handlePoint } = getKeyVariable.call(this, 'middle-left')

      const mousemoveHandler = Utils.throttle(e => {
        draged = true
        const currentPosition = Utils.getPositionInSvg(viewportRef, e)

        const rotatedCurrentPosition = Utils.getRotatedPoint(currentPosition, handlePoint, -rect.rotate)
        const rotatedLeftMiddlePoint = Utils.getRotatedPoint({
          x: rotatedCurrentPosition.x,
          y: handlePoint.y
        }, handlePoint, rect.rotate)

        const newWidth = Math.sqrt(Math.pow(rotatedLeftMiddlePoint.x - sPoint.x, 2) + Math.pow(rotatedLeftMiddlePoint.y - sPoint.y, 2), 2)
        const newCenter = {
          x: rotatedLeftMiddlePoint.x - (Math.abs(sPoint.x - rotatedLeftMiddlePoint.x) / 2) * (rotatedLeftMiddlePoint.x > sPoint.x ? 1 : -1),
          y: rotatedLeftMiddlePoint.y + (Math.abs(sPoint.y - rotatedLeftMiddlePoint.y) / 2) * (rotatedLeftMiddlePoint.y > sPoint.y ? -1 : 1)
        }

        if (newWidth < MINIMUM_SIZE) {
          return
        }

        if (!Utils.pointInRect(newCenter, handlePoint, sPoint)) {
          return
        }

        !changed && this.emitChanging(HANDLER_MIDDLE_LEFT, {
          width: newWidth,
          y: newCenter.y - (rect.height / 2),
          x: newCenter.x - (newWidth / 2)
        }, rotatedLeftMiddlePoint)
      }, THROTTLE_DELAY_TIME, true)

      const mouseupHandler = ev => {
        draged && this.emitChanged(HANDLER_MIDDLE_LEFT)
        changed = true
        window.removeEventListener('mousemove', mousemoveHandler)
        window.removeEventListener('mouseup', mouseupHandler)
      }

      window.addEventListener('mousemove', mousemoveHandler)
      window.addEventListener('mouseup', mouseupHandler)
    },

    dragMiddleRightHandle(e) {
      let draged = false
      let changed = false
      const { rect, viewportRef, sPoint, handlePoint } = getKeyVariable.call(this, 'middle-right')

      const mousemoveHandler = Utils.throttle(e => {
        draged = true
        const currentPosition = Utils.getPositionInSvg(viewportRef, e)

        const rotatedCurrentPosition = Utils.getRotatedPoint(currentPosition, handlePoint, -rect.rotate)
        const rotatedRightMiddlePoint = Utils.getRotatedPoint({
          x: rotatedCurrentPosition.x,
          y: handlePoint.y
        }, handlePoint, rect.rotate)

        const newWidth = Math.sqrt(Math.pow(rotatedRightMiddlePoint.x - sPoint.x, 2) + Math.pow(rotatedRightMiddlePoint.y - sPoint.y, 2), 2)
        const newCenter = {
          x: rotatedRightMiddlePoint.x - (Math.abs(sPoint.x - rotatedRightMiddlePoint.x) / 2) * (rotatedRightMiddlePoint.x > sPoint.x ? 1 : -1),
          y: rotatedRightMiddlePoint.y + (Math.abs(sPoint.y - rotatedRightMiddlePoint.y) / 2) * (rotatedRightMiddlePoint.y > sPoint.y ? -1 : 1)
        }

        if (newWidth < MINIMUM_SIZE) {
          return
        }

        if (!Utils.pointInRect(newCenter, handlePoint, sPoint)) {
          return
        }

        !changed && this.emitChanging(HANDLER_MIDDLE_RIGHT, {
          width: newWidth,
          y: newCenter.y - (rect.height / 2),
          x: newCenter.x - (newWidth / 2)
        }, rotatedRightMiddlePoint)
      }, THROTTLE_DELAY_TIME, true)

      const mouseupHandler = ev => {
        draged && this.emitChanged(HANDLER_MIDDLE_RIGHT)
        changed = true
        window.removeEventListener('mousemove', mousemoveHandler)
        window.removeEventListener('mouseup', mouseupHandler)
      }

      window.addEventListener('mousemove', mousemoveHandler)
      window.addEventListener('mouseup', mouseupHandler)
    }
  }
}

export default handleShape