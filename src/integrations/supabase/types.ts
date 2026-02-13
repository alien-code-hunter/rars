export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          action: Database["public"]["Enums"]["access_action"]
          created_at: string | null
          id: string
          ip_address: unknown
          repository_item_id: string
          terms_accepted: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["access_action"]
          created_at?: string | null
          id?: string
          ip_address?: unknown
          repository_item_id: string
          terms_accepted?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["access_action"]
          created_at?: string | null
          id?: string
          ip_address?: unknown
          repository_item_id?: string
          terms_accepted?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_repository_item_id_fkey"
            columns: ["repository_item_id"]
            isOneToOne: false
            referencedRelation: "repository_items"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          abstract: string | null
          applicant_id: string
          created_at: string | null
          data_type: Database["public"]["Enums"]["data_type"] | null
          end_date: string | null
          ethics_approved: boolean | null
          id: string
          methodology: string | null
          objectives: string | null
          reference_number: string
          regions_facilities: Json | null
          screening_deadline: string | null
          sensitivity_level:
            | Database["public"]["Enums"]["sensitivity_level"]
            | null
          sensitivity_reason: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          supervisor_email: string | null
          supervisor_name: string | null
          title: string
          turnaround_deadline: string | null
          updated_at: string | null
        }
        Insert: {
          abstract?: string | null
          applicant_id: string
          created_at?: string | null
          data_type?: Database["public"]["Enums"]["data_type"] | null
          end_date?: string | null
          ethics_approved?: boolean | null
          id?: string
          methodology?: string | null
          objectives?: string | null
          reference_number?: string
          regions_facilities?: Json | null
          screening_deadline?: string | null
          sensitivity_level?:
            | Database["public"]["Enums"]["sensitivity_level"]
            | null
          sensitivity_reason?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          supervisor_email?: string | null
          supervisor_name?: string | null
          title: string
          turnaround_deadline?: string | null
          updated_at?: string | null
        }
        Update: {
          abstract?: string | null
          applicant_id?: string
          created_at?: string | null
          data_type?: Database["public"]["Enums"]["data_type"] | null
          end_date?: string | null
          ethics_approved?: boolean | null
          id?: string
          methodology?: string | null
          objectives?: string | null
          reference_number?: string
          regions_facilities?: Json | null
          screening_deadline?: string | null
          sensitivity_level?:
            | Database["public"]["Enums"]["sensitivity_level"]
            | null
          sensitivity_reason?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          supervisor_email?: string | null
          supervisor_name?: string | null
          title?: string
          turnaround_deadline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
        }
        Relationships: []
      }
      decisions: {
        Row: {
          application_id: string
          decided_by: string
          decision: Database["public"]["Enums"]["decision_type"]
          decision_date: string | null
          id: string
          letter_document_id: string | null
          notes: string | null
        }
        Insert: {
          application_id: string
          decided_by: string
          decision: Database["public"]["Enums"]["decision_type"]
          decision_date?: string | null
          id?: string
          letter_document_id?: string | null
          notes?: string | null
        }
        Update: {
          application_id?: string
          decided_by?: string
          decision?: Database["public"]["Enums"]["decision_type"]
          decision_date?: string | null
          id?: string
          letter_document_id?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_letter_document_id_fkey"
            columns: ["letter_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
        document_downloads: {
          Row: {
            action: string | null
            created_at: string | null
            document_id: string
            id: string
            user_id: string | null
          }
          Insert: {
            action?: string | null
            created_at?: string | null
            document_id: string
            id?: string
            user_id?: string | null
          }
          Update: {
            action?: string | null
            created_at?: string | null
            document_id?: string
            id?: string
            user_id?: string | null
          }
          Relationships: [
            {
              foreignKeyName: "document_downloads_document_id_fkey"
              columns: ["document_id"]
              isOneToOne: false
              referencedRelation: "documents"
              referencedColumns: ["id"]
            },
          ]
        }
      documents: {
        Row: {
          application_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          id: string
          is_deleted: boolean | null
          mime_type: string | null
          size_bytes: number | null
          uploaded_at: string | null
          uploaded_by: string
          version: number | null
        }
        Insert: {
          application_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          id?: string
          is_deleted?: boolean | null
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_at?: string | null
          uploaded_by: string
          version?: number | null
        }
        Update: {
          application_id?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_path?: string
          id?: string
          is_deleted?: boolean | null
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_at?: string | null
          uploaded_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      extensions: {
        Row: {
          application_id: string
          created_at: string | null
          current_end_date: string | null
          decided_by: string | null
          decision_date: string | null
          decision_notes: string | null
          id: string
          reason: string
          requested_by: string
          requested_end_date: string
          status: Database["public"]["Enums"]["extension_status"] | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          current_end_date?: string | null
          decided_by?: string | null
          decision_date?: string | null
          decision_notes?: string | null
          id?: string
          reason: string
          requested_by: string
          requested_end_date: string
          status?: Database["public"]["Enums"]["extension_status"] | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          current_end_date?: string | null
          decided_by?: string | null
          decision_date?: string | null
          decision_notes?: string | null
          id?: string
          reason?: string
          requested_by?: string
          requested_end_date?: string
          status?: Database["public"]["Enums"]["extension_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "extensions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          application_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_text: string
          sender_id: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text: string
          sender_id: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          applicant_type: Database["public"]["Enums"]["applicant_type"] | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          id: string
          institution: string | null
          is_active: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_type?: Database["public"]["Enums"]["applicant_type"] | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          id: string
          institution?: string | null
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_type?: Database["public"]["Enums"]["applicant_type"] | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          institution?: string | null
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      repository_items: {
        Row: {
          application_id: string
          id: string
          institution: string | null
          keywords: Json | null
          program_area: string | null
          public_visible: boolean | null
          publication_year: number | null
          published_at: string | null
          restricted: boolean | null
          restriction_reason: string | null
        }
        Insert: {
          application_id: string
          id?: string
          institution?: string | null
          keywords?: Json | null
          program_area?: string | null
          public_visible?: boolean | null
          publication_year?: number | null
          published_at?: string | null
          restricted?: boolean | null
          restriction_reason?: string | null
        }
        Update: {
          application_id?: string
          id?: string
          institution?: string | null
          keywords?: Json | null
          program_area?: string | null
          public_visible?: boolean | null
          publication_year?: number | null
          published_at?: string | null
          restricted?: boolean | null
          restriction_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repository_items_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
        repository_watchlist: {
          Row: {
            created_at: string | null
            id: string
            repository_item_id: string
            user_id: string
          }
          Insert: {
            created_at?: string | null
            id?: string
            repository_item_id: string
            user_id: string
          }
          Update: {
            created_at?: string | null
            id?: string
            repository_item_id?: string
            user_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "repository_watchlist_repository_item_id_fkey"
              columns: ["repository_item_id"]
              isOneToOne: false
              referencedRelation: "repository_items"
              referencedColumns: ["id"]
            },
          ]
        }
      reviews: {
        Row: {
          application_id: string
          assigned_at: string | null
          comments: string | null
          id: string
          recommendation: Database["public"]["Enums"]["recommendation"] | null
          review_stage: Database["public"]["Enums"]["review_stage"]
          reviewer_id: string
          submitted_at: string | null
        }
        Insert: {
          application_id: string
          assigned_at?: string | null
          comments?: string | null
          id?: string
          recommendation?: Database["public"]["Enums"]["recommendation"] | null
          review_stage: Database["public"]["Enums"]["review_stage"]
          reviewer_id: string
          submitted_at?: string | null
        }
        Update: {
          application_id?: string
          assigned_at?: string | null
          comments?: string | null
          id?: string
          recommendation?: Database["public"]["Enums"]["recommendation"] | null
          review_stage?: Database["public"]["Enums"]["review_stage"]
          reviewer_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_reference_number: { Args: never; Returns: string }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      access_action: "VIEW" | "DOWNLOAD"
      applicant_type:
        | "STUDENT"
        | "NGO"
        | "CONSULTANT"
        | "GOVERNMENT"
        | "ACADEMIC"
        | "OTHER"
      application_status:
        | "DRAFT"
        | "SUBMITTED"
        | "SCREENING"
        | "RETURNED"
        | "IN_REVIEW"
        | "ED_DECISION"
        | "APPROVED"
        | "REJECTED"
        | "ACTIVE_RESEARCH"
        | "FINAL_SUBMISSION_PENDING"
        | "COMPLETED"
        | "PUBLISHED"
      data_type: "AGGREGATED" | "PATIENT_LEVEL"
      decision_type: "APPROVED" | "REJECTED"
      document_type:
        | "ETHICS_LETTER"
        | "SUPERVISOR_LETTER"
        | "INSTITUTION_LETTER"
        | "PROPOSAL"
        | "FINAL_PAPER"
        | "TOOL"
        | "DATASET"
        | "CODEBOOK"
        | "APPROVAL_LETTER"
        | "REJECTION_LETTER"
        | "OTHER"
      extension_status: "PENDING" | "APPROVED" | "REJECTED"
      recommendation: "APPROVE" | "REJECT"
      review_stage: "PROGRAM" | "HIS" | "DATA_OWNER" | "TECHNICAL" | "OTHER"
      sensitivity_level: "PUBLIC" | "RESTRICTED"
      user_role:
        | "PUBLIC"
        | "APPLICANT"
        | "ADMIN_OFFICER"
        | "REVIEWER"
        | "EXECUTIVE_DIRECTOR"
        | "SYSTEM_ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_action: ["VIEW", "DOWNLOAD"],
      applicant_type: [
        "STUDENT",
        "NGO",
        "CONSULTANT",
        "GOVERNMENT",
        "ACADEMIC",
        "OTHER",
      ],
      application_status: [
        "DRAFT",
        "SUBMITTED",
        "SCREENING",
        "RETURNED",
        "IN_REVIEW",
        "ED_DECISION",
        "APPROVED",
        "REJECTED",
        "ACTIVE_RESEARCH",
        "FINAL_SUBMISSION_PENDING",
        "COMPLETED",
        "PUBLISHED",
      ],
      data_type: ["AGGREGATED", "PATIENT_LEVEL"],
      decision_type: ["APPROVED", "REJECTED"],
      document_type: [
        "ETHICS_LETTER",
        "SUPERVISOR_LETTER",
        "INSTITUTION_LETTER",
        "PROPOSAL",
        "FINAL_PAPER",
        "TOOL",
        "DATASET",
        "CODEBOOK",
        "APPROVAL_LETTER",
        "REJECTION_LETTER",
        "OTHER",
      ],
      extension_status: ["PENDING", "APPROVED", "REJECTED"],
      recommendation: ["APPROVE", "REJECT"],
      review_stage: ["PROGRAM", "HIS", "DATA_OWNER", "TECHNICAL", "OTHER"],
      sensitivity_level: ["PUBLIC", "RESTRICTED"],
      user_role: [
        "PUBLIC",
        "APPLICANT",
        "ADMIN_OFFICER",
        "REVIEWER",
        "EXECUTIVE_DIRECTOR",
        "SYSTEM_ADMIN",
      ],
    },
  },
} as const
