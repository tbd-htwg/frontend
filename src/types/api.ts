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
  authorId?: number
  authorName?: string
  authorProfileImageUrl?: string
  locations?: string[]
  accommodationNames?: string[]
  transportTypes?: string[]
  /** Signed URLs for all trip-location images; populated only when authenticated. */
  locationImageUrls?: string[]
  /** Present when returned from Spring Data REST (HAL `user` link). */
  userId?: number
}

/** Full-text trip search hit (GET /api/search/trips). */
export type TripSearchResult = {
  id: number
  title: string
  author: string
  shortDescription: string
  destination?: string
  startDate?: string
  locations: string[]
  accommodationNames?: string[]
  transportTypes?: string[]
  /** Signed URLs for trip-location images when authenticated. */
  locationImageUrls?: string[]
  /** Author user id when returned by the search API. */
  userId?: number
}

export type TripDetailsResponse = TripListItemResponse & {
  longDescription: string
  tripLocations: TripLocationResponse[]
  transports: TransportResponse[]
  accommodations: AccommodationResponse[]
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

/** Same shape as {@link UserResponse}; kept as a named type for user-profile views. */
export type UserDetailsResponse = UserResponse

/** Display name; maps from backend {@code location.city}. */
export type LocationResponse = {
  id: number
  city: string
  countryCode?: string
  latitude?: number
  longitude?: number
  formattedAddress?: string
}

export type TripLocationResponse = {
  id: number
  tripId: number
  locationId: number
  description: string
  images: TripLocationImageResponse[]
  locationName: string
  formattedAddress?: string
  address?: string
  startDate?: string
  endDate?: string
}

export type TripLocationImageResponse = {
  id: number
  signedReadUrl: string
}

/** Partial update for a trip-location (per-trip visit), not the shared location record. */
export type TripLocationPatchRequest = {
  description?: string
  startDate?: string
  endDate?: string
}

export type SignedImageUploadRequest = {
  fileName: string
  contentType: string
}

export type SignedImageUploadResponse = {
  imageId?: number | null
  uploadUrl: string
  signedReadUrl: string
  objectName: string
  contentType: string
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
  /** Firestore document id (string), not numeric SQL id */
  id: string
  tripId: number
  userId: number
  userName: string
  content: string
  createdAt: string
}

export type ExternalTourResponse = {
  id: string
  title: string
  price: string
  url: string
}

export type ExternalDailyForecast = {
  date: string
  tempMax: number
  tempMin: number
  weatherCode: number
  description: string
}

export type ExternalWeatherData = {
  currentTemp: number
  currentWeatherCode: number
  currentDescription: string
  dailyForecasts: ExternalDailyForecast[]
}

export type ExternalTravelWarning = {
  country: string
  status: string
  message: string
}

export type TripExternalInfoResponse = {
  warning?: ExternalTravelWarning
  weather?: ExternalWeatherData
  tours: ExternalTourResponse[]
}
