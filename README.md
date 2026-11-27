# Put Two Boards on GitHub Pages (with player accounts)

## 1. Publish the site
1. Create a new public repository on github.com (for example `two-boards`).
2. Upload everything in this folder to the repository root.
3. Settings -> Pages -> Deploy from a branch -> `main` and `/ (root)` -> Save.
4. After a minute the site is live at `https://<your-name>.github.io/two-boards/`.

## 2. Turn on accounts (sign up / log in), free
GitHub Pages cannot store accounts, so accounts live in a free Supabase project.
1. Make a free project at supabase.com.
2. Open **SQL Editor -> New query**, paste all of `supabase-setup.sql`, press **Run**. This creates the saves table, locks it so every player can only see their own save, and adds a "delete my account" function.
3. Open **Authentication -> Sign In / Providers -> Email**. For quick testing you may turn off "Confirm email". For a public site, keep it on.
4. Open **Authentication -> URL Configuration** and set **Site URL** to your GitHub Pages address.
5. Open **Project Settings -> API**. Copy the **Project URL** and the **anon / publishable** key.
6. Edit `supabase-config.js` and paste both values between the quotes. Commit the change.
   Both are public by design. Never paste a `service_role` key.

Players then use the **Player** menu to sign up and log in, and their progress follows them to any device.

## Without Supabase
If `supabase-config.js` is empty, the Player menu offers a private GitHub gist sync (paste a token with only the `gist` permission) or a save file/code. Progress also saves in each browser automatically.
