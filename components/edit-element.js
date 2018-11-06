const editElement = {
  name: 'edit-element',
  props: {
    name: { // 图形名称
      type: String,
      required: true
    },
    shape: { // 图形的尺寸位置
      type: Object,
      required: true
    },
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
    }
  },
  data() {
    return {
      x: this.shape.x,
      y: this.shape.y,
      width: this.shape.width,
      height: this.shape.height,
      rotate: this.shape.rotate
    }
  },
  watch: {
    name(val, oldVal) {
      this.handleUpdateElement(oldVal)
    },
    shape(shape) {
      Object.assign(this, {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        rotate: shape.rotate
      })

      this.handleUpdateElement()
    }
  },
  render() {
    return (
      <g transform={`rotate(${this.rotate},${this.x + this.width / 2},${this.y + this.height / 2})`}>
        {
          this.$scopedSlots.child && this.$scopedSlots.child({
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            rotate: this.rotate
          })
        }
        <svg
          viewBox={`0 0 ${this.width} ${this.height}`}
          x={this.x}
          y={this.y}
          width={this.width}
          height={this.height}
        >
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="transparent"
            onMousedown={this.handleStartEditElement}
          />
        </svg>
      </g>
    )
  },
  beforeDestroy() {
    this.$parent.destroyEditElement(this.name)
  },
  methods: {
    handleStartEditElement(e) {
      e.stopPropagation()

      const shape = {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        rotate: this.rotate
      }

      const config = {
        movable: this.movable,
        resizeable: this.resizeable,
        rotatable: this.rotatable
      }

      this.$parent.handleStartEditElement(e, this.name, shape, config)
    },
    handleUpdateElement(originName = this.name) {
      this.$parent.updateEditElement(
        originName,
        this.name,
        this.x,
        this.y,
        this.width,
        this.height,
        this.rotate
      )
    }
  }
}

export default editElement