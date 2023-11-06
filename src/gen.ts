import process from 'node:process'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import c from 'picocolors'
import { execa } from 'execa'
import axios from 'axios'
import { capitalize } from '@antfu/utils'
import type { ApiBlock, ApiInterface, ApiOptions, ApiParameter, InitOptions, SwaggerData } from './types'
import { handleApiModel } from './handleApiModel'
import { handleInterface } from './handleInterface'
import { handleJsType } from './utils'

const CWD = process.cwd()
let initOptions: InitOptions

export async function gen(config: InitOptions) {
  if (!config)
    return console.log(c.red('请先执行 gen-api init 初始化配置文件'))
  initOptions = config

  const apiList = config.apiList.filter(item => item.enable)

  if (!config.apiBody)
    return console.log(c.red('配置文件里的 apiBody不能为空, 且必须是一个函数'))

  apiList.forEach(async (item) => {
    const swaggerUrl = item.swaggerUrl
    const absOutputDir = path.join(CWD, item.outputDir || '/src/api')
    const apiOptions = { ...item, absOutputDir }
    if (swaggerUrl.startsWith('http')) {
      try {
        const { data } = await axios.get(swaggerUrl)
        parseData(apiOptions, data)
      }
      catch (error: any) {
        console.error(c.red('swagger地址访问异常'), error?.message)
      }
    }
    else {
      const filePath = path.join(CWD, swaggerUrl)
      try {
        const data = await fs.readFile(filePath, 'utf-8')
        parseData(apiOptions, JSON.parse(data))
      }
      catch (error: any) {
        console.error(c.red('swagger地址访问异常'), error?.message)
      }
    }
  })
}

function parseData(apiOptions: ApiOptions, data: SwaggerData) {
  const apiList = handleApiModel(apiOptions, data.paths)
  const interfaces = handleInterface(data.definitions)
  const count = apiList.reduce((pre, cur) => {
    return pre + cur.apis.length
  }, 0)
  console.log(c.green(`总共 ${count} 个接口生成中...`))
  writeApiToFile(apiOptions, apiList)
  writeInterfaceToFile(apiOptions, interfaces)
}

async function writeApiToFile(apiOptions: ApiOptions, apiList: ApiBlock[]) {
  const outputDir = apiOptions.absOutputDir || './'
  // return
  apiList.forEach(async (item) => {
    const tplStr = `${initOptions.httpTpl || ''}`
    let apiStr = ''
    const namespace = item.namespace
    let fileUsedInterface: string[] = [] // 当前文件用到的 interface
    item.apis.forEach((api) => {
      const { name, url, method, summary, parameters, outputInterface } = api
      // 出参存在且不是简单类型
      if (outputInterface && !handleJsType(outputInterface))
        fileUsedInterface.push(outputInterface)

      // 入参需要引入的interface
      parameters?.forEach(item => !item.isSimpleJsType && item.type && fileUsedInterface.push(item.type))

      const { p1, p2, p3 } = getParamStr(parameters)
      const apiBodyFn = initOptions.apiBody
      const apiBodyStr = apiBodyFn({
        name,
        url,
        method: capitalize(method),
        summary,
        parameters,
        outputInterface: outputInterface || 'any', // 出参不存在，处理成any
        pstr1: p1,
        pstr2: p2,
        pstr3: p3,
      })
      if (!apiBodyStr)
        throw new Error('apiBody缺少返回值！')

      apiStr += `${apiBodyStr}\n`
    })

    // interface 引入
    let importStr = ''
    fileUsedInterface = [...new Set(fileUsedInterface)]
    if (fileUsedInterface.length) {
      importStr += `import type {`
      fileUsedInterface.forEach((item, index) => {
        importStr += index === 0 ? `${item}` : `,${item}`
      })
      importStr += `} from './_interfaces'`
    }

    try {
      await fs.access(outputDir)
    }
    catch (error) {
      // 若目标目录不存在，则创建
      await fs.mkdir(outputDir, { recursive: true })
    }
    // 写入目标目录
    const targetFile = path.join(outputDir, `${namespace}.ts`)
    await fs.writeFile(targetFile, `${tplStr}\n${importStr}\n${apiStr}`)

    // 格式化
    await execa('eslint', ['--fix', targetFile], { stdio: 'inherit' })
  })
}

async function writeInterfaceToFile(apiOptions: ApiOptions, interfaces: ApiInterface[]) {
  const absOutputDir = apiOptions.absOutputDir || ''
  let str = ''
  interfaces.forEach((item) => {
    str += `export interface ${item.name} {`
    const properties = item.properties
    if (properties) {
      Object.keys(properties).forEach((key) => {
        const it = properties[key]
        const description = it.description ? `/** ${it.description} */` : ''
        // 有注释
        if (description) {
          str += `
            ${description || ''}
            ${it.name}?: ${it.type}${it.isArray ? '[]' : ''}`
        }
        // 没注释
        else {
          str += `
            ${it.name}?: ${it.type}${it.isArray ? '[]' : ''}`
        }
      })
    }
    str += '\n}\n\n'
  })
  const targetFile = path.join(absOutputDir, `_interfaces.ts`)
  try {
    await fs.access(absOutputDir)
  }
  catch (error) {
    // 若目标目录不存在，则创建
    await fs.mkdir(absOutputDir, { recursive: true })
  }
  await fs.writeFile(targetFile, str)

  // 格式化
  await execa('eslint', ['--fix', targetFile], { stdio: 'inherit' })
}

/**
 *
 * @param {*} parameters 数据格式如下
 * [{
 *  name: 'name',
 *  in: 'query',
 *  isArray: false,  // 是否是数组
 *  isSimpleJsType:false,  // 是否是简单js类型
 *  type: 'string',
 *  description: 'name',
 * }]
 */
function getParamStr(parameters?: ApiParameter[]) {
  // 过滤掉 in header 的参数
  const avaliableParam = (parameters || []).filter(item => item.in !== 'header')
  // 无参数
  if (!avaliableParam.length)
    return { p1: 'data?: any', p2: 'data' }

  let p1 = ''
  let p2 = ''
  let p3 = ''
  // 只有一个参数，且 in body
  if (avaliableParam.length === 1 && avaliableParam[0].in === 'body') {
    const onlyParam = avaliableParam[0]
    p1 = `data: ${onlyParam.type}${onlyParam.isArray ? '[]' : ''}`
    p2 = 'data'
    p3 = ''
  }
  // 所有的参数都 in path
  else if (avaliableParam.every(p => p.in === 'path')) {
    const str = avaliableParam.reduce((pre, cur) => {
      let desc = cur.description?.trim()
      desc = desc && desc !== cur.name.trim() ? `\n  // ${desc}\n` : '\n' // 有注释且和名字不一样
      return `${pre}${desc}${cur.name}?:${cur.type}${cur.isArray ? '[]' : ''};`
    }, '')
    p1 = `data: {${str}\n}`
    p2 = ''
    p3 = `const {${avaliableParam.map(p => p.name).join(',')}} = data`
  }
  // 所有的参数都 in query 或 in body
  else if (avaliableParam.every(p => p.in === 'query' || p.in === 'body')) {
    const str = avaliableParam.reduce((pre, cur) => {
      let desc = cur.description?.trim()
      desc = desc && desc !== cur.name.trim() ? `\n  // ${desc}\n` : '\n' // 有注释且和名字不一样
      return `${pre}${desc}${cur.name}?: ${cur.type}${cur.isArray ? '[]' : ''};`
    }, '')
    p1 = `data: {${str}\n}`
    p2 = 'data'
    p3 = ''
  }
  // 存在 in path 的参数，且其它都 in query 或 in body
  else if (
    avaliableParam.some(p => p.in === 'path')
    && avaliableParam.filter(p => p.in !== 'path').every(p => p.in === 'query' || p.in === 'body')
  ) {
    const notInPathParam = avaliableParam.filter(p => p.in !== 'path')
    const str = avaliableParam.reduce((pre, cur) => {
      let desc = cur.description?.trim()
      desc = desc && desc !== cur.name.trim() ? `\n  // ${desc}\n` : '\n' // 有注释且和名字不一样
      return `${pre}${desc}${cur.name}?: ${cur.type}${cur.isArray ? '[]' : ''};`
    }, '')
    p1 = `data: {${str}\n}`
    p2 = ` {${notInPathParam.map(p => p.name).join(',')}} `
    p3 = `const {${avaliableParam.map(p => p.name).join(',')}} = data`
  }
  // 其他奇怪的或未知的情况，如 in formData
  else {
    p1 = 'data?: any'
    p2 = 'data'
    p3 = ''
  }
  return {
    p1,
    p2,
    p3,
  }
}
