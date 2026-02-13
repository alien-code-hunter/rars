 // RARS Type Definitions
 
 export type UserRole = 
   | 'PUBLIC'
   | 'APPLICANT' 
   | 'ADMIN_OFFICER' 
   | 'REVIEWER' 
   | 'EXECUTIVE_DIRECTOR' 
   | 'SYSTEM_ADMIN';
 
 export type ApplicantType = 
   | 'STUDENT' 
   | 'NGO' 
   | 'CONSULTANT' 
   | 'GOVERNMENT' 
   | 'ACADEMIC' 
   | 'OTHER';
 
 export type ApplicationStatus = 
   | 'DRAFT'
   | 'SUBMITTED'
   | 'SCREENING'
   | 'RETURNED'
   | 'IN_REVIEW'
   | 'ED_DECISION'
   | 'APPROVED'
   | 'REJECTED'
   | 'ACTIVE_RESEARCH'
   | 'FINAL_SUBMISSION_PENDING'
   | 'COMPLETED'
   | 'PUBLISHED';
 
 export type DataType = 'AGGREGATED' | 'PATIENT_LEVEL';
 
 export type SensitivityLevel = 'PUBLIC' | 'RESTRICTED';
 
 export type DocumentType = 
   | 'ETHICS_LETTER'
   | 'SUPERVISOR_LETTER'
   | 'INSTITUTION_LETTER'
   | 'PROPOSAL'
   | 'FINAL_PAPER'
   | 'TOOL'
   | 'DATASET'
   | 'CODEBOOK'
   | 'APPROVAL_LETTER'
   | 'REJECTION_LETTER'
   | 'OTHER';
 
 export type ReviewStage = 
   | 'PROGRAM'
   | 'HIS'
   | 'DATA_OWNER'
   | 'TECHNICAL'
   | 'OTHER';
 
 export type Recommendation = 'APPROVE' | 'REJECT';
 
 export type DecisionType = 'APPROVED' | 'REJECTED';
 
 export type ExtensionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
 
 export type AccessAction = 'VIEW' | 'DOWNLOAD';
 
 export interface Profile {
   id: string;
   full_name: string;
   email: string;
   phone?: string;
   applicant_type: ApplicantType;
   institution?: string;
   department?: string;
   is_active: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export interface Application {
   id: string;
   reference_number: string;
   applicant_id: string;
   title: string;
   abstract?: string;
   objectives?: string;
   methodology?: string;
   data_type: DataType;
   sensitivity_level: SensitivityLevel;
   sensitivity_reason?: string;
   regions_facilities: string[];
   start_date?: string;
   end_date?: string;
   status: ApplicationStatus;
   ethics_approved: boolean;
   supervisor_name?: string;
   supervisor_email?: string;
   screening_deadline?: string;
   turnaround_deadline?: string;
   created_at: string;
   updated_at: string;
   profiles?: Profile;
 }
 
 export interface Document {
   id: string;
   application_id: string;
   document_type: DocumentType;
   file_name: string;
   file_path: string;
   mime_type?: string;
   size_bytes?: number;
   version: number;
   uploaded_by: string;
   uploaded_at: string;
   is_deleted: boolean;
 }

export interface DocumentDownload {
  id: string;
  document_id: string;
  user_id?: string | null;
  action?: string | null;
  created_at: string;
}
 
 export interface Message {
   id: string;
   application_id: string;
   sender_id: string;
   message_text: string;
   is_read: boolean;
   created_at: string;
   profiles?: Profile;
 }

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body?: string | null;
  link?: string | null;
  type?: string | null;
  is_read: boolean;
  created_at: string;
}
 
 export interface Review {
   id: string;
   application_id: string;
   reviewer_id: string;
   review_stage: ReviewStage;
   recommendation?: Recommendation;
   comments?: string;
   assigned_at: string;
   submitted_at?: string;
   profiles?: Profile;
 }
 
 export interface Decision {
   id: string;
   application_id: string;
   decision: DecisionType;
   decided_by: string;
   decision_date: string;
   letter_document_id?: string;
   notes?: string;
   profiles?: Profile;
 }
 
 export interface Extension {
   id: string;
   application_id: string;
   requested_by: string;
   reason: string;
   current_end_date?: string;
   requested_end_date: string;
   status: ExtensionStatus;
   decided_by?: string;
   decision_date?: string;
   decision_notes?: string;
   created_at: string;
 }
 
 export interface RepositoryItem {
   id: string;
   application_id: string;
   public_visible: boolean;
   restricted: boolean;
   restriction_reason?: string;
   keywords: string[];
   publication_year?: number;
   institution?: string;
   program_area?: string;
   published_at: string;
   applications?: Application;
 }

export interface RepositoryWatchlist {
  id: string;
  user_id: string;
  repository_item_id: string;
  created_at: string;
}
 
 export interface AccessLog {
   id: string;
   repository_item_id: string;
   user_id?: string;
   action: AccessAction;
   ip_address?: string;
   user_agent?: string;
   terms_accepted: boolean;
   created_at: string;
 }
 
 // Status display configuration
 export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
   DRAFT: { label: 'Draft', className: 'status-draft' },
   SUBMITTED: { label: 'Submitted', className: 'status-submitted' },
   SCREENING: { label: 'Screening', className: 'status-screening' },
   RETURNED: { label: 'Returned', className: 'status-submitted' },
   IN_REVIEW: { label: 'In Review', className: 'status-review' },
   ED_DECISION: { label: 'ED Decision', className: 'status-review' },
   APPROVED: { label: 'Approved', className: 'status-approved' },
   REJECTED: { label: 'Rejected', className: 'status-rejected' },
   ACTIVE_RESEARCH: { label: 'Active Research', className: 'status-active' },
   FINAL_SUBMISSION_PENDING: { label: 'Final Submission Pending', className: 'status-screening' },
   COMPLETED: { label: 'Completed', className: 'status-completed' },
   PUBLISHED: { label: 'Published', className: 'status-completed' },
 };