import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('username').unique().notNullable();
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.enum('role', ['dispatcher', 'admin', 'supervisor', 'field_unit', 'viewer']).notNullable();
    table.uuid('unit_id'); // Remove .references('id').inTable('units') here
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login');
    table.timestamps(true, true);
    
    table.index(['username']);
    table.index(['email']);
    table.index(['role']);
    table.index(['unit_id']);
  });

  // Unit groups table
  await knex.schema.createTable('unit_groups', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('group_name').notNullable();
    table.enum('group_type', ['ems', 'fire', 'security', 'law_enforcement', 'search_rescue', 'support']).notNullable();
    table.text('description');
    table.string('color'); // Added color column
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index(['group_type']);
    table.index(['is_active']);
  });

  // Units table
  await knex.schema.createTable('units', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('unit_number').unique().notNullable();
    table.string('unit_name').notNullable();
    table.enum('unit_type', ['ems', 'fire', 'security', 'law_enforcement', 'search_rescue', 'support']).notNullable();
    table.uuid('group_id').references('id').inTable('unit_groups').notNullable();
    table.enum('status', ['available', 'dispatched', 'enroute', 'on_scene', 'transporting', 'out_of_service', 'maintenance', 'training']).defaultTo('available');
    table.decimal('current_latitude', 10, 8);
    table.decimal('current_longitude', 11, 8);
    table.decimal('current_accuracy', 5, 2);
    table.uuid('assigned_call_id'); // Remove .references('id').inTable('calls') here
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_status_update');
    table.timestamp('last_location_update');
    table.timestamps(true, true);
    
    table.index(['unit_number']);
    table.index(['unit_type']);
    table.index(['group_id']);
    table.index(['status']);
    table.index(['assigned_call_id']);
    table.index(['is_active']);
  });

  // Call types table
  await knex.schema.createTable('call_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description');
    table.integer('default_priority').notNullable();
    table.text('response_plan');
    table.boolean('is_active').defaultTo(true);
    table.string('color'); // Added color column
    table.integer('priority'); // Added priority column
    table.timestamps(true, true);
    
    table.index(['name']);
    table.index(['default_priority']);
    table.index(['is_active']);
  });

  // Protocol questions table
  await knex.schema.createTable('protocol_questions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('call_type_id').references('id').inTable('call_types').onDelete('CASCADE');
    table.string('question').notNullable();
    table.enum('type', ['text', 'number', 'boolean', 'select', 'multi_select']).notNullable();
    table.boolean('required').defaultTo(false);
    table.jsonb('options');
    table.integer('order').notNullable();
    table.timestamps(true, true);
    
    table.index(['call_type_id']);
    table.index(['order']);
  });

  // Points of interest table
  await knex.schema.createTable('points_of_interest', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.enum('type', ['building', 'trail', 'camp_site', 'activity_area', 'parking', 'emergency_exit', 'water_source', 'other']).notNullable();
    table.decimal('latitude', 10, 8).notNullable();
    table.decimal('longitude', 11, 8).notNullable();
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index(['name']);
    table.index(['type']);
    table.index(['is_active']);
    table.index(['latitude', 'longitude']);
  });

  // Calls table
  await knex.schema.createTable('calls', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('call_number').unique().notNullable();
    table.uuid('call_type_id').references('id').inTable('call_types').notNullable();
    table.integer('priority').notNullable();
    table.enum('status', ['pending', 'dispatched', 'enroute', 'on_scene', 'cleared', 'cancelled']).defaultTo('pending');
    table.decimal('latitude', 10, 8).notNullable();
    table.decimal('longitude', 11, 8).notNullable();
    table.string('address');
    table.uuid('poi_id').references('id').inTable('points_of_interest');
    table.text('location_notes');
    table.string('caller_name');
    table.string('caller_phone');
    table.string('callback_number');
    table.boolean('is_anonymous').defaultTo(false);
    table.text('description').notNullable();
    table.jsonb('assigned_units').defaultTo(JSON.stringify([]));
    table.uuid('dispatcher_id').references('id').inTable('users').notNullable();
    table.timestamp('closed_at');
    table.timestamp('estimated_arrival_time');
    table.timestamp('actual_arrival_time');
    table.timestamp('cleared_time');
    table.timestamps(true, true);
    
    table.index(['call_number']);
    table.index(['call_type_id']);
    table.index(['priority']);
    table.index(['status']);
    table.index(['dispatcher_id']);
    table.index(['created_at']);
    table.index(['latitude', 'longitude']);
  });

  // Call updates table
  await knex.schema.createTable('call_updates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('call_id').references('id').inTable('calls').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users');
    table.enum('update_type', ['status_change', 'unit_assignment', 'location_update', 'description_update', 'priority_change', 'general_update']).notNullable();
    table.text('description').notNullable();
    table.jsonb('metadata');
    table.timestamps(true, true);
    
    table.index(['call_id']);
    table.index(['user_id']);
    table.index(['update_type']);
    table.index(['created_at']);
  });

  // System configuration table
  await knex.schema.createTable('system_configs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('key').unique().notNullable();
    table.text('value').notNullable();
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index(['key']);
    table.index(['is_active']);
  });

  // Notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.enum('type', ['call_assigned', 'status_update', 'unit_available', 'system_alert', 'maintenance']).notNullable();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.uuid('recipient_id').references('id').inTable('users');
    table.string('recipient_group');
    table.jsonb('metadata');
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    table.timestamps(true, true);
    
    table.index(['type']);
    table.index(['recipient_id']);
    table.index(['recipient_group']);
    table.index(['is_read']);
    table.index(['created_at']);
  });

  // Reports table
  await knex.schema.createTable('reports', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.enum('type', ['call_volume', 'response_times', 'unit_performance', 'incident_summary', 'custom']).notNullable();
    table.jsonb('parameters').notNullable();
    table.uuid('generated_by').references('id').inTable('users').notNullable();
    table.enum('status', ['pending', 'generating', 'completed', 'failed']).defaultTo('pending');
    table.string('file_path');
    table.timestamp('completed_at');
    table.timestamps(true, true);
    
    table.index(['type']);
    table.index(['generated_by']);
    table.index(['status']);
    table.index(['created_at']);
  });

  // Add foreign key constraint for users.unit_id after units table is created
  await knex.schema.alterTable('users', (table) => {
    table.foreign('unit_id').references('id').inTable('units');
  });

  // Add foreign key constraint for units.assigned_call_id after calls table is created
  await knex.schema.alterTable('units', (table) => {
    table.foreign('assigned_call_id').references('id').inTable('calls');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop foreign key constraints first
  await knex.schema.alterTable('units', (table) => {
    table.dropForeign(['assigned_call_id']);
  });
  await knex.schema.alterTable('users', (table) => {
    table.dropForeign(['unit_id']);
  });
  await knex.schema.dropTableIfExists('reports');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('system_configs');
  await knex.schema.dropTableIfExists('call_updates');
  await knex.schema.dropTableIfExists('calls');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('units');
  await knex.schema.dropTableIfExists('points_of_interest');
  await knex.schema.dropTableIfExists('protocol_questions');
  await knex.schema.dropTableIfExists('call_types');
  await knex.schema.dropTableIfExists('unit_groups');
} 