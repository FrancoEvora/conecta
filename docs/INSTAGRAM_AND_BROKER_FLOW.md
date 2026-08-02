# Instagram post and broker activation

- Broker invitations are activated by the backend with a confirmed Supabase Auth user and immediate session creation.
- The activation remains bound to the single-use invitation token and the invited e-mail.
- The sharing studio generates a tracked Instagram feed link and a square 1080 × 1080 creative using the product's primary image.
- On compatible mobile devices the Web Share API sends the image, caption and link to the native share sheet.
- On other devices the image is downloaded and the caption is copied for manual posting.
- Public and tracked invitation links expose Open Graph metadata with the principal product image.
