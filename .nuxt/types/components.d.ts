
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T

interface _GlobalComponents {
  BottomNav: typeof import("../../app/components/BottomNav.vue")['default']
  EmptyState: typeof import("../../app/components/EmptyState.vue")['default']
  IngredientForm: typeof import("../../app/components/IngredientForm.vue")['default']
  OnboardingBarrier: typeof import("../../app/components/OnboardingBarrier.vue")['default']
  RecipeCard: typeof import("../../app/components/RecipeCard.vue")['default']
  RecipeForm: typeof import("../../app/components/RecipeForm.vue")['default']
  IconsIconList: typeof import("../../app/components/icons/IconList.vue")['default']
  IconsIconPlan: typeof import("../../app/components/icons/IconPlan.vue")['default']
  IconsIconSettings: typeof import("../../app/components/icons/IconSettings.vue")['default']
  IconsIconStorage: typeof import("../../app/components/icons/IconStorage.vue")['default']
  IconsIconToday: typeof import("../../app/components/icons/IconToday.vue")['default']
  NuxtWelcome: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/welcome.vue")['default']
  NuxtLayout: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-layout")['default']
  NuxtErrorBoundary: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
  ClientOnly: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/client-only")['default']
  DevOnly: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/dev-only")['default']
  ServerPlaceholder: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/server-placeholder")['default']
  NuxtLink: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-link")['default']
  NuxtLoadingIndicator: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
  NuxtTime: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
  NuxtRouteAnnouncer: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
  NuxtAnnouncer: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-announcer")['default']
  NuxtImg: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
  NuxtPicture: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
  VitePwaManifest: typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/VitePwaManifest")['default']
  NuxtPwaManifest: typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/VitePwaManifest")['default']
  NuxtPwaAssets: typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/NuxtPwaAssets")['default']
  PwaAppleImage: typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/nuxt4/PwaAppleImage")['default']
  PwaAppleSplashScreenImage: typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/nuxt4/PwaAppleSplashScreenImage")['default']
  PwaFaviconImage: typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/nuxt4/PwaFaviconImage")['default']
  PwaMaskableImage: typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/nuxt4/PwaMaskableImage")['default']
  PwaTransparentImage: typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/nuxt4/PwaTransparentImage")['default']
  NuxtPage: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/pages/runtime/page")['default']
  NoScript: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['NoScript']
  Link: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Link']
  Base: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Base']
  Title: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Title']
  Meta: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Meta']
  Style: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Style']
  Head: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Head']
  Html: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Html']
  Body: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Body']
  NuxtIsland: typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-island")['default']
  LazyBottomNav: LazyComponent<typeof import("../../app/components/BottomNav.vue")['default']>
  LazyEmptyState: LazyComponent<typeof import("../../app/components/EmptyState.vue")['default']>
  LazyIngredientForm: LazyComponent<typeof import("../../app/components/IngredientForm.vue")['default']>
  LazyOnboardingBarrier: LazyComponent<typeof import("../../app/components/OnboardingBarrier.vue")['default']>
  LazyRecipeCard: LazyComponent<typeof import("../../app/components/RecipeCard.vue")['default']>
  LazyRecipeForm: LazyComponent<typeof import("../../app/components/RecipeForm.vue")['default']>
  LazyIconsIconList: LazyComponent<typeof import("../../app/components/icons/IconList.vue")['default']>
  LazyIconsIconPlan: LazyComponent<typeof import("../../app/components/icons/IconPlan.vue")['default']>
  LazyIconsIconSettings: LazyComponent<typeof import("../../app/components/icons/IconSettings.vue")['default']>
  LazyIconsIconStorage: LazyComponent<typeof import("../../app/components/icons/IconStorage.vue")['default']>
  LazyIconsIconToday: LazyComponent<typeof import("../../app/components/icons/IconToday.vue")['default']>
  LazyNuxtWelcome: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/welcome.vue")['default']>
  LazyNuxtLayout: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
  LazyNuxtErrorBoundary: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
  LazyClientOnly: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/client-only")['default']>
  LazyDevOnly: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/dev-only")['default']>
  LazyServerPlaceholder: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/server-placeholder")['default']>
  LazyNuxtLink: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-link")['default']>
  LazyNuxtLoadingIndicator: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
  LazyNuxtTime: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
  LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
  LazyNuxtAnnouncer: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-announcer")['default']>
  LazyNuxtImg: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
  LazyNuxtPicture: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
  LazyVitePwaManifest: LazyComponent<typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/VitePwaManifest")['default']>
  LazyNuxtPwaManifest: LazyComponent<typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/VitePwaManifest")['default']>
  LazyNuxtPwaAssets: LazyComponent<typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/NuxtPwaAssets")['default']>
  LazyPwaAppleImage: LazyComponent<typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/nuxt4/PwaAppleImage")['default']>
  LazyPwaAppleSplashScreenImage: LazyComponent<typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/nuxt4/PwaAppleSplashScreenImage")['default']>
  LazyPwaFaviconImage: LazyComponent<typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/nuxt4/PwaFaviconImage")['default']>
  LazyPwaMaskableImage: LazyComponent<typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/nuxt4/PwaMaskableImage")['default']>
  LazyPwaTransparentImage: LazyComponent<typeof import("../../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.6_@types+node@26.1.1_jiti@2.7.0_terser@5.4_a40549a93aebd3820743b30da5f981c3/node_modules/@vite-pwa/nuxt/dist/runtime/components/nuxt4/PwaTransparentImage")['default']>
  LazyNuxtPage: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/pages/runtime/page")['default']>
  LazyNoScript: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['NoScript']>
  LazyLink: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Link']>
  LazyBase: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Base']>
  LazyTitle: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Title']>
  LazyMeta: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Meta']>
  LazyStyle: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Style']>
  LazyHead: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Head']>
  LazyHtml: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Html']>
  LazyBody: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/head/runtime/components")['Body']>
  LazyNuxtIsland: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@4.4.8_@babel+plugin-syntax-jsx@7.29.7_@babel+core@7.29.7__@babel+plugin-syntax-typ_381a009cc2e1b95587fcad1f3851f277/node_modules/nuxt/dist/app/components/nuxt-island")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
