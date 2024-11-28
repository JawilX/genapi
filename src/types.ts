export interface ApiOptions {
  /** swagger json 的 url 或 本地swagger.json相对根目录的路径 */
  swaggerUrl: string
  /** swagger version，可以手动指定版本，不指定则自动识别 */
  swaggerVersion?: 2 | 3
  /** 输出到哪个目录中 */
  outputDir?: string
  absOutputDir?: string
  /** 是否生成 */
  enable?: boolean
  /** 无需生成的接口，如配置成 ignore: /\\/abcDef\\/|\\/test\\// ， 则路径中带 /abcDef/ 和 /test/ 的接口将不会生成 */
  ignore?: RegExp
}

export interface ApiBodyParams {
  /** 接口路径 */
  url: string
  /** 请求方法，如：Get, Post */
  method: string
  /** 后端写的注释 */
  summary?: string
  /** 接口名称，由接口路径处理得到，如：/api/user/create 处理成 userCreate */
  name: string
  /** 接口入参，格式： [{in:"body",type:"IUserModel",interface:"IUserModel",name:"",description:"注释"},{in:"query",type:string,interface:""}] */
  parameters?: ApiParameter[]
  /** 请求参数的接口 */
  requestBodyRef?: string
  /** 请求类型是 multipart/form-data 时 requestBody 里面对应的数据 */
  requestFormData?: { schema?: Schema }
  formDataParameters?: ApiParameter[]
  /** 请求类型是 multipart/form-data 时 formDataStr 为 'FormData' */
  formDataStr?: 'FormData' | ''
  /** 出参interface */
  outputInterface?: string
  /** 由 parameters 处理得到的 */
  pstr1?: string
  pstr2?: string
  pstr3?: string
}

export interface InitOptions {
  /** 手动配置转换 swagger2 到 openapi3 的接口地址 */
  swaggerConvertApi?: string
  /** 是否使用本地转换 swagger2 到 openapi3, 线上接口不可用时可开启这个 */
  useLocalConvert?: boolean
  apiList: ApiOptions[]
  /** 文件头部引入内容 */
  httpTpl?: string
  apiBody: (params: ApiBodyParams) => string
}

export interface ApiBlock {
  namespace: string
  apis: ApiBodyParams[]
}

export interface ApiInterface {
  /** 原始 key 处理后结果，如： ApiResponse */
  name?: string
  /** 类型，如 'object', 目前看到的都是 'object' */
  type: string
  properties?: {
    [key: string]: ApiInterface
  }
  /** 是否是数组 */
  isArray?: boolean
  /** 是否是简单 js 类型, 如 number、string 等 */
  isSimpleJsType?: boolean
  format?: string
  originalRef?: string
  /** 注释 */
  description?: string
  /** 额外属性 */
  additionalProperties?: any
  items?: any
  $ref?: string
}

export interface Schema {
  $ref: string
  originalRef: string
  type?: string
  format?: string
  items?: any
  properties?: {
    [key: string]: {
      type?: string
      format?: string
    }
  }
}

export interface ApiParameter {
  in: string
  name: string
  description: string
  required?: boolean
  type: string
  format?: string
  items?: any
  schema?: Schema
  isSimpleJsType?: boolean
  isArray?: boolean
}

export interface ApiContent {
  [contentType: string]: {
    schema: Schema
  }
}

export interface ApiRequestBody {
  description: string
  content: ApiContent
}

export interface SwaggerData {
  openapi: string
  info: {
    title: string
    version: string
    description: string
  }
  host: string
  basePath: string
  tags: any[]
  paths: {
    [path: string]: {
      [method: string]: {
        summary: string
        parameters: ApiParameter[]
        requestBody: ApiRequestBody
        responses: {
          [code: string]: {
            description: string
            content: ApiContent
          }
        }
      }
    }
  }
  components: {
    schemas: {
      [key: string]: ApiInterface
    }
  }
  securityDefinitions: any
}
