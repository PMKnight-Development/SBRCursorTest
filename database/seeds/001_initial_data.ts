import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data (in correct order to respect foreign key constraints)
  await knex('call_events').del();
  await knex('calls').del();
  await knex('units').del();
  await knex('users').del();
  await knex('call_types').del();
  await knex('unit_groups').del();
  await knex('points_of_interest').del();

  // Insert default call types
  const callTypes = [
    { name: 'Medical Emergency', description: 'Medical emergencies requiring immediate attention', default_priority: 1, color: '#ff0000', priority: 1 },
    { name: 'Fire', description: 'Fire-related incidents', default_priority: 1, color: '#ff6600', priority: 1 },
    { name: 'Traffic Accident', description: 'Vehicle accidents and traffic incidents', default_priority: 2, color: '#ffcc00', priority: 2 },
    { name: 'Lost Person', description: 'Missing or lost individuals', default_priority: 2, color: '#00cc00', priority: 2 },
    { name: 'Weather Emergency', description: 'Weather-related emergencies', default_priority: 3, color: '#0066cc', priority: 3 },
    { name: 'Security Incident', description: 'Security-related incidents', default_priority: 2, color: '#9900cc', priority: 2 },
    { name: 'Equipment Failure', description: 'Equipment or facility issues', default_priority: 4, color: '#666666', priority: 4 },
    { name: 'Animal Incident', description: 'Wildlife or animal-related incidents', default_priority: 3, color: '#8b4513', priority: 3 },
  ];

  await knex('call_types').insert(callTypes);

  // Insert default unit groups
  const unitGroups = [
    { group_name: 'Medical Response', description: 'Medical emergency response units', group_type: 'ems', color: '#ff0000' },
    { group_name: 'Fire Response', description: 'Fire emergency response units', group_type: 'fire', color: '#ff6600' },
    { group_name: 'Security', description: 'Security and law enforcement units', group_type: 'security', color: '#9900cc' },
    { group_name: 'Transport', description: 'Transportation and logistics units', group_type: 'support', color: '#0066cc' },
    { group_name: 'Support', description: 'Support and administrative units', group_type: 'support', color: '#666666' },
  ];

  const insertedGroups = await knex('unit_groups').insert(unitGroups).returning('id');

  // Insert default units using the actual UUIDs from unit groups
  const units = [
    { 
      unit_number: 'MED-1', 
      unit_name: 'Medical Unit 1', 
      unit_type: 'ems',
      group_id: insertedGroups[0].id, 
      status: 'available',
      current_latitude: 37.7749,
      current_longitude: -81.4194,
      current_accuracy: 10.5,
      is_active: true
    },
    { 
      unit_number: 'MED-2', 
      unit_name: 'Medical Unit 2', 
      unit_type: 'ems',
      group_id: insertedGroups[0].id, 
      status: 'available',
      current_latitude: 37.7849,
      current_longitude: -81.4094,
      current_accuracy: 8.2,
      is_active: true
    },
    { 
      unit_number: 'FIRE-1', 
      unit_name: 'Fire Engine 1', 
      unit_type: 'fire',
      group_id: insertedGroups[1].id, 
      status: 'available',
      current_latitude: 37.7649,
      current_longitude: -81.4294,
      current_accuracy: 12.1,
      is_active: true
    },
    { 
      unit_number: 'SEC-1', 
      unit_name: 'Security Unit 1', 
      unit_type: 'security',
      group_id: insertedGroups[2].id, 
      status: 'available',
      current_latitude: 37.7549,
      current_longitude: -81.4394,
      current_accuracy: 15.3,
      is_active: true
    },
    { 
      unit_number: 'TRANS-1', 
      unit_name: 'Transport Unit 1', 
      unit_type: 'support',
      group_id: insertedGroups[3].id, 
      status: 'available',
      current_latitude: 37.7449,
      current_longitude: -81.4494,
      current_accuracy: 9.7,
      is_active: true
    },
  ];

  await knex('units').insert(units);

  // Insert default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = {
    username: 'admin',
    email: 'admin@sbr-cad.com',
    password_hash: hashedPassword,
    first_name: 'System',
    last_name: 'Administrator',
    role: 'admin',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  await knex('users').insert(adminUser);

  // Insert sample points of interest for SBR
  const pois = [
    {
      name: 'Main Administration Building',
      type: 'building',
      latitude: 37.7749,
      longitude: -81.4194,
      description: 'Main administrative offices and visitor center',
      is_active: true
    },
    {
      name: 'Medical Center',
      type: 'building',
      latitude: 37.7849,
      longitude: -81.4094,
      description: 'Primary medical facility and first aid station',
      is_active: true
    },
    {
      name: 'Fire Station',
      type: 'building',
      latitude: 37.7649,
      longitude: -81.4294,
      description: 'Main fire station and emergency response center',
      is_active: true
    },
    {
      name: 'Security Office',
      type: 'building',
      latitude: 37.7549,
      longitude: -81.4394,
      description: 'Security headquarters and dispatch center',
      is_active: true
    },
    {
      name: 'Main Trailhead',
      type: 'trail',
      latitude: 37.7449,
      longitude: -81.4494,
      description: 'Primary trail access point for hiking and activities',
      is_active: true
    },
    {
      name: 'Camp Site Alpha',
      type: 'camp_site',
      latitude: 37.7349,
      longitude: -81.4594,
      description: 'Large group camping area with facilities',
      is_active: true
    },
    {
      name: 'Activity Center',
      type: 'activity_area',
      latitude: 37.7249,
      longitude: -81.4694,
      description: 'Multi-purpose activity and recreation center',
      is_active: true
    },
    {
      name: 'Main Parking Lot',
      type: 'parking',
      latitude: 37.7149,
      longitude: -81.4794,
      description: 'Primary parking area for visitors and staff',
      is_active: true
    },
    {
      name: 'Emergency Exit 1',
      type: 'emergency_exit',
      latitude: 37.7049,
      longitude: -81.4894,
      description: 'Emergency evacuation route and assembly point',
      is_active: true
    },
    {
      name: 'Water Source 1',
      type: 'water_source',
      latitude: 37.6949,
      longitude: -81.4994,
      description: 'Primary water source and distribution point',
      is_active: true
    }
  ];

  await knex('points_of_interest').insert(pois);

  console.log('✅ Database seeded with initial data');
  console.log('📋 Default admin credentials:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('⚠️  Please change these credentials after first login!');
} 