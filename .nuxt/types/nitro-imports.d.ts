declare global {
  const ALLOWED_IMAGE_MIME: typeof import('../../server/utils/image-upload').ALLOWED_IMAGE_MIME
  const ATWATER_FACTORS: typeof import('../../server/utils/macros').ATWATER_FACTORS
  const H3Error: typeof import('../../node_modules/h3').H3Error
  const H3Event: typeof import('../../node_modules/h3').H3Event
  const MAX_IMAGE_BYTES: typeof import('../../server/utils/image-upload').MAX_IMAGE_BYTES
  const PUBLIC_DIR: typeof import('../../server/utils/image-upload').PUBLIC_DIR
  const RECIPES_DIR: typeof import('../../server/utils/image-upload').RECIPES_DIR
  const RECIPES_SUBDIR: typeof import('../../server/utils/image-upload').RECIPES_SUBDIR
  const ZERO_MACROS: typeof import('../../server/utils/macros').ZERO_MACROS
  const __buildAssetsURL: typeof import('../../node_modules/.pnpm/@nuxt+nitro-server@4.4.8_@babel+plugin-syntax-typescript@7.29.7_@babel+core@7.29.7__db0_d48f01afba2ec52248f623aad850bf9f/node_modules/@nuxt/nitro-server/dist/runtime/utils/paths').buildAssetsURL
  const __publicAssetsURL: typeof import('../../node_modules/.pnpm/@nuxt+nitro-server@4.4.8_@babel+plugin-syntax-typescript@7.29.7_@babel+core@7.29.7__db0_d48f01afba2ec52248f623aad850bf9f/node_modules/@nuxt/nitro-server/dist/runtime/utils/paths').publicAssetsURL
  const appendCorsHeaders: typeof import('../../node_modules/h3').appendCorsHeaders
  const appendCorsPreflightHeaders: typeof import('../../node_modules/h3').appendCorsPreflightHeaders
  const appendHeader: typeof import('../../node_modules/h3').appendHeader
  const appendHeaders: typeof import('../../node_modules/h3').appendHeaders
  const appendResponseHeader: typeof import('../../node_modules/h3').appendResponseHeader
  const appendResponseHeaders: typeof import('../../node_modules/h3').appendResponseHeaders
  const assertIngredientsOwned: typeof import('../../server/utils/recipe-helpers').assertIngredientsOwned
  const assertMethod: typeof import('../../node_modules/h3').assertMethod
  const atwaterKcalFromMacros: typeof import('../../server/utils/macros').atwaterKcalFromMacros
  const buildRecipeDto: typeof import('../../server/utils/recipe-helpers').buildRecipeDto
  const cachedEventHandler: typeof import('../../node_modules/nitropack/dist/runtime/internal/cache').cachedEventHandler
  const cachedFunction: typeof import('../../node_modules/nitropack/dist/runtime/internal/cache').cachedFunction
  const callNodeListener: typeof import('../../node_modules/h3').callNodeListener
  const clearResponseHeaders: typeof import('../../node_modules/h3').clearResponseHeaders
  const clearSession: typeof import('../../node_modules/h3').clearSession
  const computeRecipeMacros: typeof import('../../server/utils/macros').computeRecipeMacros
  const createApp: typeof import('../../node_modules/h3').createApp
  const createAppEventHandler: typeof import('../../node_modules/h3').createAppEventHandler
  const createAuthError: typeof import('../../server/utils/errors').createAuthError
  const createConflictError: typeof import('../../server/utils/errors').createConflictError
  const createError: typeof import('../../node_modules/h3').createError
  const createEvent: typeof import('../../node_modules/h3').createEvent
  const createEventStream: typeof import('../../node_modules/h3').createEventStream
  const createIngredientSchema: typeof import('../../server/utils/recipe-validation').createIngredientSchema
  const createNotFoundError: typeof import('../../server/utils/errors').createNotFoundError
  const createRateLimitError: typeof import('../../server/utils/errors').createRateLimitError
  const createRecipeSchema: typeof import('../../server/utils/recipe-validation').createRecipeSchema
  const createRouter: typeof import('../../node_modules/h3').createRouter
  const createValidationError: typeof import('../../server/utils/errors').createValidationError
  const defaultContentType: typeof import('../../node_modules/h3').defaultContentType
  const defineAppConfig: typeof import('../../node_modules/.pnpm/@nuxt+nitro-server@4.4.8_@babel+plugin-syntax-typescript@7.29.7_@babel+core@7.29.7__db0_d48f01afba2ec52248f623aad850bf9f/node_modules/@nuxt/nitro-server/dist/runtime/utils/config').defineAppConfig
  const defineCachedEventHandler: typeof import('../../node_modules/nitropack/dist/runtime/internal/cache').defineCachedEventHandler
  const defineCachedFunction: typeof import('../../node_modules/nitropack/dist/runtime/internal/cache').defineCachedFunction
  const defineEventHandler: typeof import('../../node_modules/h3').defineEventHandler
  const defineLazyEventHandler: typeof import('../../node_modules/h3').defineLazyEventHandler
  const defineNitroErrorHandler: typeof import('../../node_modules/nitropack/dist/runtime/internal/error/utils').defineNitroErrorHandler
  const defineNitroPlugin: typeof import('../../node_modules/nitropack/dist/runtime/internal/plugin').defineNitroPlugin
  const defineNodeListener: typeof import('../../node_modules/h3').defineNodeListener
  const defineNodeMiddleware: typeof import('../../node_modules/h3').defineNodeMiddleware
  const defineRenderHandler: typeof import('../../node_modules/nitropack/dist/runtime/internal/renderer').defineRenderHandler
  const defineRequestMiddleware: typeof import('../../node_modules/h3').defineRequestMiddleware
  const defineResponseMiddleware: typeof import('../../node_modules/h3').defineResponseMiddleware
  const defineRouteMeta: typeof import('../../node_modules/nitropack/dist/runtime/internal/meta').defineRouteMeta
  const defineTask: typeof import('../../node_modules/nitropack/dist/runtime/internal/task').defineTask
  const defineWebSocket: typeof import('../../node_modules/h3').defineWebSocket
  const defineWebSocketHandler: typeof import('../../node_modules/h3').defineWebSocketHandler
  const deleteCookie: typeof import('../../node_modules/h3').deleteCookie
  const dynamicEventHandler: typeof import('../../node_modules/h3').dynamicEventHandler
  const eventHandler: typeof import('../../node_modules/h3').eventHandler
  const fetchWithEvent: typeof import('../../node_modules/h3').fetchWithEvent
  const fromNodeMiddleware: typeof import('../../node_modules/h3').fromNodeMiddleware
  const fromPlainHandler: typeof import('../../node_modules/h3').fromPlainHandler
  const fromWebHandler: typeof import('../../node_modules/h3').fromWebHandler
  const generateImageFilename: typeof import('../../server/utils/image-upload').generateImageFilename
  const getCookie: typeof import('../../node_modules/h3').getCookie
  const getHeader: typeof import('../../node_modules/h3').getHeader
  const getHeaders: typeof import('../../node_modules/h3').getHeaders
  const getJwtSecret: typeof import('../../server/utils/secret').getJwtSecret
  const getMethod: typeof import('../../node_modules/h3').getMethod
  const getProxyRequestHeaders: typeof import('../../node_modules/h3').getProxyRequestHeaders
  const getQuery: typeof import('../../node_modules/h3').getQuery
  const getRequestFingerprint: typeof import('../../node_modules/h3').getRequestFingerprint
  const getRequestHeader: typeof import('../../node_modules/h3').getRequestHeader
  const getRequestHeaders: typeof import('../../node_modules/h3').getRequestHeaders
  const getRequestHost: typeof import('../../node_modules/h3').getRequestHost
  const getRequestIP: typeof import('../../node_modules/h3').getRequestIP
  const getRequestPath: typeof import('../../node_modules/h3').getRequestPath
  const getRequestProtocol: typeof import('../../node_modules/h3').getRequestProtocol
  const getRequestURL: typeof import('../../node_modules/h3').getRequestURL
  const getRequestWebStream: typeof import('../../node_modules/h3').getRequestWebStream
  const getResponseHeader: typeof import('../../node_modules/h3').getResponseHeader
  const getResponseHeaders: typeof import('../../node_modules/h3').getResponseHeaders
  const getResponseStatus: typeof import('../../node_modules/h3').getResponseStatus
  const getResponseStatusText: typeof import('../../node_modules/h3').getResponseStatusText
  const getRouteRules: typeof import('../../node_modules/nitropack/dist/runtime/internal/route-rules').getRouteRules
  const getRouterParam: typeof import('../../node_modules/h3').getRouterParam
  const getRouterParams: typeof import('../../node_modules/h3').getRouterParams
  const getSecretKey: typeof import('../../server/utils/secret').getSecretKey
  const getSession: typeof import('../../node_modules/h3').getSession
  const getValidatedQuery: typeof import('../../node_modules/h3').getValidatedQuery
  const getValidatedRouterParams: typeof import('../../node_modules/h3').getValidatedRouterParams
  const handleCacheHeaders: typeof import('../../node_modules/h3').handleCacheHeaders
  const handleCors: typeof import('../../node_modules/h3').handleCors
  const hashPassword: typeof import('../../server/utils/auth').hashPassword
  const hashRefreshToken: typeof import('../../server/utils/auth').hashRefreshToken
  const isCorsOriginAllowed: typeof import('../../node_modules/h3').isCorsOriginAllowed
  const isError: typeof import('../../node_modules/h3').isError
  const isEvent: typeof import('../../node_modules/h3').isEvent
  const isEventHandler: typeof import('../../node_modules/h3').isEventHandler
  const isMethod: typeof import('../../node_modules/h3').isMethod
  const isPreflightRequest: typeof import('../../node_modules/h3').isPreflightRequest
  const isStream: typeof import('../../node_modules/h3').isStream
  const isWebResponse: typeof import('../../node_modules/h3').isWebResponse
  const lazyEventHandler: typeof import('../../node_modules/h3').lazyEventHandler
  const lineItemMacros: typeof import('../../server/utils/macros').lineItemMacros
  const loadOwnedRecipe: typeof import('../../server/utils/recipe-helpers').loadOwnedRecipe
  const loginSchema: typeof import('../../server/utils/validation').loginSchema
  const mapIngredient: typeof import('../../server/utils/recipe-validation').mapIngredient
  const nitroPlugin: typeof import('../../node_modules/nitropack/dist/runtime/internal/plugin').nitroPlugin
  const parseCookies: typeof import('../../node_modules/h3').parseCookies
  const perServing: typeof import('../../server/utils/macros').perServing
  const promisifyNodeListener: typeof import('../../node_modules/h3').promisifyNodeListener
  const proxyRequest: typeof import('../../node_modules/h3').proxyRequest
  const readBody: typeof import('../../node_modules/h3').readBody
  const readFormData: typeof import('../../node_modules/h3').readFormData
  const readMultipartFormData: typeof import('../../node_modules/h3').readMultipartFormData
  const readRawBody: typeof import('../../node_modules/h3').readRawBody
  const readValidatedBody: typeof import('../../node_modules/h3').readValidatedBody
  const recipeIngredientInputSchema: typeof import('../../server/utils/recipe-validation').recipeIngredientInputSchema
  const refreshSchema: typeof import('../../server/utils/validation').refreshSchema
  const registerSchema: typeof import('../../server/utils/validation').registerSchema
  const removeRecipeImage: typeof import('../../server/utils/image-upload').removeRecipeImage
  const removeResponseHeader: typeof import('../../node_modules/h3').removeResponseHeader
  const requireAuth: typeof import('../../server/utils/require-auth').requireAuth
  const resolveRecipeImagePath: typeof import('../../server/utils/image-upload').resolveRecipeImagePath
  const runTask: typeof import('../../node_modules/nitropack/dist/runtime/internal/task').runTask
  const sanitizeStatusCode: typeof import('../../node_modules/h3').sanitizeStatusCode
  const sanitizeStatusMessage: typeof import('../../node_modules/h3').sanitizeStatusMessage
  const saveRecipeImage: typeof import('../../server/utils/image-upload').saveRecipeImage
  const sealSession: typeof import('../../node_modules/h3').sealSession
  const send: typeof import('../../node_modules/h3').send
  const sendError: typeof import('../../node_modules/h3').sendError
  const sendIterable: typeof import('../../node_modules/h3').sendIterable
  const sendNoContent: typeof import('../../node_modules/h3').sendNoContent
  const sendProxy: typeof import('../../node_modules/h3').sendProxy
  const sendRedirect: typeof import('../../node_modules/h3').sendRedirect
  const sendStream: typeof import('../../node_modules/h3').sendStream
  const sendWebResponse: typeof import('../../node_modules/h3').sendWebResponse
  const serveStatic: typeof import('../../node_modules/h3').serveStatic
  const setCookie: typeof import('../../node_modules/h3').setCookie
  const setHeader: typeof import('../../node_modules/h3').setHeader
  const setHeaders: typeof import('../../node_modules/h3').setHeaders
  const setResponseHeader: typeof import('../../node_modules/h3').setResponseHeader
  const setResponseHeaders: typeof import('../../node_modules/h3').setResponseHeaders
  const setResponseStatus: typeof import('../../node_modules/h3').setResponseStatus
  const signAccessToken: typeof import('../../server/utils/auth').signAccessToken
  const signRefreshToken: typeof import('../../server/utils/auth').signRefreshToken
  const splitCookiesString: typeof import('../../node_modules/h3').splitCookiesString
  const statRecipeImage: typeof import('../../server/utils/image-upload').statRecipeImage
  const toEventHandler: typeof import('../../node_modules/h3').toEventHandler
  const toNodeListener: typeof import('../../node_modules/h3').toNodeListener
  const toNumber: typeof import('../../server/utils/recipe-validation').toNumber
  const toPlainHandler: typeof import('../../node_modules/h3').toPlainHandler
  const toPublicUrl: typeof import('../../server/utils/image-upload').toPublicUrl
  const toWebHandler: typeof import('../../node_modules/h3').toWebHandler
  const toWebRequest: typeof import('../../node_modules/h3').toWebRequest
  const unsealSession: typeof import('../../node_modules/h3').unsealSession
  const updateRecipeSchema: typeof import('../../server/utils/recipe-validation').updateRecipeSchema
  const updateSession: typeof import('../../node_modules/h3').updateSession
  const useAppConfig: typeof import('../../node_modules/nitropack/dist/runtime/internal/config').useAppConfig
  const useBase: typeof import('../../node_modules/h3').useBase
  const useEvent: typeof import('../../node_modules/nitropack/dist/runtime/internal/context').useEvent
  const useNitroApp: typeof import('../../node_modules/nitropack/dist/runtime/internal/app').useNitroApp
  const useRuntimeConfig: typeof import('../../node_modules/nitropack/dist/runtime/internal/config').useRuntimeConfig
  const useSession: typeof import('../../node_modules/h3').useSession
  const useStorage: typeof import('../../node_modules/nitropack/dist/runtime/internal/storage').useStorage
  const validateBody: typeof import('../../server/utils/validation').validateBody
  const validateImageFile: typeof import('../../server/utils/image-upload').validateImageFile
  const verifyAccessToken: typeof import('../../server/utils/auth').verifyAccessToken
  const verifyPassword: typeof import('../../server/utils/auth').verifyPassword
  const verifyRefreshToken: typeof import('../../server/utils/auth').verifyRefreshToken
  const writeEarlyHints: typeof import('../../node_modules/h3').writeEarlyHints
}
// for type re-export
declare global {
  // @ts-ignore
  export type { EventHandler, EventHandlerRequest, EventHandlerResponse, EventHandlerObject, H3EventContext } from '../../node_modules/h3'
  import('../../node_modules/h3')
  // @ts-ignore
  export type { JwtPayload, RefreshJwtPayload } from '../../server/utils/auth'
  import('../../server/utils/auth')
  // @ts-ignore
  export type { ApiErrorBody } from '../../server/utils/errors'
  import('../../server/utils/errors')
  // @ts-ignore
  export type { IncomingImage, SavedImage } from '../../server/utils/image-upload'
  import('../../server/utils/image-upload')
  // @ts-ignore
  export type { IngredientMacros, MacroLineItem, Macros } from '../../server/utils/macros'
  import('../../server/utils/macros')
  // @ts-ignore
  export type { RecipeIngredientDto, RecipeDto } from '../../server/utils/recipe-helpers'
  import('../../server/utils/recipe-helpers')
  // @ts-ignore
  export type { IngredientDto, CreateIngredientInput, RecipeIngredientInput, CreateRecipeInput, UpdateRecipeInput } from '../../server/utils/recipe-validation'
  import('../../server/utils/recipe-validation')
  // @ts-ignore
  export type { RegisterInput, LoginInput, RefreshInput } from '../../server/utils/validation'
  import('../../server/utils/validation')
}
export { H3Event, H3Error, appendCorsHeaders, appendCorsPreflightHeaders, appendHeader, appendHeaders, appendResponseHeader, appendResponseHeaders, assertMethod, callNodeListener, clearResponseHeaders, clearSession, createApp, createAppEventHandler, createError, createEvent, createEventStream, createRouter, defaultContentType, defineEventHandler, defineLazyEventHandler, defineNodeListener, defineNodeMiddleware, defineRequestMiddleware, defineResponseMiddleware, defineWebSocket, defineWebSocketHandler, deleteCookie, dynamicEventHandler, eventHandler, fetchWithEvent, fromNodeMiddleware, fromPlainHandler, fromWebHandler, getCookie, getHeader, getHeaders, getMethod, getProxyRequestHeaders, getQuery, getRequestFingerprint, getRequestHeader, getRequestHeaders, getRequestHost, getRequestIP, getRequestPath, getRequestProtocol, getRequestURL, getRequestWebStream, getResponseHeader, getResponseHeaders, getResponseStatus, getResponseStatusText, getRouterParam, getRouterParams, getSession, getValidatedQuery, getValidatedRouterParams, handleCacheHeaders, handleCors, isCorsOriginAllowed, isError, isEvent, isEventHandler, isMethod, isPreflightRequest, isStream, isWebResponse, lazyEventHandler, parseCookies, promisifyNodeListener, proxyRequest, readBody, readFormData, readMultipartFormData, readRawBody, readValidatedBody, removeResponseHeader, sanitizeStatusCode, sanitizeStatusMessage, sealSession, send, sendError, sendIterable, sendNoContent, sendProxy, sendRedirect, sendStream, sendWebResponse, serveStatic, setCookie, setHeader, setHeaders, setResponseHeader, setResponseHeaders, setResponseStatus, splitCookiesString, toEventHandler, toNodeListener, toPlainHandler, toWebHandler, toWebRequest, unsealSession, updateSession, useBase, useSession, writeEarlyHints } from 'h3';
export { useNitroApp } from 'nitropack/runtime/internal/app';
export { useRuntimeConfig, useAppConfig } from 'nitropack/runtime/internal/config';
export { defineNitroPlugin, nitroPlugin } from 'nitropack/runtime/internal/plugin';
export { defineCachedFunction, defineCachedEventHandler, cachedFunction, cachedEventHandler } from 'nitropack/runtime/internal/cache';
export { useStorage } from 'nitropack/runtime/internal/storage';
export { defineRenderHandler } from 'nitropack/runtime/internal/renderer';
export { defineRouteMeta } from 'nitropack/runtime/internal/meta';
export { getRouteRules } from 'nitropack/runtime/internal/route-rules';
export { useEvent } from 'nitropack/runtime/internal/context';
export { defineTask, runTask } from 'nitropack/runtime/internal/task';
export { defineNitroErrorHandler } from 'nitropack/runtime/internal/error/utils';
export { buildAssetsURL as __buildAssetsURL, publicAssetsURL as __publicAssetsURL } from '/home/andreas/workspace/food/node_modules/.pnpm/@nuxt+nitro-server@4.4.8_@babel+plugin-syntax-typescript@7.29.7_@babel+core@7.29.7__db0_d48f01afba2ec52248f623aad850bf9f/node_modules/@nuxt/nitro-server/dist/runtime/utils/paths';
export { defineAppConfig } from '/home/andreas/workspace/food/node_modules/.pnpm/@nuxt+nitro-server@4.4.8_@babel+plugin-syntax-typescript@7.29.7_@babel+core@7.29.7__db0_d48f01afba2ec52248f623aad850bf9f/node_modules/@nuxt/nitro-server/dist/runtime/utils/config';
export { hashPassword, verifyPassword, signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, hashRefreshToken } from '/home/andreas/workspace/food/server/utils/auth';
export { createValidationError, createAuthError, createConflictError, createNotFoundError, createRateLimitError } from '/home/andreas/workspace/food/server/utils/errors';
export { PUBLIC_DIR, RECIPES_DIR, RECIPES_SUBDIR, MAX_IMAGE_BYTES, ALLOWED_IMAGE_MIME, validateImageFile, generateImageFilename, resolveRecipeImagePath, saveRecipeImage, removeRecipeImage, statRecipeImage, toPublicUrl } from '/home/andreas/workspace/food/server/utils/image-upload';
export { ATWATER_FACTORS, ZERO_MACROS, atwaterKcalFromMacros, lineItemMacros, computeRecipeMacros, perServing } from '/home/andreas/workspace/food/server/utils/macros';
export { loadOwnedRecipe, buildRecipeDto, assertIngredientsOwned } from '/home/andreas/workspace/food/server/utils/recipe-helpers';
export { toNumber, mapIngredient, createIngredientSchema, recipeIngredientInputSchema, createRecipeSchema, updateRecipeSchema } from '/home/andreas/workspace/food/server/utils/recipe-validation';
export { requireAuth } from '/home/andreas/workspace/food/server/utils/require-auth';
export { getJwtSecret, getSecretKey } from '/home/andreas/workspace/food/server/utils/secret';
export { registerSchema, loginSchema, refreshSchema, validateBody } from '/home/andreas/workspace/food/server/utils/validation';