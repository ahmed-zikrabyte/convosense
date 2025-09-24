import mongoose, { Document, Schema } from "mongoose";
import { CLIENT_DB_REF } from "./client.model";
import { CAMPAIGN_DB_REF } from "./campaign.model";

export interface IReport extends Document {
  _id: string;
  report_id: string;
  campaign_id?: string;
  client_id?: string;
  report_type: "campaign_performance" | "call_analytics" | "financial_summary" | "lead_conversion" | "system_health";
  metrics: {
    // Campaign Performance Metrics
    total_calls?: number;
    successful_calls?: number;
    failed_calls?: number;
    pickup_rate?: number;
    average_call_duration?: number;
    conversion_rate?: number;

    // Financial Metrics
    total_cost_usd?: number;
    average_cost_per_call?: number;
    total_minutes_used?: number;
    credits_consumed?: number;
    profit_margin?: number;
    retell_costs?: number;

    // Lead Metrics
    total_leads?: number;
    contacted_leads?: number;
    converted_leads?: number;
    pending_leads?: number;

    // Call Quality Metrics
    average_sentiment_score?: number;
    average_quality_score?: number;
    voicemail_rate?: number;
    hung_up_rate?: number;

    // System Health Metrics
    webhook_success_rate?: number;
    processing_errors?: number;
    system_uptime?: number;
  };
  filters: {
    date_range?: {
      start_date: Date;
      end_date: Date;
    };
    campaign_ids?: string[];
    client_ids?: string[];
    status_filter?: string[];
    outcome_filter?: string[];
  };
  report_period: "daily" | "weekly" | "monthly" | "quarterly" | "custom";
  generated_at: Date;
  generated_by?: string; // Admin user ID
  export_formats: {
    pdf_url?: string;
    csv_url?: string;
    json_data?: Record<string, any>;
  };
  metadata: {
    generation_time_ms?: number;
    data_points_count?: number;
    cached?: boolean;
    version?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    report_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    campaign_id: {
      type: String,
      ref: CAMPAIGN_DB_REF,
      index: true,
    },
    client_id: {
      type: String,
      ref: CLIENT_DB_REF,
      index: true,
    },
    report_type: {
      type: String,
      enum: ["campaign_performance", "call_analytics", "financial_summary", "lead_conversion", "system_health"],
      required: [true, "Report type is required"],
      index: true,
    },
    metrics: {
      // Campaign Performance Metrics
      total_calls: {
        type: Number,
        min: [0, "Total calls cannot be negative"],
      },
      successful_calls: {
        type: Number,
        min: [0, "Successful calls cannot be negative"],
      },
      failed_calls: {
        type: Number,
        min: [0, "Failed calls cannot be negative"],
      },
      pickup_rate: {
        type: Number,
        min: [0, "Pickup rate cannot be negative"],
        max: [100, "Pickup rate cannot exceed 100%"],
      },
      average_call_duration: {
        type: Number,
        min: [0, "Average call duration cannot be negative"],
      },
      conversion_rate: {
        type: Number,
        min: [0, "Conversion rate cannot be negative"],
        max: [100, "Conversion rate cannot exceed 100%"],
      },

      // Financial Metrics
      total_cost_usd: {
        type: Number,
        min: [0, "Total cost cannot be negative"],
      },
      average_cost_per_call: {
        type: Number,
        min: [0, "Average cost per call cannot be negative"],
      },
      total_minutes_used: {
        type: Number,
        min: [0, "Total minutes cannot be negative"],
      },
      credits_consumed: {
        type: Number,
        min: [0, "Credits consumed cannot be negative"],
      },
      profit_margin: {
        type: Number,
      },
      retell_costs: {
        type: Number,
        min: [0, "Retell costs cannot be negative"],
      },

      // Lead Metrics
      total_leads: {
        type: Number,
        min: [0, "Total leads cannot be negative"],
      },
      contacted_leads: {
        type: Number,
        min: [0, "Contacted leads cannot be negative"],
      },
      converted_leads: {
        type: Number,
        min: [0, "Converted leads cannot be negative"],
      },
      pending_leads: {
        type: Number,
        min: [0, "Pending leads cannot be negative"],
      },

      // Call Quality Metrics
      average_sentiment_score: {
        type: Number,
        min: [0, "Average sentiment score cannot be negative"],
        max: [100, "Average sentiment score cannot exceed 100"],
      },
      average_quality_score: {
        type: Number,
        min: [1, "Average quality score must be at least 1"],
        max: [5, "Average quality score cannot exceed 5"],
      },
      voicemail_rate: {
        type: Number,
        min: [0, "Voicemail rate cannot be negative"],
        max: [100, "Voicemail rate cannot exceed 100%"],
      },
      hung_up_rate: {
        type: Number,
        min: [0, "Hung up rate cannot be negative"],
        max: [100, "Hung up rate cannot exceed 100%"],
      },

      // System Health Metrics
      webhook_success_rate: {
        type: Number,
        min: [0, "Webhook success rate cannot be negative"],
        max: [100, "Webhook success rate cannot exceed 100%"],
      },
      processing_errors: {
        type: Number,
        min: [0, "Processing errors cannot be negative"],
      },
      system_uptime: {
        type: Number,
        min: [0, "System uptime cannot be negative"],
        max: [100, "System uptime cannot exceed 100%"],
      },
    },
    filters: {
      date_range: {
        start_date: {
          type: Date,
        },
        end_date: {
          type: Date,
        },
      },
      campaign_ids: [{
        type: String,
      }],
      client_ids: [{
        type: String,
      }],
      status_filter: [{
        type: String,
      }],
      outcome_filter: [{
        type: String,
      }],
    },
    report_period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly", "custom"],
      required: [true, "Report period is required"],
      index: true,
    },
    generated_at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    generated_by: {
      type: String,
      index: true,
    },
    export_formats: {
      pdf_url: {
        type: String,
      },
      csv_url: {
        type: String,
      },
      json_data: {
        type: Schema.Types.Mixed,
      },
    },
    metadata: {
      generation_time_ms: {
        type: Number,
        min: [0, "Generation time cannot be negative"],
      },
      data_points_count: {
        type: Number,
        min: [0, "Data points count cannot be negative"],
      },
      cached: {
        type: Boolean,
        default: false,
      },
      version: {
        type: String,
        default: "1.0",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
reportSchema.index({ report_type: 1, generated_at: -1 });
reportSchema.index({ campaign_id: 1, report_type: 1 });
reportSchema.index({ client_id: 1, report_type: 1 });
reportSchema.index({ generated_at: -1 });
reportSchema.index({ report_period: 1, generated_at: -1 });

// Generate report_id before saving
reportSchema.pre("save", async function (next) {
  if (!this.report_id) {
    this.report_id = `rpt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  next();
});

// Method to calculate efficiency score
reportSchema.methods.getEfficiencyScore = function(): number {
  const metrics = this.metrics;
  if (!metrics.total_calls || metrics.total_calls === 0) return 0;

  const pickupWeight = 0.3;
  const conversionWeight = 0.4;
  const qualityWeight = 0.3;

  const pickupScore = (metrics.pickup_rate || 0) * pickupWeight;
  const conversionScore = (metrics.conversion_rate || 0) * conversionWeight;
  const qualityScore = ((metrics.average_quality_score || 3) / 5 * 100) * qualityWeight;

  return Math.round(pickupScore + conversionScore + qualityScore);
};

// Method to check if report is stale
reportSchema.methods.isStale = function(hoursThreshold: number = 24): boolean {
  const ageInHours = (Date.now() - this.generated_at.getTime()) / (1000 * 60 * 60);
  return ageInHours > hoursThreshold;
};

// Static method to get recent reports
reportSchema.statics.getRecentReports = function(reportType?: string, limit: number = 10) {
  const query = reportType ? { report_type: reportType } : {};
  return this.find(query)
    .sort({ generated_at: -1 })
    .limit(limit)
    .populate("campaign_id", "name")
    .populate("client_id", "name email");
};

// Static method to get reports by date range
reportSchema.statics.getByDateRange = function(startDate: Date, endDate: Date, clientId?: string, campaignId?: string) {
  const query: any = {
    generated_at: {
      $gte: startDate,
      $lte: endDate
    }
  };

  if (clientId) query.client_id = clientId;
  if (campaignId) query.campaign_id = campaignId;

  return this.find(query).sort({ generated_at: -1 });
};

export const REPORT_DB_REF = "Report";
const Report = mongoose.model<IReport>(REPORT_DB_REF, reportSchema);

export default Report;