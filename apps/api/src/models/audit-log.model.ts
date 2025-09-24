import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  _id: string;
  log_id: string;
  user_id: string;
  user_type: "super_admin" | "admin" | "client" | "system";
  action: string;
  resource: string;
  resource_id?: string;
  details: {
    method?: string;
    endpoint?: string;
    ip_address?: string;
    user_agent?: string;
    changes?: {
      before?: Record<string, any>;
      after?: Record<string, any>;
      fields_changed?: string[];
    };
    additional_data?: Record<string, any>;
  };
  status: "success" | "failed" | "unauthorized" | "forbidden";
  severity: "low" | "medium" | "high" | "critical";
  category: "auth" | "user_management" | "campaign" | "financial" | "system" | "api" | "webhook";
  session_id?: string;
  request_id?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    log_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user_id: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    user_type: {
      type: String,
      enum: ["super_admin", "admin", "client", "system"],
      required: [true, "User type is required"],
      index: true,
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
      index: true,
    },
    resource: {
      type: String,
      required: [true, "Resource is required"],
      trim: true,
      index: true,
    },
    resource_id: {
      type: String,
      index: true,
    },
    details: {
      method: {
        type: String,
        enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      },
      endpoint: {
        type: String,
        trim: true,
      },
      ip_address: {
        type: String,
        match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, "Invalid IP address format"],
      },
      user_agent: {
        type: String,
      },
      changes: {
        before: {
          type: Schema.Types.Mixed,
        },
        after: {
          type: Schema.Types.Mixed,
        },
        fields_changed: [{
          type: String,
          trim: true,
        }],
      },
      additional_data: {
        type: Schema.Types.Mixed,
      },
    },
    status: {
      type: String,
      enum: ["success", "failed", "unauthorized", "forbidden"],
      required: [true, "Status is required"],
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: [true, "Severity is required"],
      index: true,
    },
    category: {
      type: String,
      enum: ["auth", "user_management", "campaign", "financial", "system", "api", "webhook"],
      required: [true, "Category is required"],
      index: true,
    },
    session_id: {
      type: String,
      index: true,
    },
    request_id: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for efficient queries
auditLogSchema.index({ user_id: 1, createdAt: -1 });
auditLogSchema.index({ user_type: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resource_id: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, severity: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// TTL index for automatic cleanup (90 days)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Generate log_id before saving
auditLogSchema.pre("save", async function (next) {
  if (!this.log_id) {
    this.log_id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  next();
});

// Method to check if log is critical
auditLogSchema.methods.isCritical = function(): boolean {
  return this.severity === "critical" ||
         (this.status === "unauthorized" && this.category === "financial") ||
         (this.action.includes("delete") && this.category === "user_management");
};

// Method to get human-readable description
auditLogSchema.methods.getDescription = function(): string {
  const actionMap: Record<string, string> = {
    "create": "created",
    "update": "updated",
    "delete": "deleted",
    "login": "logged in",
    "logout": "logged out",
    "access": "accessed",
    "download": "downloaded",
    "upload": "uploaded",
  };

  const action = actionMap[this.action.toLowerCase()] || this.action;
  const article = ["a", "e", "i", "o", "u"].includes(this.resource[0]?.toLowerCase()) ? "an" : "a";

  return `User ${this.user_id} ${action} ${article} ${this.resource}${this.resource_id ? ` (${this.resource_id})` : ""}`;
};

// Static method to log action
auditLogSchema.statics.logAction = async function(
  userId: string,
  userType: string,
  action: string,
  resource: string,
  options: {
    resourceId?: string;
    status?: string;
    severity?: string;
    category?: string;
    details?: any;
    sessionId?: string;
    requestId?: string;
  } = {}
) {
  return this.create({
    user_id: userId,
    user_type: userType,
    action,
    resource,
    resource_id: options.resourceId,
    status: options.status || "success",
    severity: options.severity || "low",
    category: options.category || "system",
    details: options.details || {},
    session_id: options.sessionId,
    request_id: options.requestId,
  });
};

// Static method to get security events
auditLogSchema.statics.getSecurityEvents = function(startDate?: Date, endDate?: Date) {
  const query: any = {
    $or: [
      { status: { $in: ["unauthorized", "forbidden"] } },
      { severity: "critical" },
      { action: { $in: ["login_failed", "password_reset", "account_locked"] } },
      { category: "auth", status: "failed" }
    ]
  };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get activity summary
auditLogSchema.statics.getActivitySummary = async function(userId?: string, startDate?: Date, endDate?: Date) {
  const match: any = {};

  if (userId) match.user_id = userId;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          action: "$action",
          resource: "$resource",
          status: "$status"
        },
        count: { $sum: 1 },
        latest_activity: { $max: "$createdAt" }
      }
    },
    {
      $group: {
        _id: {
          action: "$_id.action",
          resource: "$_id.resource"
        },
        total_attempts: { $sum: "$count" },
        successful_attempts: {
          $sum: {
            $cond: [{ $eq: ["$_id.status", "success"] }, "$count", 0]
          }
        },
        failed_attempts: {
          $sum: {
            $cond: [{ $ne: ["$_id.status", "success"] }, "$count", 0]
          }
        },
        latest_activity: { $max: "$latest_activity" }
      }
    },
    { $sort: { latest_activity: -1 } }
  ]);
};

export const AUDIT_LOG_DB_REF = "AuditLog";
const AuditLog = mongoose.model<IAuditLog>(AUDIT_LOG_DB_REF, auditLogSchema);

export default AuditLog;