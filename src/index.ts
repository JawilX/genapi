import type { InitOptions } from './types'

export * from './init'
export * from './gen'
export * from './types'

export function defineConfig(options: Partial<InitOptions>) {
  return options
}
