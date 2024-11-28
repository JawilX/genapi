import c from 'picocolors'
import type { ApiBlock, ApiBodyParams, ApiOptions, ApiParameter, SwaggerData } from './types'
import { commonUrl, getApiName, getContentOriginRef, getNamespace, handleJsType, handleWeirdName } from './utils'

export function handleApiModel(apiOptions: ApiOptions, paths: SwaggerData['paths']): ApiBlock[] {
  const apiList: ApiBlock[] = []
  for (const path in paths) {
    const isIgnore = apiOptions.ignore && apiOptions.ignore.test(path)
    if (!isIgnore) {
      const obj = paths[path]
      const hasMultiMethod = Object.keys(obj).length > 1
      Object.keys(obj).forEach((method: string) => {
        const item = obj[method]
        const url = commonUrl(path)
        const name = getApiName(url, hasMultiMethod ? method : '')
        const namespace = getNamespace(url)
        const summary = item.summary // 接口注释
        const parameters = getParameters(item.parameters) // 入参
        const requestBodyRef = getContentOriginRef(item.requestBody?.content)
        const requestFormData = item.requestBody?.content?.['multipart/form-data']
        const formDataProperties = requestFormData?.schema?.properties
        let formDataParameters
        if (formDataProperties) {
          const list = []
          for (const key in formDataProperties) {
            const item = formDataProperties[key]
            list.push({ ...item, name: key } as any)
          }
          formDataParameters = getParameters(list)
        }

        const resContent = item?.responses['200']?.content
        // 出参模型
        const resScheme = resContent?.['application/json']?.schema || resContent?.['*/*']?.schema

        let outputInterface = '' // 出参interface
        // 如果存在出参模型
        if (resScheme?.$ref)
          outputInterface = handleWeirdName(resScheme.$ref.replace('#/components/schemas/', ''))
        // 出参是个简单类型
        else if (resScheme?.type)
          outputInterface = handleJsType(resScheme.type)

        outputInterface = handleJsType(outputInterface) ? handleJsType(outputInterface) : outputInterface
        if (outputInterface === 'Void' || outputInterface === 'void')
          outputInterface = ''

        const apiModel: ApiBodyParams = {
          name,
          url,
          method,
          summary,
          parameters,
          requestBodyRef,
          requestFormData,
          formDataParameters,
          outputInterface,
        }
        const idx = apiList.findIndex(item => item.namespace === namespace)
        if (idx > -1)
          apiList[idx].apis.push(apiModel)
        else apiList.push({ namespace, apis: [apiModel] })
      })
    }
  }
  return apiList
}

/** 处理入参 */
function getParameters(parameters: ApiParameter[]): ApiParameter[] {
  // 数据格式如：
  // "parameters": [
  //   {
  //     "in": "body",
  //     "name": "req",
  //     "description": "req",
  //     "required": true,
  //     "schema": {
  //       "$ref": "#/definitions/AddUserReq",
  //       "originalRef": "AddUserReq"
  //     }
  //    或者这样的 schema
  //    "schema": {
  //      "type": "array",
  //      "items": { "type": "integer", "format": "int64" }
  //    }
  //     或者这样的 schema
  //     "schema": {
  //       "type": "array",
  //       "items": { "$ref": "#/definitions/AddEmployeeReq", "originalRef": "AddEmployeeReq" }
  //      }
  //   },
  // ],

  // 再如：
  // "parameters": [
  //   {
  //     "name": "limit",
  //     "in": "query",
  //     "description": "当前页请求列表大小",
  //     "required": true,
  //     "type": "integer",
  //     "default": 100,
  //     "format": "int32"
  //   },
  //   {
  //     "name": "offset",
  //     "in": "query",
  //     "description": "注释注释",
  //     "required": false,
  //     "type": "integer",
  //     "format": "int64"
  //   }
  // ],
  // 再如:
  // "parameters": [
  //   {
  //     "in": "body",
  //     "name": "map",
  //     "description": "map",
  //     "required": true,
  //     "schema": { "type": "object", "additionalProperties": { "type": "object" } }
  //   }
  // ],
  // 再如
  // "parameters": [
  // {
  //   "name": "desktopIds",
  //   "in": "query",
  //   "description": "desktopIds",
  //   "required": false,
  //   "type": "array",
  //   "items": { "type": "integer", "format": "int64" },
  //   "collectionFormat": "multi"
  // },

  // 有入参
  if (parameters && parameters.length) {
    return parameters.map((item) => {
      let type = '' // 如：string, number, boolean, UserInterface
      let isArray = false // 是否是数组
      let isSimpleJsType = false //  是否是简单 js 类型
      // 入参是数组
      if (item.type === 'array' || item.schema?.type === 'array') {
        isArray = true
        const itemsObj = item.schema?.type === 'array' ? item.schema?.items : item.items
        // 简单类型
        if (handleJsType(itemsObj?.format || itemsObj?.type)) {
          type = handleJsType(itemsObj?.format || itemsObj?.type)
          isSimpleJsType = true
        }
        else if (itemsObj?.originalRef) {
          type = handleWeirdName(itemsObj?.originalRef)
          isSimpleJsType = false
        }
        else {
          console.log(c.red('入参：未处理的情况'))
        }
      }
      // 非数组
      else {
        isArray = false
        if (item.schema?.originalRef) {
          type = handleWeirdName(item.schema?.originalRef)
          isSimpleJsType = false
        }
        else {
          type = handleJsType(item.format || item.type || item.schema?.format || item.schema?.type || '') || 'any'
          isSimpleJsType = true
        }
      }
      return {
        name: handleWeirdName(item.name),
        description: item.description || '', // 注释
        in: item.in, // 可能值： body ,header, query, path...
        isSimpleJsType,
        isArray,
        type,
      }
    })
  }
  // 没入参
  else {
    return []
  }
}
