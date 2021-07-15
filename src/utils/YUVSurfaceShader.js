import ShaderProgram from './ShaderProgram'
import ShaderCompiler from './ShaderCompiler'
import { fragmentYUV, vertexQuad } from './ShaderSources'

export default class YUVSurfaceShader {
  /**
   *
   * @param {WebGLRenderingContext} gl
   * @returns {YUVSurfaceShader}
   */
  static create (gl) {
    const program = this._initShaders(gl)
    const shaderArgs = this._initShaderArgs(gl, program)
    const vertexBuffer = this._initBuffers(gl)

    return new YUVSurfaceShader(gl, vertexBuffer, shaderArgs, program)
  }

  static _initShaders (gl) {
    const program = new ShaderProgram(gl)
    program.attach(ShaderCompiler.compile(gl, vertexQuad))
    program.attach(ShaderCompiler.compile(gl, fragmentYUV))
    program.link()
    program.use()

    return program
  }

  static _initShaderArgs (gl, program) {
    // find shader arguments
    const shaderArgs = {}
    shaderArgs.yTexture = program.getUniformLocation('yTexture')
    shaderArgs.uTexture = program.getUniformLocation('uTexture')
    shaderArgs.vTexture = program.getUniformLocation('vTexture')

    shaderArgs.u_projection = program.getUniformLocation('u_projection')

    shaderArgs.a_position = program.getAttributeLocation('a_position')
    gl.enableVertexAttribArray(shaderArgs.a_position)
    shaderArgs.a_texCoord = program.getAttributeLocation('a_texCoord')
    gl.enableVertexAttribArray(shaderArgs.a_texCoord)

    return shaderArgs
  }

  static _initBuffers (gl) {
    // Create vertex buffer object.
    return gl.createBuffer()
  }

  constructor (gl, vertexBuffer, shaderArgs, program) {
    this.gl = gl
    this.vertexBuffer = vertexBuffer
    this.shaderArgs = shaderArgs
    this.program = program
  }

  /**
   *
   * @param {Texture} textureY
   * @param {Texture} textureU
   * @param {Texture} textureV
   */
  setTexture (textureY, textureU, textureV) {
    const gl = this.gl

    gl.uniform1i(this.shaderArgs.yTexture, 0)
    gl.uniform1i(this.shaderArgs.uTexture, 1)
    gl.uniform1i(this.shaderArgs.vTexture, 2)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, textureY.texture)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, textureU.texture)

    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, textureV.texture)
  }

  use () {
    this.program.use()
  }

  release () {
    const gl = this.gl
    gl.useProgram(null)
  }

  /**
   * @param {{w:number, h:number}}encodedFrameSize
   * @param {{maxXTexCoord:number, maxYTexCoord:number}} h264RenderState
   */
  updateShaderData (encodedFrameSize, h264RenderState) {
    const { w, h } = encodedFrameSize
    this.gl.viewport(0, 0, w, h)
    this.program.setUniformM4(this.shaderArgs.u_projection, [
      2.0 / w, 0, 0, 0,
      0, 2.0 / -h, 0, 0,
      0, 0, 1, 0,
      -1, 1, 0, 1
    ])
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      // First triangle
      // top left:
      0, 0, 0, 0,
      // top right:
      w, 0, h264RenderState.maxXTexCoord, 0,
      // bottom right:
      w, h, h264RenderState.maxXTexCoord, h264RenderState.maxYTexCoord,

      // Second triangle
      // bottom right:
      w, h, h264RenderState.maxXTexCoord, h264RenderState.maxYTexCoord,
      // bottom left:
      0, h, 0, h264RenderState.maxYTexCoord,
      // top left:
      0, 0, 0, 0
    ]), this.gl.DYNAMIC_DRAW)
    this.gl.vertexAttribPointer(this.shaderArgs.a_position, 2, this.gl.FLOAT, false, 16, 0)
    this.gl.vertexAttribPointer(this.shaderArgs.a_texCoord, 2, this.gl.FLOAT, false, 16, 8)
  }

  draw () {
    const gl = this.gl
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
    gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 6)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }
}
