import { NextResponse } from 'next/server';
import { callAI, CRM_SYSTEM_PROMPT } from '@/lib/ai';
import { CRM_TOOLS, buildMongoQuery } from '@/lib/ai-tools';
import { getCollection } from '@/lib/db';

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const fullMessages = [
      { role: 'system', content: CRM_SYSTEM_PROMPT },
      ...messages
    ];

    const aiResult = await callAI(fullMessages, CRM_TOOLS);

    // If AI wants to call a function, execute it and get data
    if (aiResult.type === 'function_call') {
      const { name, arguments: args } = aiResult;
      console.log(`🤖 AI called function: ${name}`, args);
      
      let functionResult;
      
      try {
        // Route function calls to internal logic
        if (name === 'queryCustomers') {
          const customers = await getCollection('customers');
          const conditions = [];
          if (args.city) conditions.push({ field: 'city', operator: 'eq', value: args.city });
          if (args.tag) conditions.push({ field: 'tags', operator: 'eq', value: args.tag });
          if (args.minSpent) conditions.push({ field: 'totalSpent', operator: 'gte', value: args.minSpent });
          if (args.maxSpent) conditions.push({ field: 'totalSpent', operator: 'lte', value: args.maxSpent });
          
          const query = conditions.length > 0 ? buildMongoQuery(conditions) : {};
          const limit = args.limit || 20;
          const data = await customers.find(query).limit(limit).toArray();
          functionResult = { count: data.length, customers: data.map(c => ({ name: c.name, email: c.email, city: c.city, totalSpent: c.totalSpent, tags: c.tags })) };
        } 
        else if (name === 'listSegments') {
          const segments = await getCollection('segments');
          const data = await segments.find({}).limit(args.limit || 20).toArray();
          functionResult = { count: data.length, segments: data.map(s => ({ _id: s._id, name: s.name, customerCount: s.customerCount })) };
        }
        else if (name === 'getCampaignStats') {
          // Just mock or fetch basic stats for AI
          const campaigns = await getCollection('campaigns');
          // Handle object id string
          const campQuery = {};
          try { campQuery._id = new require('mongodb').ObjectId(args.campaignId); } catch(e) { campQuery._id = args.campaignId; }
          
          const data = await campaigns.findOne(campQuery);
          functionResult = data ? { name: data.name, stats: data.stats } : { error: 'Not found' };
        }
        else {
          // Generic response for complex actions for now
          functionResult = { success: true, message: `Function ${name} processed.` };
        }

        // Call AI again with the result
        const followupMessages = [
          ...fullMessages,
          { role: 'assistant', content: `I need to call ${name} with ${JSON.stringify(args)}` },
          { role: 'system', content: `Function ${name} returned: ${JSON.stringify(functionResult).substring(0, 1000)}` }
        ];

        const finalResult = await callAI(followupMessages);
        
        return NextResponse.json({
          response: finalResult.content,
          functionCall: { name, result: functionResult },
          provider: finalResult.provider
        });
        
      } catch (fnErr) {
        console.error('Function execution error:', fnErr);
        return NextResponse.json({
          response: `I tried to execute ${name} but encountered an error: ${fnErr.message}`,
          functionCall: { name, error: fnErr.message }
        });
      }
    }

    return NextResponse.json({
      response: aiResult.content,
      provider: aiResult.provider
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
