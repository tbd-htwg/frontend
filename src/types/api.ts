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
  transportRoutes?: string[]
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
  transportRoutes?: string[]
  /** Signed URLs for trip-location images when authenticated. */
  locationImageUrls?: string[]
  /** Author user id when returned by the search API. */
  userId?: number
}

export type TripDetailsResponse = TripListItemResponse & {
  longDescription: string
  destinationGooglePlaceId?: string
  tripLocations: TripLocationResponse[]
  transports: TransportResponse[]
  accommodations: AccommodationResponse[]
}

export type TripCreateRequest = {
  userId: number
  title: string
  /** Google Places id; server resolves the display label. */
  destinationGooglePlaceId: string
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
  googlePlaceId?: string
  description: string
  images: TripLocationImageResponse[]
  /** Primary label (POI / place name). */
  placeName?: string
  /** Secondary label (city / locality). */
  cityName?: string
  /** @deprecated Use placeName; kept for HAL projections. */
  locationName: string
  formattedAddress?: string
  address?: string
  latitude?: number
  longitude?: number
  countryCode?: string
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
  startGooglePlaceId?: string
  endGooglePlaceId?: string
  startAddress?: string
  endAddress?: string
  startLatitude?: number
  startLongitude?: number
  endLatitude?: number
  endLongitude?: number
}

export type AccommodationResponse = {
  id: number
  type: string
  name: string
  address: string
  googlePlaceId?: string
  cityName?: string
  latitude?: number
  longitude?: number
  countryCode?: string
  checkInDate?: string
  checkOutDate?: string
  cost?: number
  currency?: string
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
  /** Legacy field from older API builds; prefer {@link url}. */
  productUrl?: string
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
  /** ISO-8601 observation time at the place (Open-Meteo local time). */
  observedAt?: string
  dailyForecasts: ExternalDailyForecast[]
}

export type ExternalTravelWarning = {
  countryCode: string
  countryName: string
  status: string
  summary: string
  infoUrl: string
}

/** Trip stop widgets: weather + travel warning only. */
export type StopExternalInfoResponse = {
  warning?: ExternalTravelWarning
  weather?: ExternalWeatherData
}

/** Accommodation widgets: Viator split by price similarity. */
export type AccommodationExternalInfoResponse = {
  similarPriceTours: ExternalTourResponse[]
  otherTours: ExternalTourResponse[]
}

export type TransportTravelMode = 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT'

export type TransportRouteResponse = {
  mode: TransportTravelMode
  distanceMeters: number
  durationSeconds: number
  distanceText: string
  durationText: string
  encodedPolyline: string
}

/** @deprecated Use {@link StopExternalInfoResponse} for trip stops. */
export type TripExternalInfoResponse = StopExternalInfoResponse & {
  tours?: ExternalTourResponse[]
}

/** Google Places text-search hit from GET /external/details/search */
export type PlaceSuggestion = {
  placeId: string
  placeName: string
  formattedAddress: string
  lat: number
  lon: number
}

/** @deprecated Use PlaceSuggestion */
export type GeocodingSuggestion = PlaceSuggestion & {
  city: string
  displayName: string
  countryCode: string
}
