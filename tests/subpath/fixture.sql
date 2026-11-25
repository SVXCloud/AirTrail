-- An established airport and sync timestamp keep the deployment suite offline.
INSERT INTO airport (icao, iata, name, municipality, lat, lon, country, continent, type, tz, custom)
VALUES ('EGLL', 'LHR', 'London Heathrow', 'London', 51.47, -0.4543, 'GB', 'EU', 'large_airport', 'Europe/London', false)
ON CONFLICT DO NOTHING;
INSERT INTO app_config (id, config) VALUES (1, '{"data":{"lastSynced":"2026-01-01T00:00:00.000Z"}}')
ON CONFLICT (id) DO UPDATE SET config = app_config.config || EXCLUDED.config;

UPDATE app_config
SET config = config || jsonb_build_object('oauth', jsonb_build_object(
  'enabled', true, 'issuerUrl', :'oidc_issuer', 'clientId', 'airtrail-e2e',
  'clientSecret', 'airtrail-e2e', 'tokenEndpointAuthMethod', 'client_secret_basic',
  'autoRegister', true
))
WHERE id = 1;
