# Triumphant Standard Academy — Multi-Page Visual CMS

This package keeps the original multi-page Visual CMS and its existing Netlify Identity login/invite flow.

## Administrator roles

- **Admin:** can edit and publish all website content.
- **Super Admin:** can do everything an Admin can do, plus add/remove administrators and change administrator roles.
- Maximum **5 Super Admins** is enforced server-side.
- At least **1 Super Admin** must remain.
- Website design, structure, layout, fonts and colors remain locked.

## One-time Super Admin setup

No environment variables are required.

If the CMS has **zero administrators**, the first authenticated Netlify Identity account that opens the editor is automatically promoted to **Super Admin**. This removes the need to manually edit the role just to get the first administrator into the editor.

After the first Super Admin exists, no non-admin account can bootstrap itself. Super Admins can use **Manage admins** inside the visual editor to invite administrators and assign roles.

If you manually change a user's role in Netlify Identity, log out/in or refresh the Identity session so the new role is available to the browser.


## Protected School Owner

This build supports a protected School Owner account. Before the School Owner's first login, set the Netlify environment variable:

`SCHOOL_OWNER_EMAIL` = the exact email address used by the school's Netlify Identity account.

The configured owner is automatically promoted to Super Admin on first login. The CMS will not allow another administrator to delete or demote the School Owner. Changes to the owner account itself must be made through Netlify Identity.

For each new school, use a separate Netlify site and set that site's `SCHOOL_OWNER_EMAIL` to the new school's owner's email. Keep this value server-side as a Netlify environment variable; do not put it in public HTML or JavaScript.


## Supabase migration (v10)
The migrated CMS uses Supabase Auth, Postgres (`site_content`, `cms_admins`) and Supabase Storage (`tsa-media`) for live content, administrator access and media. Legacy Netlify Functions are retained as fallback/reference but are not used by the migrated browser CMS.


Supabase Stable Preview v6: fixed explicit editor page switching so the preview cannot fall back to Home when selecting another page.


## Direct administrator invitations
The Visual Editor can add administrators directly from **Manage admins**. The invite endpoint runs server-side so the Supabase service-role key is never exposed in browser code.

In Netlify site environment variables, add:
- `SUPABASE_SECRET_KEY` = the Supabase **secret** key for this project. (For older setups, `SUPABASE_SERVICE_ROLE_KEY` is also accepted.) Keep it server-only; never put it in HTML or client JavaScript.

The existing `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_URL` may be used for the project URL.
