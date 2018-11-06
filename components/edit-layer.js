import Utils from '../utils'
import handleShape from './handle-shape'

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

// 重置参考物的线框尺寸
const resetReferenceShape = () => [
  {x: 0, y: 0, width: 0, height: 0},
  {x: 0, y: 0, width: 0, height: 0}
]

const resetEditingShape = () => ({
  name: null,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  rotate: 0
})

const editLayer = {
  name: 'edit-layer',
  components: {
    handleShape
  },
  props: {
    // 画板宽度
    width: {
      type: Number,
      required: true
    },

    // 画板高度
    height: {
      type: Number,
      required: true
    },

    // 启用吸附对齐
    useMeasure: {
      type: Boolean,
      default: false
    },

    // 启用锁定比例
    lockProportions: {
      type: Boolean,
      default: false
    },

    // 对齐吸附阈值
    threshold: {
      type: Number,
      default: 8
    }
  },
  data() {
    return {
      editing: false,

      shapeList: [], // 元素几何属性列表，当开启吸附模式的时候会用到
      editingShape: resetEditingShape(),
      editingShapeConfig: {},

      mouseEvent: null,

      measuringLine: [ // 吸附参考线
        [[0, 0], [0, 0]],
        [[0, 0], [0, 0]]
      ],
      referenceShape: resetReferenceShape(), // 参考物线框
      corrected: { // 修正值
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    }
  },
  render() {
    const viewBox = `0 0 ${this.width} ${this.height}`

    return (
      <svg viewBox={viewBox} ref="svg">
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="transparent"
          onClick={this.handleResetEditStatus}
        />
        {this.$slots.default}
        {
          (this.editing && (this.editingShape.rotate === 0)) && (
            <g class="measure">
              <line
                x1={this.measuringLine[0][0][0]}
                y1={this.measuringLine[0][0][1]}
                x2={this.measuringLine[0][1][0]}
                y2={this.measuringLine[0][1][1]}
              />
              <line
                x1={this.measuringLine[1][0][0]}
                y1={this.measuringLine[1][0][1]}
                x2={this.measuringLine[1][1][0]}
                y2={this.measuringLine[1][1][1]}
              />
              <rect
                fill="none"
                x={this.referenceShape[0].x}
                y={this.referenceShape[0].y}
                width={this.referenceShape[0].width}
                height={this.referenceShape[0].height}
              />
              <rect
                fill="none"
                x={this.referenceShape[1].x}
                y={this.referenceShape[1].y}
                width={this.referenceShape[1].width}
                height={this.referenceShape[1].height}
              />
            </g>
          )
        }
        {
          this.editing && (
            <handle-shape
              key={'handle-shape' + this.editingShape.name}
              mouseEvent={this.mouseEvent}
              name={this.editingShape.name}
              x={this.editingShape.x}
              y={this.editingShape.y}
              width={this.editingShape.width}
              height={this.editingShape.height}
              rotate={this.editingShape.rotate}
              movable={this.editingShapeConfig.movable || false}
              resizeable={this.editingShapeConfig.resizeable || false}
              rotatable={this.editingShapeConfig.rotatable || false}
              getViewportRef={this.getViewportRef}
              onChanging={this.handleChangingElement}
              onChanged={this.handleChangeStop}
              correct={this.corrected}
            />
          )
        }
      </svg>
    )
  },
  methods: {
    getViewportRef() {
      return this.$refs.svg
    },

    /**
     * 计算吸附对齐修正值
     * @param  {String} handler         手柄名称
     * @param  {Object} handlerPosition 手柄坐标
     */
    calcCorrect(handler, handlerPosition) {
      const canvasVirtualShape = {
        x: 0,
        y: 0,
        width: this.width,
        height: this.height,
        rotate: 0
      }
      const dragingShapePoints = Utils.sizeToPoints(this.editingShape)
      const measuringLineX = [[0, 0], [0, 0]]
      const measuringLineY = [[0, 0], [0, 0]]
      const referenceShape = [
        {x: 0, y: 0, width: 0, height: 0},
        {x: 0, y: 0, width: 0, height: 0}
      ]

      // 拖拽中的元素与参考元素的x轴关系值
      let closestX = {
        points: null, // 参考对象的关键点集合
        distance: Infinity, // 与参考对象的x轴关键点的差值绝对值的最小值
        pointIndex: 0, // 参考的关键点索引 0: xMin, 1: xMid, 2: xMax
        correct: 0 // x轴修正值
      }

      let closestY = {
        points: null,
        distance: Infinity,
        pointIndex: 0,
        correct: 0
      }

      const getClosestXFunc = shapePoints => diff => {
        const distance = Math.abs(diff[0])
        if (distance < closestX.distance && (distance < this.threshold)) {
          closestX = {
            distance,
            pointIndex: diff[1],
            points: shapePoints,
            correct: diff[0]
          }
        }
      }

      const getClosestYFunc = shapePoints => diff => {
        const distance = Math.abs(diff[0])
        if (distance < closestY.distance && (distance < this.threshold)) {
          closestY = {
            distance,
            pointIndex: diff[1],
            points: shapePoints,
            correct: diff[0]
          }
        }
      }

      if (handler === HANDLER_MOVE) {
        [canvasVirtualShape, ...this.shapeList].forEach(shape => {
          if (shape.rotate !== 0) {
            return
          }

          const shapePoints = Utils.sizeToPoints(shape)

          const pointXDiff = [
            [shapePoints[0][0] - dragingShapePoints[0][0], 0],
            [shapePoints[0][0] - dragingShapePoints[0][1], 0],
            [shapePoints[0][0] - dragingShapePoints[0][2], 0],
            [shapePoints[0][1] - dragingShapePoints[0][0], 1],
            [shapePoints[0][1] - dragingShapePoints[0][1], 1],
            [shapePoints[0][1] - dragingShapePoints[0][2], 1],
            [shapePoints[0][2] - dragingShapePoints[0][0], 2],
            [shapePoints[0][2] - dragingShapePoints[0][1], 2],
            [shapePoints[0][2] - dragingShapePoints[0][2], 2]
          ]

          const pointYDiff = [
            [shapePoints[1][0] - dragingShapePoints[1][0], 0],
            [shapePoints[1][0] - dragingShapePoints[1][1], 0],
            [shapePoints[1][0] - dragingShapePoints[1][2], 0],
            [shapePoints[1][1] - dragingShapePoints[1][0], 1],
            [shapePoints[1][1] - dragingShapePoints[1][1], 1],
            [shapePoints[1][1] - dragingShapePoints[1][2], 1],
            [shapePoints[1][2] - dragingShapePoints[1][0], 2],
            [shapePoints[1][2] - dragingShapePoints[1][1], 2],
            [shapePoints[1][2] - dragingShapePoints[1][2], 2]
          ]

          const getClosestX = getClosestXFunc(shapePoints)
          const getClosestY = getClosestYFunc(shapePoints)

          pointXDiff.forEach(getClosestX)
          pointYDiff.forEach(getClosestY)
        })
      } else if (handler !== HANDLER_ROTATE) {
        [canvasVirtualShape, ...this.shapeList].forEach(shape => {
          if (shape.rotate !== 0) {
            return
          }

          const shapePoints = Utils.sizeToPoints(shape)

          const pointXDiff = [
            [shapePoints[0][0] - handlerPosition.x, 0],
            [shapePoints[0][1] - handlerPosition.x, 1],
            [shapePoints[0][2] - handlerPosition.x, 2]
          ]

          const pointYDiff = [
            [shapePoints[1][0] - handlerPosition.y, 0],
            [shapePoints[1][1] - handlerPosition.y, 1],
            [shapePoints[1][2] - handlerPosition.y, 2]
          ]

          const getClosestX = getClosestXFunc(shapePoints)
          const getClosestY = getClosestYFunc(shapePoints)

          pointXDiff.forEach(getClosestX)
          pointYDiff.forEach(getClosestY)
        })
      }

      if (closestX.points !== null) {
        if (closestX.pointIndex === 0) {
          measuringLineX[0][0] = closestX.points[0][0]
          measuringLineX[1][0] = closestX.points[0][0]
        } else if (closestX.pointIndex === 1) {
          measuringLineX[0][0] = closestX.points[0][1]
          measuringLineX[1][0] = closestX.points[0][1]
        } else { // closestX.pointIndex === 2
          measuringLineX[0][0] = closestX.points[0][2]
          measuringLineX[1][0] = closestX.points[0][2]
        }

        if (closestX.points[1][0] > dragingShapePoints[1][0]) {
          measuringLineX[0][1] = dragingShapePoints[1][0] + closestY.correct
          measuringLineX[1][1] = closestX.points[1][2]
        } else {
          measuringLineX[0][1] = closestX.points[1][0]
          measuringLineX[1][1] = dragingShapePoints[1][2] + closestY.correct
        }

        referenceShape[0] = Utils.pointsToSize(closestX.points)
      }

      if (closestY.points !== null) {
        if (closestY.pointIndex === 0) {
          measuringLineY[0][1] = closestY.points[1][0]
          measuringLineY[1][1] = closestY.points[1][0]
        } else if (closestY.pointIndex === 1) {
          measuringLineY[0][1] = closestY.points[1][1]
          measuringLineY[1][1] = closestY.points[1][1]
        } else { // closestY.pointIndex === 2
          measuringLineY[0][1] = closestY.points[1][2]
          measuringLineY[1][1] = closestY.points[1][2]
        }

        if (closestY.points[0][0] > dragingShapePoints[0][0]) {
          measuringLineY[0][0] = dragingShapePoints[0][0] + closestX.correct
          measuringLineY[1][0] = closestY.points[0][2]
        } else {
          measuringLineY[0][0] = closestY.points[0][0]
          measuringLineY[1][0] = dragingShapePoints[0][2] + closestX.correct
        }

        referenceShape[1] = Utils.pointsToSize(closestY.points)
      }

      this.measuringLine = [
        measuringLineX,
        measuringLineY
      ]

      this.referenceShape = referenceShape

      switch (handler) {
        case HANDLER_MOVE:
          this.corrected.x = closestX.correct
          this.corrected.y = closestY.correct
          break
        case HANDLER_TOP_LEFT:
          this.corrected.x = closestX.correct
          this.corrected.y = closestY.correct
          this.corrected.width = closestX.correct * -1
          this.corrected.height = closestY.correct * -1
          break
        case HANDLER_TOP_MIDDLE:
          this.corrected.y = closestY.correct
          this.corrected.height = closestY.correct * -1
          break
        case HANDLER_TOP_RIGHT:
          this.corrected.y = closestY.correct
          this.corrected.width = closestX.correct
          this.corrected.height = closestY.correct * -1
          break
        case HANDLER_BOTTOM_LEFT:
          this.corrected.x = closestX.correct
          this.corrected.width = closestX.correct * -1
          this.corrected.height = closestY.correct
          break
        case HANDLER_BOTTOM_MIDDLE:
          this.corrected.height = closestY.correct
          break
        case HANDLER_BOTTOM_RIGHT:
          this.corrected.width = closestX.correct
          this.corrected.height = closestY.correct
          break
        case HANDLER_MIDDLE_LEFT:
          this.corrected.x = closestX.correct
          this.corrected.width = closestX.correct * -1
          break
        case HANDLER_MIDDLE_RIGHT:
          this.corrected.width = closestX.correct
          break
      }
    },

    // 开始编辑元素
    handleStartEditElement(e, name, shape, config) {
      if (!this.lockProportions) {
        if (this.useMeasure && (shape.rotate === 0)) {
          const shapeList = this.$children.filter(Instance => (
            Instance.$options.name === 'edit-element' &&
            (Instance.name !== name) // 这里要去除开始编辑的元素，避免在开启吸附对齐的时候，和自身位置比较
          )).map(Instance => ({
            name: Instance.name,
            x: Instance.x,
            y: Instance.y,
            width: Instance.width,
            height: Instance.height,
            rotate: Instance.rotate
          }))

          this.shapeList = shapeList
        }
      }

      this.editingShape = { name, ...shape }
      this.editingShapeConfig = config
      this.mouseEvent = e
      this.editing = true
      this.$emit('select', this.editingShape)
    },

    // 元素编辑中
    // 同时更新可编辑元素的宽高边距
    handleChangingElement(handler, shape, handlerPosition) {
      const VueComponent = this.$children.find(Instance => (
        Instance.$options.name === 'edit-element' &&
        (Instance.name === this.editingShape.name)
      ))

      // 必须先更新编辑中的元素的尺寸边距，再计算对齐修正
      Object.assign(this.editingShape, shape)

      if (!this.lockProportions) {
        if (this.useMeasure && (shape.rotate === 0)) {
          this.calcCorrect(handler, handlerPosition)
        }
      }

      const correctedShape = {
        x: this.editingShape.x + this.corrected.x,
        y: this.editingShape.y + this.corrected.y,
        width: this.editingShape.width + this.corrected.width,
        height: this.editingShape.height + this.corrected.height,
        rotate: shape.rotate
      }

      Object.assign(VueComponent, correctedShape)
      this.$emit('changing', Object.assign({ name: this.editingShape.name }, correctedShape))
    },

    handleChangeStop() {
      Object.assign(this.editingShape, {
        x: this.editingShape.x + this.corrected.x,
        y: this.editingShape.y + this.corrected.y,
        width: this.editingShape.width + this.corrected.width,
        height: this.editingShape.height + this.corrected.height
      })

      this.resetCorrectedValue()
      this.referenceShape = resetReferenceShape()
      this.$emit('change', Object.assign({}, this.editingShape))
    },

    updateEditElement(originName, name, x, y, width, height, rotate) {
      if (this.editingShape.name === originName) {
        Object.assign(this.editingShape, {
          name, x, y, width, height, rotate
        })
      }
    },

    destroyEditElement(name) {
      if (this.editingShape.name === name) {
        this.handleResetEditStatus()
      }
    },

    handleResetEditStatus() {
      this.editing = false
      this.shapeList = []
      this.resetCorrectedValue()
      this.editingShape = resetEditingShape()
      this.$emit('deselect')
    },

    // 重置修正值
    resetCorrectedValue() {
      this.measuringLine = [
        [[0, 0], [0, 0]],
        [[0, 0], [0, 0]]
      ]
      this.corrected = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    }
  }
}

export default editLayer