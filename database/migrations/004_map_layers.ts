import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('map_layers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.enum('type', ['feature', 'vectortile']).notNullable();
    table.text('url').notNullable();
    table.string('layer_id');
    table.decimal('opacity', 3, 2).defaultTo(0.8);
    table.boolean('visible').defaultTo(true);
    table.text('description');
    table.integer('order').notNullable().defaultTo(0);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['order']);
    table.index(['type']);
    table.index(['visible']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('map_layers');
} 