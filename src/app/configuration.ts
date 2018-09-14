import { InjectionToken } from '@angular/core'

export const JWT_LOCALSTORAGE_KEY = new InjectionToken<string>(
  'JWT_LOCALSTORAGE_KEY'
)

export const MOBILE_MEDIA_QUERY = new InjectionToken<string>(
  '(max-width: 720px)'
)
