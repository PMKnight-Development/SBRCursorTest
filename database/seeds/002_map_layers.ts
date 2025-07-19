import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing map layers
  await knex('map_layers').del();

  // Insert default map layers
  await knex('map_layers').insert([
    {
      name: 'Summit AEDs',
      type: 'feature',
      url: 'https://services1.arcgis.com/RpUtm89cWZfyYWZf/arcgis/rest/services/Summit_AEDs/FeatureServer/0',
      opacity: 1.0,
      visible: true,
      description: 'Summit AEDs',
      order: 1
    }
  ]);
} 