export type HalLink = {
  href: string
}

export type HalPage = {
  size: number
  totalElements: number
  totalPages: number
  number: number
}

export type HalEntity<T> = T & {
  _links?: Record<string, HalLink>
}

export type HalCollection<T> = {
  _embedded?: Record<string, T[]>
  _links?: Record<string, HalLink>
  page?: HalPage
}

export type PaginatedResponse<T> = {
  items: T[]
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type UserResponse = {
  id: number
  email: string
  name: string
  imageUrl: string
  description: string
}

export type UserCreateRequest = {
  email: string
  name: string
  imageUrl?: string
  description?: string
}

export type UserPutRequest = UserCreateRequest

export type UserPatchRequest = Partial<UserCreateRequest>

export type TripListItemResponse = {
  id: number
  title: string
  destination: string
  startDate: string
  shortDescription: string
}

/** Full-text trip search hit (GET /api/search/trips). */
export type TripSearchResult = {
  id: number
  title: string
  author: string
  shortDescription: string
  locations: string[]
}

export type TripDetailsResponse = TripListItemResponse & {
  longDescription: string
}

export type TripCreateRequest = {
  userId: number
  title: string
  destination: string
  startDate: string
  shortDescription: string
  longDescription: string
}

export type TripPutRequest = TripCreateRequest

export type TripPatchRequest = Partial<TripCreateRequest>

export type UserDetailsResponse = UserResponse & {
  trips: TripListItemResponse[]
}

export type LocationResponse = {
  id: number
  name: string
}

export type TripLocationResponse = {
  id: number
  tripId: number
  locationId: number
  description: string
  imageUrl: string
  locationName: string
}

export type TransportResponse = {
  id: number
  type: string
}

export type AccommodationResponse = {
  id: number
  type: string
  name: string
  address: string
}

export type CommentResponse = {
  id: number
  tripId: number
  userId: number
  userName: string
  content: string
  createdAt: string
}
