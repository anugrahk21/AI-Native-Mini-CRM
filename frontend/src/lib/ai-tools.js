// AI Function Calling Tool Definitions
// These define what actions the AI assistant can perform in the CRM

export const CRM_TOOLS = [
  {
    name: 'queryCustomers',
    description: 'Search and filter customers based on attributes like city, spending, order history, tags, etc. Returns matching customers with their details.',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'Filter by city name (e.g., "Mumbai", "Delhi")'
        },
        minSpent: {
          type: 'number',
          description: 'Minimum total amount spent'
        },
        maxSpent: {
          type: 'number',
          description: 'Maximum total amount spent'
        },
        minOrders: {
          type: 'number',
          description: 'Minimum number of orders'
        },
        gender: {
          type: 'string',
          description: 'Filter by gender: "male", "female", or "other"'
        },
        tag: {
          type: 'string',
          description: 'Filter by customer tag (e.g., "vip", "churning", "new")'
        },
        inactiveDays: {
          type: 'number',
          description: 'Customers who haven\'t ordered in this many days'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)'
        }
      }
    }
  },
  {
    name: 'createSegment',
    description: 'Create a new customer segment with specific filter rules. The segment can be used later for campaigns.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the segment (e.g., "High Value Mumbai Shoppers")'
        },
        description: {
          type: 'string',
          description: 'Brief description of what this segment represents'
        },
        conditions: {
          type: 'array',
          description: 'Array of filter conditions',
          items: {
            type: 'object',
            properties: {
              field: {
                type: 'string',
                description: 'Customer field to filter on: totalSpent, totalOrders, city, gender, age, lastOrderDate, tags, averageOrderValue'
              },
              operator: {
                type: 'string',
                description: 'Comparison operator: gt, gte, lt, lte, eq, ne, in, nin, contains, daysAgo'
              },
              value: {
                type: 'string',
                description: 'Value to compare against (string representation)'
              }
            },
            required: ['field', 'operator', 'value']
          }
        },
        logic: {
          type: 'string',
          description: 'How to combine conditions: "AND" (all must match) or "OR" (any can match)'
        }
      },
      required: ['name', 'conditions']
    }
  },
  {
    name: 'previewSegment',
    description: 'Preview how many customers match a segment\'s criteria. Shows count and sample customers.',
    parameters: {
      type: 'object',
      properties: {
        segmentId: {
          type: 'string',
          description: 'ID of the segment to preview'
        }
      },
      required: ['segmentId']
    }
  },
  {
    name: 'createCampaign',
    description: 'Create a new campaign targeting a specific segment with a message on a chosen channel.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Campaign name (e.g., "Summer Sale Blast")'
        },
        segmentId: {
          type: 'string',
          description: 'ID of the target segment'
        },
        segmentName: {
          type: 'string',
          description: 'Name of the target segment (use this if you don\'t know the ID)'
        },
        channel: {
          type: 'string',
          description: 'Delivery channel: "whatsapp", "sms", "email", or "rcs"'
        },
        messageTemplate: {
          type: 'string',
          description: 'Message template with placeholders like {{name}}, {{discount}}. E.g., "Hi {{name}}! Get {{discount}}% off your next order!"'
        },
        subject: {
          type: 'string',
          description: 'Email subject line (only for email channel)'
        }
      },
      required: ['name', 'channel', 'messageTemplate']
    }
  },
  {
    name: 'sendCampaign',
    description: 'Execute and send a campaign to all customers in its target segment. This triggers actual message delivery through the channel service.',
    parameters: {
      type: 'object',
      properties: {
        campaignId: {
          type: 'string',
          description: 'ID of the campaign to send'
        }
      },
      required: ['campaignId']
    }
  },
  {
    name: 'getCampaignStats',
    description: 'Get delivery performance statistics for a specific campaign including sent, delivered, failed, opened, and clicked counts.',
    parameters: {
      type: 'object',
      properties: {
        campaignId: {
          type: 'string',
          description: 'ID of the campaign to get stats for'
        }
      },
      required: ['campaignId']
    }
  },
  {
    name: 'listSegments',
    description: 'List all existing customer segments with their names, descriptions, and customer counts.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of segments to return (default: 20)'
        }
      }
    }
  },
  {
    name: 'listCampaigns',
    description: 'List all campaigns with their status, channel, and basic stats.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by campaign status: "draft", "sending", "sent", "completed"'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of campaigns to return (default: 20)'
        }
      }
    }
  },
  {
    name: 'getInsights',
    description: 'Get AI-powered insights about customer behavior, campaign performance, and recommendations. Use when the marketer asks for analysis or recommendations.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'What kind of insights to generate: "overview", "churn_risk", "top_customers", "campaign_performance", "segment_recommendations"'
        }
      },
      required: ['topic']
    }
  }
];

// Build MongoDB query from segment conditions
export function buildMongoQuery(conditions, logic = 'AND') {
  const queries = conditions.map(cond => {
    const { field, operator, value } = cond;

    switch (operator) {
      case 'gt':
        return { [field]: { $gt: parseValue(value) } };
      case 'gte':
        return { [field]: { $gte: parseValue(value) } };
      case 'lt':
        return { [field]: { $lt: parseValue(value) } };
      case 'lte':
        return { [field]: { $lte: parseValue(value) } };
      case 'eq':
        return { [field]: parseValue(value) };
      case 'ne':
        return { [field]: { $ne: parseValue(value) } };
      case 'in':
        return { [field]: { $in: value.split(',').map(v => v.trim()) } };
      case 'nin':
        return { [field]: { $nin: value.split(',').map(v => v.trim()) } };
      case 'contains':
        return { [field]: { $regex: value, $options: 'i' } };
      case 'daysAgo':
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(value));
        return { [field]: { $lte: daysAgo } };
      default:
        return { [field]: parseValue(value) };
    }
  });

  if (queries.length === 0) return {};
  if (queries.length === 1) return queries[0];

  return logic === 'OR' ? { $or: queries } : { $and: queries };
}

function parseValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const num = Number(value);
  if (!isNaN(num) && value !== '') return num;
  return value;
}
