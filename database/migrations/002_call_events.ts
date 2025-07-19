import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('call_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('call_id').notNullable().references('id').inTable('calls').onDelete('CASCADE');
    table.string('event_type').notNullable(); // created, status_change, unit_assignment, etc.
    table.text('description').notNullable();
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    // Indexes
    table.index(['call_id']);
    table.index(['user_id']);
    table.index(['timestamp']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('call_events');
} 