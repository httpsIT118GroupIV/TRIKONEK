delete from public.commuter_signals;
delete from public.waiting_sheds;

insert into public.waiting_sheds (shed_name, latitude, longitude, route_zone) values
  ('Buga Terminal', 13.2962, 123.3595, 'Lakeside'),
  ('Nogpo Terminal', 13.2885, 123.3734, 'Lakeside'),
  ('Bonbon Terminal', 13.2788, 123.4042, 'Lakeside'),
  ('Libon Terminal', 13.2998, 123.4384, 'Centrong Libon'),
  ('Bacolod Terminal', 13.2706, 123.4431, 'Libon–Bacolod'),
  ('Polangui Terminal', 13.2956, 123.4856, 'Libon–Polangui');
