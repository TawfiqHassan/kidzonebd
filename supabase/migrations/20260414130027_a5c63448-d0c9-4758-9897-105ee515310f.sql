UPDATE public.site_settings 
SET value = '{"menu_items":[{"name":"Home","href":"/","children":[]},{"name":"All Toys","href":"/all-toys","children":[]},{"name":"New Arrivals","href":"/new-arrivals","children":[]},{"name":"Blog","href":"/blog","children":[]},{"name":"Contact","href":"/contact","children":[]}]}'::jsonb,
    updated_at = now()
WHERE key = 'navbar';