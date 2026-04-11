export type UserResponse = {
  id: number
  email: string
  name: string
}

export type UserCreateRequest = {
  email: string
  name: string
}

export type UserPutRequest = {
  email: string
  name: string
}

export type UserPatchRequest = {
  email?: string
  name?: string
}

export type TripListItemResponse = {
  id: number
  title: string
  startDate: string
}

export type TripDetailsResponse = {
  id: number
  title: string
  destination: string
  startDate: string
  shortDescription: string
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

export type TripPutRequest = {
  userId: number
  title: string
  destination: string
  startDate: string
  shortDescription: string
  longDescription: string
}

export type TripPatchRequest = {
  userId?: number
  title?: string
  destination?: string
  startDate?: string
  shortDescription?: string
  longDescription?: string
}

export type UserDetailsResponse = {
  id: number
  email: string
  name: string
  trips: TripListItemResponse[]
}
