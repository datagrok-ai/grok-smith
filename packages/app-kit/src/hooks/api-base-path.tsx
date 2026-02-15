import { createContext, useContext } from 'react'

const ApiBasePathContext = createContext('/api')

export const ApiBasePath = ApiBasePathContext.Provider
export const useApiBasePath = () => useContext(ApiBasePathContext)
