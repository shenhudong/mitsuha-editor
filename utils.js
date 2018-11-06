/* eslint-disable */

/**
 * 工具方法库
 */

/**
 * 函数节流 返回函数连续调用时，fn 执行频率限定为每多少时间执行一次
 * @param fn         {function}  需要调用的函数
 * @param delay      {number}    延迟时间，单位毫秒
 * @param immediate  {bool}      给 immediate 参数传递 false，绑定的函数先执行，而不是delay后后执行
 * @return           {function}  实际调用函数
 */
let throttle = function(fn, delay, immediate = false, debounce = false) {
  let curr = +new Date()
  let last_call = 0
  let last_exec = 0
  let timer = null
  let diff
  let context
  let args
  const exec = function() {
    last_exec = curr
    fn.apply(context, args)
  }

  return function() {
    curr = +new Date()
    context = this
    args = arguments
    diff = curr - (debounce ? last_call : last_exec) - delay

    clearTimeout(timer)

    if (debounce) {
      if (immediate) {
        timer = setTimeout(exec, delay)
      } else if (diff >= 0) {
        exec()
      }
    } else {
      if (diff >= 0) {
        exec()
      } else if (immediate) {
        timer = setTimeout(exec, -diff)
      }
    }

    last_call = curr
  }
}

const sizeToPoints = (rect, correctX = 0, correctY = 0) => {
  const xMin = rect.x + correctX
  const xMid = rect.x + rect.width / 2 + correctX
  const xMax = rect.x + rect.width + correctX
  const yMin = rect.y + correctY
  const yMid = rect.y + rect.height / 2 + correctY
  const yMax = rect.y + rect.height + correctY

  return [
    [xMin, xMid, xMax],
    [yMin, yMid, yMax]
  ]
}

const pointsToSize = points => ({
  x: points[0][0],
  y: points[1][0],
  width: points[0][2] - points[0][0],
  height: points[1][2] - points[1][0]
})

/**
 * 获取两点之间连线后的中点坐标
 * @param  {Object} p1 点1的坐标
 * @param  {Object} p2 点2的坐标
 * @return {Object}    中点坐标
 */
const getCenterPoint = (p1, p2) => ({
  x: p1.x + ((p2.x - p1.x) / 2),
  y: p1.y + ((p2.y - p1.y) / 2)
})

/**
 * 检测 p0 是否在 p1 与 p2 建立的正方形内
 * @param  {Object}  p0 被检测的坐标
 * @param  {Object}  p1 点1坐标
 * @param  {Object}  p2 点2坐标
 * @return {Boolean}    检测结果
 */
const pointInRect = (p0, p1, p2) => {
  if (p1.x > p2.x) {
    if (p0.x < p2.x) {
      return false
    }
  } else {
    if (p0.x > p2.x) {
      return false
    }
  }

  if (p1.y > p2.y) {
    if (p0.y < p2.y) {
      return false
    }
  } else {
    if (p0.y > p2.y) {
      return false
    }
  }

  return true
}

/**
 * 获取鼠标位置在svg元素中的坐标
 * @param   {SVGElement}  SVGElement  SVG元素
 * @param   {Event}       e           Event
 * @return  {Object}                  鼠标指针在SVG中的坐标（xy结构）
 */
const getPositionInSvg = (SVGElement, e) => {
  const point = SVGElement.createSVGPoint()

  point.x = e.clientX
  point.y = e.clientY

  const position = point.matrixTransform(SVGElement.getScreenCTM().inverse())

  return {
    x: position.x,
    y: position.y
  }
}

/**
 * 角度转弧度(通常用于js的计算正弦余弦的方法)
 * @param   {Number}  degree  角度
 * @return  {Number}          弧度
 */
const degreeToRadian = degree => 2 * Math.PI / 360 * degree

/**
 * 计算根据圆心旋转后的点的坐标
 * @param   {Object}  point   旋转前的点坐标
 * @param   {Object}  center  旋转中心
 * @param   {Int}     rotate  旋转的角度
 * @return  {Object}          旋转后的坐标
 */
const getRotatedPoint = (point, center, rotate) => {
  /**
   * 旋转公式：
   *  点a(x, y)
   *  旋转中心c(x, y)
   *  旋转后点n(x, y)
   *  旋转角度θ
   * nx = cosθ * (ax - cx) - sinθ * (ay - cy) + cx
   * ny = sinθ * (ax - cx) + cosθ * (ay - cy) + cy
   */
  return {
    x: (point.x - center.x) * Math.cos(degreeToRadian(rotate)) - (point.y - center.y) * Math.sin(degreeToRadian(rotate)) + center.x,
    y: (point.x - center.x) * Math.sin(degreeToRadian(rotate)) + (point.y - center.y) * Math.cos(degreeToRadian(rotate)) + center.y
  }
}

const absoluteZoom = (num, scaling) => (num / scaling * 100).toFixed(2)

export default {
  throttle,
  sizeToPoints,
  pointsToSize,
  getCenterPoint,
  pointInRect,
  getPositionInSvg,
  degreeToRadian,
  getRotatedPoint,
  absoluteZoom
}