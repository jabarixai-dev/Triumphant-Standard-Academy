import { getStore } from "@netlify/blobs";
import { getUser as identityGetUser, admin } from "@netlify/identity";

const store = getStore("tsa-content");

function ownerEmail() {
  return String(process.env.SCHOOL_OWNER_EMAIL || "").trim().toLowerCase();
}

function isOwner(user) {
  const email = String(user?.email || "").trim().toLowerCase();
  const configured = ownerEmail();
  return !!configured && !!email && email === configured;
}

function userRole(user) {
  const roles = Array.isArray(user?.roles) ? user.roles :
    (Array.isArray(user?.appMetadata?.roles) ? user.appMetadata.roles :
    (Array.isArray(user?.app_metadata?.roles) ? user.app_metadata.roles : []));
  if (roles.includes("superadmin")) return "superadmin";
  if (roles.includes("admin")) return "admin";
  return "none";
}

async function getAuthenticatedUser(request) {
  // @netlify/identity reads the authenticated Netlify Identity session
  // attached to this request.
  try {
    const user = await identityGetUser();
    if (user) return user;
  } catch (_) {}

  // Fallback for callers that explicitly send the Identity JWT.
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;

  const origin = new URL(request.url).origin;
  const response = await fetch(`${origin}/.netlify/identity/user`, {
    headers: { Authorization: auth }
  });

  if (!response.ok) return null;
  return response.json();
}

async function getFreshUser(request) {
  const user = await getAuthenticatedUser(request);
  if (!user?.id) return null;

  // Read the user record server-side so role changes are recognized even
  // when the browser is still holding an older JWT.
  try {
    const fresh = await admin.getUser(user.id);
    return fresh || user;
  } catch (_) {
    return user;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

const allowedSections = [
  "index",
  "about",
  "academics",
  "admissions",
  "contact",
  "news",
  "gallery",
  "administration",
  "programs"
];

export default async (request) => {
  try {
    const url = new URL(request.url);
    const section = url.searchParams.get("section");

    if (request.method === "GET") {
      if (section === "__admin_check") {
        const user = await getFreshUser(request);
        if (!user) return json({ error: "Unauthorized. Please log in." }, 401);

        let role = userRole(user);

        // The explicitly configured School Owner is the protected bootstrap
        // account. It is promoted to Super Admin on first login if necessary.
        if (isOwner(user) && role !== "superadmin") {
          const promoted = await admin.updateUser(user.id, {
            app_metadata: { ...(user.appMetadata || user.app_metadata || {}), roles: ["superadmin"] }
          });
          role = userRole(promoted);
        }

        // Backward-compatible bootstrap: only use the first-account fallback
        // when no School Owner has been configured. For production sites, set
        // SCHOOL_OWNER_EMAIL before the owner's first login.
        if (!ownerEmail() && role === "none") {
          let managedCount = 0;
          try {
            for (let page = 1; page <= 20; page++) {
              const batch = await admin.listUsers({ page, perPage: 500 });
              if (!Array.isArray(batch) || batch.length === 0) break;
              managedCount += batch.filter(u => userRole(u) !== "none").length;
              if (batch.length < 500) break;
            }
          } catch (_) {}

          if (managedCount === 0) {
            const promoted = await admin.updateUser(user.id, {
              app_metadata: { ...(user.appMetadata || user.app_metadata || {}), roles: ["superadmin"] }
            });
            role = userRole(promoted);
          }
        }

        if (role === "none") {
          return json({ error: "This account is not an administrator. Ask a Super Admin to assign you the Admin role." }, 403);
        }

        return json({ success: true, email: user.email || "", role });
      }
      async function readSection(name) {
        try {
          const value = await store.get(name, { type: "json" });
          return value && typeof value === "object" ? value : {};
        } catch (error) {
          console.error(`Content read failed for ${name}:`, error);
          return {};
        }
      }

      if (section) {
        if (!allowedSections.includes(section)) {
          return json({ error: "Invalid section" }, 400);
        }
        return json(await readSection(section));
      }

      const results = {};
      await Promise.all(
        allowedSections.map(async (name) => {
          results[name] = await readSection(name);
        })
      );
      return json(results);
    }

    if (request.method === "POST") {
      const user = await getFreshUser(request);
      if (!user) return json({ error: "Unauthorized. Please log in." }, 401);
      if (userRole(user) === "none") return json({ error: "This account is not an administrator." }, 403);

      const body = await request.json();
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json({ error: "Invalid JSON body" }, 400);
      }

      if (!body.section || body.data === undefined) {
        return json({ error: "section and data are required" }, 400);
      }

      if (!allowedSections.includes(body.section)) {
        return json({ error: "Invalid section" }, 400);
      }

      let saved = false;
      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await store.setJSON(body.section, body.data);
          saved = true;
          break;
        } catch (error) {
          lastError = error;
          console.error(`Content write attempt ${attempt + 1} failed for ${body.section}:`, error);
          if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
        }
      }
      if (!saved) {
        return json({ error: "Could not save this section right now. Please try Publish again." }, 503);
      }

      return json({
        success: true,
        section: body.section
      });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: "Internal server error" }, 500);
  }
};
