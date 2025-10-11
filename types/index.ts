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

export {
  photographerBasicInfoSchema,
  photographerProfessionalInfoSchema,
  photographerPricingInfoSchema,
  photographerSettlementInfoSchema,
  photographer4DProfileSchema,
  type PhotographerBasicInfoFormData,
  type PhotographerProfessionalInfoFormData,
  type PhotographerPricingInfoFormData,
  type PhotographerSettlementInfoFormData,
  type Photographer4DProfileFormData,
  type Photographer as PhotographerType,
  type PhotographerProfile,
  type PhotographerProfileInsert,
  type PhotographerProfileUpdate,
} from './photographer.types'

export {
  refundFormSchema,
  paymentMethodSchema,
  type RefundFormData,
  type PaymentMethod,
  type Payment,
  type PaymentInsert,
  type PaymentUpdate,
  type Refund,
  type RefundInsert,
  type RefundUpdate,
  type TossCardInfo,
  type TossBankInfo,
  type TossWalletInfo,
  type EximbayCardInfo,
  type AdyenCardInfo,
  type StripeCardInfo,
  type PaymentMetadata,
  type CreatePaymentRequest,
  type ConfirmPaymentRequest,
  type PaymentStatus,
  type PaymentResult,
} from './payment.types'

// Product types
export {
  type ProductDB,
  type ProductInsert,
  type ProductUpdate,
  type Product,
  type ProductStats,
} from './product.types'

// Coupon types
export {
  type CouponDB,
  type CouponInsert,
  type CouponUpdate,
  type CouponTemplateDB,
  type CouponTemplateInsert,
  type CouponTemplateUpdate,
  type CouponWithTemplate,
  type CouponFilters,
  type CouponStats,
} from './coupon.types'

// Photographer Keyword types
export {
  type PhotographerKeywordDB,
  type PhotographerKeywordInsert,
  type PhotographerKeywordUpdate,
  type CreateKeywordData,
  type UpdateKeywordData,
} from './keyword.types'

// Story types
export {
  type StoryDB,
  type StoryInsert,
  type StoryUpdate,
  type StoryFilters,
} from './story.types'

// Survey types
export {
  type SurveyQuestionDB,
  type SurveyQuestionInsert,
  type SurveyQuestionUpdate,
  type SurveyChoiceDB,
  type SurveyChoiceInsert,
  type SurveyChoiceUpdate,
  type SurveyImageDB,
  type SurveyImageInsert,
  type SurveyImageUpdate,
  type QuestionWithChoicesAndImages,
  type CreateChoiceData,
  type UpdateChoiceData,
  type CreateSurveyImageData,
  type UpdateSurveyImageData,
} from './survey.types'
