import type { ru } from './messages/ru'

/** Формы по категориям Intl.PluralRules: `other` обязательна, остальные — по языку. */
export interface PluralForms {
  zero?: string
  one?: string
  two?: string
  few?: string
  many?: string
  other: string
}

type Shape<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends PluralForms
      ? PluralForms
      : Shape<T[K]>
}

export type Messages = Shape<typeof ru>

type Join<K extends string, P extends string> = `${K}.${P}`

type PathsTo<T, Leaf> = {
  [K in keyof T & string]: T[K] extends Leaf
    ? K
    : T[K] extends string | PluralForms
      ? never
      : Join<K, PathsTo<T[K], Leaf>>
}[keyof T & string]

export type MessageKey = PathsTo<Messages, string>
export type PluralKey = PathsTo<Messages, PluralForms>

export type MessageParams = Record<string, string | number>
