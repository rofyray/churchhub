// Church departments - edit this list to customize departments for your church
// These are used to initialize departments when a new church is set up

export const DEPARTMENTS = [
  'Worship & Music',
  'Ushering',
  'Media & Tech',
  'Children Ministry',
  'Youth Ministry',
  'Women Fellowship',
  'Men Fellowship',
  'Prayer Team',
  'Evangelism',
  'Hospitality',
  'Sanctuary Keepers',
  'Counseling',
  'Community Outreach',
  'Administration',
] as const;

// Type for department names (useful for type-safe department references)
export type DepartmentName = (typeof DEPARTMENTS)[number];
