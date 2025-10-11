// Database types
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './database.types'

// Enums
export {
  type ApprovalStatus,
  type UserRole,
  type InquiryStatus,
  type DocumentType,
  APPROVAL_STATUS,
  USER_ROLE,
  INQUIRY_STATUS,
  DOCUMENT_TYPE,
  APPROVAL_STATUS_VALUES,
  USER_ROLE_VALUES,
  INQUIRY_STATUS_VALUES,
  DOCUMENT_TYPE_VALUES,
  APPROVAL_STATUS_LABELS,
  USER_ROLE_LABELS,
  INQUIRY_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  isApprovalStatus,
  isUserRole,
  isInquiryStatus,
  isDocumentType,
} from './enums'

// Zod Schemas and Form Types
export {
  inquiryFormSchema,
  type InquiryFormValues,
  type InquiryDB,
  type InquiryInsert,
  type InquiryUpdate,
  type Category,
  type MoodKeyword,
  type AvailableSlot,
  type Inquiry,
  type Photographer,
} from './inquiry.types'

export {
  reviewSchema,
  type ReviewFormData,
  type Review,
  type ReviewInsert,
  type ReviewUpdate,
} from './review.types'

export {
  createAdminSchema,
  createPhotographerSchema,
  type CreateAdminFormData,
  type CreatePhotographerFormData,
  type User,
  type UserInsert,
  type UserUpdate,
  type Photographer as PhotographerDB,
  type PhotographerInsert,
  type PhotographerUpdate,
  type AdminUser,
  type PhotographerUser,
} from './user-management.types'

export {
  termsSectionSchema,
  termsCreateSchema,
  termsUpdateSchema,
  type TermsSectionFormData,
  type TermsCreateFormData,
  type TermsUpdateFormData,
  type Terms,
  type TermsInsert,
  type TermsUpdate,
  type TermsSection,
  type TermsSectionInsert,
  type TermsSectionUpdate,
  type TermsWithSections,
} from './terms.types'

export {
  photographerSignupStep1Schema,
  photographerSignupStep2Schema,
  photographerSignupStep3Schema,
  photographerSignupStep4Schema,
  photographerSignupStep5Schema,
  photographerSignupFormSchema,
  type PhotographerSignupStep1,
  type PhotographerSignupStep2,
  type PhotographerSignupStep3,
  type PhotographerSignupStep4,
  type PhotographerSignupStep5,
  type PhotographerSignupFormData,
  type PhotographerInsertData,
  mapFormDataToPhotographerInsert,
} from './photographer-signup.types'

export {
  userSignupSchema,
  photographerSignupSchema,
  type UserSignupFormData,
  type PhotographerSignupFormData as PhotographerSignupFormDataNew,
  type TermsAgreement,
  type ActiveTermsVersions,
} from './signup.types'
