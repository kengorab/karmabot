export function mock<T>(clazz: T, fnName: string, value: any) {
  Object.defineProperty(clazz, fnName, { value })
}
