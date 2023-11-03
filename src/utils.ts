import { capitalize } from '@antfu/utils'
import { pinyin } from 'pinyin-pro'

const jsKeyWords = [
  'delete',
  'break',
  'catch',
  'continue',
  'instanceof',
  'new',
  'switch',
  'throw',
  'while',
  'with',
  'finally',
  'return',
  'export',
  'enum',
  'private',
  'package',
  'public',
  'static',
  'for',
  'function',
]

/**
 * 处理接口地址
 * "/abc/def/{taskId}"   => `/abc/def/${taskId}`
 * "/api/abc-defg/v1/{type}/list/filter"  => `/api/abc-defg/v1/${type}/list/filter`
 */
export function commonUrl(url: string): string {
  return url.replace(/{/g, '${')
}

/**
 * 将接口地址转化为接口名称
 * @param url
 * @param method
 * @returns
 */
export function getApiName(url: string, method: string) {
  // 去除开头的 /api
  url = url.replace(/^\/api/, '')
  // 去除可能存在的短杠、左右花括号和$、 点号
  url = url.replace(/\$|\{|\}|-|\./g, '')
  let name = url.replace(/\/\w/g, (match, index) => {
    const letter = match.replace('/', '')
    return index === 0 ? letter : capitalize(letter)
  })
  // 路径相同的 api, 在后面拼上请求方法以做区分， 如，有两个接口处理后的接口名称都是 systemUser，则分别处理成： systemUserGet 和  systemUserPost
  if (method)
    name += capitalize(method)
  // 如果处理后的接口名称正好是 js 关键字，则默认加上Fn, 如，delete 处理成 deleteFn
  return jsKeyWords.includes(name) ? `${name}Fn` : name
}

/**
 * 获取接口所属文件名称
 * 将 /api/user/create 转化为 user
 */
export function getNamespace(url: string) {
  const arr = url.split('/')
  return arr.find(item => item && item !== 'api') || ''
}

/**
 * 处理一些奇奇怪怪的 interface 或 入参 name，去除特殊字符，并将中文转英文
 * 如： ApiResponse«List«我的数据对象GroupResp»»， 将被处理成 ApiResponseWoDeShuJuDuiXiangGroupResp
 */
export function handleWeirdName(originKey: string) {
  if (!originKey || !originKey.trim())
    return ''
  let str = originKey.replace(/\[|\]|\(|\)|«|»|\{|\}|（|）/g, '') // 去除各种括号 [] () «» {}
  str = str.replace(/\s|-|&|\/|\*|=|\+|\$/g, '') // 去除所有空格，短杠 - ，斜杠 /， 星号 *， 等号 =，加号 +, $符
  str = str.replace(/(,|，|、|；|;|\.|。|"|'|‘|’|“|”)/g, '') // 去除中英文逗号，顿号，分号，中英文句号，中引文单双引号
  // 汉字转拼音 历史消息=>LiShiXiaoXi
  if (hasChinese(str))
    str = pinyin(str, { nonZh: 'consecutive', toneType: 'none', v: true, type: 'array' }).map(upperCaseFirstLetter).join('')
  return str
}

export function hasChinese(str: string) {
  return /[\u4E00-\u9FA5]+/g.test(str)
}

export function handleJsType(originType: string) {
  const typeEnum = {
    'integer': 'number',
    'string': 'string',
    'long': 'string',
    'boolean': 'boolean',
    'Boolean': 'boolean',
    'number': 'number',
    // array: '[]',
    'Object': 'any',
    'object': 'any',
    'double': 'string',
    'Int64': 'string',
    'int64': 'string',
    'Int32': 'number',
    'int32': 'number',
    'String': 'string',
    'date-time': 'string',
    'Date': 'string',
    'date': 'string',
    'file': 'File',
    // "properties": {
    //   "uri": { "type": "string", "format": "uri" },
    //   "url": { "type": "string", "format": "url" },
    // },
    'uri': 'string',
    'url': 'string',
  } as any
  return typeEnum[originType] || ''
}

/** 首字母大写 */
export function upperCaseFirstLetter(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}

/** 首字母小写 */
export function lowerCaseFirstLetter(str: string) {
  return str.slice(0, 1).toLowerCase() + str.slice(1)
}
