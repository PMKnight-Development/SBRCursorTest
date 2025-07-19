import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Call protocol answers table
  await knex.schema.createTable('call_protocol_answers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('call_id').references('id').inTable('calls').onDelete('CASCADE').notNullable();
    table.jsonb('answers').notNullable();
    table.integer('calculated_priority').notNullable();
    table.jsonb('recommended_units').defaultTo(JSON.stringify([]));
    table.text('response_plan');
    table.boolean('protocol_completed').defaultTo(false);
    table.timestamp('completed_at');
    table.timestamps(true, true);
    
    table.index(['call_id']);
    table.index(['calculated_priority']);
    table.index(['protocol_completed']);
    table.index(['completed_at']);
  });

  // Add some sample protocol questions for common call types
  const callTypes = await knex('call_types').select('id', 'name');
  
  for (const callType of callTypes) {
    if (callType.name.toLowerCase().includes('medical')) {
      await knex('protocol_questions').insert([
        {
          call_type_id: callType.id,
          question: 'Is the patient conscious and breathing?',
          type: 'boolean',
          required: true,
          order: 1
        },
        {
          call_type_id: callType.id,
          question: 'What is the nature of the medical emergency?',
          type: 'text',
          required: true,
          order: 2
        },
        {
          call_type_id: callType.id,
          question: 'Is there any bleeding?',
          type: 'boolean',
          required: false,
          order: 3
        },
        {
          call_type_id: callType.id,
          question: 'How many patients are involved?',
          type: 'number',
          required: false,
          order: 4
        }
      ]);
    } else if (callType.name.toLowerCase().includes('fire')) {
      await knex('protocol_questions').insert([
        {
          call_type_id: callType.id,
          question: 'Is the fire currently active?',
          type: 'boolean',
          required: true,
          order: 1
        },
        {
          call_type_id: callType.id,
          question: 'What type of structure is involved?',
          type: 'select',
          required: true,
          options: JSON.stringify(['Building', 'Vehicle', 'Wildland', 'Other']),
          order: 2
        },
        {
          call_type_id: callType.id,
          question: 'Are there any people trapped?',
          type: 'boolean',
          required: true,
          order: 3
        },
        {
          call_type_id: callType.id,
          question: 'Is there smoke visible?',
          type: 'boolean',
          required: false,
          order: 4
        }
      ]);
    } else if (callType.name.toLowerCase().includes('security')) {
      await knex('protocol_questions').insert([
        {
          call_type_id: callType.id,
          question: 'What type of security incident?',
          type: 'select',
          required: true,
          options: JSON.stringify(['Fight', 'Theft', 'Trespassing', 'Suspicious Activity', 'Other']),
          order: 1
        },
        {
          call_type_id: callType.id,
          question: 'Are weapons involved?',
          type: 'boolean',
          required: true,
          order: 2
        },
        {
          call_type_id: callType.id,
          question: 'How many people are involved?',
          type: 'number',
          required: false,
          order: 3
        },
        {
          call_type_id: callType.id,
          question: 'Are there any injuries?',
          type: 'boolean',
          required: false,
          order: 4
        }
      ]);
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('call_protocol_answers');
} 