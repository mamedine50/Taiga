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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      backhaul_offers: {
        Row: {
          available_date: string
          capacity_cbm: number | null
          capacity_kg: number | null
          capacity_linear_ft: number | null
          carrier_company_id: string
          created_at: string | null
          dest_city: string
          discount_pct: number | null
          id: string
          mission_id: string | null
          origin_city: string
          status: string | null
        }
        Insert: {
          available_date: string
          capacity_cbm?: number | null
          capacity_kg?: number | null
          capacity_linear_ft?: number | null
          carrier_company_id: string
          created_at?: string | null
          dest_city: string
          discount_pct?: number | null
          id?: string
          mission_id?: string | null
          origin_city: string
          status?: string | null
        }
        Update: {
          available_date?: string
          capacity_cbm?: number | null
          capacity_kg?: number | null
          capacity_linear_ft?: number | null
          carrier_company_id?: string
          created_at?: string | null
          dest_city?: string
          discount_pct?: number | null
          id?: string
          mission_id?: string | null
          origin_city?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backhaul_offers_carrier_company_id_fkey"
            columns: ["carrier_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backhaul_offers_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_documents: {
        Row: {
          company_id: string
          created_at: string | null
          expires_at: string | null
          file_url: string
          id: string
          reviewed_by: string | null
          status: Database["public"]["Enums"]["doc_status"] | null
          type: Database["public"]["Enums"]["doc_type"]
        }
        Insert: {
          company_id: string
          created_at?: string | null
          expires_at?: string | null
          file_url: string
          id?: string
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["doc_status"] | null
          type: Database["public"]["Enums"]["doc_type"]
        }
        Update: {
          company_id?: string
          created_at?: string | null
          expires_at?: string | null
          file_url?: string
          id?: string
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["doc_status"] | null
          type?: Database["public"]["Enums"]["doc_type"]
        }
        Relationships: [
          {
            foreignKeyName: "carrier_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          language: string | null
          legal_name: string
          neq: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          rating_avg: number | null
          rating_count: number | null
          stripe_account_id: string | null
          stripe_customer_id: string | null
          type: Database["public"]["Enums"]["company_type"]
          verified: boolean | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          language?: string | null
          legal_name: string
          neq?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          type: Database["public"]["Enums"]["company_type"]
          verified?: boolean | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          language?: string | null
          legal_name?: string
          neq?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          type?: Database["public"]["Enums"]["company_type"]
          verified?: boolean | null
        }
        Relationships: []
      }
      corridor_rates: {
        Row: {
          corridor_id: string
          effective_from: string
          effective_to: string | null
          fuel_surcharge_pct: number | null
          handling_per_pallet: number | null
          id: string
          insurance_pct: number | null
          min_charge: number
          rate_per_kg: number
          season: Database["public"]["Enums"]["season"]
          season_surcharge_pct: number | null
        }
        Insert: {
          corridor_id: string
          effective_from: string
          effective_to?: string | null
          fuel_surcharge_pct?: number | null
          handling_per_pallet?: number | null
          id?: string
          insurance_pct?: number | null
          min_charge: number
          rate_per_kg: number
          season: Database["public"]["Enums"]["season"]
          season_surcharge_pct?: number | null
        }
        Update: {
          corridor_id?: string
          effective_from?: string
          effective_to?: string | null
          fuel_surcharge_pct?: number | null
          handling_per_pallet?: number | null
          id?: string
          insurance_pct?: number | null
          min_charge?: number
          rate_per_kg?: number
          season?: Database["public"]["Enums"]["season"]
          season_surcharge_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "corridor_rates_corridor_id_fkey"
            columns: ["corridor_id"]
            isOneToOne: false
            referencedRelation: "corridors"
            referencedColumns: ["id"]
          },
        ]
      }
      corridors: {
        Row: {
          active: boolean | null
          cellular_coverage:
            | Database["public"]["Enums"]["coverage_level"]
            | null
          code: string
          dest_region: string
          distance_km: number | null
          id: string
          name: string
          origin_region: string
          requires_satellite: boolean | null
          service_days: string[] | null
        }
        Insert: {
          active?: boolean | null
          cellular_coverage?:
            | Database["public"]["Enums"]["coverage_level"]
            | null
          code: string
          dest_region: string
          distance_km?: number | null
          id?: string
          name: string
          origin_region: string
          requires_satellite?: boolean | null
          service_days?: string[] | null
        }
        Update: {
          active?: boolean | null
          cellular_coverage?:
            | Database["public"]["Enums"]["coverage_level"]
            | null
          code?: string
          dest_region?: string
          distance_km?: number | null
          id?: string
          name?: string
          origin_region?: string
          requires_satellite?: boolean | null
          service_days?: string[] | null
        }
        Relationships: []
      }
      departures: {
        Row: {
          booked_cbm: number | null
          booked_kg: number | null
          booked_linear_ft: number | null
          capacity_cbm: number | null
          capacity_kg: number | null
          capacity_linear_ft: number | null
          corridor_id: string
          created_at: string | null
          departure_date: string
          driver_id: string | null
          id: string
          status: string | null
          terminal_city: string
          vehicle_id: string | null
        }
        Insert: {
          booked_cbm?: number | null
          booked_kg?: number | null
          booked_linear_ft?: number | null
          capacity_cbm?: number | null
          capacity_kg?: number | null
          capacity_linear_ft?: number | null
          corridor_id: string
          created_at?: string | null
          departure_date: string
          driver_id?: string | null
          id?: string
          status?: string | null
          terminal_city: string
          vehicle_id?: string | null
        }
        Update: {
          booked_cbm?: number | null
          booked_kg?: number | null
          booked_linear_ft?: number | null
          capacity_cbm?: number | null
          capacity_kg?: number | null
          capacity_linear_ft?: number | null
          corridor_id?: string
          created_at?: string | null
          departure_date?: string
          driver_id?: string | null
          id?: string
          status?: string | null
          terminal_city?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departures_corridor_id_fkey"
            columns: ["corridor_id"]
            isOneToOne: false
            referencedRelation: "corridors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departures_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departures_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string | null
          id: string
          opened_by: string
          reason: string
          resolution: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["dispute_status"] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          opened_by: string
          reason: string
          resolution?: string | null
          shipment_id: string
          status?: Database["public"]["Enums"]["dispute_status"] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          opened_by?: string
          reason?: string
          resolution?: string | null
          shipment_id?: string
          status?: Database["public"]["Enums"]["dispute_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          active: boolean | null
          company_id: string
          created_at: string | null
          id: string
          license_class: string | null
          license_number: string | null
          profile_id: string | null
        }
        Insert: {
          active?: boolean | null
          company_id: string
          created_at?: string | null
          id?: string
          license_class?: string | null
          license_number?: string | null
          profile_id?: string | null
        }
        Update: {
          active?: boolean | null
          company_id?: string
          created_at?: string | null
          id?: string
          license_class?: string | null
          license_number?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          gst: number | null
          id: string
          issued_at: string | null
          number: string
          pdf_url: string | null
          qst: number | null
          shipment_id: string
          subtotal: number | null
          total: number | null
        }
        Insert: {
          gst?: number | null
          id?: string
          issued_at?: string | null
          number: string
          pdf_url?: string | null
          qst?: number | null
          shipment_id: string
          subtotal?: number | null
          total?: number | null
        }
        Update: {
          gst?: number | null
          id?: string
          issued_at?: string | null
          number?: string
          pdf_url?: string | null
          qst?: number | null
          shipment_id?: string
          subtotal?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: true
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string | null
          from_profile_id: string
          id: number
          shipment_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          from_profile_id: string
          id?: never
          shipment_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          from_profile_id?: string
          id?: never
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_shipments: {
        Row: {
          mission_id: string
          shipment_id: string
        }
        Insert: {
          mission_id: string
          shipment_id: string
        }
        Update: {
          mission_id?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_shipments_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_shipments_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_stops: {
        Row: {
          address: string | null
          city: string | null
          completed_at: string | null
          id: string
          lat: number | null
          lng: number | null
          mission_id: string
          offline_captured: boolean | null
          scheduled_at: string | null
          seq: number
          shipment_id: string | null
          type: Database["public"]["Enums"]["stop_type"]
        }
        Insert: {
          address?: string | null
          city?: string | null
          completed_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          mission_id: string
          offline_captured?: boolean | null
          scheduled_at?: string | null
          seq: number
          shipment_id?: string | null
          type: Database["public"]["Enums"]["stop_type"]
        }
        Update: {
          address?: string | null
          city?: string | null
          completed_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          mission_id?: string
          offline_captured?: boolean | null
          scheduled_at?: string | null
          seq?: number
          shipment_id?: string | null
          type?: Database["public"]["Enums"]["stop_type"]
        }
        Relationships: [
          {
            foreignKeyName: "mission_stops_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_stops_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          accepted_at: string | null
          carrier_company_id: string
          carrier_payout_amount: number
          created_at: string | null
          departure_id: string | null
          driver_id: string | null
          expires_at: string | null
          id: string
          offered_at: string | null
          payout_status: Database["public"]["Enums"]["payout_status"] | null
          platform_fee_amount: number
          status: Database["public"]["Enums"]["mission_status"] | null
          vehicle_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          carrier_company_id: string
          carrier_payout_amount: number
          created_at?: string | null
          departure_id?: string | null
          driver_id?: string | null
          expires_at?: string | null
          id?: string
          offered_at?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"] | null
          platform_fee_amount: number
          status?: Database["public"]["Enums"]["mission_status"] | null
          vehicle_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          carrier_company_id?: string
          carrier_payout_amount?: number
          created_at?: string | null
          departure_id?: string | null
          driver_id?: string | null
          expires_at?: string | null
          id?: string
          offered_at?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"] | null
          platform_fee_amount?: number
          status?: Database["public"]["Enums"]["mission_status"] | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_carrier_company_id_fkey"
            columns: ["carrier_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_departure_id_fkey"
            columns: ["departure_id"]
            isOneToOne: false
            referencedRelation: "departures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          channel: Database["public"]["Enums"]["notif_channel"] | null
          created_at: string | null
          id: number
          link: string | null
          profile_id: string
          read: boolean | null
          title: string
        }
        Insert: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notif_channel"] | null
          created_at?: string | null
          id?: never
          link?: string | null
          profile_id: string
          read?: boolean | null
          title: string
        }
        Update: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notif_channel"] | null
          created_at?: string | null
          id?: never
          link?: string | null
          profile_id?: string
          read?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          carrier_company_id: string
          id: string
          mission_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["payout_status"] | null
          stripe_transfer_id: string | null
        }
        Insert: {
          amount: number
          carrier_company_id: string
          id?: string
          mission_id: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          stripe_transfer_id?: string | null
        }
        Update: {
          amount?: number
          carrier_company_id?: string
          id?: string
          mission_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_carrier_company_id_fkey"
            columns: ["carrier_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      pods: {
        Row: {
          captured_at: string
          damages: boolean | null
          id: string
          lat: number | null
          lng: number | null
          mission_id: string
          notes: string | null
          photo_urls: string[]
          shipment_id: string
          signature_url: string | null
          signee_name: string | null
          synced_at: string | null
        }
        Insert: {
          captured_at: string
          damages?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          mission_id: string
          notes?: string | null
          photo_urls?: string[]
          shipment_id: string
          signature_url?: string | null
          signee_name?: string | null
          synced_at?: string | null
        }
        Update: {
          captured_at?: string
          damages?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          mission_id?: string
          notes?: string | null
          photo_urls?: string[]
          shipment_id?: string
          signature_url?: string | null
          signee_name?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pods_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pods_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: true
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string | null
          full_name: string
          id: string
          language: string | null
          phone: string | null
          push_token: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          full_name: string
          id: string
          language?: string | null
          phone?: string | null
          push_token?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          language?: string | null
          phone?: string | null
          push_token?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          from_profile_id: string
          id: string
          shipment_id: string
          stars: number
          to_company_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          from_profile_id: string
          id?: string
          shipment_id: string
          stars: number
          to_company_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          from_profile_id?: string
          id?: string
          shipment_id?: string
          stars?: number
          to_company_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_to_company_id_fkey"
            columns: ["to_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      route_requests: {
        Row: {
          company_id: string | null
          created_at: string | null
          dest_address: string | null
          dest_city: string
          id: string
          notes: string | null
          origin_address: string | null
          origin_city: string
          requested_by: string
          requested_date: string | null
          status: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          dest_address?: string | null
          dest_city: string
          id?: string
          notes?: string | null
          origin_address?: string | null
          origin_city: string
          requested_by: string
          requested_date?: string | null
          status?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          dest_address?: string | null
          dest_city?: string
          id?: string
          notes?: string | null
          origin_address?: string | null
          origin_city?: string
          requested_by?: string
          requested_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_items: {
        Row: {
          cbm: number | null
          dangerous_goods: boolean | null
          description: string
          height_cm: number
          id: string
          length_cm: number
          notes: string | null
          qty: number
          shipment_id: string
          stackable: boolean | null
          weight_kg_each: number
          width_cm: number
        }
        Insert: {
          cbm?: number | null
          dangerous_goods?: boolean | null
          description: string
          height_cm: number
          id?: string
          length_cm: number
          notes?: string | null
          qty?: number
          shipment_id: string
          stackable?: boolean | null
          weight_kg_each: number
          width_cm: number
        }
        Update: {
          cbm?: number | null
          dangerous_goods?: boolean | null
          description?: string
          height_cm?: number
          id?: string
          length_cm?: number
          notes?: string | null
          qty?: number
          shipment_id?: string
          stackable?: boolean | null
          weight_kg_each?: number
          width_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipment_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          backhaul_discount_pct: number | null
          chargeable_weight_kg: number | null
          corridor_id: string | null
          created_at: string | null
          created_by: string
          currency: string | null
          declared_value: number | null
          departure_id: string | null
          dest_address: string
          dest_city: string
          dest_lat: number | null
          dest_lng: number | null
          flexible: boolean | null
          gst: number | null
          id: string
          is_backhaul: boolean | null
          origin_address: string
          origin_city: string
          origin_lat: number | null
          origin_lng: number | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          qst: number | null
          quote_breakdown: Json | null
          ref: string
          requested_date: string
          shipper_company_id: string
          special_instructions: string | null
          status: Database["public"]["Enums"]["shipment_status"] | null
          stripe_payment_intent_id: string | null
          subtotal: number | null
          total_amount: number | null
          total_cbm: number | null
          total_linear_ft: number | null
          total_weight_kg: number | null
          updated_at: string | null
        }
        Insert: {
          backhaul_discount_pct?: number | null
          chargeable_weight_kg?: number | null
          corridor_id?: string | null
          created_at?: string | null
          created_by: string
          currency?: string | null
          declared_value?: number | null
          departure_id?: string | null
          dest_address: string
          dest_city: string
          dest_lat?: number | null
          dest_lng?: number | null
          flexible?: boolean | null
          gst?: number | null
          id?: string
          is_backhaul?: boolean | null
          origin_address: string
          origin_city: string
          origin_lat?: number | null
          origin_lng?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          qst?: number | null
          quote_breakdown?: Json | null
          ref?: string
          requested_date: string
          shipper_company_id: string
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          total_amount?: number | null
          total_cbm?: number | null
          total_linear_ft?: number | null
          total_weight_kg?: number | null
          updated_at?: string | null
        }
        Update: {
          backhaul_discount_pct?: number | null
          chargeable_weight_kg?: number | null
          corridor_id?: string | null
          created_at?: string | null
          created_by?: string
          currency?: string | null
          declared_value?: number | null
          departure_id?: string | null
          dest_address?: string
          dest_city?: string
          dest_lat?: number | null
          dest_lng?: number | null
          flexible?: boolean | null
          gst?: number | null
          id?: string
          is_backhaul?: boolean | null
          origin_address?: string
          origin_city?: string
          origin_lat?: number | null
          origin_lng?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          qst?: number | null
          quote_breakdown?: Json | null
          ref?: string
          requested_date?: string
          shipper_company_id?: string
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          total_amount?: number | null
          total_cbm?: number | null
          total_linear_ft?: number | null
          total_weight_kg?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_corridor_id_fkey"
            columns: ["corridor_id"]
            isOneToOne: false
            referencedRelation: "corridors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_departure_id_fkey"
            columns: ["departure_id"]
            isOneToOne: false
            referencedRelation: "departures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_shipper_company_id_fkey"
            columns: ["shipper_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      status_events: {
        Row: {
          actor_profile_id: string | null
          created_at: string | null
          id: number
          mission_id: string | null
          offline_captured: boolean | null
          shipment_id: string | null
          status: string
        }
        Insert: {
          actor_profile_id?: string | null
          created_at?: string | null
          id?: never
          mission_id?: string | null
          offline_captured?: boolean | null
          shipment_id?: string | null
          status: string
        }
        Update: {
          actor_profile_id?: string | null
          created_at?: string | null
          id?: never
          mission_id?: string | null
          offline_captured?: boolean | null
          shipment_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_points: {
        Row: {
          id: number
          lat: number
          lng: number
          mission_id: string
          recorded_at: string
          source: Database["public"]["Enums"]["tracking_source"]
          speed_kmh: number | null
          synced_at: string | null
        }
        Insert: {
          id?: never
          lat: number
          lng: number
          mission_id: string
          recorded_at: string
          source?: Database["public"]["Enums"]["tracking_source"]
          speed_kmh?: number | null
          synced_at?: string | null
        }
        Update: {
          id?: never
          lat?: number
          lng?: number
          mission_id?: string
          recorded_at?: string
          source?: Database["public"]["Enums"]["tracking_source"]
          speed_kmh?: number | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_points_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          active: boolean | null
          capacity_cbm: number
          capacity_kg: number
          company_id: string
          created_at: string | null
          id: string
          linear_feet: number | null
          plate: string | null
          telematics: Database["public"]["Enums"]["telematics_type"] | null
          telematics_device_id: string | null
          type: Database["public"]["Enums"]["vehicle_type"]
          unit_number: string
        }
        Insert: {
          active?: boolean | null
          capacity_cbm: number
          capacity_kg: number
          company_id: string
          created_at?: string | null
          id?: string
          linear_feet?: number | null
          plate?: string | null
          telematics?: Database["public"]["Enums"]["telematics_type"] | null
          telematics_device_id?: string | null
          type: Database["public"]["Enums"]["vehicle_type"]
          unit_number: string
        }
        Update: {
          active?: boolean | null
          capacity_cbm?: number
          capacity_kg?: number
          company_id?: string
          created_at?: string | null
          id?: string
          linear_feet?: number | null
          plate?: string | null
          telematics?: Database["public"]["Enums"]["telematics_type"] | null
          telematics_device_id?: string | null
          type?: Database["public"]["Enums"]["vehicle_type"]
          unit_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      accept_mission: {
        Args: { p_driver?: string; p_mission: string; p_vehicle?: string }
        Returns: undefined
      }
      add_shipment_to_departure: {
        Args: { p_departure: string; p_shipment: string }
        Returns: undefined
      }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      assign_departure_to_carrier: {
        Args: {
          p_carrier: string
          p_carrier_payout: number
          p_departure: string
          p_expires_hours?: number
          p_platform_fee: number
        }
        Returns: string
      }
      assign_shipment_to_carrier: {
        Args: {
          p_carrier: string
          p_carrier_payout: number
          p_expires_hours?: number
          p_platform_fee: number
          p_shipment: string
        }
        Returns: string
      }
      can_access_mission: { Args: { mid: string }; Returns: boolean }
      confirm_reservation: {
        Args: {
          p_number: string
          p_payment_intent: string
          p_pdf_path: string
          p_shipment: string
        }
        Returns: undefined
      }
      create_company_and_link: {
        Args: {
          p_city?: string
          p_language?: string
          p_legal_name: string
          p_neq?: string
          p_phone?: string
        }
        Returns: string
      }
      create_departure: {
        Args: {
          p_cap_cbm: number
          p_cap_kg: number
          p_cap_lf: number
          p_corridor: string
          p_date: string
          p_terminal: string
        }
        Returns: string
      }
      disablelongtransactions: { Args: never; Returns: string }
      driver_mark_status: {
        Args: { p_mission: string; p_shipment: string; p_status: string }
        Returns: undefined
      }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      is_mission_carrier: { Args: { mid: string }; Returns: boolean }
      is_mission_mine_as_shipper: {
        Args: { p_mission: string }
        Returns: boolean
      }
      is_shipment_in_my_missions: {
        Args: { p_shipment: string }
        Returns: boolean
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      mark_capture_failed: {
        Args: { p_reason: string; p_shipment: string }
        Returns: undefined
      }
      mark_captured: { Args: { p_shipment: string }; Returns: undefined }
      my_company: { Args: never; Returns: string }
      my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      next_invoice_number: { Args: never; Returns: string }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      quote_shipment: { Args: { sid: string }; Returns: Json }
      refuse_mission: { Args: { p_mission: string }; Returns: undefined }
      remove_shipment_from_departure: {
        Args: { p_shipment: string }
        Returns: undefined
      }
      request_custom_route: {
        Args: {
          p_dest_address?: string
          p_dest_city: string
          p_notes?: string
          p_origin_address?: string
          p_origin_city: string
          p_requested_date?: string
        }
        Returns: string
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      submit_pod: {
        Args: {
          p_captured_at: string
          p_damages: boolean
          p_lat: number
          p_lng: number
          p_mission: string
          p_notes: string
          p_photo_urls: string[]
          p_shipment: string
          p_signature_url: string
          p_signee: string
        }
        Returns: undefined
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      company_type: "shipper" | "carrier"
      coverage_level: "complete" | "partielle" | "aucune"
      dispute_status: "ouvert" | "en_analyse" | "resolu" | "ferme"
      doc_status: "en_attente" | "valide" | "expire" | "refuse"
      doc_type:
        | "assurance_cargo"
        | "assurance_responsabilite"
        | "pevl"
        | "permis_conduire"
        | "immatriculation"
        | "autre"
      mission_status:
        | "offerte"
        | "acceptee"
        | "refusee"
        | "expiree"
        | "en_cours"
        | "completee"
        | "annulee"
      notif_channel: "push" | "sms" | "courriel" | "interne"
      payment_status: "en_attente" | "retenu" | "verse" | "rembourse" | "echoue"
      payout_status: "en_attente" | "en_cours" | "verse" | "echoue"
      season: "ete" | "hiver" | "degel"
      shipment_status:
        | "brouillon"
        | "cote"
        | "reserve"
        | "assigne"
        | "ramassage"
        | "en_transit"
        | "livre"
        | "complete"
        | "annule"
        | "litige"
      stop_type: "ramassage" | "terminal" | "livraison"
      telematics_type: "cellulaire" | "satellite" | "aucun"
      tracking_source: "cellulaire" | "satellite" | "manuel"
      user_role: "shipper" | "carrier" | "driver" | "admin"
      vehicle_type:
        | "dry_van_53"
        | "dry_van_48"
        | "flatbed"
        | "reefer"
        | "cube"
        | "pickup_remorque"
        | "autre"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      company_type: ["shipper", "carrier"],
      coverage_level: ["complete", "partielle", "aucune"],
      dispute_status: ["ouvert", "en_analyse", "resolu", "ferme"],
      doc_status: ["en_attente", "valide", "expire", "refuse"],
      doc_type: [
        "assurance_cargo",
        "assurance_responsabilite",
        "pevl",
        "permis_conduire",
        "immatriculation",
        "autre",
      ],
      mission_status: [
        "offerte",
        "acceptee",
        "refusee",
        "expiree",
        "en_cours",
        "completee",
        "annulee",
      ],
      notif_channel: ["push", "sms", "courriel", "interne"],
      payment_status: ["en_attente", "retenu", "verse", "rembourse", "echoue"],
      payout_status: ["en_attente", "en_cours", "verse", "echoue"],
      season: ["ete", "hiver", "degel"],
      shipment_status: [
        "brouillon",
        "cote",
        "reserve",
        "assigne",
        "ramassage",
        "en_transit",
        "livre",
        "complete",
        "annule",
        "litige",
      ],
      stop_type: ["ramassage", "terminal", "livraison"],
      telematics_type: ["cellulaire", "satellite", "aucun"],
      tracking_source: ["cellulaire", "satellite", "manuel"],
      user_role: ["shipper", "carrier", "driver", "admin"],
      vehicle_type: [
        "dry_van_53",
        "dry_van_48",
        "flatbed",
        "reefer",
        "cube",
        "pickup_remorque",
        "autre",
      ],
    },
  },
} as const
