export interface Term {
  id: number
  /** SERVICE, PRIVACY, MARKETING */
  type: string
  version: string
  content: string
  required: boolean
  effectiveAt?: string
}
