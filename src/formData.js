export const EMPTY_FORM = {
  fullName: '',
  dateOfBirth: '',
  placeOfBirth: '',
  gender: '',
  nationality: '',
  passportNumber: '',
  dateOfIssuance: '',
  dateOfExpiry: '',
  vietnameseAddress: '',
  phoneNumber: '',
  email: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  emergencyContactEmail: '',
  signature: '',
  signatureDate: '',
};

// Fields filled from the ID document. A new extraction resets all of them so
// values from a previous document never linger; user-typed contact details
// (phone, email, emergency contact) are left untouched.
export const EXTRACTED_FIELDS = [
  'fullName',
  'dateOfBirth',
  'placeOfBirth',
  'gender',
  'nationality',
  'passportNumber',
  'dateOfIssuance',
  'dateOfExpiry',
  'vietnameseAddress',
];
